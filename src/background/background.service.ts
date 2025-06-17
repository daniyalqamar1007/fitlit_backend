import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Background, BackgroundDocument } from './schemas/background.schema';
import OpenAI from 'openai';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class BackgroundService {
  private readonly logger = new Logger(BackgroundService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectModel(Background.name)
    private readonly backgroundModel: Model<BackgroundDocument>,
    private readonly awsS3Service: AwsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'OPENAI_API_KEY is not set! OpenAI service will not work properly.',
      );
    }
  }

  async generateBackground(prompt: string, userId: string) {
    try {
      // Generate image using OpenAI
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      if (response.data && response.data[0].url) {
        // Download the image
        const imageResponse = await fetch(response.data[0].url);
        const imageBuffer = await imageResponse.arrayBuffer();

        // Upload to AWS S3
        const imageUrl = await this.awsS3Service.uploadFile(
          Buffer.from(imageBuffer),
          userId,
        );

        // Set all existing backgrounds to inactive
        await this.backgroundModel.updateMany(
          { user_id: userId },
          { isActive: false }
        );

        // Create new background with active status
        const created = new this.backgroundModel({
          user_id: userId,
          imageUrl: imageUrl,
          prompt: prompt,
          isActive: true,
          createdAt: new Date(),
        });

        await created.save();

        return {
          success: true,
          imageUrl: imageUrl,
        };
      }

      return {
        success: false,
        message: 'Failed to generate background image',
      };
    } catch (error) {
      this.logger.error('Error generating background:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getActiveBackground(userId: string) {
    try {
      const background = await this.backgroundModel.findOne({
        user_id: userId,
        isActive: true,
      });

      return {
        success: true,
        background: background,
      };
    } catch (error) {
      this.logger.error('Error getting active background:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }
} 