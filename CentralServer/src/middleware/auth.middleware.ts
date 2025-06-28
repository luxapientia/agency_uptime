import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { PrismaClient } from '@prisma/client';
import AuthService from '../services/auth.service';

const prisma = new PrismaClient();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const userId = await AuthService.validateToken(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach the user to the request
    (req as any).user = user;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
}