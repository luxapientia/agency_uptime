import { Router } from 'express';

const router = Router();

// Public endpoint to get all active sites (no authentication required)
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

export default router; 