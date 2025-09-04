import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import type { AuthenticatedRequest } from '../types/express';
import logger from '../utils/logger';
import axios from 'axios';
import authService from '../services/auth.service';
import mailgunService from '../services/mailgun.service';
import { authenticate } from '../middleware/auth.middleware';

const prisma = new PrismaClient();
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

// Schema for reset password
const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

/**
 * POST /auth/reset-password
 * Reset password with verification code
 */
router.post('/reset-password', validateRequest(resetPasswordSchema), async (req, res, next) => {
  try {
    const { email, verificationCode, newPassword } = req.body;

    // First verify the code using the existing verification system
    const isVerified = await mailgunService.verifyCode(email.toLowerCase(), verificationCode);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    if (error instanceof BadRequestError) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
      return;
    }
    next(error);
  }
});

export default router; 