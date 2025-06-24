// notification.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}
  
  @Get()
  async getNotifications(@Request() req) {
    const userId = req.user.userId;
    return this.notificationService.getNotificationsForUser(Number(userId));
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    return this.notificationService.getUnreadCount(Number(userId));
  }

  @Post(':id/mark-read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const result = await this.notificationService.markAsRead(id);
    if (result) {
      return { success: true, message: 'Notification marked as read' };
    }
    return { success: false, message: 'Notification not found' };
  }

  @Post('mark-all-read')
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    await this.notificationService.markAllAsRead(Number(userId));
    return { success: true, message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    await this.notificationService.deleteNotification(id);
    return { success: true, message: 'Notification deleted successfully' };
  }
}