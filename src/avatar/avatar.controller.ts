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
    console.log("Raw request body:", req.body); // ✅ Log the raw body
  console.log("DTO received:", Dto); // ✅ Log the DTO
  console.log("Type of accessories_id:", typeof Dto.accessories_id); // ✅ Check type
  console.log(Dto.backgroundimageurl)
    console.log("coming")
    const userId = req.user.userId;
    return this.avatarService.saveavatar(Dto, userId);
  }

  @Get('check')
  async checkAvailability(@Query('date') date: string,@Query('id') id: string) {
    return this.avatarService.checkAvailability(id,date);
  }
@UseGuards(JwtAuthGuard)
@Get('all-by-date')
async getAllByDate(@Req() req: RequestWithUser) {
  try {
    const userId = req.user.userId;
    return await this.avatarService.getAvatarsByDate(userId);
  } catch (error) {
    console.error(error);
    throw new HttpException(
      'Failed to fetch avatars by date',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
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

  // @UseGuards(JwtAuthGuard)
  // @Post('swipe-outfit')
  // async swipe(@Body() dto: any, @Req() req: RequestWithUser) {
  //   return await this.avatarService.swipe(dto, req.user.userId);
  // }
@UseGuards(JwtAuthGuard)
@Get('user-avatars')
async getUserAvatars(@Req() req: RequestWithUser) {
  try {
    const userId = req.user.userId;
    return await this.avatarService.getAllUserAvatars(userId);
  } catch (error) {
    console.error(error);
    throw new HttpException(
      'Failed to fetch user avatars',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
  @UseGuards(JwtAuthGuard)
  @Post('outfit')
  async outfit(
    @Body()
    dto: { shirt_id: string; accessories_id:string;pant_id: string; shoe_id: string;profile_picture:string },
    @Req() req: RequestWithUser,
  ) {
    try {
      console.log("coming")
      // console.log(accessories_id)y
      return this.avatarService.outfit(dto, req.user?.userId);
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Background removal failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
