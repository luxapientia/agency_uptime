import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface MembershipPlanData {
  name: string;
  price: number;
  title: string;
  monitoredSites: number;
  type: 'main' | 'upgrade';
  features: string[];
}

/**
 * Initialize membership plans in the database
 * This function reads the membership plans from the JSON file and creates them in the database
 * It will skip plans that already exist (based on name)
 */
export async function initializeMembershipPlans(): Promise<void> {
  try {
    logger.info('Starting membership plans initialization...');

    // Read the membership plans JSON file
    const plansFilePath = path.join(__dirname, '../../prisma/membershipPlans.json');
    
    if (!fs.existsSync(plansFilePath)) {
      throw new Error(`Membership plans file not found at: ${plansFilePath}`);
    }

    const plansData = fs.readFileSync(plansFilePath, 'utf-8');
    const plans: MembershipPlanData[] = JSON.parse(plansData);

    if (!Array.isArray(plans)) {
      throw new Error('Invalid membership plans data format');
    }

    logger.info(`Found ${plans.length} membership plans to initialize`);

    let createdCount = 0;
    let skippedCount = 0;

    // Process each plan
    for (const plan of plans) {
      try {
        // Check if plan already exists by name
        const existingPlan = await prisma.membershipPlan.findFirst({
          where: { name: plan.name }
        });

        if (existingPlan) {
          logger.info(`Plan "${plan.name}" already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create the plan
        await prisma.membershipPlan.create({
          data: {
            name: plan.name,
            price: plan.price,
            title: plan.title,
            monitoredSites: plan.monitoredSites,
            type: plan.type,
            features: plan.features
          }
        });

        logger.info(`Created membership plan: ${plan.name} ($${plan.price}/month)`);
        createdCount++;

      } catch (error) {
        logger.error(`Failed to create plan "${plan.name}":`, error);
        throw error;
      }
    }

    logger.info(`Membership plans initialization completed. Created: ${createdCount}, Skipped: ${skippedCount}`);

  } catch (error) {
    logger.error('Failed to initialize membership plans:', error);
    throw error;
  }
}

/**
 * Reset membership plans (delete all and recreate)
 * Use with caution - this will delete all existing plans
 */
export async function resetMembershipPlans(): Promise<void> {
  try {
    logger.info('Resetting membership plans...');

    // Delete all existing plans
    const deletedCount = await prisma.membershipPlan.deleteMany({});
    logger.info(`Deleted ${deletedCount.count} existing membership plans`);

    // Reinitialize plans
    await initializeMembershipPlans();

    logger.info('Membership plans reset completed successfully');

  } catch (error) {
    logger.error('Failed to reset membership plans:', error);
    throw error;
  }
}

/**
 * Get all membership plans from database
 */
export async function getAllMembershipPlans() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return plans;
  } catch (error) {
    logger.error('Failed to get membership plans:', error);
    throw error;
  }
}

/**
 * Check if membership plans are initialized
 */
export async function checkMembershipPlansInitialized(): Promise<boolean> {
  try {
    const count = await prisma.membershipPlan.count();
    return count > 0;
  } catch (error) {
    logger.error('Failed to check membership plans initialization:', error);
    return false;
  }
}

// If this file is run directly, initialize the plans
if (require.main === module) {
  initializeMembershipPlans()
    .then(() => {
      logger.info('Membership plans initialization script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Membership plans initialization script failed:', error);
      process.exit(1);
    });
}
