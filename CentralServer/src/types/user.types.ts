import type { FeatureKey } from '../constants/features.constants';

/**
 * User feature with expiration date
 */
export interface UserFeature {
  id: string;
  userId: string;
  featureKey: FeatureKey;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User feature input for creating/updating
 */
export interface UserFeatureInput {
  featureKey: FeatureKey;
  endDate: Date;
}

/**
 * User with features included
 */
export interface UserWithFeatures {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
  customDomain?: string;
  userFeatures: UserFeature[];
}

/**
 * Feature status for UI display
 */
export interface FeatureStatus {
  featureKey: FeatureKey;
  isActive: boolean;
  endDate: Date;
  daysUntilExpiry: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
} 