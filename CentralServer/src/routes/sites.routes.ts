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
import telegramService from '../services/telegram.service';
import slackService from '../services/slack.service';
import { config } from '../config';
import discordService from '../services/discord.service';
import { leadConnectorService } from '../services/leadconnector.service';

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

// Notification schemas
const createNotificationSchema = z.object({
  body: z.object({
    type: z.enum(['EMAIL', 'SLACK', 'TELEGRAM', 'DISCORD', 'PUSH_NOTIFICATION', 'WEB_HOOK']),
    contactInfo: z.string().min(1, 'Contact info is required'),
    enabled: z.boolean().default(true),
  }),
});

const updateNotificationSchema = z.object({
  body: z.object({
    type: z.enum(['EMAIL', 'SLACK', 'TELEGRAM', 'DISCORD', 'PUSH_NOTIFICATION', 'WEB_HOOK']).optional(),
    contactInfo: z.string().min(1, 'Contact info is required').optional(),
    enabled: z.boolean().optional(),
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

  try {
    const site = await prisma.site.findUnique({
      where: { id },
      include: { notificationSettings: true }
    });

    if (!site) {
      throw new NotFoundError('Site not found');
    }

    if (site.userId !== req.user.id) {
      throw new BadRequestError('You do not have permission to delete this site');
    }

    // First delete all notifications
    await prisma.notificationSettings.deleteMany({
      where: { siteId: id }
    });

    // Then delete all status records
    await prisma.siteStatus.deleteMany({
      where: { siteId: id }
    });

    // Finally delete the site
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

// Get all notifications for a site
const getSiteNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const { id: siteId } = req.params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { notificationSettings: true },
  });

  if (!site) {
    res.status(404).json({ error: 'Site not found' });
    return;
  }

  if (site.userId !== req.user.id) {
    res.status(403).json({ error: 'You do not have permission to access this site' });
    return;
  }

  res.json(site.notificationSettings);
};

// Create a notification for a site
const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: siteId } = req.params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    const contactInfo = req.body.contactInfo;

    let isValidContactInfo = false;

    console.log(req.body.type);

    if (req.body.type === 'TELEGRAM') {
      isValidContactInfo = await telegramService.verifyChatId(contactInfo);
    } else if (req.body.type === 'SLACK') {
      isValidContactInfo = await slackService.verifyUser(contactInfo);
    } else if (req.body.type === 'DISCORD') {
      isValidContactInfo = await discordService.verifyChannelId(contactInfo);
    } else if (req.body.type === 'EMAIL') {
      isValidContactInfo = true;
    } else if (req.body.type === 'PUSH_NOTIFICATION') {
      await leadConnectorService.createGoHighLevelContact(contactInfo);
      isValidContactInfo = true;
    } else if (req.body.type === 'WEB_HOOK') {
      isValidContactInfo = true;
    } else  {
      isValidContactInfo = false;
    }

    if (!isValidContactInfo) {
      res.status(400).json({ error: 'Invalid contact info' });
      return;
    }

    if (!site) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    if (site.userId !== req.user.id) {
      res.status(403).json({ error: 'You do not have permission to modify this site' });
      return;
    }

    const existingNotification = await prisma.notificationSettings.findFirst({
      where: {
        siteId,
        type: req.body.type,
        contactInfo: contactInfo,
      },
    });

    if (existingNotification) {
      res.status(400).json({ error: 'Notification already exists' });
      return;
    }

    const notification = await prisma.notificationSettings.create({
      data: {
        ...req.body,
        siteId,
      },
    });

    await prisma.site.update({
      where: { id: siteId },
      data: {
        notificationSettings: {
          connect: { id: notification.id }
        }
      }
    });

    logger.info(`Notification ${notification.id} created for site ${siteId}`);
    res.status(201).json(notification);
  } catch (error) {
    logger.error('Failed to create notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Update a notification
const updateNotification = async (req: AuthenticatedRequest, res: Response) => {
  const { id: siteId, notificationId } = req.params;

  const notification = await prisma.notificationSettings.findUnique({
    where: { id: notificationId },
    include: { site: true },
  });

  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  if (notification.site.userId !== req.user.id) {
    res.status(403).json({ error: 'You do not have permission to modify this notification' });
    return;
  }

  if (notification.siteId !== siteId) {
    res.status(400).json({ error: 'Notification does not belong to this site' });
    return;
  }

  try {
    const updatedNotification = await prisma.notificationSettings.update({
      where: { id: notificationId },
      data: req.body,
    });

    logger.info(`Notification ${notificationId} updated`);
    res.json(updatedNotification);
  } catch (error) {
    logger.error('Failed to update notification:', error);
    throw error;
  }
};

// Delete a notification
const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  const { id: siteId, notificationId } = req.params;

  const notification = await prisma.notificationSettings.findUnique({
    where: { id: notificationId },
    include: { site: true },
  });

  if (!notification) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  if (notification.site.userId !== req.user.id) {
    res.status(403).json({ error: 'You do not have permission to delete this notification' });
    return;
  }

  if (notification.siteId !== siteId) {
    res.status(400).json({ error: 'Notification does not belong to this site' });
    return;
  }

  try {
    await prisma.notificationSettings.delete({
      where: { id: notificationId },
    });

    logger.info(`Notification ${notificationId} deleted`);
    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete notification:', error);
    throw error;
  }
};

// Get notification channels information
const getNotificationChannels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const channelsInfo = {
      telegram: {
        botUsername: config.telegram.botName,
        instructions: [
          `Start a chat with our bot: @${config.telegram.botName}`,
          'Send the /start command to the bot',
          'The bot will reply with your Chat ID',
          'Use this Chat ID in the contact info field'
        ]
      },
      slack: {
        inviteLink: config.slack.invitationLink,
        instructions: [
          'Join our Slack workspace using the invite link: ' + config.slack.invitationLink,
          'Add our Slack app to your workspace',
          'Copy the channel ID where you want to receive notifications',
          'Use the channel ID in the contact info field'
        ]
      },
      discord: {
        inviteLink: config.discord.invitationLink,
        instructions: [
          'Join our Discord server using the invite link: ' + config.discord.invitationLink,
          'Enable developer mode in Discord (Settings > App Settings > Advanced > Developer Mode)',
          'Right-click on the channel and click "Copy Channel ID"',
          'Use the channel ID in the contact info field'
        ]
      },
      email: {
        instructions: [
          'Enter your email address in the contact info field',
          'You will receive a verification email',
          'Click the verification link to confirm your email'
        ]
      }
    };

    res.json(channelsInfo);
  } catch (error) {
    logger.error('Failed to get notification channels info:', error);
    res.status(500).json({ error: 'Failed to get notification channels information' });
  }
};

// Get statistics for all sites of the authenticated user
const getStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get all sites for the user
    const sites = await prisma.site.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        notificationSettings: true,
        statuses: {
          orderBy: {
            checkedAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Calculate statistics
    const totalSites = sites.length;
    const onlineSites = sites.filter(site => site.statuses[0]?.isUp).length;
    const sitesWithSsl = sites.filter(site => site.statuses[0]?.hasSsl).length;
    const sitesWithNotifications = sites.filter(site => site.notificationSettings.length > 0).length;

    res.json({
      totalSites,
      onlineSites,
      sitesWithSsl,
      sitesWithNotifications,
    });
  } catch (error) {
    logger.error('Failed to get site statistics:', error);
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
    res.status(404).json({ error: 'Site not found' });
    return;
  }

  if (site.userId !== req.user.id) {
    res.status(403).json({ error: 'You do not have permission to access this site' });
    return;
  }

  if(site.statuses.length > 0) {
    res.status(200).json(site.statuses[0]);
  } else {
    res.status(404).json({ error: 'No status checks available yet' });
    return;
  }
};

// Get site status history
const getSiteStatusHistory = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { hours = 24 } = req.query; // Default to 24 hours

  try {
    const site = await prisma.site.findUnique({
      where: { id },
    });

    if (!site) {
      res.status(404).json({ error: 'Site not found' });
      return;
    }

    if (site.userId !== req.user.id) {
      res.status(403).json({ error: 'You do not have permission to access this site' });
      return;
    }

    const startTime = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);
    const statusHistory = await prisma.siteStatus.findMany({
      where: {
        siteId: id,
        checkedAt: {
          gte: startTime
        }
      },
      orderBy: {
        checkedAt: 'asc'
      }
    });

    res.json(statusHistory);
  } catch (error) {
    logger.error('Failed to get site status history:', error);
    res.status(500).json({ error: 'Failed to get site status history' });
  }
};

const getSiteStatuses = async (req: AuthenticatedRequest, res: Response) => {
  try {
  const user = req.user;
  const sites = await prisma.site.findMany({
    where: {
      userId: user.id,
    },
    include: {
      statuses: {
        orderBy: {
          checkedAt: 'desc'
        },
        take: 1
      }
    }
    });

    res.status(200).json(sites);
  } catch (error) {
    logger.error('Failed to get site statuses:', error);
    res.status(500).json({ error: 'Failed to get site statuses' });
  }
};

router.get('/', getSites as any);
router.get('/statistics', getStatistics as any);
router.get('/:id/status', getSiteStatus as any);
router.get('/:id/status/history', getSiteStatusHistory as any);
router.get('/statuses', getSiteStatuses as any);

router.get('/report', generatePDFReport as any);
router.get('/notification-channels', getNotificationChannels as any);
router.post('/', validateRequest(createSiteSchema), createSite as any);
router.patch('/:id', validateRequest(updateSiteSchema), updateSite as any);
router.delete('/:id', deleteSite as any);

// Add notification routes
router.get('/:id/notifications', getSiteNotifications as any);
router.post('/:id/notifications', validateRequest(createNotificationSchema), createNotification as any);
router.patch('/:id/notifications/:notificationId', validateRequest(updateNotificationSchema), updateNotification as any);
router.delete('/:id/notifications/:notificationId', deleteNotification as any);

export default router;