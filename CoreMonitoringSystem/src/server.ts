import { WorkerService } from './services/worker.service';

const worker = new WorkerService({
  region: process.env.WORKER_REGION || 'unknown',
  checkTimeout: parseInt(process.env.CHECK_TIMEOUT || '30000'),
});

worker.start().catch(error => {
  console.error('Failed to start worker:', error);
  process.exit(1);
});