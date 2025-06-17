import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BackgroundImage } from './schemas/background-image.schema';
import { CreateBackgroundImageDto } from './dto/create-background-image.dto';
import { AwsService } from 'src/aws/aws.service';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

class FileLike extends Blob {
  lastModified: number;
  name: string;
  constructor(buffer: Buffer, name: string, type: string) {
    super([buffer], { type });
    this.lastModified = Date.now();
    this.name = name;
  }
}

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
  size: number;
}

@Injectable()
export class BackgroundImagesService {
  private readonly logger = new Logger(BackgroundImagesService.name);
  private readonly openai: OpenAI;
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly TEMP_DIR = path.join(process.cwd(), 'temp');

  constructor(
    @InjectModel(BackgroundImage.name)
    private readonly backgroundImageModel: Model<BackgroundImage>,
    private readonly awsS3Service: AwsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
    });

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    }

    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'OPENAI_API_KEY is not set! OpenAI service will not work properly.',
      );
    }
  }

  private async optimizeAndSaveImage(buffer: Buffer): Promise<string> {
    try {
      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = metadata.width;
      let height = metadata.height;
      const maxDimension = 512; // Reduced from 1024 to 512

      if (width && height) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Generate unique filename
      const filename = `${uuidv4()}.jpg`;
      const outputPath = path.join(this.TEMP_DIR, filename);

      // Resize and save the image with more aggressive compression
      await sharp(buffer)
        .resize(width, height)
        .jpeg({ 
          quality: 80, // Reduced quality
          mozjpeg: true, // Use mozjpeg for better compression
          chromaSubsampling: '4:2:0' // More aggressive chroma subsampling
        })
        .toFile(outputPath);

      // Verify the file size
      const stats = fs.statSync(outputPath);
      if (stats.size > this.MAX_FILE_SIZE) {
        // If still too large, try even more aggressive compression
        await sharp(outputPath)
          .jpeg({ 
            quality: 40,
            mozjpeg: true,
            chromaSubsampling: '4:2:0'
          })
          .toFile(outputPath);
      }

      return outputPath;
    } catch (error) {
      this.logger.error('Error optimizing image:', error);
      throw new Error('Failed to process image');
    }
  }

  async createFromPrompt(userId: string, dto: CreateBackgroundImageDto) {
    try {
      if (!dto.prompt) {
        throw new Error('Prompt is required');
      }

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: dto.prompt,
        n: 1,
        size: '1024x1024',
      });

      if (response.data?.[0]?.url) {
        // Download the image
        const imageResponse = await fetch(response.data[0].url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Upload to S3
        const imageUrl = await this.awsS3Service.uploadFile(imageBuffer, userId);
        await this.backgroundImageModel.updateMany(
          { user_id: userId },
          { $set: { status: false } }
        );
        // Save to database
        const created = new this.backgroundImageModel({
          user_id: userId,
          image_url: imageUrl,
          status: true,
        });


        await created.save();


        return {
          success: true,
          image_url: imageUrl,
        };
      }

      return {
        success: false,
        message: 'Failed to generate image',
      };
    } catch (error) {
      this.logger.error('Error creating background image:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async createFromImage(userId: string, file: UploadedFile) {
    let tempFilePath: string | null = null;
    
    try {
      if (!file || (!file.buffer && !file.path)) {
        throw new Error('No file uploaded');
      }

      let imageBuffer: Buffer;

      if (file.buffer) {
        imageBuffer = file.buffer;
      } else if (file.path) {
        imageBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('Invalid file format');
      }

      // Check file size
      if (imageBuffer.length > this.MAX_FILE_SIZE * 4) {
        throw new Error('File size too large. Maximum size is 8MB');
      }

      // Optimize and save image to temp file
      tempFilePath = await this.optimizeAndSaveImage(imageBuffer);

      // Verify the optimized file size
      const stats = fs.statSync(tempFilePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new Error('Failed to optimize image to required size');
      }

      // Create a File-like object from the temp file
      const imageFile = new FileLike(
        fs.readFileSync(tempFilePath),
        path.basename(tempFilePath),
        'image/jpeg'
      );

      try {
        // Send image for editing with fixed prompt
        const response = await this.openai.images.edit({
          model: 'gpt-image-1',
          image: imageFile,
          size: '1024x1536', // Changed to match avatar service
          background: 'transparent',
          quality: 'low', // Changed to match avatar service
          prompt: `Transform this image into a 3D digital art with a professional background.
          Ensure clean lines, realistic proportions, soft shading, and expressive features.
          Maintain a balanced, stylized appearance suitable for virtual environments.
          Add a subtle, professional background that complements the subject. and also left some space infront of warobe pace image`,
        });

        if (response.data?.[0]?.b64_json) {
          const imageBuffer = Buffer.from(response.data[0].b64_json, 'base64');
          
          // Upload to S3
          const imageUrl = await this.awsS3Service.uploadFile(imageBuffer, userId);

          // Save to database
          // First update all existing background images for this user to false
          await this.backgroundImageModel.updateMany(
            { user_id: userId },
            { $set: { status: false } }
          );

          // Then create the new background image with status true
          const created = new this.backgroundImageModel({
            user_id: userId,
            image_url: imageUrl,
            status: true,
          });

          await created.save();

          return {
            success: true,
            image_url: imageUrl,
          };
        }
      } catch (openaiError) {
        this.logger.error('OpenAI API error:', openaiError);
        throw new Error('Failed to process image with AI. Please try again.');
      }

      return {
        success: false,
        message: 'Failed to process image',
      };
    } catch (error) {
      this.logger.error('Error processing background image:', error);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      // Clean up temporary files
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  async getAllUserBackgroundImages(userId: string) {
    try {
      // First verify if the user ID is valid
      if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Log the query parameters for debugging
      console.log('Searching for images with user ID:', userId);

      const images = await this.backgroundImageModel
        .find({ user_id: userId})
        .select('image_url status')
        .sort({ createdAt: -1 });

      // Log the query results for debugging
      console.log('Found images:', images);
      console.log('Number of images found:', images.length);
      return {
        success: true,
        images: images.map(img => ({
          id: img._id,
          image_url: img.image_url,
          status: img.status,
        })),
      };
    } catch (error) {
      this.logger.error('Error fetching background images:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async changeBackgroundStatus(userId: string, backgroundImageId: string) {
    try {
      console.log('Service received userId:', userId);
      console.log('Service received backgroundImageId:', backgroundImageId);

      // Convert userId to number since that's how it's stored in the database
      const userIdNum = parseInt(userId, 10);
      console.log('userIdNum', userIdNum);

      // Verify if the user ID and background image ID are valid
      if (!userIdNum || isNaN(userIdNum)) {
        throw new Error('Invalid user ID');
      }
      if (!backgroundImageId || !Types.ObjectId.isValid(backgroundImageId)) {
        throw new Error('Invalid background image ID');
      }

      // First check if the image exists and belongs to the user
      const existingImage = await this.backgroundImageModel.findOne({
        _id: new Types.ObjectId(backgroundImageId),
        user_id: userIdNum
      });
      console.log('existingImage', existingImage);

      if (!existingImage) {
        throw new Error('Background image not found or does not belong to user');
      }

      // Set all user's background images to false
      const updateManyResult = await this.backgroundImageModel.updateMany(
        { user_id: userIdNum },
        { $set: { status: false } }
      );
      console.log('Update many result:', updateManyResult);

      // Update the specific image to true
      const updatedImage = await this.backgroundImageModel.findByIdAndUpdate(
        new Types.ObjectId(backgroundImageId),
        { $set: { status: true } },
        { new: true }
      );
      console.log('Updated image:', updatedImage);

      if (!updatedImage) {
        throw new Error('Failed to update background image status');
      }

      // Verify the update
      const verifyImage = await this.backgroundImageModel.findById(backgroundImageId);
      console.log('Verification after update:', verifyImage);

      return {
        success: true,
        message: 'Background image status updated successfully',
        image: {
          id: updatedImage._id,
          image_url: updatedImage.image_url,
          status: updatedImage.status
        }
      };
    } catch (error) {
      this.logger.error('Error changing background image status:', error);
      throw error;
    }
  }
} 