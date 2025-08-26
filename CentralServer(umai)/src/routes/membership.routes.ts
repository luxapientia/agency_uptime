import { Router, Response } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import type { AuthenticatedRequest } from '../types/express';
import logger from '../utils/logger';
import { config } from '../config';
import { authenticate } from '../middleware/auth.middleware';

const prisma = new PrismaClient();
const router = Router();

// Zod schemas for validation
const createMembershipSchema = z.object({
  body: z.object({
    membershipPlanId: z.string().uuid('Invalid membership plan ID'),
    endDate: z.string().datetime('Invalid end date format'),
  }),
});

const updateMembershipSchema = z.object({
  body: z.object({
    endDate: z.string().datetime('Invalid end date format').optional(),
  }),
});

// GET /api/membership-plans - Get all membership plans (public)
const getMembershipPlans = async (req: any, res: Response) => {
  try {
    const { type } = req.query;
    
    // Build where clause for filtering
    const whereClause: any = {};
    if (type && (type === 'main' || type === 'upgrade')) {
      whereClause.type = type;
    }

    const plans = await prisma.membershipPlan.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' }, // Main plans first, then upgrade plans
        { price: 'asc' }
      ]
    });

    // Calculate total price of upgrade plans only (for bundle pricing)
    const upgradePlans = plans.filter(plan => plan.type === 'upgrade');
    const totalUpgradePrice = upgradePlans.reduce((sum, plan) => sum + plan.price, 0);

    logger.info('Membership plans fetched successfully');
    res.json({
      plans,
      bundlePrice: config.membership.bundlePrice,
      totalPrice: totalUpgradePrice,
      savings: totalUpgradePrice - config.membership.bundlePrice
    });
  } catch (error) {
    logger.error('Failed to fetch membership plans:', error);
    res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
};

// GET /api/user-memberships - Get user's memberships
const getUserMemberships = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const memberships = await prisma.userMembership.findMany({
      where: { userId: req.user.id },
      include: {
        membershipPlan: true
      },
      orderBy: { startDate: 'desc' }
    });

    logger.info(`User memberships fetched for user ${req.user.id}`);
    res.json(memberships);
  } catch (error) {
    logger.error('Failed to fetch user memberships:', error);
    res.status(500).json({ error: 'Failed to fetch user memberships' });
  }
};

// POST /api/user-memberships - Create a new user membership
const createUserMembership = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { membershipPlanId, endDate } = req.body;

    // Check if plan exists
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId }
    });

    if (!plan) {
      throw new NotFoundError('Membership plan not found');
    }

    // Check if user already has this membership
    const existingMembership = await prisma.userMembership.findUnique({
      where: {
        userId_membershipPlanId: {
          userId: req.user.id,
          membershipPlanId
        }
      }
    });

    if (existingMembership) {
      throw new BadRequestError('User already has this membership');
    }

    const membership = await prisma.userMembership.create({
      data: {
        userId: req.user.id,
        membershipPlanId,
        endDate: new Date(endDate)
      },
      include: {
        membershipPlan: true
      }
    });

    logger.info(`User membership created for user ${req.user.id}, plan: ${plan.name}`);
    res.status(201).json(membership);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    if (error instanceof BadRequestError) {
      res.status(400).json({ error: error.message });
      return;
    }
    logger.error('Failed to create user membership:', error);
    res.status(500).json({ error: 'Failed to create user membership' });
  }
};

// PUT /api/user-memberships/:id - Update user membership
const updateUserMembership = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { endDate } = req.body;

    // Check if membership exists and belongs to user
    const existingMembership = await prisma.userMembership.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingMembership) {
      throw new NotFoundError('Membership not found');
    }

    const updateData: any = {};
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    const membership = await prisma.userMembership.update({
      where: { id },
      data: updateData,
      include: {
        membershipPlan: true
      }
    });

    logger.info(`User membership updated for user ${req.user.id}, membership ID: ${id}`);
    res.json(membership);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    logger.error('Failed to update user membership:', error);
    res.status(500).json({ error: 'Failed to update user membership' });
  }
};

// DELETE /api/user-memberships/:id - Delete user membership
const deleteUserMembership = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if membership exists and belongs to user
    const existingMembership = await prisma.userMembership.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingMembership) {
      throw new NotFoundError('Membership not found');
    }

    await prisma.userMembership.delete({
      where: { id }
    });

    logger.info(`User membership deleted for user ${req.user.id}, membership ID: ${id}`);
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    logger.error('Failed to delete user membership:', error);
    res.status(500).json({ error: 'Failed to delete user membership' });
  }
};

// GET /api/membership-plans/main - Get main membership plans only
const getMainMembershipPlans = async (req: any, res: Response) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { type: 'main' },
      orderBy: { price: 'asc' }
    });

    logger.info('Main membership plans fetched successfully');
    res.json({ plans });
  } catch (error) {
    logger.error('Failed to fetch main membership plans:', error);
    res.status(500).json({ error: 'Failed to fetch main membership plans' });
  }
};

// GET /api/membership-plans/upgrade - Get upgrade membership plans only
const getUpgradeMembershipPlans = async (req: any, res: Response) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { type: 'upgrade' },
      orderBy: { price: 'asc' }
    });

    // Calculate bundle pricing for upgrade plans
    const totalPrice = plans.reduce((sum, plan) => sum + plan.price, 0);
    const bundlePrice = config.membership.bundlePrice;
    const savings = totalPrice - bundlePrice;

    logger.info('Upgrade membership plans fetched successfully');
    res.json({
      plans,
      bundlePrice,
      totalPrice,
      savings
    });
  } catch (error) {
    logger.error('Failed to fetch upgrade membership plans:', error);
    res.status(500).json({ error: 'Failed to fetch upgrade membership plans' });
  }
};

// Route definitions
router.get('/membership-plans', getMembershipPlans as any);
router.get('/membership-plans/main', getMainMembershipPlans as any);
router.get('/membership-plans/upgrade', getUpgradeMembershipPlans as any);
router.get('/user-memberships', authenticate, getUserMemberships as any);
router.post('/user-memberships', authenticate, validateRequest(createMembershipSchema), createUserMembership as any);
router.put('/user-memberships/:id', authenticate, validateRequest(updateMembershipSchema), updateUserMembership as any);
router.delete('/user-memberships/:id', authenticate, deleteUserMembership as any);

export default router; 