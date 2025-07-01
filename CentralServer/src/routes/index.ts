import { Router } from 'express';
import authRoutes from './auth.routes';
import sitesRoutes from './sites.routes';
import filesRoutes from './files.routes';
import { authenticate } from '../middleware/auth.middleware';
import { config } from '../config';

const router = Router();

// Public routes
router.use(`${config.root.url}/auth`, authRoutes);

// Protected routes
router.use(`${config.root.url}/sites`, authenticate, sitesRoutes);
router.use(`${config.root.url}/files`, filesRoutes); // File routes (authentication handled in route handler)

export default router; 