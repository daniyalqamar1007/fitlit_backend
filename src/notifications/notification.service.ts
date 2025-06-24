// notification.service.ts
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  private notificationGateway: any; // We'll inject this later

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Setter method for gateway injection (to avoid circular dependency)
  setNotificationGateway(gateway: any) {
    this.notificationGateway = gateway;
  }

  async createNotification(
    userId: number,
    type: string,
    message: string,
    sender?: number,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    const notification = new this.notificationModel({
      userId,
      type,
      message,
      sender,
      metadata,
      isRead: false,
    });

    const savedNotification = await notification.save();
    
    // Send real-time notification via WebSocket
    if (this.notificationGateway) {
      await this.notificationGateway.sendNotificationToUser(userId, savedNotification);
    }
    
    return savedNotification;
  }

  async getNotificationsForUser(userId: number) {
    try {
      const notifications = await this.notificationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .exec();

      return {
        success: true,
        notifications,
        count: notifications.length,
        unreadCount: notifications.filter(n => !n.isRead).length
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      };
    }
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true },
      )
      .exec();

    if (notification && this.notificationGateway) {
      // Notify via WebSocket
      await this.notificationGateway.notifyNotificationRead(notification.userId, notificationId);
    }

    return notification;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationModel
      .updateMany(
        { userId, isRead: false },
        { isRead: true },
      )
      .exec();

    // Notify via WebSocket
    if (this.notificationGateway) {
      await this.notificationGateway.notifyAllNotificationsRead(userId);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationModel.countDocuments({
      userId,
      isRead: false,
    });
  }
}