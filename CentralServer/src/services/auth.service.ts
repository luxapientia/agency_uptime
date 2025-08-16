import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

const prisma = new PrismaClient();

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    role: string;
  };
}

class AuthService {
  private generateToken(userId: string): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestError('Email already registered');
    }

    // Check if this is the first user in the system
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    if (isFirstUser) {
      console.log(`🎉 First user registered! ${data.email} will be assigned SUPER_ADMIN role.`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        // First user becomes super admin, others default to USER
        role: isFirstUser ? 'SUPER_ADMIN' : 'USER',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        role: true,
      },
    });

    const token = this.generateToken(user.id);

    return {
      token,
      user,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyName: user.companyName,
        role: user.role,
      },
    };
  }

  async validateToken(token: string): Promise<string> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as { userId: string };
      return decoded.userId;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  async refreshToken(userId: string): Promise<string> {
    return this.generateToken(userId);
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        role: true,
      },
    });
    return user;
  }
}

export default new AuthService(); 