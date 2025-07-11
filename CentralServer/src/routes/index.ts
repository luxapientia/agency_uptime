import { Router } from 'express';
import authRoutes from './auth.routes';
import sitesRoutes from './sites.routes';
import { authenticate } from '../middleware/auth.middleware';
import settingsRoutes from './settings.route';

const router = Router();

// Public routes
router.use(`/auth`, authRoutes);

// Protected routes
router.use(`/sites`, authenticate, sitesRoutes);
router.use(`/settings`, settingsRoutes);

export default router; 