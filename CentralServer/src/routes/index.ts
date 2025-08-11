import { Router } from 'express';
import authRoutes from './auth.routes';
import sitesRoutes from './sites.routes';
import membershipRoutes from './membership.routes';
import paymentRoutes from './payment.routes';
import aiRoutes from './ai.routes';
import notificationRoutes from './notification.route';
import reportsRoutes from './reports.routes';
import settingsRoutes from './settings.route';
import workersRoutes from './workers.routes';
import publicRoutes from './public.routes';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.use('/', publicRoutes);

// Public auth routes (no authentication required)
router.use('/auth', authRoutes);

// Protected routes (authentication required)
router.use('/sites', authenticate, sitesRoutes);
router.use('/workers', authenticate, workersRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/ai', authenticate, aiRoutes);
router.use('/reports', authenticate, reportsRoutes);
router.use('/membership', membershipRoutes);
router.use('/payment', paymentRoutes);

export default router; 