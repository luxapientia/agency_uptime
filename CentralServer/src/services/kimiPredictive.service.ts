import OpenAI from 'openai';
import logger from '../utils/logger';
import { PrismaClient, SiteStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simple result types
interface HealthAnalysis {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  confidence: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

interface StatusPrediction {
  predictedStatus: 'up' | 'down' | 'degraded';
  confidence: number;
  timeframe: string;
  reasoning: string;
  recommendations: string[];
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

class KimiPredictiveService {
  private openai: OpenAI;
  private readonly model = 'kimi-latest';

  constructor() {
    const apiKey = process.env.MOONSHOT_API_KEY || '';
    if (!apiKey) {
      logger.warn('MOONSHOT_API_KEY not found in environment variables');
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: 'https://api.moonshot.ai/v1'
    });
  }

  /**
   * Analyze current site health using AI
   */
  async analyzeSiteHealth(siteId: string): Promise<HealthAnalysis> {
    try {
      // Get status data from the last 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      const statuses = await prisma.siteStatus.findMany({
        where: { 
          siteId,
          checkedAt: {
            gte: threeDaysAgo
          }
        },
        orderBy: { checkedAt: 'desc' }
      });

      if (statuses.length === 0) {
        throw new Error('No status data available for this site in the last 3 days');
      }

      // Get site info
      const site = await prisma.site.findUnique({
        where: { id: siteId }
      });

      if (!site) {
        throw new Error('Site not found');
      }

      // Group by worker and analyze each
      const workers = new Map<string, SiteStatus[]>();
      statuses.forEach(status => {
        if (!workers.has(status.workerId)) {
          workers.set(status.workerId, []);
        }
        workers.get(status.workerId)!.push(status);
      });

      // Analyze each worker's performance
      const workerAnalysis = Array.from(workers.entries()).map(([workerId, workerStatuses]) => {
        const latest = workerStatuses[0];
        const recent = workerStatuses.slice(0, 10);
        const historical = workerStatuses.slice(0, 50);

        // Calculate performance metrics
        const avgResponseTime = historical
          .filter(s => s.httpResponseTime)
          .reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / 
          historical.filter(s => s.httpResponseTime).length;

        const uptimePercentage = (historical.filter(s => s.isUp).length / historical.length) * 100;
        
        const responseTimeTrend = recent.length > 3 ? 
          recent.slice(0, 3).reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / 3 -
          recent.slice(-3).reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / 3 : 0;

        // SSL analysis
        const sslIssues = latest.hasSsl && latest.sslDaysUntilExpiry !== null && latest.sslDaysUntilExpiry <= 30;

        // DNS analysis
        const dnsInstability = recent.filter(s => s.dnsIsUp !== latest.dnsIsUp).length > 2;

        // TCP analysis
        const tcpIssues = latest.tcpChecks && Array.isArray(latest.tcpChecks) && 
          latest.tcpChecks.some((check: any) => !check.isUp);

        return {
          workerId,
          isUp: latest.isUp,
          pingIsUp: latest.pingIsUp,
          httpIsUp: latest.httpIsUp,
          dnsIsUp: latest.dnsIsUp,
          currentResponseTime: latest.httpResponseTime,
          avgResponseTime: Math.round(avgResponseTime || 0),
          uptimePercentage: Math.round(uptimePercentage),
          responseTimeTrend: Math.round(responseTimeTrend),
          sslIssues,
          dnsInstability,
          tcpIssues,
          checkedAt: latest.checkedAt,
          sslInfo: latest.hasSsl ? {
            isValid: (latest.sslDaysUntilExpiry || 0) > 0,
            daysUntilExpiry: latest.sslDaysUntilExpiry || 0,
            issuer: latest.sslIssuer || 'Unknown'
          } : null,
          tcpChecks: latest.tcpChecks,
          dnsNameservers: latest.dnsNameservers
        };
      });

      // Find consensus worker
      const consensus = workerAnalysis.find(w => w.workerId === 'consensus_worker') || workerAnalysis[0];

      // Calculate overall metrics
      const allWorkers = workerAnalysis.filter(w => w.workerId !== 'consensus_worker');
      const avgUptime = allWorkers.reduce((sum, w) => sum + w.uptimePercentage, 0) / allWorkers.length;
      const avgResponseTime = allWorkers.reduce((sum, w) => sum + w.avgResponseTime, 0) / allWorkers.length;
      
      // Detect anomalies
      const anomalies = [];
      const responseTimeOutliers = allWorkers.filter(w => w.avgResponseTime > avgResponseTime * 2);
      const lowUptimeWorkers = allWorkers.filter(w => w.uptimePercentage < 95);
      const sslIssues = allWorkers.filter(w => w.sslIssues);
      const dnsIssues = allWorkers.filter(w => w.dnsInstability);
      const tcpIssues = allWorkers.filter(w => w.tcpIssues);

      if (responseTimeOutliers.length > 0) {
        anomalies.push(`High response time workers: ${responseTimeOutliers.map(w => w.workerId).join(', ')}`);
      }
      if (lowUptimeWorkers.length > 0) {
        anomalies.push(`Low uptime workers: ${lowUptimeWorkers.map(w => w.workerId).join(', ')}`);
      }
      if (sslIssues.length > 0) {
        anomalies.push(`SSL issues detected in ${sslIssues.length} workers`);
      }
      if (dnsIssues.length > 0) {
        anomalies.push(`DNS instability in ${dnsIssues.length} workers`);
      }
      if (tcpIssues.length > 0) {
        anomalies.push(`TCP connectivity issues in ${tcpIssues.length} workers`);
      }

      // Prepare comprehensive data for AI analysis
      const analysisData = {
        site: {
          name: site.name,
          url: site.url,
          id: siteId
        },
        dataPeriod: 'Last 3 days',
        overallMetrics: {
          avgUptime: Math.round(avgUptime),
          avgResponseTime: Math.round(avgResponseTime),
          totalWorkers: allWorkers.length,
          consensusStatus: consensus.isUp
        },
        workers: workerAnalysis,
        anomalies,
        consensus
      };

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert site reliability engineer with deep knowledge of web infrastructure, networking, and performance optimization. Provide comprehensive, actionable analysis of site health data.'
          },
          {
            role: 'user',
            content: `Perform a comprehensive health analysis of this site using the last 3 days of data. Each worker represents a monitoring region, and consensus_worker is the combined status from all regions.

Site: ${site.name} (${site.url})
Data Period: Last 3 days
Data: ${JSON.stringify(analysisData, null, 2)}

Provide detailed analysis in JSON format:
{
  "diagnosis": "comprehensive explanation of current health status including any issues found",
  "severity": "low|medium|high|critical",
  "overallHealth": "excellent|good|fair|poor|critical",
  "performanceAnalysis": {
    "responseTimeIssues": "analysis of response time patterns and outliers",
    "uptimeIssues": "analysis of uptime patterns and reliability",
    "regionalIssues": "analysis of differences between monitoring regions"
  },
  "securityAnalysis": {
    "sslIssues": "analysis of SSL certificate status and issues",
    "dnsIssues": "analysis of DNS stability and configuration",
    "tcpIssues": "analysis of TCP connectivity and port availability"
  },
  "recommendations": [
    "specific, actionable recommendation 1",
    "specific, actionable recommendation 2",
    "specific, actionable recommendation 3"
  ],
  "perWorkerRecommendations": [
    {
      "workerId": "worker-1",
      "issues": ["specific issue 1", "specific issue 2"],
      "recommendations": ["worker-specific recommendation 1", "worker-specific recommendation 2"]
    }
  ],
  "confidence": 0.95,
  "anomalies": ["detailed description of anomaly 1", "detailed description of anomaly 2"]
}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from AI');
      }

      let result;
      try {
        const content = completion.choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, content];
        result = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        result = {
          diagnosis: completion.choices[0].message.content,
          severity: 'medium',
          overallHealth: 'fair',
          performanceAnalysis: { responseTimeIssues: '', uptimeIssues: '', regionalIssues: '' },
          securityAnalysis: { sslIssues: '', dnsIssues: '', tcpIssues: '' },
          recommendations: ['Review the analysis provided'],
          perWorkerRecommendations: [],
          confidence: 0.8,
          anomalies: []
        };
      }

      return {
        ...result,
        tokenUsage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      logger.error('Site health analysis failed:', error);
      throw error;
    }
  }

  /**
   * Predict future site status using AI
   */
  async predictSiteStatus(siteId: string, timeframe: string = '24h'): Promise<StatusPrediction> {
    try {
      // Get historical status data from the last 3 days for prediction
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      const statuses = await prisma.siteStatus.findMany({
        where: { 
          siteId,
          checkedAt: {
            gte: threeDaysAgo
          }
        },
        orderBy: { checkedAt: 'desc' }
      });

      if (statuses.length === 0) {
        throw new Error('No historical data available for this site in the last 3 days');
      }

      // Get site info
      const site = await prisma.site.findUnique({
        where: { id: siteId }
      });

      if (!site) {
        throw new Error('Site not found');
      }

      // Group by worker and analyze historical patterns
      const workers = new Map<string, SiteStatus[]>();
      statuses.forEach(status => {
        if (!workers.has(status.workerId)) {
          workers.set(status.workerId, []);
        }
        workers.get(status.workerId)!.push(status);
      });

      // Analyze historical patterns for each worker
      const workerPredictions = Array.from(workers.entries()).map(([workerId, workerStatuses]) => {
        const recent = workerStatuses.slice(0, 20);
        const historical = workerStatuses.slice(0, 100);

        // Calculate trend metrics
        const recentAvg = recent.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / recent.length;
        const historicalAvg = historical.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / historical.length;
        const responseTimeTrend = recentAvg - historicalAvg;

        const recentUptime = (recent.filter(s => s.isUp).length / recent.length) * 100;
        const historicalUptime = (historical.filter(s => s.isUp).length / historical.length) * 100;
        const uptimeTrend = recentUptime - historicalUptime;

        // Detect patterns
        const failurePatterns = this.detectFailurePatterns(historical);
        const performanceDegradation = responseTimeTrend > 100; // 100ms increase
        const reliabilityDecline = uptimeTrend < -5; // 5% decline

        return {
          workerId,
          currentStatus: workerStatuses[0].isUp,
          avgResponseTime: Math.round(historicalAvg),
          responseTimeTrend: Math.round(responseTimeTrend),
          uptimePercentage: Math.round(historicalUptime),
          uptimeTrend: Math.round(uptimeTrend),
          failurePatterns,
          performanceDegradation,
          reliabilityDecline,
          recentFailures: recent.filter(s => !s.isUp).length
        };
      });

      // Calculate overall trends
      const allWorkers = workerPredictions.filter(w => w.workerId !== 'consensus_worker');
      const overallResponseTimeTrend = allWorkers.reduce((sum, w) => sum + w.responseTimeTrend, 0) / allWorkers.length;
      const overallUptimeTrend = allWorkers.reduce((sum, w) => sum + w.uptimeTrend, 0) / allWorkers.length;
      const totalRecentFailures = allWorkers.reduce((sum, w) => sum + w.recentFailures, 0);

      // Predict overall status
      let predictedStatus: 'up' | 'down' | 'degraded' = 'up';
      let confidence = 0.8;
      let reasoning = '';

      if (overallUptimeTrend < -10 || totalRecentFailures > 5) {
        predictedStatus = 'down';
        confidence = 0.9;
        reasoning = 'Significant decline in uptime and multiple recent failures indicate potential downtime';
      } else if (overallResponseTimeTrend > 200 || overallUptimeTrend < -5) {
        predictedStatus = 'degraded';
        confidence = 0.85;
        reasoning = 'Performance degradation and slight uptime decline suggest service degradation';
      } else {
        predictedStatus = 'up';
        confidence = 0.9;
        reasoning = 'Stable performance and uptime patterns suggest continued availability';
      }

      // Prepare comprehensive prediction data
      const predictionData = {
        site: {
          name: site.name,
          url: site.url,
          id: siteId
        },
        timeframe,
        dataPeriod: 'Last 3 days',
        overallTrends: {
          responseTimeTrend: Math.round(overallResponseTimeTrend),
          uptimeTrend: Math.round(overallUptimeTrend),
          totalRecentFailures,
          predictedStatus,
          confidence
        },
        workerPredictions,
        historicalPatterns: this.analyzeHistoricalPatterns(statuses)
      };

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert site reliability engineer specializing in predictive analytics and trend analysis. Provide detailed predictions based on historical patterns and current trends.'
          },
          {
            role: 'user',
            content: `Predict the site status for the next ${timeframe} based on the last 3 days of historical data.

Site: ${site.name} (${site.url})
Timeframe: ${timeframe}
Data Period: Last 3 days
Data: ${JSON.stringify(predictionData, null, 2)}

Provide detailed prediction in JSON format:
{
  "predictedStatus": "up|down|degraded",
  "confidence": 0.85,
  "timeframe": "${timeframe}",
  "reasoning": "detailed explanation of prediction based on patterns and trends",
  "performancePrediction": {
    "responseTime": "predicted response time trend",
    "uptime": "predicted uptime percentage",
    "reliability": "predicted reliability score"
  },
  "riskFactors": [
    "specific risk factor 1 with probability",
    "specific risk factor 2 with probability"
  ],
  "recommendations": [
    "specific preventive action 1",
    "specific preventive action 2",
    "specific preventive action 3"
  ],
  "perWorkerPredictions": [
    {
      "workerId": "worker-1",
      "predictedStatus": "up|down|degraded",
      "confidence": 0.85,
      "reasoning": "worker-specific prediction reasoning"
    }
  ]
}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from AI');
      }

      let result;
      try {
        const content = completion.choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, content];
        result = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        result = {
          predictedStatus,
          confidence,
          timeframe,
          reasoning,
          performancePrediction: { responseTime: 'stable', uptime: '95%', reliability: 'high' },
          riskFactors: ['Unable to parse AI response'],
          recommendations: ['Review the prediction manually'],
          perWorkerPredictions: []
        };
      }

      return {
        ...result,
        tokenUsage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0
        }
      };

    } catch (error) {
      logger.error('Site status prediction failed:', error);
      throw error;
    }
  }

  /**
   * Detect failure patterns in historical data
   */
  private detectFailurePatterns(statuses: SiteStatus[]): string[] {
    const patterns = [];
    const failures = statuses.filter(s => !s.isUp);
    
    if (failures.length > 0) {
      // Check for time-based patterns
      const failureHours = failures.map(f => new Date(f.checkedAt).getHours());
      const hourCounts = new Map<number, number>();
      failureHours.forEach(hour => {
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      
      const mostCommonHour = Array.from(hourCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      if (mostCommonHour && mostCommonHour[1] > 2) {
        patterns.push(`Failures cluster around ${mostCommonHour[0]}:00`);
      }

      // Check for frequency patterns
      if (failures.length > 5) {
        patterns.push('High failure frequency detected');
      }

      // Check for recent increase
      const recentFailures = failures.filter(f => 
        Date.now() - new Date(f.checkedAt).getTime() < 24 * 60 * 60 * 1000
      );
      if (recentFailures.length > failures.length * 0.5) {
        patterns.push('Recent increase in failures');
      }
    }

    return patterns;
  }

  /**
   * Analyze historical patterns for prediction
   */
  private analyzeHistoricalPatterns(statuses: SiteStatus[]): any {
    const patterns = {
      totalChecks: statuses.length,
      totalFailures: statuses.filter(s => !s.isUp).length,
      failureRate: (statuses.filter(s => !s.isUp).length / statuses.length) * 100,
      avgResponseTime: statuses.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / statuses.length,
      timeRange: {
        start: statuses[statuses.length - 1]?.checkedAt,
        end: statuses[0]?.checkedAt
      }
    };

    return patterns;
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    model: string;
    lastError?: string;
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Reply with "OK".' }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      return {
        available: true,
        model: this.model
      };
    } catch (error) {
      return {
        available: false,
        model: this.model,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const kimiPredictiveService = new KimiPredictiveService();
export type { HealthAnalysis, StatusPrediction };
