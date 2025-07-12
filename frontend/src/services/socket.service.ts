import io, { type Socket } from 'socket.io-client';
import type { SiteStatusUpdate, SiteConfigUpdate } from '../types/socket.types';

class SocketService {
  private socket: typeof Socket | null = null;
  private maxReconnectAttempts = 5;
  private messageQueue: { event: string; data: any }[] = [];
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token')
      }
    });

    this.socket = socket;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.processMessageQueue();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    // Handle site status updates
    this.socket.on('site_status_update', (data: SiteStatusUpdate) => {
      this.notifyListeners('site_status_update', data);
    });

    // Handle site configuration updates
    this.socket.on('site_config_update', (data: SiteConfigUpdate) => {
      this.notifyListeners('site_config_update', data);
    });
  }

  private processMessageQueue(): void {
    if (!this.socket?.connected || this.messageQueue.length === 0) return;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.emit(message.event, message.data);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  public subscribe<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      this.messageQueue.push({ event, data });
      return;
    }

    this.socket.emit(event, data);
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  public reconnect(): void {
    this.disconnect();
    this.initialize();
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
