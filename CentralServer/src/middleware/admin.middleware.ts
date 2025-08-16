import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError } from '../utils/errors';
import { isAdmin, isSuperAdmin } from '../utils/roleUtils';
import AuthService from '../services/auth.service';

const prisma = new PrismaClient();

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First, authenticate the user
    const authHeader = req.headers.authorization;
    
    console.log('Admin middleware - Headers:', req.headers);
    console.log('Admin middleware - Auth header:', authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const userId = await AuthService.validateToken(token);

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        role: true 
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if user has admin privileges
    console.log('Admin middleware - User role:', user.role);
    console.log('Admin middleware - Is admin?', isAdmin(user.role));
    
    if (!isAdmin(user.role)) {
      throw new UnauthorizedError('Admin access required');
    }

    // Attach user and role to request for use in route handlers
    (req as any).user = user;
    (req as any).userId = userId;
    (req as any).userRole = user.role;
    
    next();
  } catch (error) {
    next(error);
  }
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First, authenticate the user
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const userId = await AuthService.validateToken(token);

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
        role: true 
      }
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Check if user has super admin privileges
    if (!isSuperAdmin(user.role)) {
      throw new UnauthorizedError('Super admin access required');
    }

    // Attach user and role to request for use in route handlers
    (req as any).user = user;
    (req as any).userId = userId;
    (req as any).userRole = user.role;
    
    next();
  } catch (error) {
    next(error);
  }
}; 