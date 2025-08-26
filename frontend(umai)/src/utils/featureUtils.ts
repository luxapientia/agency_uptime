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
 * Check if a user can monitor a specific number of websites
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @param requiredCount - The number of websites they want to monitor
 * @returns boolean indicating if user can monitor that many websites
 */
export function canMonitorWebsites(userFeatures: Array<{ featureKey: string; endDate: Date }>, requiredCount: number): boolean {
  if (requiredCount <= 10) return true; // Basic free tier
  
  if (requiredCount <= 50) {
    return hasFeature(userFeatures, FEATURES.MONITORED_WEBSITES_50) || 
           hasFeature(userFeatures, FEATURES.MONITORED_WEBSITES_200);
  }
  
  if (requiredCount <= 200) {
    return hasFeature(userFeatures, FEATURES.MONITORED_WEBSITES_200);
  }
  
  return false; // Beyond enterprise limit
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
 * Get the maximum number of websites a user can monitor based on their features
 * @param userFeatures - Array of user feature objects with featureKey and endDate
 * @returns The maximum number of websites allowed
 */
export function getMaxWebsitesAllowed(userFeatures: Array<{ featureKey: string; endDate: Date }>): number {
  if (hasFeature(userFeatures, FEATURES.MONITORED_WEBSITES_200)) return 200;
  if (hasFeature(userFeatures, FEATURES.MONITORED_WEBSITES_50)) return 50;
  if (hasFeature(userFeatures, FEATURES.MONITORED_WEBSITES_10)) return 10;
  return 0; // No monitoring features
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
 * Format feature list for display in UI components
 * @param features - Array of feature keys
 * @returns Array of formatted feature objects with key and description
 */
export function formatFeaturesForDisplay(features: string[]): Array<{ key: string; description: string }> {
  return features.map(feature => ({
    key: feature,
    description: isValidFeatureKey(feature) ? getFeatureDescription(feature) : feature
  }));
}

/**
 * Get feature icon based on feature type (for UI display)
 * @param featureKey - The feature key to get icon for
 * @returns Icon name or identifier
 */
export function getFeatureIcon(featureKey: FeatureKey): string {
  const iconMap: Record<FeatureKey, string> = {
    [FEATURES.MONITORED_WEBSITES_10]: 'monitor',
    [FEATURES.MONITORED_WEBSITES_50]: 'monitor',
    [FEATURES.MONITORED_WEBSITES_200]: 'monitor',
    [FEATURES.CHECK_INTERVAL_5MIN]: 'schedule',
    [FEATURES.CHECK_INTERVAL_1MIN]: 'schedule',
    [FEATURES.CHECK_INTERVAL_30SEC]: 'schedule',
    [FEATURES.AI_DIAGNOSTICS_BASIC]: 'psychology',
    [FEATURES.AI_DIAGNOSTICS_ADVANCED]: 'psychology',
    [FEATURES.AI_DIAGNOSTICS_PREMIUM]: 'psychology',
    [FEATURES.ALERTS_EMAIL]: 'email',
    [FEATURES.ALERTS_SLACK]: 'chat',
    [FEATURES.ALERTS_TELEGRAM]: 'telegram',
    [FEATURES.ALERTS_DISCORD]: 'discord',
    [FEATURES.ALERTS_WEBHOOK]: 'webhook',
    [FEATURES.ALERTS_PUSH_NOTIFICATION]: 'notifications',
    [FEATURES.CLIENT_SUBACCOUNTS]: 'people',
    [FEATURES.MULTI_USER_LOGINS]: 'group',
    [FEATURES.API_ACCESS]: 'api',
    [FEATURES.WEBHOOK_ACCESS]: 'webhook',
    [FEATURES.PREDICTIVE_MONITORING]: 'trending_up',
    [FEATURES.BRANDED_PDF_REPORTS]: 'picture_as_pdf',
  };
  
  return iconMap[featureKey] || 'feature';
} 