import OpenAI from 'openai';
import logger from '../utils/logger';
import { PrismaClient, SiteStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Simple result types
interface HealthAnalysis {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  performanceAnalysis: {
    responseTimeIssues: string;
    uptimeIssues: string;
    regionalIssues: string;
  };
  securityAnalysis: {
    sslIssues: string;
    dnsIssues: string;
    tcpIssues: string;
  };
  recommendations: string[];
  perWorkerRecommendations: Array<{
    workerId: string;
    issues: string[];
    recommendations: string[];
  }>;
  confidence: number;
  anomalies: string[];
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
  performancePrediction: {
    responseTime: string;
    uptime: string;
    reliability: string;
  };
  riskFactors: string[];
  recommendations: string[];
  perWorkerPredictions: Array<{
    workerId: string;
    predictedStatus: 'up' | 'down' | 'degraded';
    confidence: number;
    reasoning: string;
  }>;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

interface AIPrompt {
  id: string;
  name: string;
  title: string;
  description: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
}

class KimiPredictiveService {
  private openai: OpenAI;
  private readonly model = 'kimi-latest';
  private promptCache: Map<string, AIPrompt> = new Map();

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
   * Get AI prompt from database with caching
   */
  private async getPrompt(promptName: string): Promise<AIPrompt> {
    // Check cache first
    if (this.promptCache.has(promptName)) {
      return this.promptCache.get(promptName)!;
    }

    // Fetch from database
    const prompt = await prisma.aIPrompt.findFirst({
      where: {
        name: promptName,
        isActive: true
      }
    });

    if (!prompt) {
      throw new Error(`AI prompt '${promptName}' not found or inactive`);
    }

    // Cache the prompt
    this.promptCache.set(promptName, prompt);
    return prompt;
  }

  /**
   * Clear prompt cache (useful for testing or when prompts are updated)
   */
  public clearPromptCache(): void {
    this.promptCache.clear();
  }

  /**
   * Analyze current site health using AI
   */
  async analyzeSiteHealth(siteId: string): Promise<HealthAnalysis> {
    try {
      // Get the health analysis prompt
      const prompt = await this.getPrompt('site_health_analysis');

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

      // Replace placeholders in the user prompt template
      const userPrompt = prompt.userPromptTemplate
        .replace('{{siteName}}', site.name)
        .replace('{{siteUrl}}', site.url)
        .replace('{{analysisData}}', JSON.stringify(analysisData, null, 2));

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
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
        diagnosis: result.diagnosis || completion.choices[0].message.content,
        severity: result.severity || 'medium',
        overallHealth: result.overallHealth || 'fair',
        performanceAnalysis: result.performanceAnalysis || { responseTimeIssues: '', uptimeIssues: '', regionalIssues: '' },
        securityAnalysis: result.securityAnalysis || { sslIssues: '', dnsIssues: '', tcpIssues: '' },
        recommendations: result.recommendations || ['Review the analysis provided'],
        perWorkerRecommendations: result.perWorkerRecommendations || [],
        confidence: result.confidence || 0.8,
        anomalies: result.anomalies || [],
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
      // Get the status prediction prompt
      const prompt = await this.getPrompt('status_prediction');

      // Get historical status data from the last 7 days for more comprehensive analysis
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const statuses = await prisma.siteStatus.findMany({
        where: { 
          siteId,
          checkedAt: {
            gte: sevenDaysAgo
          }
        },
        orderBy: { checkedAt: 'desc' }
      });

      if (statuses.length === 0) {
        throw new Error('No historical data available for this site in the last 7 days');
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

      // Enhanced analysis for each worker
      const workerPredictions = Array.from(workers.entries()).map(([workerId, workerStatuses]) => {
        const recent = workerStatuses.slice(0, 50); // Last 50 checks
        const historical = workerStatuses.slice(0, 200); // Last 200 checks

        // Calculate comprehensive metrics
        const recentAvg = recent.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / recent.length;
        const historicalAvg = historical.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / historical.length;
        const responseTimeTrend = recentAvg - historicalAvg;

        const recentUptime = (recent.filter(s => s.isUp).length / recent.length) * 100;
        const historicalUptime = (historical.filter(s => s.isUp).length / historical.length) * 100;
        const uptimeTrend = recentUptime - historicalUptime;

        // Enhanced pattern detection
        const failurePatterns = this.detectDetailedFailurePatterns(historical);
        const performanceDegradation = responseTimeTrend > 100;
        const reliabilityDecline = uptimeTrend < -5;

        // Time-based analysis
        const hourlyPatterns = this.analyzeHourlyPatterns(historical);
        const dailyPatterns = this.analyzeDailyPatterns(historical);
        const weeklyPatterns = this.analyzeWeeklyPatterns(historical);

        // DNS and SSL analysis
        const dnsIssues = historical.filter(s => s.dnsResponseTime && s.dnsResponseTime > 5000).length;
        const sslIssues = historical.filter(s => s.sslDaysUntilExpiry && s.sslDaysUntilExpiry < 30).length;

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
          recentFailures: recent.filter(s => !s.isUp).length,
          hourlyPatterns,
          dailyPatterns,
          weeklyPatterns,
          dnsIssues,
          sslIssues,
          lastFailureTime: recent.find(s => !s.isUp)?.checkedAt,
          consecutiveFailures: this.getConsecutiveFailures(recent),
          recoveryTime: this.calculateAverageRecoveryTime(historical)
        };
      });

      // Calculate comprehensive overall trends
      const allWorkers = workerPredictions.filter(w => w.workerId !== 'consensus_worker');
      const overallResponseTimeTrend = allWorkers.reduce((sum, w) => sum + w.responseTimeTrend, 0) / allWorkers.length;
      const overallUptimeTrend = allWorkers.reduce((sum, w) => sum + w.uptimeTrend, 0) / allWorkers.length;
      const totalRecentFailures = allWorkers.reduce((sum, w) => sum + w.recentFailures, 0);
      const totalDnsIssues = allWorkers.reduce((sum, w) => sum + w.dnsIssues, 0);
      const totalSslIssues = allWorkers.reduce((sum, w) => sum + w.sslIssues, 0);

      // Enhanced prediction logic with specific failure reasons
      const predictionAnalysis = this.analyzeDetailedPrediction(
        workerPredictions,
        overallResponseTimeTrend,
        overallUptimeTrend,
        totalRecentFailures,
        totalDnsIssues,
        totalSslIssues,
        timeframe
      );

      // Prepare comprehensive prediction data
      const predictionData = {
        site: {
          name: site.name,
          url: site.url,
          id: siteId
        },
        timeframe,
        dataPeriod: 'Last 7 days',
        overallTrends: {
          responseTimeTrend: Math.round(overallResponseTimeTrend),
          uptimeTrend: Math.round(overallUptimeTrend),
          totalRecentFailures,
          totalDnsIssues,
          totalSslIssues,
          predictedStatus: predictionAnalysis.predictedStatus,
          confidence: predictionAnalysis.confidence
        },
        workerPredictions,
        historicalPatterns: this.analyzeHistoricalPatterns(statuses),
        failureAnalysis: predictionAnalysis.failureAnalysis,
        timeBasedRisks: predictionAnalysis.timeBasedRisks,
        infrastructureRisks: predictionAnalysis.infrastructureRisks
      };

      // Replace placeholders in the user prompt template
      const userPrompt = prompt.userPromptTemplate
        .replace('{{siteName}}', site.name)
        .replace('{{siteUrl}}', site.url)
        .replace('{{timeframe}}', timeframe)
        .replace('{{predictionData}}', JSON.stringify(predictionData, null, 2));

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
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
          predictedStatus: predictionAnalysis.predictedStatus,
          confidence: predictionAnalysis.confidence,
          timeframe,
          reasoning: predictionAnalysis.reasoning,
          performancePrediction: { responseTime: 'stable', uptime: '95%', reliability: 'high' },
          riskFactors: ['Unable to parse AI response'],
          recommendations: ['Review the prediction manually'],
          perWorkerPredictions: []
        };
      }

      return {
        predictedStatus: result.predictedStatus || predictionAnalysis.predictedStatus,
        confidence: result.confidence || predictionAnalysis.confidence,
        timeframe: result.timeframe || timeframe,
        reasoning: result.reasoning || predictionAnalysis.reasoning,
        performancePrediction: result.performancePrediction || { responseTime: 'stable', uptime: '95%', reliability: 'high' },
        riskFactors: result.riskFactors || ['Unable to parse AI response'],
        recommendations: result.recommendations || ['Review the prediction manually'],
        perWorkerPredictions: result.perWorkerPredictions || [],
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
   * Enhanced failure pattern detection with detailed analysis
   */
  private detectDetailedFailurePatterns(statuses: SiteStatus[]): string[] {
    const patterns: string[] = [];
    const failures = statuses.filter(s => !s.isUp);
    
    if (failures.length === 0) return patterns;
    
    // Check for consecutive failures
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (const status of statuses) {
      if (!status.isUp) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    
    if (maxConsecutive >= 3) {
      patterns.push(`Consecutive failures: ${maxConsecutive} times`);
    }
    
    // Check for time-based patterns
    const failureHours = failures.map(f => new Date(f.checkedAt).getHours());
    const hourCounts = new Map<number, number>();
    
    failureHours.forEach(hour => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const mostCommonHour = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostCommonHour && mostCommonHour[1] >= 3) {
      patterns.push(`Failures often occur at ${mostCommonHour[0]}:00`);
    }
    
    return patterns;
  }

  /**
   * Analyze hourly patterns in status data
   */
  private analyzeHourlyPatterns(statuses: SiteStatus[]): any {
    const hourlyData = new Map<number, { failures: number, total: number, avgResponseTime: number }>();
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStatuses = statuses.filter(s => new Date(s.checkedAt).getHours() === hour);
      const failures = hourStatuses.filter(s => !s.isUp).length;
      const avgResponseTime = hourStatuses.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / hourStatuses.length;
      
      hourlyData.set(hour, {
        failures,
        total: hourStatuses.length,
        avgResponseTime: Math.round(avgResponseTime)
      });
    }
    
    return Object.fromEntries(hourlyData);
  }

  /**
   * Analyze daily patterns in status data
   */
  private analyzeDailyPatterns(statuses: SiteStatus[]): any {
    const dailyData = new Map<number, { failures: number, total: number, avgResponseTime: number }>();
    
    for (let day = 0; day < 7; day++) {
      const dayStatuses = statuses.filter(s => new Date(s.checkedAt).getDay() === day);
      const failures = dayStatuses.filter(s => !s.isUp).length;
      const avgResponseTime = dayStatuses.reduce((sum, s) => sum + (s.httpResponseTime || 0), 0) / dayStatuses.length;
      
      dailyData.set(day, {
        failures,
        total: dayStatuses.length,
        avgResponseTime: Math.round(avgResponseTime)
      });
    }
    
    return Object.fromEntries(dailyData);
  }

  /**
   * Analyze weekly patterns in status data
   */
  private analyzeWeeklyPatterns(statuses: SiteStatus[]): any {
    const weeklyData = new Map<number, { failures: number, total: number, avgResponseTime: number }>();
    
    // Group by week of year
    statuses.forEach(status => {
      const date = new Date(status.checkedAt);
      const weekOfYear = Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      if (!weeklyData.has(weekOfYear)) {
        weeklyData.set(weekOfYear, { failures: 0, total: 0, avgResponseTime: 0 });
      }
      
      const data = weeklyData.get(weekOfYear)!;
      data.total++;
      if (!status.isUp) data.failures++;
      data.avgResponseTime += status.httpResponseTime || 0;
    });
    
    // Calculate averages
    weeklyData.forEach((data, week) => {
      data.avgResponseTime = Math.round(data.avgResponseTime / data.total);
    });
    
    return Object.fromEntries(weeklyData);
  }

  /**
   * Get consecutive failure count
   */
  private getConsecutiveFailures(statuses: SiteStatus[]): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    
    for (const status of statuses) {
      if (!status.isUp) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }
    
    return maxConsecutive;
  }

  /**
   * Calculate average recovery time from failures
   */
  private calculateAverageRecoveryTime(statuses: SiteStatus[]): number {
    const recoveryTimes: number[] = [];
    let failureStart: Date | null = null;
    
    for (const status of statuses) {
      if (!status.isUp && !failureStart) {
        failureStart = status.checkedAt;
      } else if (status.isUp && failureStart) {
        const recoveryTime = status.checkedAt.getTime() - failureStart.getTime();
        recoveryTimes.push(recoveryTime);
        failureStart = null;
      }
    }
    
    if (recoveryTimes.length === 0) return 0;
    return Math.round(recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length);
  }

  /**
   * Analyze detailed prediction with specific failure reasons
   */
  private analyzeDetailedPrediction(
    workerPredictions: any[],
    overallResponseTimeTrend: number,
    overallUptimeTrend: number,
    totalRecentFailures: number,
    totalDnsIssues: number,
    totalSslIssues: number,
    timeframe: string
  ): any {
    let predictedStatus: 'up' | 'down' | 'degraded' = 'up';
    let confidence = 0.8;
    let reasoning = '';
    
    const failureAnalysis: string[] = [];
    const timeBasedRisks: string[] = [];
    const infrastructureRisks: string[] = [];

    // Analyze failure patterns
    if (overallUptimeTrend < -10 || totalRecentFailures > 5) {
      predictedStatus = 'down';
      confidence = 0.9;
      reasoning = 'Significant decline in uptime and multiple recent failures indicate potential downtime';
      failureAnalysis.push('High failure rate detected in recent checks');
      failureAnalysis.push(`Uptime decline of ${Math.abs(overallUptimeTrend)}%`);
    } else if (overallResponseTimeTrend > 200 || overallUptimeTrend < -5) {
      predictedStatus = 'degraded';
      confidence = 0.85;
      reasoning = 'Performance degradation and slight uptime decline suggest service degradation';
      failureAnalysis.push('Response time degradation detected');
      failureAnalysis.push(`Average response time increased by ${overallResponseTimeTrend}ms`);
    } else {
      predictedStatus = 'up';
      confidence = 0.9;
      reasoning = 'Stable performance and uptime patterns suggest continued availability';
    }

    // Analyze infrastructure risks
    if (totalDnsIssues > 0) {
      infrastructureRisks.push(`DNS resolution issues detected: ${totalDnsIssues} instances`);
      confidence = Math.max(0.7, confidence - 0.1);
    }
    
    if (totalSslIssues > 0) {
      infrastructureRisks.push(`SSL certificate expiring soon: ${totalSslIssues} instances`);
      confidence = Math.max(0.7, confidence - 0.1);
    }

    // Analyze time-based risks
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    workerPredictions.forEach(worker => {
      if (worker.hourlyPatterns && worker.hourlyPatterns[currentHour]) {
        const hourData = worker.hourlyPatterns[currentHour];
        if (hourData.failures > 0 && hourData.failures / hourData.total > 0.3) {
          timeBasedRisks.push(`High failure rate at ${currentHour}:00 (${Math.round((hourData.failures / hourData.total) * 100)}%)`);
        }
      }
      
      if (worker.dailyPatterns && worker.dailyPatterns[currentDay]) {
        const dayData = worker.dailyPatterns[currentDay];
        if (dayData.failures > 0 && dayData.failures / dayData.total > 0.2) {
          timeBasedRisks.push(`Higher failure rate on ${this.getDayName(currentDay)} (${Math.round((dayData.failures / dayData.total) * 100)}%)`);
        }
      }
    });

    return {
      predictedStatus,
      confidence,
      reasoning,
      failureAnalysis,
      timeBasedRisks,
      infrastructureRisks
    };
  }

  /**
   * Get day name from day number
   */
  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
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
