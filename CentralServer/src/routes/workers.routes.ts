import { Router, Response } from 'express';
import redisService from '../services/redis.service';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// GET /api/workers - Get all active worker information
const getWorkers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workers = await redisService.getWorkersInfo();
    
    logger.info(`Retrieved ${workers.length} active workers`);
    
    res.json({
      success: true,
      data: {
        workers,
        count: workers.length
      }
    });
  } catch (error) {
    logger.error('Failed to get workers from Redis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve workers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/workers/ids - Get only worker IDs (simplified endpoint)
const getWorkerIds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workerIds = await redisService.getWorkerIds();
    
    logger.info(`Retrieved ${workerIds.length} worker IDs`);
    
    res.json({
      success: true,
      data: {
        workerIds,
        count: workerIds.length
      }
    });
  } catch (error) {
    logger.error('Failed to get worker IDs from Redis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve worker IDs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.get('/', getWorkers as any);
router.get('/ids', getWorkerIds as any);

export default router; 