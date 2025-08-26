import { Router } from 'express';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import authService from '../services/auth.service';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import mailgunService from '../services/mailgun.service';
import { authenticate } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../types/express';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
      ),
    companyName: z.string().min(1, 'Company name is required'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ message: error.message });
      return;
    }
    next(error);
  }
});

router.post('/send-verification', async (req, res, next) => {
  try {
    const result = await mailgunService.sendVerificationCode(req.body.email);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

router.post('/verify-code', async (req, res, next) => {
  try {
    const result = await mailgunService.verifyCode(req.body.email, req.body.code);
    if (result) {
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false });
    }
  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ message: error.message });
      return;
    }
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    // Generate new token
    const token = await authService.refreshToken(authReq.user.id);
    res.json({
      token,
      user: authReq.user
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ message: error.message });
      return;
    }
    next(error);
  }
});

export default router; 