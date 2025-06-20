import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
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
    const profile = await this.userService.findByIdForProfile(userId);
    const followCounts = await this.userService.getFollowCounts(Number(userId));
    return {
      ...profile,
      ...followCounts
    };
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
  async getAllUsers(@Req() req: RequestWithUser) {
    const currentUserId = req.user.userId;
    const users = await this.userService.findAll();
    const filteredUsers = await Promise.all(
      users
        .filter(user => user.profilePicture && user.profilePicture.trim() !== '')
        .map(async user => {
          const followCounts = await this.userService.getFollowCounts(Number(user.userId));
          const isFollowing = await this.userService.isFollowing(Number(currentUserId), Number(user.userId));
          const avatarsWithDateResult = await this.AvatarService.getAvatarsByDate(String(user.userId));
          const avatars = Array.isArray(avatarsWithDateResult.data)
            ? avatarsWithDateResult.data.map(a => a.avatarUrl)
            : [];
          return {
            id: user.userId,
            name: user.name,
            profilePicture: user.profilePicture,
            gender: user.gender,
            email: user.email,
            following: followCounts.following,
            followers: followCounts.followers,
            isFollowing,
            avatars
          };
        })
    );
    return {
      success: true,
      data: filteredUsers
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow-action')
  async followAction(@Req() req, @Body() body: { userId: number; action: 'follow' | 'unfollow' }) {
    const currentUserId = req.user.userId;
    const { userId, action } = body;
    if (!userId || !action) {
      throw new BadRequestException('userId and action are required');
    }
    if (!['follow', 'unfollow'].includes(action)) {
      throw new BadRequestException('action must be follow or unfollow');
    }
    return this.userService.followOrUnfollow(currentUserId, userId, action);
  }

  @UseGuards(JwtAuthGuard)
  @Get('follow-counts/:userId')
  async getFollowCounts(@Param('userId') userId: string) {
    const id = Number(userId);
    if (isNaN(id)) throw new BadRequestException('Invalid userId');
    return this.userService.getFollowCounts(id);
  }
}
