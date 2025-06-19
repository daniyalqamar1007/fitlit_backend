import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BackgroundImagesService } from './background-images.service';
import { CreateBackgroundImageDto } from './dto/create-background-image.dto';
import { ChangeBackgroundStatusDto } from './dto/change-background-status.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

@Controller('background-images')
@UseGuards(JwtAuthGuard)
export class BackgroundImagesController {
  constructor(private readonly backgroundImagesService: BackgroundImagesService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('image'))
  async generateBackground(
    @Request() req,
    @Body() dto: CreateBackgroundImageDto,
    @UploadedFile() file?: UploadedFile,
  ) {
    console.log("User ID:", req.user.userId);
    console.log("Prompt:", dto.prompt);
    console.log("File:", file);

    // Check if at least one of prompt or file is provided
    if (!dto.prompt && !file) {
      throw new BadRequestException('Either prompt or image file is required');
    }

    // If both are provided, prioritize file over prompt
    if (file) {
      return this.backgroundImagesService.createFromImage(req.user.userId, file);
    } else {
      return this.backgroundImagesService.createFromPrompt(req.user.userId, dto);
    }
  }

  @Post('generate-from-prompt')
  async createFromPrompt(
    @Request() req,
    @Body() dto: CreateBackgroundImageDto,
  ) {
    console.log("users")
    console.log(dto.prompt)

    if (!dto.prompt) {
      throw new BadRequestException('Prompt is required');
    }
    return this.backgroundImagesService.createFromPrompt(req.user.userId, dto);
  }

  @Post('generate-from-image')
  @UseInterceptors(FileInterceptor('image'))
  async createFromImage(
    @Request() req,
    @UploadedFile() file: UploadedFile,
  ) {
    console.log(file)
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.backgroundImagesService.createFromImage(req.user.userId, file);
  }

  @Get()
  async getAllUserBackgroundImages(@Request() req) {
    return this.backgroundImagesService.getAllUserBackgroundImages(req.user.userId);
  }

  @Post('change-status')
  async changeBackgroundStatus(
    @Request() req,
    @Body() dto: ChangeBackgroundStatusDto,
  ) {
    console.log('User ID from token:', req.user.userId);
    console.log('Received background_image_id:', dto.background_image_id);
    console.log('Request body:', dto);
    
    if (!dto.background_image_id || dto.background_image_id.trim() === '') {
      throw new BadRequestException('Background image ID is required');
    }

    if (!req.user || !req.user.userId) {
      throw new BadRequestException('User ID not found in token');
    }

    try {
      const result = await this.backgroundImagesService.changeBackgroundStatus(
        req.user.userId,
        dto.background_image_id,
      );
      console.log('Service response:', result);
      return result;
    } catch (error) {
      console.error('Error in changeBackgroundStatus:', error);
      throw new BadRequestException(error.message || 'Failed to change background status');
    }
  }
} 