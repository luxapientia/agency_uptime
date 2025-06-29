import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import router from './routes';
import { PrismaClient } from '@prisma/client';
import redisService from './services/redis.service';
import logger from './utils/logger';
import monitorService from './services/monitor.service';

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving
const staticPath = path.join(__dirname, '../public');
app.use('/', express.static(staticPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', router);

// Error handling
app.use(errorHandler);

// Function to sync all sites to Redis
async function syncSitesToRedis() {
  try {
    const sites = await prisma.site.findMany({
      where: {
        isActive: true
      }
    });
    logger.info(`Found ${sites.length} active sites to sync with Redis`);

    // Perform bulk sync
    await redisService.bulkSyncSites(sites);

    // Verify synchronization
    const isVerified = await redisService.verifySyncStatus(sites);
    if (!isVerified) {
      throw new Error('Redis synchronization verification failed');
    }

    logger.info('All sites successfully synchronized and verified with Redis');
  } catch (error) {
    logger.error('Failed to sync sites with Redis:', error);
    throw error;
  }
}

// Start server with Redis sync
async function startServer() {
  try {
    // Create static directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(staticPath)) {
      fs.mkdirSync(staticPath, { recursive: true });
      logger.info(`Created static files directory at ${staticPath}`);
    }

    // Attempt Redis sync with retries
    let retries = 3;
    while (retries > 0) {
      try {
        await syncSitesToRedis();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        logger.warn(`Redis sync failed, ${retries} retries remaining:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
    
    monitorService.start();

    console.log(staticPath)

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Static files are being served from ${staticPath}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 