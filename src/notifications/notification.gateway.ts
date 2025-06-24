// notification.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger } from '@nestjs/common';
  import * as jwt from 'jsonwebtoken';
  import { NotificationService } from './notification.service';
  
  interface AuthenticatedSocket extends Socket {
    userId?: number;
  }
  
  @WebSocketGateway({
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    namespace: '/notifications'
  })
  export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(NotificationGateway.name);
    private connectedClients = new Map<number, string>(); // userId -> socketId
  
    constructor(private notificationService: NotificationService) {
      // Set up circular reference
      this.notificationService.setNotificationGateway(this);
    }
  
    afterInit(server: Server) {
      this.logger.log('WebSocket Gateway initialized');
    }
  
    async handleConnection(client: AuthenticatedSocket) {
      try {
        const token = client.handshake.query.token as string;
        
        if (!token) {
          this.logger.warn('Client connected without token');
          client.disconnect();
          return;
        }
  
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        const userId = decoded.sub;
  
        if (!userId) {
          this.logger.warn('Invalid token - no userId');
          client.disconnect();
          return;
        }
  
        client.userId = userId;
        this.connectedClients.set(userId, client.id);
        
        this.logger.log(`Client connected: ${client.id} for user ${userId}`);
        
        // Join user to their personal room
        client.join(`user_${userId}`);
        
      } catch (error) {
        this.logger.error('Authentication failed:', error.message);
        client.disconnect();
      }
    }
  
    handleDisconnect(client: AuthenticatedSocket) {
      if (client.userId) {
        this.connectedClients.delete(client.userId);
        this.logger.log(`Client disconnected: ${client.id} for user ${client.userId}`);
      }
    }
  
    // Method to send notification to specific user
    async sendNotificationToUser(userId: number, notification: any) {
      this.server.to(`user_${userId}`).emit('new_notification', {
        type: 'new_notification',
        notification
      });
    }
  
    // Method to notify user when notification is marked as read
    async notifyNotificationRead(userId: number, notificationId: string) {
      this.server.to(`user_${userId}`).emit('notification_read', {
        type: 'notification_read',
        notificationId
      });
    }
  
    // Method to notify user when all notifications are marked as read
    async notifyAllNotificationsRead(userId: number) {
      this.server.to(`user_${userId}`).emit('all_notifications_read', {
        type: 'all_notifications_read'
      });
    }
  }