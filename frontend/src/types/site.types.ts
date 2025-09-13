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

export interface PublicSite {
  id: string;
  name: string;
  url: string;
  checkInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    companyName: string;
    themeSettings: {
      logo: string;
      primaryColor: string;
      secondaryColor: string;
      textPrimary: string;
      textSecondary: string;
    } | null;
  };
  statuses: SiteStatus[];
  // Enhanced API response properties
  status: {
    overall: string;
    color: string;
    message: string;
    lastChecked: string | null;
    currentResponseTime: number | null;
    uptime: {
      '24h': number;
      '7d': number;
      '30d': number;
    };
  };
  incidents: Array<{
    start: string;
    end: string | null;
    duration: number;
    cause: string;
    resolution: string;
  }>;
  aiDiagnostics: {
    diagnosis: string;
    severity: string;
    recommendations: string;
    confidence: number;
  } | null;
  aiPredictiveAnalysis: {
    predictedStatus: 'up' | 'down' | 'degraded';
    confidence: number;
    timeframe: string;
    riskFactors: string[];
    recommendations: string[];
    predictedAt: string;
  } | null;
  performance: {
    averageResponseTime: number;
    sslStatus: string;
    sslExpiryDays: number | null;
  };
  detailedStatus: {
    overall: {
      isUp: boolean;
      workerId: string;
    };
    ping: {
      isUp: boolean;
      responseTime: number | null;
    };
    http: {
      isUp: boolean;
      responseTime: number | null;
    };
    dns: {
      isUp: boolean;
      responseTime: number | null;
      nameservers: string[];
      records: any;
    };
    ssl: {
      hasSsl: boolean;
      validFrom: string | null;
      validTo: string | null;
      issuer: string | null;
      daysUntilExpiry: number | null;
    };
    tcp: {
      checks: any;
    };
  };
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