import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/logger';
import { config } from '../config';
import AuthService from './auth.service';

class SocketService {
  private io: SocketServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  initialize(server: HttpServer) {
    this.io = new SocketServer(server);

    // Middleware for authentication
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token is required'));
        }

        const userId = await AuthService.validateToken(token);
        if (!userId) {
          return next(new Error('Invalid authentication token'));
        }

        socket.userId = userId;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: any) => {
      const userId = socket.userId;
      logger.info(`Client connected: ${socket.id} (User: ${userId})`);

      // Add socket to user's socket set
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(socket.id);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id} (User: ${userId})`);
        // Remove socket from user's socket set
        this.userSockets.get(userId)?.delete(socket.id);
        if (this.userSockets.get(userId)?.size === 0) {
          this.userSockets.delete(userId);
        }
      });
    });

    logger.info('WebSocket service initialized');
  }

  // Send data to a specific user (through all their active sockets)
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.IO server not initialized');
      return;
    }

    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) {
      logger.warn(`No active sockets found for user ${userId}`);
      return;
    }

    socketIds.forEach(socketId => {
      this.io?.to(socketId).emit(event, data);
    });
    logger.debug(`Sent ${event} event to user ${userId} (${socketIds.size} active connections)`);
  }

  // Send data to all connected clients
  broadcast(event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.IO server not initialized');
      return;
    }
    this.io.emit(event, data);
    logger.debug(`Broadcast ${event} event to all users`);
  }
}

export default new SocketService(); 