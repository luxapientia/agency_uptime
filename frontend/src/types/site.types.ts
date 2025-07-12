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

interface StatusData {
  isUp: boolean | null;
  lastChecked: string | null;
  pingUp: boolean | null;
  httpUp: boolean | null;
  ssl: {
    enabled: boolean;
    validFrom: string;
    validTo: string;
    issuer: string;
    daysUntilExpiry: number;
  } | null;
}

export interface SiteStatus {
  currentStatus: StatusData;
  uptime: {
    last24Hours: {
      overall: number;
      http: number;
      ping: number;
      totalChecks: number;
    };
  };
  history: Array<{
    timestamp: string;
    isUp: boolean;
    httpUp: boolean;
    pingUp: boolean;
  }>;
  message?: string;
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