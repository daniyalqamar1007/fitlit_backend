import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger } from '@nestjs/common';
  import * as jwt from 'jsonwebtoken';
  import { NotificationService } from './notification.service';
  
  interface AuthenticatedSocket extends Socket {
    userId?: number;
    authenticated?: boolean;
  }
  
  @WebSocketGateway({
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    namespace: '/notifications'
  })
  export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(NotificationGateway.name);
    private connectedClients = new Map<number, Set<string>>(); // userId -> Set of socketIds
    private authenticatedSockets = new Map<string, number>(); // socketId -> userId
  
    constructor(private notificationService: NotificationService) {
      // Set up circular reference
      this.notificationService.setNotificationGateway(this);
    }
  
    afterInit(server: Server) {
      this.logger.log('WebSocket Gateway initialized');
    }
  
    async handleConnection(client: AuthenticatedSocket) {
      this.logger.log(`Client attempting connection: ${client.id}`);
      
      try {
        // Get token from query params or headers
        const token = client.handshake.query.token as string || 
                     client.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          this.logger.warn(`Client ${client.id} connected without token`);
          client.emit('auth_error', { message: 'Authentication token required' });
          client.disconnect(true);
          return;
        }
  
        // Verify JWT token
        let decoded: any;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        } catch (jwtError) {
          this.logger.warn(`JWT verification failed for client ${client.id}: ${jwtError.message}`);
          client.emit('auth_error', { message: 'Invalid authentication token' });
          client.disconnect(true);
          return;
        }
  
        const userId = decoded.sub || decoded.userId;
  
        if (!userId) {
          this.logger.warn(`Invalid token - no userId for client ${client.id}`);
          client.emit('auth_error', { message: 'Invalid token payload' });
          client.disconnect(true);
          return;
        }
  
        // Set socket properties
        client.userId = Number(userId);
        client.authenticated = true;
        
        // Update tracking maps
        this.authenticatedSockets.set(client.id, client.userId);
        
        if (!this.connectedClients.has(client.userId)) {
          this.connectedClients.set(client.userId, new Set());
        }
        this.connectedClients.get(client.userId)!.add(client.id);
        
        this.logger.log(`Client authenticated: ${client.id} for user ${client.userId}`);
        
        // Join user to their personal room
        await client.join(`user_${client.userId}`);
        
        // Send connection confirmation
        client.emit('connected', { 
          message: 'Successfully connected to notifications',
          userId: client.userId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        this.logger.error(`Connection handling error for client ${client.id}:`, error);
        client.emit('connection_error', { message: 'Connection failed' });
        client.disconnect(true);
      }
    }
  
    handleDisconnect(client: AuthenticatedSocket) {
      const userId = this.authenticatedSockets.get(client.id);
      
      if (userId) {
        // Remove from tracking maps
        this.authenticatedSockets.delete(client.id);
        
        const userSockets = this.connectedClients.get(userId);
        if (userSockets) {
          userSockets.delete(client.id);
          if (userSockets.size === 0) {
            this.connectedClients.delete(userId);
          }
        }
        
        this.logger.log(`Client disconnected: ${client.id} for user ${userId}`);
      } else {
        this.logger.log(`Unauthenticated client disconnected: ${client.id}`);
      }
    }
  
    // Handle ping messages for connection testing
    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
      if (client.authenticated) {
        client.emit('pong', { timestamp: new Date().toISOString() });
        this.logger.log(`Ping received from client ${client.id}`);
      }
    }
  
    // Handle explicit join requests
    @SubscribeMessage('join')
    handleJoin(
      @MessageBody() data: { userId?: number },
      @ConnectedSocket() client: AuthenticatedSocket,
    ): void {
      if (!client.authenticated || !client.userId) {
        client.emit('join_error', { message: 'Not authenticated' });
        return;
      }
  
      // Verify the user is joining their own room
      if (data.userId && data.userId !== client.userId) {
        client.emit('join_error', { message: 'Cannot join another user\'s room' });
        return;
      }
  
      client.emit('joined', { 
        userId: client.userId,
        room: `user_${client.userId}`,
        timestamp: new Date().toISOString()
      });
    }
  
    // Method to send notification to specific user
    async sendNotificationToUser(userId: number, notification: any): Promise<boolean> {
      try {
        const room = `user_${userId}`;
        const socketsInRoom = await this.server.in(room).fetchSockets();
        
        if (socketsInRoom.length === 0) {
          this.logger.warn(`No connected sockets found for user ${userId}`);
          return false;
        }
  
        this.server.to(room).emit('new_notification', {
          type: 'new_notification',
          notification,
          timestamp: new Date().toISOString()
        });
  
        this.logger.log(`Notification sent to user ${userId} (${socketsInRoom.length} sockets)`);
        return true;
      } catch (error) {
        this.logger.error(`Error sending notification to user ${userId}:`, error);
        return false;
      }
    }
  
    // Method to notify user when notification is marked as read
    async notifyNotificationRead(userId: number, notificationId: string): Promise<boolean> {
      try {
        const room = `user_${userId}`;
        this.server.to(room).emit('notification_read', {
          type: 'notification_read',
          notificationId,
          timestamp: new Date().toISOString()
        });
  
        this.logger.log(`Read notification sent to user ${userId} for notification ${notificationId}`);
        return true;
      } catch (error) {
        this.logger.error(`Error sending read notification to user ${userId}:`, error);
        return false;
      }
    }
  
    // Method to notify user when all notifications are marked as read
    async notifyAllNotificationsRead(userId: number): Promise<boolean> {
      try {
        const room = `user_${userId}`;
        this.server.to(room).emit('all_notifications_read', {
          type: 'all_notifications_read',
          timestamp: new Date().toISOString()
        });
  
        this.logger.log(`All read notification sent to user ${userId}`);
        return true;
      } catch (error) {
        this.logger.error(`Error sending all read notification to user ${userId}:`, error);
        return false;
      }
    }
  
    // Get connected users count
    getConnectedUsersCount(): number {
      return this.connectedClients.size;
    }
  
    // Get connected sockets count for a user
    getUserSocketsCount(userId: number): number {
      return this.connectedClients.get(userId)?.size || 0;
    }
  
    // Check if user is connected
    isUserConnected(userId: number): boolean {
      return this.connectedClients.has(userId) && this.connectedClients.get(userId)!.size > 0;
    }
  }