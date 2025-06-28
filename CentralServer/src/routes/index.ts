import { Router } from 'express';
import authRoutes from './auth.routes';
import sitesRoutes from './sites.routes';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/sites', authenticate, sitesRoutes);

export default router; 