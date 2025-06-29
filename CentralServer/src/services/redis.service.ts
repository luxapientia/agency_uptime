import Redis from 'ioredis';
import { Site } from '@prisma/client';
import logger from '../utils/logger';
import { config } from '../config';

class RedisService {
  private redis: Redis;
  private readonly SITES_CONFIG_KEY = 'sites:config';
  private readonly SYNC_LOCK_KEY = 'sync:lock';

  constructor() {
    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });
    
    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  async syncSite(site: Site): Promise<void> {
    try {
      const siteData = {
        id: site.id,
        url: site.url,
        checkInterval: site.checkInterval,
        isActive: site.isActive,
        userId: site.userId
      };

      await this.redis.hset(this.SITES_CONFIG_KEY, site.id, JSON.stringify(siteData));
      
      // Publish update event for monitoring system
      await this.redis.publish('site-config-updates', JSON.stringify({
        action: 'update',
        site: siteData
      }));

      logger.info(`Site ${site.id} synchronized to Redis`);
    } catch (error) {
      logger.error('Failed to sync site to Redis:', error);
      throw error;
    }
  }

  async removeSite(siteId: string): Promise<void> {
    try {
      await this.redis.hdel(this.SITES_CONFIG_KEY, siteId);
      
      // Publish delete event for monitoring system
      await this.redis.publish('site-config-updates', JSON.stringify({
        action: 'delete',
        site: { id: siteId }
      }));

      logger.info(`Site ${siteId} removed from Redis`);
    } catch (error) {
      logger.error('Failed to remove site from Redis:', error);
      throw error;
    }
  }

  async updateSiteStatus(siteId: string, isActive: boolean): Promise<void> {
    try {
      const siteData = await this.redis.hget(this.SITES_CONFIG_KEY, siteId);
      if (siteData) {
        const site = JSON.parse(siteData);
        site.isActive = isActive;
        await this.redis.hset(this.SITES_CONFIG_KEY, siteId, JSON.stringify(site));
        
        // Publish update event for monitoring system
        await this.redis.publish('site-config-updates', JSON.stringify({
          action: 'update',
          site
        }));

        logger.info(`Site ${siteId} status updated in Redis`);
      }
    } catch (error) {
      logger.error('Failed to update site status in Redis:', error);
      throw error;
    }
  }

  async getAllSites(): Promise<Record<string, any>> {
    try {
      return await this.redis.hgetall(this.SITES_CONFIG_KEY);
    } catch (error) {
      logger.error('Failed to get sites from Redis:', error);
      throw error;
    }
  }

  async bulkSyncSites(sites: Site[]): Promise<void> {
    try {
      // Acquire lock before bulk sync
      const lockAcquired = await this.redis.set(
        this.SYNC_LOCK_KEY,
        Date.now().toString(),
        'EX',
        60 // Lock expires in 60 seconds
      );

      if (!lockAcquired) {
        throw new Error('Another sync operation is in progress');
      }

      logger.info(`Starting bulk sync of ${sites.length} sites`);

      // Clear existing sites
      await this.redis.del(this.SITES_CONFIG_KEY);

      // Prepare bulk operation
      const pipeline = this.redis.pipeline();
      
      for (const site of sites) {
        const siteData = {
          id: site.id,
          url: site.url,
          checkInterval: site.checkInterval,
          isActive: site.isActive,
          userId: site.userId
        };
        pipeline.hset(this.SITES_CONFIG_KEY, site.id, JSON.stringify(siteData));
      }

      // Execute bulk operation
      await pipeline.exec();
      
      // Publish bulk update event for monitoring system
      await this.redis.publish('site-config-updates', JSON.stringify({
        action: 'bulk',
        sites: sites.map(site => ({
          id: site.id,
          url: site.url,
          checkInterval: site.checkInterval,
          isActive: site.isActive,
          userId: site.userId
        }))
      }));
      
      // Release lock
      await this.redis.del(this.SYNC_LOCK_KEY);
      
      logger.info(`Successfully synchronized ${sites.length} sites to Redis`);
    } catch (error) {
      // Ensure lock is released even if sync fails
      await this.redis.del(this.SYNC_LOCK_KEY);
      logger.error('Failed to perform bulk sync to Redis:', error);
      throw error;
    }
  }

  async verifySyncStatus(sites: Site[]): Promise<boolean> {
    try {
      const redisSites = await this.getAllSites();
      const redisCount = Object.keys(redisSites).length;

      if (redisCount !== sites.length) {
        logger.warn(`Sync verification failed: Redis has ${redisCount} sites, DB has ${sites.length} sites`);
        return false;
      }

      // Verify each site
      for (const site of sites) {
        const redisSite = redisSites[site.id];
        if (!redisSite) {
          logger.warn(`Sync verification failed: Site ${site.id} missing from Redis`);
          return false;
        }

        const parsedRedisSite = JSON.parse(redisSite);
        if (
          parsedRedisSite.url !== site.url ||
          parsedRedisSite.checkInterval !== site.checkInterval ||
          parsedRedisSite.isActive !== site.isActive
        ) {
          logger.warn(`Sync verification failed: Site ${site.id} data mismatch`);
          return false;
        }
      }

      logger.info('Sync verification successful: All sites are properly synchronized');
      return true;
    } catch (error) {
      logger.error('Failed to verify sync status:', error);
      throw error;
    }
  }
}

export default new RedisService(); 