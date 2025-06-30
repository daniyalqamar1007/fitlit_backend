import { Injectable } from "@nestjs/common"
import type { Model } from "mongoose"
import type { AppSettings, AppSettingsDocument } from "./schemas/app-settings.schema"

@Injectable()
export class AppSettingsService {
  constructor(private appSettingsModel: Model<AppSettingsDocument>) {}

  async getSettings(): Promise<AppSettings> {
    let settings = await this.appSettingsModel.findOne()
    if (!settings) {
      settings = new this.appSettingsModel({
        maintenanceMode: false,
        allowRegistration: true,
        maxFileSize: 10485760, // 10MB
      })
      await settings.save()
    }
    return settings
  }

  async updateSettings(settingsData: Partial<AppSettings>): Promise<AppSettings> {
    let settings = await this.appSettingsModel.findOne()
    if (!settings) {
      settings = new this.appSettingsModel(settingsData)
    } else {
      Object.assign(settings, settingsData)
    }
    return settings.save()
  }
}
