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

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly awsService: AwsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.userService.findByIdForProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('profilePicture'))
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Multer.File,
  ) {
    const userId = req.user.userId;
    const updateData: UpdateProfileDto = { ...updateProfileDto };

    // If a file was uploaded, process it
    if (file) {
      try {
        // Upload to AWS S3
        const imageUrl = await this.awsService.uploadFile(file, userId);
        updateData.profilePicture = imageUrl;
      } catch (error) {
        throw new BadRequestException(
          'Failed to upload image: ' + error.message,
        );
      }
    }
    return this.userService.updateProfile(userId, updateData);
  }
}
