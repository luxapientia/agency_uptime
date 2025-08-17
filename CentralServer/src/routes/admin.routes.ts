import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/admin.middleware';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /admin/users
 * Fetch all users with basic information
 * Requires admin privileges
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        userFeatures: {
          select: {
            featureKey: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            sites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

/**
 * GET /admin/users/:id
 * Fetch a specific user by ID
 * Requires admin privileges
 */
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
              select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          customDomain: true,
          userFeatures: {
            select: {
              featureKey: true,
              endDate: true,
            },
          },
          sites: {
            select: {
              id: true,
              name: true,
              url: true,
              isActive: true,
              checkInterval: true,
              monthlyReport: true,
            },
          },
        },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

/**
 * POST /admin/users
 * Create a new user
 * Requires admin privileges
 */
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, companyName, role, password, userFeatures } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !companyName || !role || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: firstName, lastName, email, companyName, role, password',
      });
    }

    // Validate role
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be USER, ADMIN, or SUPER_ADMIN',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already taken by another user',
      });
    }

    // Validate userFeatures array if provided
    if (userFeatures !== undefined) {
      if (!Array.isArray(userFeatures)) {
        return res.status(400).json({
          success: false,
          error: 'userFeatures must be an array',
        });
      }

      // Validate each feature object
      for (const feature of userFeatures as Array<{ featureKey: string; endDate: string | Date }>) {
        if (!feature.featureKey || !feature.endDate) {
          return res.status(400).json({
            success: false,
            error: 'Each feature must have featureKey and endDate',
          });
        }

        // Validate endDate is a valid date
        if (isNaN(new Date(feature.endDate).getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid endDate format',
          });
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        companyName: companyName.trim(),
        role,
        password: hashedPassword, // Note: In production, this should be hashed
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        userFeatures: {
          select: {
            featureKey: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            sites: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
});

/**
 * PUT /admin/users/:id
 * Update user information (all fields including features)
 * Requires admin privileges
 */
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, companyName, role, userFeatures } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !companyName || !role) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: firstName, lastName, email, companyName, role',
      });
    }

    // Validate role
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be USER, ADMIN, or SUPER_ADMIN',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Validate userFeatures array if provided
    if (userFeatures !== undefined) {
      if (!Array.isArray(userFeatures)) {
        return res.status(400).json({
          success: false,
          error: 'userFeatures must be an array',
        });
      }

      // Validate each feature object
      for (const feature of userFeatures as Array<{ featureKey: string; endDate: string | Date }>) {
        if (!feature.featureKey || !feature.endDate) {
          return res.status(400).json({
            success: false,
            error: 'Each feature must have featureKey and endDate',
          });
        }

        // Validate endDate is a valid date
        if (isNaN(new Date(feature.endDate).getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid endDate format',
          });
        }
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if email is already taken by another user
    const emailExists = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id },
      },
      select: { id: true },
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'Email is already taken by another user',
      });
    }

    // Use transaction to update user and features atomically
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.user.update({
        where: { id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          companyName: companyName.trim(),
          role,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          userFeatures: {
            select: {
              featureKey: true,
              endDate: true,
            },
          },
          _count: {
            select: {
              sites: true,
            },
          },
        },
      });

      // Update user features if provided
      if (userFeatures !== undefined) {
        // Delete all existing user features
        await tx.userFeature.deleteMany({
          where: { userId: id },
        });

        // Create new user features
        if (userFeatures.length > 0) {
          await tx.userFeature.createMany({
            data: userFeatures.map((feature: { featureKey: string; endDate: string | Date }) => ({
              userId: id,
              featureKey: feature.featureKey,
              endDate: new Date(feature.endDate),
            })),
          });
        }

        // Fetch updated user with new features
        return await tx.user.findUnique({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            userFeatures: {
              select: {
                featureKey: true,
                endDate: true,
              },
            },
            _count: {
              select: {
                sites: true,
              },
            },
          },
        });
      }

      return user;
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  }
});

/**
 * PUT /admin/users/:id/role
 * Update user role only
 * Requires admin privileges
 */
router.put('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be USER, ADMIN, or SUPER_ADMIN',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role',
    });
  }
});

/**
 * POST /admin/sites
 * Create a new site for a user
 * Requires admin privileges
 */
router.post('/sites', requireAdmin, async (req, res) => {
  try {
    const { userId, name, url, checkInterval, isActive, monthlyReport, monthlyReportSendAt } = req.body;

    // Validate required fields
    if (!userId || !name || !url) {
      return res.status(400).json({
        success: false,
        error: 'userId, name, and url are required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if site URL already exists for this user
    const existingSite = await prisma.site.findFirst({
      where: {
        userId,
        url: url.trim(),
      },
      select: { id: true },
    });

    if (existingSite) {
      return res.status(400).json({
        success: false,
        error: 'A site with this URL already exists for this user',
      });
    }

    // Parse monthlyReportSendAt if provided
    let parsedSendAt: Date | undefined;
    if (monthlyReport && monthlyReportSendAt) {
      parsedSendAt = new Date(monthlyReportSendAt);
      if (isNaN(parsedSendAt.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid monthlyReportSendAt format',
        });
      }
    }

    // Create site
    const newSite = await prisma.site.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        checkInterval: checkInterval || 1,
        isActive: true, // Default to true since frontend no longer sends this field
        monthlyReport: monthlyReport || false,
        monthlyReportSendAt: parsedSendAt,
        userId,
      },
      select: {
        id: true,
        name: true,
        url: true,
        checkInterval: true,
        isActive: true,
        monthlyReport: true,
        monthlyReportSendAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    res.status(201).json({
      success: true,
      data: newSite,
      message: 'Site created successfully',
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create site',
    });
  }
});

/**
 * PUT /admin/sites/:id
 * Update an existing site
 * Requires admin privileges
 */
router.put('/sites/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, checkInterval, isActive, monthlyReport, monthlyReportSendAt } = req.body;

    // Validate required fields
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'name and url are required',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    // Check if site exists
    const existingSite = await prisma.site.findUnique({
      where: { id },
      select: { id: true, userId: true, url: true, checkInterval: true, isActive: true, monthlyReport: true },
    });

    if (!existingSite) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    // Check if URL already exists for another site of the same user
    const duplicateSite = await prisma.site.findFirst({
      where: {
        userId: existingSite.userId,
        url: url.trim(),
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicateSite) {
      return res.status(400).json({
        success: false,
        error: 'A site with this URL already exists for this user',
      });
    }

    // Parse monthlyReportSendAt if provided
    let parsedSendAt: Date | undefined;
    if (monthlyReport && monthlyReportSendAt) {
      parsedSendAt = new Date(monthlyReportSendAt);
      if (isNaN(parsedSendAt.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid monthlyReportSendAt format',
        });
      }
    }

    // Update site
    const updatedSite = await prisma.site.update({
      where: { id },
      data: {
        name: name.trim(),
        url: url.trim(),
        checkInterval: checkInterval !== undefined ? checkInterval : existingSite.checkInterval,
        monthlyReport: monthlyReport !== undefined ? monthlyReport : existingSite.monthlyReport,
        monthlyReportSendAt: parsedSendAt,
      },
      select: {
        id: true,
        name: true,
        url: true,
        checkInterval: true,
        isActive: true,
        monthlyReport: true,
        monthlyReportSendAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    res.json({
      success: true,
      data: updatedSite,
      message: 'Site updated successfully',
    });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update site',
    });
  }
});

/**
 * DELETE /admin/sites/:id
 * Delete a site
 * Requires admin privileges
 */
router.delete('/sites/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if site exists
    const existingSite = await prisma.site.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existingSite) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }

    // Delete site and related records using transaction
    await prisma.$transaction(async (tx) => {
      // Delete related site statuses first
      await tx.siteStatus.deleteMany({
        where: { siteId: id },
      });

      // Delete related notification settings
      await tx.notificationSettings.deleteMany({
        where: { siteId: id },
      });

      // Finally delete the site
      await tx.site.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: `Site "${existingSite.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete site',
    });
  }
});

/**
 * DELETE /admin/users/:id
 * Delete a user and all related data
 * Requires admin privileges
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true,
        email: true,
        role: true
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent deletion of super admin users
    if (existingUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete super admin users',
      });
    }

    // Delete user and all related records using transaction
    await prisma.$transaction(async (tx) => {
      // Delete user features first
      await tx.userFeature.deleteMany({
        where: { userId: id },
      });

      // Delete notification settings for user's sites
      await tx.notificationSettings.deleteMany({
        where: { 
          site: { userId: id } 
        },
      });

      // Delete site statuses for user's sites
      await tx.siteStatus.deleteMany({
        where: { 
          site: { userId: id } 
        },
      });

      // Delete user's sites
      await tx.site.deleteMany({
        where: { userId: id },
      });

      // Delete user memberships
      await tx.userMembership.deleteMany({
        where: { userId: id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id },
      });
    });

    res.json({
      success: true,
      message: `User "${existingUser.firstName} ${existingUser.lastName}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
});

export default router; 