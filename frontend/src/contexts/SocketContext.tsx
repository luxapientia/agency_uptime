import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { socketService } from '../services/socket.service';
import type { SiteStatusUpdate, SiteConfigUpdate } from '../types/socket.types';

type SocketContextType = {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const useSocketEvent = <T,>(event: string, callback: (data: T) => void) => {
  useEffect(() => {
    const unsubscribe = socketService.subscribe<T>(event, callback);
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
};

export const useSiteStatus = (callback: (data: SiteStatusUpdate) => void) => {
  useSocketEvent<SiteStatusUpdate>('site_status_update', callback);
};

export const useSiteConfig = (callback: (data: SiteConfigUpdate) => void) => {
  useSocketEvent<SiteConfigUpdate>('site_config_update', callback);
};

type SocketProviderProps = {
  children: ReactNode;
  autoConnect?: boolean;
};

export const SocketProvider = ({ children, autoConnect = true }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(socketService.isConnected());

  useEffect(() => {
    if (!autoConnect) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (error: Error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    };

    // Subscribe to socket events
    socketService.subscribe('connect', handleConnect);
    socketService.subscribe('disconnect', handleDisconnect);
    socketService.subscribe('connect_error', handleError);

    // Initial connection
    if (!socketService.isConnected()) {
      socketService.reconnect();
    }

    return () => {
      // Cleanup subscriptions
      socketService.disconnect();
    };
  }, [autoConnect]);

  const connect = () => {
    socketService.reconnect();
  };

  const disconnect = () => {
    socketService.disconnect();
  };

  const emit = (event: string, data: any) => {
    socketService.emit(event, data);
  };

  const value = {
    isConnected,
    connect,
    disconnect,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
