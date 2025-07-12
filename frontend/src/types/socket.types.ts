import type { SiteStatus } from "./site.types";

export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  AUTHENTICATE = 'authenticate',
  SITE_STATUS_UPDATE = 'site_status_update',
  SITE_CONFIG_UPDATE = 'site-config-updates',
  ERROR = 'error'
}

export interface SocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface SiteStatusUpdate {
  siteId: string;
  status: SiteStatus;
}

export interface SiteConfigUpdate {
  action: 'update' | 'delete' | 'bulk';
  site?: {
    id: string;
    url: string;
    checkInterval: number;
    isActive: boolean;
    userId: string;
  };
  sites?: Array<{
    id: string;
    url: string;
    checkInterval: number;
    isActive: boolean;
    userId: string;
  }>;
} 