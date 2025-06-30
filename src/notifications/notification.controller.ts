import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common"
import type { NotificationService } from "./notification.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { RequestWithUser } from "../interfaces/interface"

@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getNotifications(req: RequestWithUser) {
    return this.notificationService.getNotificationsForUser(req.user.userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/read")
  async markAsRead(@Param('id') id: string, req: RequestWithUser) {
    return this.notificationService.markAsRead(id, req.user.userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post("read-all")
  async markAllAsRead(req: RequestWithUser) {
    return this.notificationService.markAllAsRead(req.user.userId)
  }
}
