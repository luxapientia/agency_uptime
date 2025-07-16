import { Router } from 'express';
import authRoutes from './auth.routes';
import sitesRoutes from './sites.routes';
import workersRoutes from './workers.routes';
import { authenticate } from '../middleware/auth.middleware';
import settingsRoutes from './settings.route';
import notificationRoutes from './notification.route';

const router = Router();

// Public routes
router.use(`/auth`, authRoutes);

// Protected routes
router.use(`/sites`, authenticate, sitesRoutes);
router.use(`/workers`, authenticate, workersRoutes);
router.use(`/settings`, settingsRoutes);
router.use(`/notifications`, authenticate, notificationRoutes);

export default router; 