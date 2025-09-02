import { FEATURES, FEATURE_DESCRIPTIONS, FEATURE_CATEGORIES, type FeatureKey } from '../constants/features.constants';

/**
 * Check if a user has access to a specific feature based on their membership
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param requiredFeature - The feature to check
 * @returns boolean indicating if user has access and feature hasn't expired
 */
export function hasFeature(userFeatures: Array<{ featureKey: string; endDate: Date }>, requiredFeature: FeatureKey): boolean {
  const now = new Date();
  return userFeatures.some(feature => 
    feature.featureKey === requiredFeature && feature.endDate > now
  );
}

/**
 * Check if a user has access to multiple features (all must be present)
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param requiredFeatures - Array of features to check
 * @returns boolean indicating if user has access to all features and they haven't expired
 */
export function hasAllFeatures(userFeatures: Array<{ featureKey: string; endDate: Date }>, requiredFeatures: FeatureKey[]): boolean {
  const now = new Date();
  return requiredFeatures.every(requiredFeature => 
    userFeatures.some(feature => 
      feature.featureKey === requiredFeature && feature.endDate > now
    )
  );
}

/**
 * Check if a user has access to at least one of the required features
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param requiredFeatures - Array of features to check
 * @returns boolean indicating if user has access to at least one feature that hasn't expired
 */
export function hasAnyFeature(userFeatures: Array<{ featureKey: string; endDate: Date }>, requiredFeatures: FeatureKey[]): boolean {
  const now = new Date();
  return requiredFeatures.some(requiredFeature => 
    userFeatures.some(feature => 
      feature.featureKey === requiredFeature && feature.endDate > now
    )
  );
}

/**
 * Get the human-readable description for a feature key
 * @param featureKey - The feature key to get description for
 * @returns The human-readable description
 */
export function getFeatureDescription(featureKey: FeatureKey): string {
  return FEATURE_DESCRIPTIONS[featureKey] || featureKey;
}

/**
 * Get all features in a specific category
 * @param category - The category to get features for
 * @returns Array of feature keys in that category
 */
export function getFeaturesByCategory(category: keyof typeof FEATURE_CATEGORIES): readonly FeatureKey[] {
  return FEATURE_CATEGORIES[category];
}

/**
 * Validate if a feature key is valid
 * @param featureKey - The feature key to validate
 * @returns boolean indicating if the feature key is valid
 */
export function isValidFeatureKey(featureKey: string): featureKey is FeatureKey {
  return Object.values(FEATURES).includes(featureKey as FeatureKey);
}

/**
 * Get all available feature keys
 * @returns Array of all available feature keys
 */
export function getAllFeatureKeys(): FeatureKey[] {
  return Object.values(FEATURES);
}

/**
 * Get features grouped by category for display purposes
 * @returns Object with categories as keys and arrays of features as values
 */
export function getFeaturesGroupedByCategory(): Record<string, { key: FeatureKey; description: string }[]> {
  const grouped: Record<string, { key: FeatureKey; description: string }[]> = {};
  
  Object.entries(FEATURE_CATEGORIES).forEach(([category, features]) => {
    grouped[category] = features.map(feature => ({
      key: feature,
      description: getFeatureDescription(feature)
    }));
  });
  
  return grouped;
}

/**
 * Check if a user can use a specific check interval
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param intervalSeconds - The check interval in seconds
 * @returns boolean indicating if user can use that check interval
 */
export function canUseCheckInterval(userFeatures: Array<{ featureKey: string; endDate: Date }>, intervalSeconds: number): boolean {
  if (intervalSeconds >= 300) return true; // 5 minutes or more - basic tier
  
  if (intervalSeconds >= 60) {
    return hasFeature(userFeatures, FEATURES.CHECK_INTERVAL_1MIN) || 
           hasFeature(userFeatures, FEATURES.CHECK_INTERVAL_30SEC);
  }
  
  if (intervalSeconds >= 30) {
    return hasFeature(userFeatures, FEATURES.CHECK_INTERVAL_30SEC);
  }
  
  return false; // Less than 30 seconds not supported
}

/**
 * Get the minimum check interval a user can use based on their features
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns The minimum check interval in seconds
 */
export function getMinCheckIntervalAllowed(userFeatures: Array<{ featureKey: string; endDate: Date }>): number {
  if (hasFeature(userFeatures, FEATURES.CHECK_INTERVAL_30SEC)) return 30;
  if (hasFeature(userFeatures, FEATURES.CHECK_INTERVAL_1MIN)) return 60;
  if (hasFeature(userFeatures, FEATURES.CHECK_INTERVAL_5MIN)) return 300;
  return 300; // Default to 5 minutes
}

/**
 * Get all active (non-expired) features for a user
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns Array of active features
 */
export function getActiveFeatures(userFeatures: Array<{ featureKey: string; endDate: Date }>): Array<{ featureKey: string; endDate: Date }> {
  const now = new Date();
  return userFeatures.filter(feature => feature.endDate > now);
}

/**
 * Get all expired features for a user
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns Array of expired features
 */
export function getExpiredFeatures(userFeatures: Array<{ featureKey: string; endDate: Date }>): Array<{ featureKey: string; endDate: Date }> {
  const now = new Date();
  return userFeatures.filter(feature => feature.endDate <= now);
}

/**
 * Get features that will expire within a specified number of days
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param days - Number of days to check ahead
 * @returns Array of features expiring soon
 */
export function getFeaturesExpiringSoon(userFeatures: Array<{ featureKey: string; endDate: Date }>, days: number = 7): Array<{ featureKey: string; endDate: Date }> {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return userFeatures.filter(feature => 
    feature.endDate > now && feature.endDate <= cutoffDate
  );
}

/**
 * Check if a user has any active features
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns boolean indicating if user has any active features
 */
export function hasAnyActiveFeatures(userFeatures: Array<{ featureKey: string; endDate: Date }>): boolean {
  return getActiveFeatures(userFeatures).length > 0;
}

/**
 * Get the expiration date for a specific feature
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param featureKey - The feature to get expiration date for
 * @returns Date when the feature expires, or null if not found
 */
export function getFeatureExpirationDate(userFeatures: Array<{ featureKey: string; endDate: Date }>, featureKey: FeatureKey): Date | null {
  const feature = userFeatures.find(f => f.featureKey === featureKey);
  return feature ? feature.endDate : null;
}

/**
 * Get days until a feature expires
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param featureKey - The feature to check
 * @returns Number of days until expiration, negative if expired, null if not found
 */
export function getDaysUntilFeatureExpires(userFeatures: Array<{ featureKey: string; endDate: Date }>, featureKey: FeatureKey): number | null {
  const expirationDate = getFeatureExpirationDate(userFeatures, featureKey);
  if (!expirationDate) return null;
  
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Check if a user has AI diagnostics capabilities
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns The highest level of AI diagnostics available
 */
export function getAIDiagnosticsLevel(userFeatures: Array<{ featureKey: string; endDate: Date }>): 'none' | 'basic' | 'advanced' | 'enterprise' {
  if (hasFeature(userFeatures, FEATURES.AI_DIAGNOSTICS_ENTERPRISE)) return 'enterprise';
  if (hasFeature(userFeatures, FEATURES.AI_DIAGNOSTICS_ADVANCED)) return 'advanced';
  if (hasFeature(userFeatures, FEATURES.AI_DIAGNOSTICS_BASIC)) return 'basic';
  return 'none';
}

/**
 * Check if a user has predictive monitoring capabilities
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns The level of predictive monitoring available
 */
export function getPredictiveMonitoringLevel(userFeatures: Array<{ featureKey: string; endDate: Date }>): 'none' | 'basic' | 'advanced' {
  if (hasFeature(userFeatures, FEATURES.PREDICTIVE_MONITORING_ADVANCED)) return 'advanced';
  if (hasFeature(userFeatures, FEATURES.PREDICTIVE_MONITORING)) return 'basic';
  return 'none';
}

/**
 * Get all available alert types for a user
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns Array of available alert types
 */
export function getAvailableAlertTypes(userFeatures: Array<{ featureKey: string; endDate: Date }>): string[] {
  const alertTypes: string[] = [];
  
  if (hasFeature(userFeatures, FEATURES.ALERTS_EMAIL)) alertTypes.push('email');
  if (hasFeature(userFeatures, FEATURES.ALERTS_SLACK)) alertTypes.push('slack');
  if (hasFeature(userFeatures, FEATURES.ALERTS_DISCORD)) alertTypes.push('discord');
  
  return alertTypes;
} 