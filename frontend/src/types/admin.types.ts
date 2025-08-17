import type { UserRole } from './auth.types';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  userFeatures: Array<{
    featureKey: string;
    endDate: string;
  }>;
  _count: {
    sites: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  customDomain?: string;
  sites: Array<{
    id: string;
    name: string;
    url: string;
    isActive: boolean;
  }>;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  total: number;
}

export interface AdminUserResponse {
  success: boolean;
  data: AdminUserDetail;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: UserRole;
  userFeatures?: Array<{
    featureKey: string;
    endDate: string;
  }>;
}

export interface UpdateUserResponse {
  success: boolean;
  data: AdminUser;
  message: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  role: UserRole;
  password: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: AdminUser;
  message: string;
} 