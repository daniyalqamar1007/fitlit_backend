import {
  Post,
  Controller,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpException,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, UploadedFileType } from 'src/aws/aws.multer.config'; // path to your multer config
import { AvatarService } from './avatar.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { RequestWithUser } from 'src/interfaces/interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @UseGuards(JwtAuthGuard)
  @Post('save-avatar')
  async saveavatar(@Body() Dto: CreateAvatarDto, @Req() req: RequestWithUser) {
    
    const userId = req.user.userId;
    
    return this.avatarService.saveavatar(Dto, userId);
  }

  @Get('check')
  async checkAvailability(@Query('date') date: string) {
    return this.avatarService.checkAvailability(date);
  }

  @Post('test')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async test(@UploadedFile() file: UploadedFileType) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    console.log(file.path);
    try {
      return this.avatarService.getSignupAvatar(file.path);
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Background removal failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
