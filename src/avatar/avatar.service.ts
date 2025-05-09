import { Injectable, Logger } from '@nestjs/common';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { OpenaiService } from './utils/openai.service';
import * as path from 'path';
import * as fs from 'fs';
import OpenAI from 'openai';

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'OPENAI_API_KEY is not set! OpenAI service will not work properly.',
      );
    }
  }
  //   constructor(private openai: OpenaiService) {}

  async test(filePath: string) {
    try {
      // Read the file as a buffer
      const imageBuffer = fs.readFileSync(filePath);
      // Create a File-like object
      const fileName = filePath.split('/').pop() ?? 'image.png';
      const imageFile = new FileLike(imageBuffer, fileName, 'image/png');
      // Send the image to OpenAI for editing
      const rsp = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: 'Create a lovely gift basket with this item in it',
      });
      if (rsp.data) {
        const image_base64:any = rsp.data[0].b64_json;
        const image_bytes = Buffer.from(image_base64, 'base64');
        fs.writeFileSync('basket.png', image_bytes);
      }
      // Save the edited image to a file

      console.log('Image saved successfully as basket.png');
      return true;
    } catch (error) {
      console.error('Error during image processing:', error.message);
      return false;
    }
  }
}
class FileLike extends Blob {
  lastModified: number;
  name: string;
  constructor(buffer: Buffer, name: string, type: string) {
    super([buffer], { type });
    this.lastModified = Date.now();
    this.name = name;
  }
}
