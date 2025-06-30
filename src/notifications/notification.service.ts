import { Injectable } from "@nestjs/common"
import type { Model } from "mongoose"
import type { Notification, NotificationDocument } from "./schemas/notification.schema"

@Injectable()
export class NotificationService {
  private notificationModel: Model<NotificationDocument>

  constructor(notificationModel: Model<NotificationDocument>) {
    this.notificationModel = notificationModel
  }

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notification = new this.notificationModel(data)
    return notification.save()
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50).exec()
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    return this.notificationModel
      .findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true })
      .exec()
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany({ userId, isRead: false }, { isRead: true }).exec()
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, isRead: false }).exec()
  }
}
