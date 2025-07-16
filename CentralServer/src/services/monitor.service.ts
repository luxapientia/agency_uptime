import { Redis } from 'ioredis';
import { PrismaClient, Site } from '@prisma/client';
import cron, { ScheduledTask } from 'node-cron';
import logger from '../utils/logger';
import { config } from '../config';
import notificationService from './notification.service';
import socketService from './socket.service';

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
      const checkedAt = new Date();
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
        const checkData = await this.redis.get(checksKey);

        if (!checkData) {
          return null;
        }

        try {
          const siteMonitorResult = JSON.parse(checkData);

          // Save individual worker status to database
          const siteStatus = await this.prisma.siteStatus.create({
            data: {
              siteId: site.id,
              workerId: workerId,
              isUp: siteMonitorResult.isUp,
              pingIsUp: siteMonitorResult.pingCheck.isUp,
              httpIsUp: siteMonitorResult.httpCheck.isUp,
              dnsIsUp: siteMonitorResult.dnsCheck.isResolved,
              checkedAt: new Date(siteMonitorResult.checkedAt),

              // Response Times - handle both number and null values
              pingResponseTime: typeof siteMonitorResult.pingCheck.responseTime === 'number'
                ? siteMonitorResult.pingCheck.responseTime
                : null,
              httpResponseTime: typeof siteMonitorResult.httpCheck.responseTime === 'number'
                ? siteMonitorResult.httpCheck.responseTime
                : null,
              dnsResponseTime: typeof siteMonitorResult.dnsCheck.responseTime === 'number'
                ? siteMonitorResult.dnsCheck.responseTime
                : null,

              // SSL Information - complete mapping
              hasSsl: !!siteMonitorResult.httpCheck.ssl,
              sslValidFrom: siteMonitorResult.httpCheck.ssl?.validFrom
                ? new Date(siteMonitorResult.httpCheck.ssl.validFrom)
                : null,
              sslValidTo: siteMonitorResult.httpCheck.ssl?.validTo
                ? new Date(siteMonitorResult.httpCheck.ssl.validTo)
                : null,
              sslIssuer: siteMonitorResult.httpCheck.ssl?.issuer || null,
              sslDaysUntilExpiry: siteMonitorResult.httpCheck.ssl?.daysUntilExpiry || null,

              // DNS Information - complete mapping
              dnsNameservers: Array.isArray(siteMonitorResult.dnsCheck.nameservers)
                ? siteMonitorResult.dnsCheck.nameservers
                : [],
              dnsRecords: {
                addresses: Array.isArray(siteMonitorResult.dnsCheck.addresses)
                  ? siteMonitorResult.dnsCheck.addresses
                  : [],
                error: siteMonitorResult.dnsCheck.error || null,
                responseTime: siteMonitorResult.dnsCheck.responseTime
              },

              // TCP Check Information - complete mapping
              tcpChecks: Array.isArray(siteMonitorResult.tcpChecks)
                ? siteMonitorResult.tcpChecks.map((tcpCheck: any) => ({
                  port: tcpCheck.port,
                  isConnected: tcpCheck.isConnected,
                  isUp: tcpCheck.isConnected, // Map isConnected to isUp for consistency
                  responseTime: typeof tcpCheck.responseTime === 'number'
                    ? tcpCheck.responseTime
                    : null,
                  error: tcpCheck.error || null
                }))
                : []
            }
          });

          logger.info(`Saved status for site ${site.url} from worker ${workerId}: ${siteMonitorResult.isUp ? 'UP' : 'DOWN'}`);

          return siteStatus;

        } catch (parseError) {
          logger.error(`Error parsing check data for site ${site.url} from worker ${workerId}:`, parseError);
          return null;
        }
      });

      const workerResults = await Promise.all(checkPromises);
      const validResults = workerResults.filter(result => result !== null);

      if (validResults.length === 0) {
        logger.error(`No valid check results found for site ${site.url}`);
        return;
      }

      const isDownCount = validResults.filter(result => !result.isUp).length;
      const isUp = !(validResults.length >= 2 ? (isDownCount >= 2) : false);
      const pingIsDownCount = validResults.filter(result => !result.pingIsUp).length;
      const pingIsUp = !(validResults.length >= 2 ? (pingIsDownCount >= 2) : false);
      const httpIsDownCount = validResults.filter(result => !result.httpIsUp).length;
      const httpIsUp = !(validResults.length >= 2 ? (httpIsDownCount >= 2) : false);
      const dnsIsDownCount = validResults.filter(result => !result.dnsIsUp).length;
      const dnsIsUp = !(validResults.length >= 2 ? (dnsIsDownCount >= 2) : false);

      // Get SSL info from first worker that has SSL data
      const sslWorker = validResults.find(status => status.hasSsl);
      
      // Get DNS info from first successful DNS resolution
      const dnsWorker = validResults.find(status => status.dnsIsUp);

      // Aggregate TCP checks from all workers
      const tcpCheckMap = new Map<number, { connected: number; total: number }>();
      
      validResults.forEach(status => {
        if (status.tcpChecks && Array.isArray(status.tcpChecks)) {
          status.tcpChecks.forEach((tcpCheck: any) => {
            const port = tcpCheck.port;
            const existing = tcpCheckMap.get(port) || { connected: 0, total: 0 };
            
            existing.total++;
            if (tcpCheck.isConnected) {
              existing.connected++;
            }
            
            tcpCheckMap.set(port, existing);
          });
        }
      });

      const consensusTcpChecks = Array.from(tcpCheckMap.entries()).map(([port, data]) => {
        const tcpIsDownCount = data.total - data.connected;
        const tcpIsUp = !(validResults.length >= 2 ? (tcpIsDownCount >= 2) : false);
        
        return {
          port,
          isConnected: tcpIsUp,
          isUp: tcpIsUp,
          responseTime: null,
          error: null
        };
      });

      // Create consensus site status
      const consensusSiteStatus = await this.prisma.siteStatus.create({
        data: {
          siteId: site.id,
          workerId: 'consensus_worker',
          isUp: isUp,
          pingIsUp: pingIsUp,
          httpIsUp: httpIsUp,
          dnsIsUp: dnsIsUp,
          checkedAt,
          
          // Response Times - null for consensus
          pingResponseTime: null,
          httpResponseTime: null,
          dnsResponseTime: null,
          
          // SSL Information - from first worker with SSL data
          hasSsl: !!sslWorker?.hasSsl,
          sslValidFrom: sslWorker?.sslValidFrom || null,
          sslValidTo: sslWorker?.sslValidTo || null,
          sslIssuer: sslWorker?.sslIssuer || null,
          sslDaysUntilExpiry: sslWorker?.sslDaysUntilExpiry || null,
          
          // DNS Information - from first successful DNS worker
          dnsNameservers: dnsWorker?.dnsNameservers || [],
          dnsRecords: dnsWorker?.dnsRecords || { addresses: [], error: null, responseTime: null },
          
          // TCP Check Information - consensus from all workers
          tcpChecks: consensusTcpChecks
        }
      });

      const previousConsensusStatus = await this.prisma.siteStatus.findFirst({
        where: {
          siteId: site.id,
          workerId: "consensus_worker"
        },
        orderBy: {
          checkedAt: 'desc'
        },
        take: 1
      });
      
      if(!previousConsensusStatus || previousConsensusStatus.isUp !== isUp) {
        await notificationService.sendNotification(site.id, `Your site ${site.name} (${site.url}) is ${isUp ? 'up' : 'down'} at ${checkedAt.toISOString()}`, 'SITE_STATUS_UPDATE');
          socketService.sendToUser(site.userId, 'site_status_update', {siteId: site.id, status: consensusSiteStatus});
          logger.info(`Sent status update via socket for site ${site.url} to user ${site.userId}`);
      }

    } catch (error) {
      logger.error(`Error checking site ${site.url}:`, error);
    }
  }
}

const monitorService = new MonitorService();
export default monitorService;