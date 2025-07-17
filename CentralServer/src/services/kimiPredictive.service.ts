import OpenAI from 'openai';
import logger from '../utils/logger';

// Site monitoring data types
interface SiteHealthData {
  siteId: string;
  siteName: string;
  url: string;
  isUp: boolean;
  pingIsUp: boolean;
  httpIsUp: boolean;
  dnsIsUp: boolean;
  responseTime: number;
  errorCodes?: string[];
  sslInfo?: {
    isValid: boolean;
    daysUntilExpiry: number;
    issuer: string;
  };
  tcpChecks?: {
    port: number;
    isUp: boolean;
    error?: string;
  }[];
  lastFailure?: {
    timestamp: string;
    error: string;
    type: 'ping' | 'http' | 'dns' | 'ssl' | 'tcp';
  };
  uptimeHistory?: {
    timestamp: string;
    isUp: boolean;
    responseTime: number;
  }[];
}

interface DiagnosticResult {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  predictedIssues?: string[];
  confidence: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
    cacheHits?: number;
  };
}

interface PredictiveSummary {
  period: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  keyInsights: string[];
  upcomingRisks: {
    risk: string;
    probability: number;
    timeframe: string;
    mitigation: string;
  }[];
  recommendations: string[];
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
    cacheHits?: number;
  };
}

// Token thresholds for different model capabilities
const TOKEN_THRESHOLDS = {
  SMALL: 8000,    // 8k context - basic diagnostics
  MEDIUM: 32000,  // 32k context - detailed analysis
  LARGE: 128000   // 128k context - comprehensive summaries
};

// Canonical prompt templates for cache optimization
const PROMPT_TEMPLATES = {
  DNS_FAILURE: `You are an expert site reliability engineer analyzing DNS resolution failures. 
Analyze the following DNS diagnostic data and provide:
1. Root cause analysis
2. Severity assessment (low/medium/high/critical)
3. Specific remediation steps
4. Preventive measures

Focus on common DNS issues: nameserver problems, TTL misconfiguration, DNS propagation delays, DNSSEC issues.`,

  SSL_ERROR: `You are an expert site reliability engineer analyzing SSL/TLS certificate issues.
Analyze the following SSL diagnostic data and provide:
1. Root cause analysis
2. Severity assessment (low/medium/high/critical)
3. Specific remediation steps
4. Timeline for resolution

Focus on: certificate expiry, chain validation, cipher suite issues, protocol version problems.`,

  SERVER_TIMEOUT: `You are an expert site reliability engineer analyzing server timeout issues.
Analyze the following timeout diagnostic data and provide:
1. Root cause analysis
2. Severity assessment (low/medium/high/critical)
3. Performance optimization recommendations
4. Infrastructure scaling suggestions

Focus on: response time patterns, server load, network latency, resource constraints.`,

  CONNECTIVITY_ISSUE: `You are an expert site reliability engineer analyzing network connectivity problems.
Analyze the following connectivity diagnostic data and provide:
1. Root cause analysis
2. Severity assessment (low/medium/high/critical)
3. Network troubleshooting steps
4. Monitoring improvements

Focus on: ping failures, packet loss, routing issues, firewall problems.`,

  PREDICTIVE_SUMMARY: `You are an expert site reliability engineer providing predictive monitoring insights.
Analyze the following multi-site health data and provide:
1. Overall health assessment (excellent/good/fair/poor/critical)
2. Key insights and trends
3. Predicted risks with probability and timeframe
4. Proactive recommendations

Focus on patterns, anomalies, degradation trends, and early warning indicators.`
};

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
   * Calculate token count estimation for input text
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Determine optimal model configuration based on content size
   */
  private getModelConfig(contentSize: number): { maxTokens: number; temperature: number } {
    if (contentSize <= TOKEN_THRESHOLDS.SMALL) {
      return { maxTokens: 1000, temperature: 0.1 };
    } else if (contentSize <= TOKEN_THRESHOLDS.MEDIUM) {
      return { maxTokens: 2000, temperature: 0.1 };
    } else {
      return { maxTokens: 3000, temperature: 0.1 };
    }
  }

  /**
   * Preprocess diagnostic data to minimize token usage and maximize cache hits
   */
  private preprocessDiagnosticData(data: SiteHealthData): string {
    const processed = {
      site: {
        name: data.siteName,
        url: data.url,
        id: data.siteId
      },
      status: {
        overall: data.isUp,
        ping: data.pingIsUp,
        http: data.httpIsUp,
        dns: data.dnsIsUp,
        responseTime: data.responseTime
      },
      errors: data.errorCodes || [],
      ...(data.sslInfo && {
        ssl: {
          valid: data.sslInfo.isValid,
          expiryDays: data.sslInfo.daysUntilExpiry,
          issuer: data.sslInfo.issuer
        }
      }),
      ...(data.tcpChecks && {
        tcp: data.tcpChecks.map(check => ({
          port: check.port,
          up: check.isUp,
          error: check.error
        }))
      }),
      ...(data.lastFailure && {
        lastFailure: {
          time: data.lastFailure.timestamp,
          error: data.lastFailure.error,
          type: data.lastFailure.type
        }
      }),
      ...(data.uptimeHistory && {
        history: data.uptimeHistory.slice(-20).map(h => ({
          time: h.timestamp,
          up: h.isUp,
          rt: h.responseTime
        }))
      })
    };

    return JSON.stringify(processed, null, 2);
  }

  /**
   * Analyze site health data and provide diagnostic insights
   */
  async analyzeSiteHealth(data: SiteHealthData): Promise<DiagnosticResult> {
    try {
      const preprocessedData = this.preprocessDiagnosticData(data);
      
      // Determine the appropriate prompt template
      let template = PROMPT_TEMPLATES.CONNECTIVITY_ISSUE;
      if (!data.dnsIsUp) {
        template = PROMPT_TEMPLATES.DNS_FAILURE;
      } else if (data.sslInfo && !data.sslInfo.isValid) {
        template = PROMPT_TEMPLATES.SSL_ERROR;
      } else if (data.responseTime > 5000) {
        template = PROMPT_TEMPLATES.SERVER_TIMEOUT;
      }

      const contentSize = this.estimateTokenCount(template + preprocessedData);
      const config = this.getModelConfig(contentSize);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: template
          },
          {
            role: 'user',
            content: `Site diagnostic data:\n${preprocessedData}\n\nPlease provide a structured analysis in JSON format with the following fields:
{
  "diagnosis": "detailed explanation of the issue",
  "severity": "low|medium|high|critical",
  "recommendations": ["specific action 1", "specific action 2", ...],
  "predictedIssues": ["potential future issue 1", "potential future issue 2", ...],
  "confidence": 0.95
}`
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: 0.9
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Kimi API');
      }

      let analysisResult;
      try {
        const content = completion.choices[0].message.content;
        // Extract JSON from response if it's wrapped in markdown
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, content];
        analysisResult = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        // Fallback parsing
        analysisResult = {
          diagnosis: completion.choices[0].message.content,
          severity: 'medium',
          recommendations: ['Review the diagnostic analysis provided'],
          confidence: 0.8
        };
      }

      return {
        ...analysisResult,
        tokenUsage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
          cacheHits: (completion.usage as any)?.prompt_cache_hit_tokens
        }
      };

    } catch (error) {
      logger.error('Site health analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate predictive monitoring summary for multiple sites
   */
  async generatePredictiveSummary(
    sites: SiteHealthData[],
    period: string = '24h'
  ): Promise<PredictiveSummary> {
    try {
      const summaryData = sites.map(site => this.preprocessDiagnosticData(site));
      const consolidatedData = JSON.stringify({
        period,
        siteCount: sites.length,
        sites: summaryData
      }, null, 2);

      const contentSize = this.estimateTokenCount(PROMPT_TEMPLATES.PREDICTIVE_SUMMARY + consolidatedData);
      const config = this.getModelConfig(contentSize);

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: PROMPT_TEMPLATES.PREDICTIVE_SUMMARY
          },
          {
            role: 'user',
            content: `Multi-site health data for ${period}:\n${consolidatedData}\n\nProvide a predictive summary in JSON format:
{
  "period": "${period}",
  "overallHealth": "excellent|good|fair|poor|critical",
  "keyInsights": ["insight 1", "insight 2", ...],
  "upcomingRisks": [
    {
      "risk": "description",
      "probability": 0.75,
      "timeframe": "24-48 hours",
      "mitigation": "recommended action"
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: 0.9
      });
      
      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('Invalid response from Kimi API');
      }

      let summaryResult;
      try {
        const content = completion.choices[0].message.content;
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || [null, content];
        summaryResult = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        summaryResult = {
          period,
          overallHealth: 'fair',
          keyInsights: ['AI analysis completed'],
          upcomingRisks: [],
          recommendations: ['Review the detailed analysis provided']
        };
      }

      return {
        ...summaryResult,
        tokenUsage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
          cacheHits: (completion.usage as any)?.prompt_cache_hit_tokens
        }
      };

    } catch (error) {
      logger.error('Predictive summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Get API health and usage statistics
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    model: string;
    tokenLimits: typeof TOKEN_THRESHOLDS;
    lastError?: string;
  }> {
    try {
      // Simple health check with minimal token usage
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Reply with just "OK" to confirm service availability.'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });
      
      return {
        available: true,
        model: this.model,
        tokenLimits: TOKEN_THRESHOLDS
      };
    } catch (error) {
      return {
        available: false,
        model: this.model,
        tokenLimits: TOKEN_THRESHOLDS,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch process multiple site diagnostics efficiently
   */
  async batchAnalyzeSites(sites: SiteHealthData[]): Promise<{
    results: (DiagnosticResult | { error: string })[];
    totalTokenUsage: {
      prompt: number;
      completion: number;
      total: number;
      cacheHits: number;
    };
  }> {
    const results: (DiagnosticResult | { error: string })[] = [];
    let totalTokenUsage = {
      prompt: 0,
      completion: 0,
      total: 0,
      cacheHits: 0
    };

    // Process sites in batches to respect rate limits
    const batchSize = 5;
    for (let i = 0; i < sites.length; i += batchSize) {
      const batch = sites.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (site) => {
        try {
          const result = await this.analyzeSiteHealth(site);
          totalTokenUsage.prompt += result.tokenUsage.prompt;
          totalTokenUsage.completion += result.tokenUsage.completion;
          totalTokenUsage.total += result.tokenUsage.total;
          totalTokenUsage.cacheHits += result.tokenUsage.cacheHits || 0;
          return result;
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Analysis failed' };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful to the API
      if (i + batchSize < sites.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      results,
      totalTokenUsage
    };
  }
}

export const kimiPredictiveService = new KimiPredictiveService();
export type { DiagnosticResult, PredictiveSummary, SiteHealthData };
