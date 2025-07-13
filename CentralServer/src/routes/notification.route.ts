import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types/express';
import type { RequestHandler } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Schema for marking notifications as seen
const markAsSeenSchema = z.object({
  notificationIds: z.array(z.string())
});

// Get all notifications for the authenticated user
const getAllNotifications = async (req: AuthenticatedRequest, res: any) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Get unseen notifications for the authenticated user
const getUnseenNotifications = async (req: AuthenticatedRequest, res: any) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        seen: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching unseen notifications:', error);
    res.status(500).json({ message: 'Failed to fetch unseen notifications' });
  }
};

// Mark notifications as seen
const markAsSeen = async (req: AuthenticatedRequest, res: any) => {
  try {
    const { notificationIds } = req.body;

    // Update all specified notifications
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds
        },
        userId: req.user.id // Ensure user can only mark their own notifications
      },
      data: {
        seen: true,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Notifications marked as seen' });
  } catch (error) {
    console.error('Error marking notifications as seen:', error);
    res.status(500).json({ message: 'Failed to mark notifications as seen' });
  }
};

// Register routes
router.get('/', getAllNotifications);
router.get('/unseen', getUnseenNotifications);
router.post('/seen', validateRequest(markAsSeenSchema), markAsSeen);

export default router;
