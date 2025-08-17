export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: UserRole;
  createdAt: Date | string;
  updatedAt: Date | string;
  userFeatures: Array<{
    featureKey: string;
    endDate: Date | string;
  }>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  features: Array<{
    featureKey: string;
    endDate: Date | string;
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
}

export interface RegisterCredentials extends RegisterData {
  confirmPassword: string;
} 