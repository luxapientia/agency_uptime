import { Router } from 'express';
import authRoutes from './auth.routes';
import sitesRoutes from './sites.routes';
import workersRoutes from './workers.routes';
import { authenticate } from '../middleware/auth.middleware';
import settingsRoutes from './settings.route';
import notificationRoutes from './notification.route';
import aiRoutes from './ai.routes';
import reportsRoutes from './reports.routes';
import membershipRoutes from './membership.routes';
import paymentRoutes from './payment.routes';

const router = Router();

// Public routes
router.use(`/auth`, authRoutes);

// Public all sites endpoint (no authentication required)
router.get('/all-sites', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Get all active sites with their latest status
    const sites = await prisma.site.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            companyName: true,
            themeSettings: {
              select: {
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                textPrimary: true,
                textSecondary: true,
              }
            }
          }
        },
        statuses: {
          orderBy: {
            checkedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            isUp: true,
            pingIsUp: true,
            httpIsUp: true,
            dnsIsUp: true,
            checkedAt: true,
            pingResponseTime: true,
            httpResponseTime: true,
            dnsResponseTime: true,
            hasSsl: true,
            sslDaysUntilExpiry: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
    });

    res.json({ sites });
  } catch (error) {
    console.error('Failed to fetch all sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

// Public individual site endpoint (no authentication required)
router.get('/all-sites/:id', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const { id } = req.params;

    console.log(id);
    
    // Get specific site with its latest status and user theme settings
    const site = await prisma.site.findFirst({
      where: {
        id: id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            companyName: true,
            themeSettings: {
              select: {
                logo: true,
                primaryColor: true,
                secondaryColor: true,
                textPrimary: true,
                textSecondary: true,
              }
            }
          }
        },
        statuses: {
          orderBy: {
            checkedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            isUp: true,
            pingIsUp: true,
            httpIsUp: true,
            dnsIsUp: true,
            checkedAt: true,
            pingResponseTime: true,
            httpResponseTime: true,
            dnsResponseTime: true,
            hasSsl: true,
            sslDaysUntilExpiry: true,
          }
        }
      },
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json({ site });
  } catch (error) {
    console.error('Failed to fetch site details:', error);
    res.status(500).json({ error: 'Failed to fetch site details' });
  }
});

// Protected routes
router.use(`/sites`, authenticate, sitesRoutes);
router.use(`/workers`, authenticate, workersRoutes);
router.use(`/settings`, settingsRoutes);
router.use(`/notifications`, authenticate, notificationRoutes);
router.use(`/ai`, authenticate, aiRoutes);
router.use(`/reports`, authenticate, reportsRoutes);
router.use(`/membership`, membershipRoutes);
router.use(`/payment`, paymentRoutes);

export default router; 