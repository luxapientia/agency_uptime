import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { WorkerService } from './services/worker.service';
import { SiteCheckService } from './services/site-check.service';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
// app.use('/api/sites', sitesRouter);

// Error handling
app.use(errorHandler);

// // Start worker service if WORKER_ENABLED is true
// if (process.env.WORKER_ENABLED === 'true') {
//   const worker = new WorkerService({
//     region: process.env.WORKER_REGION || 'unknown',
//     redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
//     checkTimeout: parseInt(process.env.CHECK_TIMEOUT || '30000'),
//   });

//   worker.start().catch(error => {
//     console.error('Failed to start worker:', error);
//     process.exit(1);
//   });
// }

// Start server
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  const worker = new WorkerService({
    region: process.env.WORKER_REGION || 'unknown',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    checkTimeout: parseInt(process.env.CHECK_TIMEOUT || '30000'),
  });

  // const worker2 = new WorkerService({
  //   region: 'us-east-1',
  //   redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  //   checkTimeout: parseInt(process.env.CHECK_TIMEOUT || '30000'),
  // });

  // worker2.start().catch(error => {
  //   console.error('Failed to start worker:', error);
  //   process.exit(1);
  // });

  worker.start().catch(error => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}); 