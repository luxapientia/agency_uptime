import { Router, Response } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { BadRequestError } from '../utils/errors';
import type { AuthenticatedRequest } from '../types/express';
import logger from '../utils/logger';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth.middleware';

const prisma = new PrismaClient();
const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Schema for creating payment intent
const createPaymentIntentSchema = z.object({
  body: z.object({
    planId: z.string(),
    amount: z.number().positive(),
  }),
});

// Create payment intent
const createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId, amount } = req.body;
    const userId = req.user.id;

    // Handle single plan payment
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new BadRequestError('Invalid plan ID');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        planId,
        userId,
        planName: plan.name,
      },
    });

    logger.info(`Payment intent created for user ${userId}, plan ${planId}`);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    logger.error('Failed to create payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Webhook handler for Stripe events
const handleWebhook = async (req: any, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret!);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'charge.succeeded':
        const paymentIntent = event.data.object as Stripe.Charge;
        await handlePaymentSuccess(paymentIntent);
        break;
      
      case 'charge.failed':
        const failedPayment = event.data.object as Stripe.Charge;
        await handlePaymentFailure(failedPayment);
        break;
      
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Handle successful payment
const handlePaymentSuccess = async (paymentIntent: Stripe.Charge) => {
  const { userId, planId } = paymentIntent.metadata;

  console.log(userId, planId, '----------------');
  
  try {
    // Set end date to 10 years from now (effectively lifetime for one-time payments)
    const endDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
    
    // Delete any existing membership for this user (replace with new plan)
    await prisma.userMembership.deleteMany({
      where: { userId }
    });

    // Delete any existing user features for this user
    await prisma.userFeature.deleteMany({
      where: { userId }
    });
    
    // Create new membership
    await prisma.userMembership.create({
      data: {
        userId,
        membershipPlanId: planId,
        endDate,
      },
    });

    // Get the plan to extract features
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
      select: { features: true }
    });

    if (plan && plan.features.length > 0) {
      // Create UserFeature records for each feature
      for (const featureKey of plan.features) {
        await prisma.userFeature.create({
          data: {
            userId,
            featureKey,
            endDate,
          },
        });
      }
    }

    logger.info(`Payment successful for user ${userId}, plan ${planId}`);
  } catch (error) {
    logger.error('Failed to update user membership after payment:', error);
  }
};

// Handle failed payment
const handlePaymentFailure = async (paymentIntent: Stripe.Charge) => {
  const { userId, planId } = paymentIntent.metadata;
  
  logger.warn(`Payment failed for user ${userId}, plan ${planId}`);
};

// Routes
router.post('/create-payment-intent', authenticate, validateRequest(createPaymentIntentSchema), createPaymentIntent as any);
router.post('/webhook', handleWebhook);

export default router; 