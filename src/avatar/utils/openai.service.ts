import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { OpenAI } from 'openai';
import { toFile } from 'openai/uploads';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn('OPENAI_API_KEY is not set! OpenAI service will not work properly.');
    }
  }

  async generateAvatarFromImages(
    imagePaths: string[],
    prompt: string,
  ): Promise<Buffer> {
    try {
      this.logger.log(`Generating avatar with images: ${imagePaths}`);
      
      if (!imagePaths || imagePaths.length === 0) {
        throw new Error('No image paths provided');
      }
      
      // Verify the file exists
      if (!fs.existsSync(imagePaths[0])) {
        throw new Error(`Image file not found at path: ${imagePaths[0]}`);
      }

      const images = await Promise.all(
        imagePaths.map((filePath) =>
          toFile(fs.createReadStream(filePath), 'image.png', {
            type: 'image/png',
          }),
        ),
      );

      const rsp = await this.openai.images.edit({
        model: 'dall-e-2', // or the model you're using
        image: images[0], // DALL-E usually supports only 1 image edit at a time
        prompt,
        n: 1,
        size: '1024x1024',
      });

      const image_base64 = rsp.data?.[0]?.b64_json ?? '';
      if (!image_base64) {
        throw new Error('No image data received from OpenAI');
      }
      
      return Buffer.from(image_base64, 'base64');
    } catch (error) {
      this.logger.error(`Error generating avatar: ${error.message}`, error.stack);
      throw error;
    }
  }
}

// import { Injectable } from '@nestjs/common';
// import * as fs from 'fs';
// import { OpenAI } from 'openai';
// import { toFile } from 'openai/uploads';

// @Injectable()
// export class OpenaiService {
//   private openai: OpenAI;

//   constructor() {
//     this.openai = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//   }

//   async generateAvatarFromImages(
//     imagePaths: string[],
//     prompt: string,
//   ): Promise<Buffer> {
//     const images = await Promise.all(
//       imagePaths.map((filePath) =>
//         toFile(fs.createReadStream(filePath), null, {
//           type: 'image/png',
//         }),
//       ),
//     );

//     const rsp = await this.openai.images.edit({
//       model: 'dall-e-2', // or the model you're using
//       image: images[0], // DALL-E usually supports only 1 image edit at a time
//       prompt,
//     });

//     const image_base64 = rsp.data?.[0]?.b64_json ?? '';
//     return Buffer.from(image_base64, 'base64');
//   }
// }
