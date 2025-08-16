import type { UserRole } from '../types/user.types';

/**
 * Check if a user has admin privileges
 */
export const isAdmin = (role: UserRole): boolean => {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
};

/**
 * Check if a user has super admin privileges
 */
export const isSuperAdmin = (role: UserRole): boolean => {
  return role === 'SUPER_ADMIN';
};

/**
 * Check if a user has at least the specified role level
 */
export const hasRoleLevel = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    'USER': 1,
    'ADMIN': 2,
    'SUPER_ADMIN': 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Get the display name for a role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    'USER': 'User',
    'ADMIN': 'Administrator',
    'SUPER_ADMIN': 'Super Administrator',
  };

  return roleNames[role];
};

/**
 * Get the description for a role
 */
export const getRoleDescription = (role: UserRole): string => {
  const roleDescriptions: Record<UserRole, string> = {
    'USER': 'Standard user with access to basic features',
    'ADMIN': 'Administrator with access to user management and system settings',
    'SUPER_ADMIN': 'Super administrator with full system access and user role management',
  };

  return roleDescriptions[role];
}; 