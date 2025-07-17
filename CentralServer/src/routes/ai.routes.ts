import { Router, Response } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import type { AuthenticatedRequest } from '../types/express';
import { kimiPredictiveService, type SiteHealthData } from '../services/kimiPredictive.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const analyzeSiteSchema = z.object({
  body: z.object({
    siteId: z.string().min(1, 'Site ID is required'),
  }),
});

const batchAnalysisSchema = z.object({
  body: z.object({
    siteIds: z.array(z.string()).min(1, 'At least one site ID is required'),
  }),
});

const predictiveSummarySchema = z.object({
  body: z.object({
    siteIds: z.array(z.string()).optional(),
    period: z.string().default('24h'),
  }),
});

/**
 * Helper function to convert site status data to SiteHealthData format
 */
async function getSiteHealthData(siteId: string): Promise<SiteHealthData | null> {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        statuses: {
          where: { workerId: 'consensus_worker' },
          orderBy: { checkedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!site) return null;

    const latestStatus = site.statuses[0];
    if (!latestStatus) return null;

    // Get uptime history for the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uptimeHistory = await prisma.siteStatus.findMany({
      where: {
        siteId,
        workerId: 'consensus_worker',
        checkedAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: { checkedAt: 'asc' },
      take: 100
    });

    // Get last failure
    const lastFailure = await prisma.siteStatus.findFirst({
      where: {
        siteId,
        workerId: 'consensus_worker',
        isUp: false
      },
      orderBy: { checkedAt: 'desc' }
    });

    const siteHealthData: SiteHealthData = {
      siteId: site.id,
      siteName: site.name,
      url: site.url,
      isUp: latestStatus.isUp,
      pingIsUp: latestStatus.pingIsUp,
      httpIsUp: latestStatus.httpIsUp,
      dnsIsUp: latestStatus.dnsIsUp,
      responseTime: latestStatus.httpResponseTime || 0,
      errorCodes: [],
      ...(latestStatus.hasSsl && {
        sslInfo: {
          isValid: (latestStatus.sslDaysUntilExpiry || 0) > 0,
          daysUntilExpiry: latestStatus.sslDaysUntilExpiry || 0,
          issuer: latestStatus.sslIssuer || 'Unknown'
        }
      }),
      ...(latestStatus.tcpChecks && {
        tcpChecks: Array.isArray(latestStatus.tcpChecks) 
          ? latestStatus.tcpChecks.map((check: any) => ({
              port: check.port,
              isUp: check.isUp,
              error: check.error
            }))
          : Object.values(latestStatus.tcpChecks).map((check: any) => ({
              port: check.port,
              isUp: check.isUp,
              error: check.error
            }))
      }),
      ...(lastFailure && {
        lastFailure: {
          timestamp: lastFailure.checkedAt.toISOString(),
          error: 'Site was down',
          type: !lastFailure.pingIsUp ? 'ping' : 
                !lastFailure.httpIsUp ? 'http' : 
                !lastFailure.dnsIsUp ? 'dns' : 'tcp'
        }
      }),
      uptimeHistory: uptimeHistory.map(status => ({
        timestamp: status.checkedAt.toISOString(),
        isUp: status.isUp,
        responseTime: status.httpResponseTime || 0
      }))
    };

    return siteHealthData;
  } catch (error) {
    logger.error('Error getting site health data:', error);
    return null;
  }
}

/**
 * GET /api/ai/health
 * Check AI service health and availability
 */
router.get('/health', async (req, res: Response) => {
  try {
    const healthStatus = await kimiPredictiveService.getHealthStatus();
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logger.error('AI health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI service health check failed'
    });
  }
});

// Analyze a single site's health and provide AI diagnostics
const analyzeSite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId } = req.body;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user.id
      }
    });

    if (!site) {
      throw new NotFoundError('Site not found or access denied');
    }

    const siteHealthData = await getSiteHealthData(siteId);
    if (!siteHealthData) {
      throw new NotFoundError('No health data available for this site');
    }

    const analysis = await kimiPredictiveService.analyzeSiteHealth(siteHealthData);

    res.json({
      success: true,
      data: {
        siteId,
        siteName: site.name,
        analysis,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Site analysis failed:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Site analysis failed'
      });
    }
  }
};

/**
 * POST /api/ai/batch-analyze
 * Analyze multiple sites in batch for efficiency
 */
// Batch analyze multiple sites
const batchAnalyze = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteIds } = req.body;

    // Verify user owns all sites
    const sites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
        userId: req.user.id
      }
    });

    if (sites.length !== siteIds.length) {
      throw new NotFoundError('One or more sites not found or access denied');
    }

    // Get health data for all sites
    const siteHealthDataPromises = siteIds.map((siteId: string) => getSiteHealthData(siteId));
    const siteHealthDataResults = await Promise.all(siteHealthDataPromises);
    
    const validSiteHealthData = siteHealthDataResults.filter((data): data is SiteHealthData => data !== null);

    if (validSiteHealthData.length === 0) {
      throw new NotFoundError('No health data available for any of the requested sites');
    }

    const batchResults = await kimiPredictiveService.batchAnalyzeSites(validSiteHealthData);

    res.json({
      success: true,
      data: {
        results: batchResults.results.map((result, index) => ({
          siteId: validSiteHealthData[index]?.siteId,
          siteName: validSiteHealthData[index]?.siteName,
          result
        })),
        tokenUsage: batchResults.totalTokenUsage,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Batch analysis failed:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Batch analysis failed'
      });
    }
  }
};

// Generate predictive monitoring summary
const predictiveSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteIds, period } = req.body;

    let targetSiteIds = siteIds;

    // If no specific sites provided, use all user's sites
    if (!targetSiteIds || targetSiteIds.length === 0) {
      const userSites = await prisma.site.findMany({
        where: { userId: req.user.id },
        select: { id: true }
      });
      targetSiteIds = userSites.map(site => site.id);
    } else {
      // Verify user owns the specified sites
      const sites = await prisma.site.findMany({
        where: {
          id: { in: targetSiteIds },
          userId: req.user.id
        }
      });

      if (sites.length !== targetSiteIds.length) {
        throw new NotFoundError('One or more sites not found or access denied');
      }
    }

    if (targetSiteIds.length === 0) {
      throw new NotFoundError('No sites found for analysis');
    }

    // Get health data for all sites
    const siteHealthDataPromises = targetSiteIds.map((siteId: string) => getSiteHealthData(siteId));
    const siteHealthDataResults = await Promise.all(siteHealthDataPromises);
    
    const validSiteHealthData = siteHealthDataResults.filter((data): data is SiteHealthData => data !== null);

    if (validSiteHealthData.length === 0) {
      throw new NotFoundError('No health data available for analysis');
    }

    const summary = await kimiPredictiveService.generatePredictiveSummary(validSiteHealthData, period);

    res.json({
      success: true,
      data: {
        summary,
        sitesAnalyzed: validSiteHealthData.length,
        period,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Predictive summary generation failed:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Predictive summary generation failed'
      });
    }
  }
};

// Get AI insights dashboard
const dashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;

    // Get user's sites with latest status
    const sites = await prisma.site.findMany({
      where: { userId },
      include: {
        statuses: {
          where: { workerId: 'consensus_worker' },
          orderBy: { checkedAt: 'desc' },
          take: 1
        }
      }
    });

    // Basic stats without AI analysis for now
    const totalSites = sites.length;
    const activeSites = sites.filter(site => site.isActive).length;
    const downSites = sites.filter(site => 
      site.statuses[0] && !site.statuses[0].isUp
    ).length;

    const insights = {
      totalSites,
      activeSites,
      downSites,
      healthScore: totalSites > 0 ? Math.round(((totalSites - downSites) / totalSites) * 100) : 100,
      criticalAlerts: downSites,
      recommendations: [
        'Monitor SSL certificate expiry dates',
        'Review sites with frequent downtime',
        'Consider redundancy for critical services'
      ]
    };

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    logger.error('AI dashboard failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI dashboard retrieval failed'
    });
  }
};

// Route registrations
router.post('/analyze-site', validateRequest(analyzeSiteSchema), analyzeSite as any);
router.post('/batch-analyze', validateRequest(batchAnalysisSchema), batchAnalyze as any);
router.post('/predictive-summary', validateRequest(predictiveSummarySchema), predictiveSummary as any);
router.get('/dashboard', dashboard as any);

export default router; 