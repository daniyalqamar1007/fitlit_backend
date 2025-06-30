import { Controller, Get, Post, UseGuards } from "@nestjs/common"
import type { AppSettingsService } from "./app-settings.service"
import { AdminAuthGuard } from "../admin/guards/admin-auth.guard"

@Controller("app-settings")
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get()
  async getSettings() {
    return this.appSettingsService.getSettings()
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  async updateSettings(settings: any) {
    return this.appSettingsService.updateSettings(settings)
  }
}
