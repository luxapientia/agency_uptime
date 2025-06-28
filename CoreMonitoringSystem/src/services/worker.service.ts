import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { SiteCheckService, SiteMonitorResult } from './site-check.service';
import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../utils/logger';

interface SiteConfig {
  id: string;
  url: string;
  checkInterval: number; // in minutes
  isActive: boolean;
  userId: string;
}

interface WorkerConfig {
  region: string;
  redisUrl: string;
  checkTimeout?: number;
}

type ConfigUpdate = {
  action: 'add' | 'update' | 'delete' | 'bulk';
  site?: SiteConfig;
  sites?: SiteConfig[];
};

export class WorkerService {
  private readonly workerId: string;
  private readonly region: string;
  private readonly redis: Redis;
  private readonly siteChecker: SiteCheckService;
  private readonly scheduledTasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;
  private siteConfigs: Map<string, SiteConfig> = new Map();

  constructor(config: WorkerConfig) {
    this.workerId = `${config.region}`;
    this.region = config.region;
    this.redis = new Redis(config.redisUrl);
    this.siteChecker = new SiteCheckService(this.workerId);

    this.redis.on('error', (error: Error) => {
      logger.error('Redis connection error:', error);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.registerWorker();
      await this.initializeChecks();
      await this.subscribeToConfigUpdates();
      logger.info(`Worker ${this.workerId} started successfully in region ${this.region}`);
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start worker:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    for (const task of this.scheduledTasks.values()) {
      task.stop();
    }
    this.scheduledTasks.clear();
    this.siteConfigs.clear();

    await this.unregisterWorker();
    await this.redis.quit();
    logger.info(`Worker ${this.workerId} stopped successfully`);
  }

  private async registerWorker(): Promise<void> {
    const workerKey = `workers:${this.workerId}`;
    await this.redis.hmset(workerKey, {
      region: this.region,
      startedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      activeSites: '0'
    });

    await this.redis.expire(workerKey, 60); // TTL 60 seconds

    setInterval(async () => {
      await this.redis.hmset(workerKey, {
        lastHeartbeat: new Date().toISOString(),
        activeSites: this.scheduledTasks.size.toString()
      });
      await this.redis.expire(workerKey, 60);
    }, 30000); // Heartbeat every 30 seconds
  }

  private async unregisterWorker(): Promise<void> {
    await this.redis.del(`workers:${this.workerId}`);
  }

  private async initializeChecks(): Promise<void> {
    const sites = await this.getSiteConfigs();
    logger.info(`Initializing checks for ${sites.length} sites`);

    // Store sites in memory
    sites.forEach(site => {
      this.siteConfigs.set(site.id, site);
      if (site.isActive) {
        this.scheduleSiteCheck(site);
      }
    });
  }

  private async getSiteConfigs(): Promise<SiteConfig[]> {
    try {
      const rawConfigs = await this.redis.hgetall('sites:config');
      return Object.values(rawConfigs)
        .map((config) => JSON.parse(config as string))
        .filter(site => site.isActive); // Only return active sites
    } catch (error) {
      logger.error('Failed to get site configs:', error);
      return [];
    }
  }

  private scheduleSiteCheck(site: SiteConfig): void {
    if (!site.isActive) {
      logger.info(`Skipping inactive site ${site.id}`);
      return;
    }

    // Remove existing task if exists
    const existingTask = this.scheduledTasks.get(site.id);
    if (existingTask) {
      existingTask.stop();
      this.scheduledTasks.delete(site.id);
    }

    const cronExpression = `*/${site.checkInterval} * * * *`;

    const task = cron.schedule(cronExpression, async () => {
      await this.performCheck(site);
    });

    this.scheduledTasks.set(site.id, task);
    logger.info(`Scheduled check for site ${site.id} with interval ${site.checkInterval} minutes`);

    // Perform first check immediately
    this.performCheck(site).catch((error) => {
      logger.error(`Initial check failed for ${site.url}:`, error);
    });
  }

  private async performCheck(site: SiteConfig): Promise<void> {
    try {
      const result = await this.siteChecker.monitorUrl(site.url);
      const checksKey = `checks:${site.id}:${this.workerId}`;
      this.redis.set(checksKey, JSON.stringify(result), 'EX', 600);
      logger.debug(`Check completed for site ${site.url}`);
    } catch (error) {
      logger.error(`Error checking site ${site.url}:`, error);
    }
  }

  private async subscribeToConfigUpdates(): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe('site-config-updates');

    subscriber.on('message', async (_channel: string, message: string) => {
      try {
        const update = JSON.parse(message) as ConfigUpdate;
        logger.info(`Received config update: ${update.action}`);

        switch (update.action) {
          case 'add':
          case 'update':
            if (update.site) {
              this.siteConfigs.set(update.site.id, update.site);
              if (update.site.isActive) {
                this.scheduleSiteCheck(update.site);
              } else {
                // Stop monitoring if site is inactive
                const task = this.scheduledTasks.get(update.site.id);
                if (task) {
                  task.stop();
                  this.scheduledTasks.delete(update.site.id);
                }
              }
            }
            break;

          case 'delete':
            if (update.site) {
              this.siteConfigs.delete(update.site.id);
              const task = this.scheduledTasks.get(update.site.id);
              if (task) {
                task.stop();
                this.scheduledTasks.delete(update.site.id);
              }
            }
            break;

          case 'bulk':
            if (update.sites) {
              // Stop all existing tasks
              this.scheduledTasks.forEach(task => task.stop());
              this.scheduledTasks.clear();
              this.siteConfigs.clear();

              // Set up new sites
              update.sites.forEach(site => {
                this.siteConfigs.set(site.id, site);
                if (site.isActive) {
                  this.scheduleSiteCheck(site);
                }
              });
              logger.info(`Bulk update completed: ${this.scheduledTasks.size} active sites`);
            }
            break;

          default:
            logger.warn(`Unknown update action: ${update.action}`);
        }
      } catch (error) {
        logger.error('Error processing config update:', error);
      }
    });

    logger.info('Subscribed to configuration updates');
  }
}
