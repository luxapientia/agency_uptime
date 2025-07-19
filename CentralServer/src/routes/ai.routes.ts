import { Router, Response } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import type { AuthenticatedRequest } from '../types/express';
import { kimiPredictiveService } from '../services/kimiPredictive.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const analyzeSiteSchema = z.object({
  body: z.object({
    siteId: z.string().min(1, 'Site ID is required'),
  }),
});

const predictSiteSchema = z.object({
  body: z.object({
    siteId: z.string().min(1, 'Site ID is required'),
    timeframe: z.string().default('24h'),
  }),
});

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
      res.status(404).json({
        success: false,
        error: 'Site not found or access denied'
      });
      return;
    }

    // Call the AI service directly with siteId
    const analysis = await kimiPredictiveService.analyzeSiteHealth(siteId);

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

// Predict future site status using AI
const predictSite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { siteId, timeframe } = req.body;

    // Verify user owns the site
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: req.user.id
      }
    });

    if (!site) {
      res.status(404).json({
        success: false,
        error: 'Site not found or access denied'
      });
      return;
    }

    // Call the AI service directly with siteId and timeframe
    const prediction = await kimiPredictiveService.predictSiteStatus(siteId, timeframe);

    res.json({
      success: true,
      data: {
        siteId,
        siteName: site.name,
        prediction,
        timeframe,
        predictedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Site prediction failed:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Site prediction failed'
      });
    }
  }
};

// Route registrations
router.post('/analyze-site', validateRequest(analyzeSiteSchema), analyzeSite as any);
router.post('/predict-site', validateRequest(predictSiteSchema), predictSite as any);

export default router; 