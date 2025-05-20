import { AvatarService } from 'src/avatar/avatar.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { WardrobeService } from './wardrobe.service';
import { CreateWardrobeItemDto } from './dto/create-wardrobe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WardrobeItemCategory } from './schemas/wardrobe.schema';
import { AwsService } from '../aws/aws.service';
import * as Multer from 'multer';
import { RequestWithUser } from 'src/interfaces/interface';


@Controller('wardrobe-items')
export class WardrobeController {
  constructor(
    private readonly wardrobeService: WardrobeService,
    private readonly awsS3Service: AwsService,
    // private readonly avatarService: AvatarService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Req() req: RequestWithUser,
    @Body() createWardrobeItemDto: CreateWardrobeItemDto,
    @UploadedFile() file: Multer.File,
    @UploadedFile() avatarfile: Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const userId = req.user.userId;

    // const buffer: any = await this.avatarService.test(file.path);
    // const bufferavatar: any = await this.avatarService.test(avatarfile.path);

    // Upload file to AWS S3
    const imageUrl = await this.awsS3Service.uploadFileDress(file, userId);

    // Add image URL to the DTO
    const wardrobeItemData = {
      ...createWardrobeItemDto,
      image_url: imageUrl,
    };

    return this.wardrobeService.create(userId, wardrobeItemData);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Query('category') category?: string,
    @Query('subCategory') subCategory?: string,
  ) {
    const userId = req.user.userId;
    return this.wardrobeService.findAll(userId, category, subCategory);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wardrobeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    const item = await this.wardrobeService.findOne(id);

    // Delete from S3 first
    if (item.image_url) {
      await this.awsS3Service.deleteFile(item.image_url);
    }

    // Then remove from database
    return this.wardrobeService.remove(id, userId);
  }
}
