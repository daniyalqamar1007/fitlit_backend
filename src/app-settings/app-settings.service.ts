// app-settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AppSettings,
  AppSettingsDocument,
} from './schemas/app-settings.schema';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectModel(AppSettings.name)
    private appSettingsModel: Model<AppSettingsDocument>,
  ) {}

  async getSettings(): Promise<AppSettings | null > {
    return this.appSettingsModel.findOne().exec(); // assuming single doc
  }
}
