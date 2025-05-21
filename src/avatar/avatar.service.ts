/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { Model } from 'mongoose';
import { Avatar, AvatarDocument } from './schemas/avatar.schema';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as sharp from 'sharp';

type InputType = 'Path' | 'Buffer';

@Injectable()
export class AvatarService {
  private readonly apiKey = 'vur1J4WkuezAiJUJJB78bs8R'; // Your Remove.bg API Key

  @InjectModel(Avatar.name) private avatarModel: Model<AvatarDocument>;
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
  async saveavatar(dto: CreateAvatarDto, userId: string) {
    try {
      const created = new this.avatarModel({ ...dto, user_id: userId });
      await created.save();
      return {
        success: true,
        message: 'Avatar saved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to save avatar: ${error.message}`);
    }
  }

  async checkAvailability(date: string) {
    const avatar = await this.avatarModel.findOne({ date });

    if (avatar) {
      return {
        success: true,
        avatarUrl: avatar.avatarUrl,
        index: avatar.index || '1',
      };
    } else {
      return {
        success: false,
        message: 'Not saved yet',
        index: 1,
      };
    }
  }

  async removeBackground(
    input: string | Buffer,
    type: InputType,
  ): Promise<Buffer> {
    let base64Image: string;

    if (type === 'Path') {
      base64Image = fs.readFileSync(input as string, { encoding: 'base64' });
    } else if (type === 'Buffer') {
      base64Image = (input as Buffer).toString('base64');
    } else {
      throw new Error(`Unsupported input type: ${type}`);
    }

    const body = {
      image_file_b64: base64Image,
      size: 'auto',
    };

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Remove.bg API failed: ${response.status} - ${errorText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async convertToPng(filePath: string) {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const isPng = ext === '.png';

    if (isPng) {
      console.log('File is already a PNG.');
      return filePath;
    }

    console.log('File is not a PNG.');

    // Remove all known image extensions (repeated or nested)
    const baseName = path
      .basename(filePath)
      .replace(/\.(png|jpe?g|webp|bmp|gif|tiff?)+$/i, '');

    const outputPath = path.join(dir, `${baseName}.png`);

    try {
      await sharp(filePath).png().toFile(outputPath);

      console.log(`Converted to PNG: ${outputPath}`);

      fs.unlinkSync(filePath);
      console.log(`Deleted original file: ${filePath}`);
      return outputPath;
    } catch (err) {
      console.error('Conversion failed:', err);
    }
  }

  async getSignupAvatar(filePath: string, prompt?: string) {
    try {
      // const newPath = await this.convertToPng(filePath);
      // if (!newPath) {
      //   throw new Error('Failed to convert image to PNG.');
      // }
      // return true;

      // Read the file as a buffer
      const imageBuffer = fs.readFileSync(filePath);
      // Create a File-like object
      const fileName = filePath.split('/').pop() ?? 'image.png';
      const imageFile = new FileLike(imageBuffer, fileName, 'image/png');
      // Send the image to OpenAI for editing
      const rsp = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        size: '1024x1536',
        background: 'transparent',
        quality: 'low',
        prompt:
          prompt ||
          `Transform this person into a full-body 3D digital avatar.
Ensure clean lines, realistic proportions, soft shading, and expressive yet simple features.
Maintain a balanced, stylized appearance suitable for virtual environments.
Remove the background completely to make it transparent.
Output the image in PNG format with a transparent background.`,
      });
      if (rsp.data) {
        const image_base64: any = rsp.data[0].b64_json;
        return Buffer.from(image_base64, 'base64');
      }

      console.log('Image generated successfully');
      return true;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('Error during image processing:', error.message);
      return false;
    }
  }

  generateAvatarPrompt(category?: string): string {
    const clothingMap: Record<string, string> = {
      tshirt: 'a modern, fitted t-shirt with clean design and subtle detail',
      pant: 'well-fitted casual pants in a neutral tone with realistic folds',
      shoe: 'stylish, casual shoes with a modern silhouette and soft shadows',
    };

    const clothingDescription =
      clothingMap[category!.toLowerCase()] || 'casual clothing';

    return `Transform this person into a full-body 3D digital avatar wearing ${clothingDescription}. 
Ensure clean lines, realistic proportions, soft shading, and expressive but simple features. 
Maintain a balanced, stylized appearance suitable for virtual environments.`;
  }

  async getUpdated3DAvatar(source: string, category: string, prompt?: string) {
    try {
      let imageBuffer: Buffer;
      let fileName = 'image.png';

      if (source.startsWith('http')) {
        // Download the image from the URL
        const response: any = await axios.get(source, {
          responseType: 'arraybuffer',
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        imageBuffer = Buffer.from(response.data, 'binary');

        // Try extracting the filename from the URL
        const urlParts = source.split('/');
        fileName = urlParts[urlParts.length - 1] || 'image.png';
      } else {
        // Load image from local file path
        imageBuffer = fs.readFileSync(source);
        fileName = source.split('/').pop() ?? 'image.png';
      }

      // Create a File-like object
      const imageFile = new FileLike(imageBuffer, fileName, 'image/png');

      // Send image for editing
      const rsp = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        background: 'transparent',
        size: '1024x1536',
        quality: 'low',
        prompt: prompt || this.generateAvatarPrompt(category),
      });

      if (rsp.data && rsp.data[0].b64_json) {
        const image_base64: string = rsp.data[0].b64_json;
        return Buffer.from(image_base64, 'base64');
      }

      console.log('Image processed successfully');
      return true;
    } catch (error: any) {
      console.error('Error during image processing:', error.message);
      return false;
    }
  }

  async generateUpdatedAvatar(
    source1: string,
    source2: string,
    category: string,
  ) {
    try {
      // Download and read the original image
      const resp: any = await axios.get(source1, {
        responseType: 'arraybuffer',
      });
      const imageBuffer1 = Buffer.from(resp.data, 'binary');
      const fileName1 = source1.split('/').pop() || 'image.png';

      // Get the dimensions of the original image
      const imageMetadata = await sharp(imageBuffer1).metadata();
      const width = imageMetadata.width;
      const height = imageMetadata.height;

      // Process the mask to match the original image's size and ensure it has alpha
      const processedMaskBuffer = await sharp(source2)
        .resize(width, height) // resize to match
        .ensureAlpha() // ensure alpha channel
        .toBuffer();
      const fileName2 = source2.split('/').pop() || 'mask.png';

      // Create FileLike objects for OpenAI API
      const imageFile1 = new FileLike(imageBuffer1, fileName1, 'image/png');
      const imageFile2 = new FileLike(
        processedMaskBuffer,
        fileName2,
        'image/png',
      );

      // Send images for editing
      const response = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile1,
        mask: imageFile2,
        size: '1024x1536', // optional: may be inferred or adjusted
        background: 'transparent',
        quality: 'low',
        // prompt: `Create a new full body avatar identical to the original image, keeping the outfit the same, but replace only the t-shirt using the mask image provided. Use the masked t-shirt design in place of the current one, and maintain the avatar's original style and appearance.`,
        prompt: `Transform this person into a full-body 3D digital avatar.
Ensure clean lines, realistic proportions, soft shading, and expressive yet simple features.
Maintain a balanced, stylized appearance suitable for virtual environments.
Remove the background completely to make it transparent.
Output the image in PNG format with a transparent background. 
important Note: i atached tshirt design in mask put that tshirt on the avatar`,
      });

      if (response.data?.[0]?.b64_json) {
        return Buffer.from(response.data[0].b64_json, 'base64');
      }

      return false;
    } catch (error) {
      console.error('Error generating updated avatar:', error.message);
      return false;
    }
  }

  // async generateUpdatedAvatar(source1: string, source2: string, category: string) {
  //   try {
  //     // Download the original image
  //     const resp: any = await axios.get(source1, { responseType: 'arraybuffer' });
  //     const imageBuffer1 = Buffer.from(resp.data, 'binary');
  //     const fileName1 = source1.split('/').pop() || 'image.png';

  //     // Process the mask image to ensure it has an alpha channel
  //     const processedMaskBuffer = await sharp(source2)
  //       .ensureAlpha() // Adds an alpha channel if missing
  //       .toBuffer();
  //     const fileName2 = source2.split('/').pop() || 'mask.png';

  //     // Create FileLike objects for OpenAI API
  //     const imageFile1 = new FileLike(imageBuffer1, fileName1, 'image/png');
  //     const imageFile2 = new FileLike(processedMaskBuffer, fileName2, 'image/png');

  //     // Send images for editing
  //     const response = await this.openai.images.edit({
  //       model: 'gpt-image-1',
  //       image: imageFile1,
  //       mask: imageFile2,
  //       size: '1024x1536',
  //       background: 'transparent',
  //       prompt: `Create a new avatar identical to the original, but replace the ${category} with the provided image.`,
  //     });

  //     if (response.data?.[0]?.b64_json) {
  //       return Buffer.from(response.data[0].b64_json, 'base64');
  //     }

  //     return false;
  //   } catch (error) {
  //     console.error('Error generating updated avatar:', error.message);
  //     return false;
  //   }
  // }
}

// FileLike class moved outside of AvatarService
class FileLike extends Blob {
  lastModified: number;
  name: string;
  constructor(buffer: Buffer, name: string, type: string) {
    super([buffer], { type });
    this.lastModified = Date.now();
    this.name = name;
  }
}
