import { Redis } from 'ioredis';
import { PrismaClient, Site } from '@prisma/client';
import cron, { ScheduledTask } from 'node-cron';
import logger from '../utils/logger';
import { config } from '../config';

export class MonitorService {
  private readonly redis: Redis;
  private readonly prisma: PrismaClient;
  private isRunning = false;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });
    this.prisma = new PrismaClient();

    this.redis.on('error', (error: Error) => {
      logger.error('Redis connection error:', error);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initial schedule setup for all active sites
    const sites = await this.prisma.site.findMany({
      where: { isActive: true }
    });

    for (const site of sites) {
      await this.addSiteSchedule(site);
    }

    logger.info('Monitor service started');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop all scheduled tasks
    for (const task of this.scheduledTasks.values()) {
      task.stop();
    }
    this.scheduledTasks.clear();

    await this.redis.quit();
    await this.prisma.$disconnect();
    logger.info('Monitor service stopped');
  }

  // Call this when a new site is added
  async addSiteSchedule(site: Site): Promise<void> {
    if (!site.isActive) return;

    const cronExpression = `* * * * *`;
    const task = cron.schedule(cronExpression, () => this.checkSite(site));
    
    this.scheduledTasks.set(site.id, task);
    logger.info(`Added schedule for site ${site.url} every minute`);
  }

  // Call this when a site is updated
  async updateSiteSchedule(site: Site): Promise<void> {
    // Remove existing schedule if any
    await this.removeSiteSchedule(site.id);
    
    // Add new schedule if site is active
    if (site.isActive) {
      await this.addSiteSchedule(site);
    }
  }

  // Call this when a site is deleted or deactivated
  async removeSiteSchedule(siteId: string): Promise<void> {
    const task = this.scheduledTasks.get(siteId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(siteId);
      logger.info(`Removed schedule for site ${siteId}`);
    }
  }

  private async checkSite(site: Site): Promise<void> {
    try {
      // Get all active workers
      const workerPattern = 'workers:*';
      const workerKeys = await this.redis.keys(workerPattern);

      if (!workerKeys.length) {
        logger.error('No active workers found');
        return;
      }

      // Get status from each worker
      const checkPromises = workerKeys.map(async workerKey => {
        const workerId = workerKey.split(':')[1];
        const checksKey = `checks:${site.id}:${workerId}`;
        return this.redis.get(checksKey);
      });

      const workerChecks = await Promise.all(checkPromises);
      const checks = workerChecks.map(check => JSON.parse(check || '{}'));

      if (!checks.length) {
        logger.error(`No check results found for site ${site.url}`);
        return;
      }

      const isUpCount = checks.filter(check => check.isUp).length;
      const isUp = workerKeys.length >= 2 ? isUpCount >= Math.ceil(checks.length / 2) : isUpCount > 0;

      const pingIsUpCount = checks.filter(check => check.pingCheck.isUp).length;
      const pingIsUp = workerKeys.length >= 2 ? pingIsUpCount >= Math.ceil(checks.length / 2) : pingIsUpCount > 0;

      const httpIsUpCount = checks.filter(check => check.getCheck.isUp).length;
      const httpIsUp = workerKeys.length >= 2 ? httpIsUpCount >= Math.ceil(checks.length / 2) : httpIsUpCount > 0;

      const ssl = checks[0].getCheck.ssl;

      const checkedAt = checks.reduce((latest, check) => new Date(check.checkedAt) > latest ? new Date(check.checkedAt) : latest, new Date(0));

      await this.prisma.siteStatus.create({
        data: {
          siteId: site.id,
          userId: site.userId,
          pingIsUp,
          httpIsUp,
          isUp,
          hasSsl: !!ssl,
          sslValidFrom: ssl?.validFrom ? new Date(ssl.validFrom) : undefined,
          sslValidTo: ssl?.validTo ? new Date(ssl.validTo) : undefined,
          sslIssuer: ssl?.issuer,
          sslDaysUntilExpiry: ssl?.daysUntilExpiry,
          checkedAt
        }
      });
    } catch (error) {
      logger.error(`Error checking site ${site.url}:`, error);
      
      // Save error status
      await this.prisma.siteStatus.create({
        data: {
          siteId: site.id,
          userId: site.userId,
          isUp: false,
          pingIsUp: false,
          httpIsUp: false,
          checkedAt: new Date(),
          hasSsl: false
        }
      });
    }
  }
} 

const monitorService = new MonitorService();
export default monitorService;