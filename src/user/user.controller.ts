import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AwsService } from 'src/aws/aws.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestWithUser } from '../interfaces/interface';
import * as Multer from 'multer';
import { AvatarService } from 'src/avatar/avatar.service';
import * as fs from 'fs';
import { unlink } from 'fs/promises';
import { multerOptions } from 'src/aws/aws.multer.config';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly awsService: AwsService,
    private readonly AvatarService: AvatarService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.userService.findByIdForProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('profilePicture', multerOptions))
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Multer.File,
  ) {
    const userId = req.user.userId;
    const updateData: UpdateProfileDto = { ...updateProfileDto };

    try {
      if (file && updateData.onProfileChange === 'yes') {
        console.log("coming")
        try {
          console.log(file);
          const buffer: any = await this.AvatarService.getSignupAvatar(
            file.path,
          );
          const imageUrl = await this.awsService.uploadFile(buffer, file);
          updateData.profilePicture = imageUrl;
        } catch (error) {
          throw new BadRequestException(
            'Failed to upload image: ' + error.message,
          );
        }
      }

      return this.userService.updateProfile(userId, updateData);
    } catch (e) {
      throw new BadRequestException('Failed to upload image: ' + e.message);
    } finally {
      if (file?.path) {
        try {
          await unlink(file.path); // delete file from disk
        } catch (err) {
          console.error('Failed to delete file:', err.message);
        }
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllUsers() {
    const users = await this.userService.findAll();
    const filteredUsers = users
      .filter(user => user.profilePicture && user.profilePicture.trim() !== '')
      .map(user => ({
        id: user.userId,
        name: user.name,
        profilePicture: user.profilePicture
      }));
    return {
      success: true,
      data: filteredUsers
    };
  }
}
