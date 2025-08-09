export interface Site {
  id: string;
  name: string;
  url: string;
  checkInterval: number;
  isActive: boolean;
  monthlyReport: boolean;
  createdAt: string;
  updatedAt: string;
  notificationSettings: NotificationSetting[];
}

export interface SiteStatus {
  id: string;
  siteId: string;
  workerId: string;
  isUp: boolean;
  pingIsUp: boolean;
  httpIsUp: boolean;
  dnsIsUp: boolean;
  checkedAt: string;
  
  // Response Times
  pingResponseTime?: number;
  httpResponseTime?: number;
  dnsResponseTime?: number;
  
  // Uptime percentages
  overallUptime?: number;
  pingUptime?: number;
  httpUptime?: number;
  dnsUptime?: number;
  
  // SSL Information
  hasSsl: boolean;
  sslValidFrom?: string;
  sslValidTo?: string;
  sslIssuer?: string;
  sslDaysUntilExpiry?: number;
  
  // DNS Information
  dnsNameservers: string[];
  dnsRecords?: {
    addresses: string[];
    error?: string;
    responseTime?: number;
  };
  
  // TCP Check Information
  tcpChecks?: TcpCheckResult[];
}

export interface TcpCheckResult {
  port: number;
  isConnected: boolean;
  isUp: boolean;
  responseTime?: number;
  error?: string;
}

export interface NotificationSetting {
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
  monthlyReport?: boolean;
  monthlyReportSendAt?: string; // ISO string or 'YYYY-MM-DDTHH:mm' from input
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  isActive?: boolean;
  monthlyReport?: boolean;
  monthlyReportSendAt?: string;
}

export interface SiteState {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  selectedSite: Site | null;
} 