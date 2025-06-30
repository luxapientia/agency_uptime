import { Router, Response } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import type { AuthenticatedRequest } from '../types/express';
import redisService from '../services/redis.service';
import logger from '../utils/logger';
import monitorService from '../services/monitor.service';
import pdfService from '../services/pdf.service';

const prisma = new PrismaClient();
const router = Router();

const createSiteSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Site name is required'),
    url: z.string().url('Must be a valid URL'),
    checkInterval: z.number().min(1).max(60).default(5),
  }),
});

const updateSiteSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Site name is required').optional(),
    url: z.string().url('Must be a valid URL').optional(),
    checkInterval: z.number().min(1).max(60).optional(),
    isActive: z.boolean().optional(),
  }),
});

// Get all sites for the authenticated user
const getSites = async (req: AuthenticatedRequest, res: Response) => {
  const sites = await prisma.site.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  res.json(sites);
};

// Create a new site
const createSite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const site = await prisma.site.create({
      data: {
        ...req.body,
        userId: req.user.id,
      },
    });

    // Sync the new site to Redis
    await redisService.syncSite(site);
    await monitorService.addSiteSchedule(site);
    logger.info(`Site ${site.id} created and synced to Redis`);

    res.status(201).json(site);
  } catch (error) {
    logger.error('Failed to create and sync site:', error);
    throw error;
  }
};

// Update a site
const updateSite = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existingSite = await prisma.site.findUnique({
    where: { id },
  });

  if (!existingSite) {
    throw new NotFoundError('Site not found');
  }

  if (existingSite.userId !== req.user.id) {
    throw new BadRequestError('You do not have permission to update this site');
  }

  try {
    const site = await prisma.site.update({
      where: { id },
      data: req.body,
    });

    // Sync the updated site to Redis
    await redisService.syncSite(site);
    await monitorService.updateSiteSchedule(site);
    logger.info(`Site ${site.id} updated and synced to Redis`);

    res.json(site);
  } catch (error) {
    logger.error('Failed to update and sync site:', error);
    throw error;
  }
};

// Delete a site
const deleteSite = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const existingSite = await prisma.site.findUnique({
    where: { id },
  });

  if (!existingSite) {
    throw new NotFoundError('Site not found');
  }

  if (existingSite.userId !== req.user.id) {
    throw new BadRequestError('You do not have permission to delete this site');
  }

  try {
    // First delete all related status records
    await prisma.siteStatus.deleteMany({
      where: { siteId: id }
    });

    // Then delete the site
    await prisma.site.delete({
      where: { id },
    });

    // Remove the site from Redis
    await redisService.removeSite(id);
    await monitorService.removeSiteSchedule(id);
    logger.info(`Site ${id} deleted and removed from Redis`);

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete and remove site from Redis:', error);
    throw error;
  }
};

// Get site status
const getSiteStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      statuses: {
        orderBy: {
          checkedAt: 'desc'
        },
        take: 1
      }
    }
  });

  if (!site) {
    throw new NotFoundError('Site not found');
  }

  if (site.userId !== req.user.id) {
    throw new BadRequestError('You do not have permission to access this site');
  }

  // Get all status checks from last 24 hours for uptime calculation
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const statusHistory = await prisma.siteStatus.findMany({
    where: {
      siteId: id,
      checkedAt: {
        gte: last24Hours
      }
    },
    orderBy: {
      checkedAt: 'asc'
    }
  });

  // Calculate uptime percentages
  let uptimePercentage = 0;
  let httpUptimePercentage = 0;
  let pingUptimePercentage = 0;

  if (statusHistory.length > 0) {
    const totalChecks = statusHistory.length;
    const upChecks = statusHistory.filter(status => status.isUp).length;
    const httpUpChecks = statusHistory.filter(status => status.httpIsUp).length;
    const pingUpChecks = statusHistory.filter(status => status.pingIsUp).length;

    uptimePercentage = (upChecks / totalChecks) * 100;
    httpUptimePercentage = (httpUpChecks / totalChecks) * 100;
    pingUptimePercentage = (pingUpChecks / totalChecks) * 100;
  }

  const latestStatus = site.statuses[0];
  res.status(200).json({
    isUp: latestStatus?.isUp ?? null,
    lastChecked: latestStatus?.checkedAt ?? null,
    pingUp: latestStatus?.pingIsUp ?? null,
    httpUp: latestStatus?.httpIsUp ?? null,
    uptime: {
      last24Hours: {
        overall: Math.round(uptimePercentage * 100) / 100,
        http: Math.round(httpUptimePercentage * 100) / 100,
        ping: Math.round(pingUptimePercentage * 100) / 100,
        totalChecks: statusHistory.length
      }
    },
    ssl: latestStatus ? {
      enabled: latestStatus.hasSsl,
      validFrom: latestStatus.sslValidFrom,
      validTo: latestStatus.sslValidTo,
      issuer: latestStatus.sslIssuer,
      daysUntilExpiry: latestStatus.sslDaysUntilExpiry
    } : null,
    message: latestStatus ? undefined : 'No status checks available yet'
  });
};

// Generate PDF report for all sites
const generatePDFReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pdfBuffer = await pdfService.generateReport(req.user.id);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sites-report.pdf');
    
    // Send the PDF buffer
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Failed to generate PDF report:', error);
    throw error;
  }
};

router.get('/', getSites as any);
router.get('/:id/status', getSiteStatus as any);
router.get('/report', generatePDFReport as any);
router.post('/', validateRequest(createSiteSchema), createSite as any);
router.patch('/:id', validateRequest(updateSiteSchema), updateSite as any);
router.delete('/:id', deleteSite as any);

export default router;