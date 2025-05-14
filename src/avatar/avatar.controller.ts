
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, UploadedFileType } from 'src/aws/aws.multer.config'; // path to your multer config
import { AvatarService } from './avatar.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';


@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post('save-avatar')
  async saveavatar(@Body() Dto: CreateAvatarDto) {
    return this.avatarService.saveavatar(Dto);
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
      return this.avatarService.test(file.path);
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Background removal failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
