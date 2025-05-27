// app-settings.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppSettingsService } from './app-settings.service';

@Controller('app-settings')
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Get('versions')
  async getVersions() {
    const settings = await this.appSettingsService.getSettings();
    if (!settings) {
      return {
        ios_version: '',
        android_version: '',
        ios_deployed_version: '',
        android_deployed_version: '',
      };
    }

    return {
      ios_version: settings.ios_version,
      android_version: settings.android_version,
      ios_deployed_version: settings.ios_deployed_version,
      android_deployed_version: settings.android_deployed_version,
    };
  }
}
