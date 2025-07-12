export interface Site {
  id: string;
  name: string;
  url: string;
  checkInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  notifications: Notification[];
}

export interface SiteStatus {
  isUp: boolean;
  checkedAt: string;
  pingUp: boolean;
  httpUp: boolean;
  pingResponseTime?: number;
  httpResponseTime?: number;
  overallUptime?: number;
  pingUptime?: number;
  httpUptime?: number;
  hasSsl: boolean;
  sslValidFrom?: string;
  sslValidTo?: string;
  sslIssuer?: string;
  sslDaysUntilExpiry?: number;
}

export interface Notification {
  id: string;
  siteId: string;
  enabled: boolean;
  type: NotificationType;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  PUSH_NOTIFICATION = 'PUSH_NOTIFICATION',
  WEB_HOOK = 'WEB_HOOK'
}

export interface CreateSiteData {
  name: string;
  url: string;
  checkInterval: number;
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  isActive?: boolean;
}

export interface SiteState {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  selectedSite: Site | null;
} 