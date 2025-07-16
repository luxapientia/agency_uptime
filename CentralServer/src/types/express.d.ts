import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
}

interface TcpCheckResult {
  port: number;
  isConnected: boolean;
  responseTime?: number;
}

interface DnsCheckResult {
  isResolved: boolean;
  nameservers?: string[];
  records?: Record<string, any>;
  responseTime?: number;
}

interface SiteCheckResult {
  url: string;
  isUp: boolean;
  checkedAt: Date;
  workerId: string;
  dnsCheck: DnsCheckResult;
  tcpChecks: TcpCheckResult[];
  pingCheck: {
    isUp: boolean;
    responseTime?: number;
  };
  httpCheck: {
    isUp: boolean;
    responseTime?: number;
    ssl?: {
      validFrom: string;
      validTo: string;
      issuer: string;
      daysUntilExpiry: number;
    };
  };
}

export {
  TcpCheckResult,
  DnsCheckResult,
  SiteCheckResult
}; 