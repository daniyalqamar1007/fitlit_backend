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
  UseGuards,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { multerOptions, type UploadedFileType } from "src/aws/aws.multer.config"
import type { AvatarService } from "./avatar.service"
import type { CreateAvatarDto } from "./dto/create-avatar.dto"
import type { RequestWithUser } from "src/interfaces/interface"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"

@Controller("avatar")
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @UseGuards(JwtAuthGuard)
  @Post("save-avatar")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async saveavatar(@Body() Dto: CreateAvatarDto, @UploadedFile() stackimage?: any, req: RequestWithUser) {
    const userId = req.user.userId
    return this.avatarService.saveavatar(Dto, userId, stackimage)
  }

  @Get("check")
  async checkAvailability(@Query('date') date: string, @Query('id') id: string) {
    return this.avatarService.checkAvailability(id, date)
  }

  @UseGuards(JwtAuthGuard)
  @Get("all-by-date")
  async getAllByDate(req: RequestWithUser) {
    try {
      const userId = req.user.userId
      return await this.avatarService.getAvatarsByDate(userId)
    } catch (error) {
      console.error(error)
      throw new HttpException("Failed to fetch avatars by date", HttpStatus.INTERNAL_SERVER_ERROR)
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

  @UseGuards(JwtAuthGuard)
  @Post("swipe-outfit")
  async swipe(dto: any, req: RequestWithUser) {
    try {
      return await this.avatarService.swipe(dto, req.user.userId)
    } catch (error) {
      console.error(error)
      throw new HttpException("Swipe operation failed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("user-avatars")
  async getUserAvatars(req: RequestWithUser) {
    try {
      const userId = req.user.userId
      return await this.avatarService.getAllUserAvatars(userId)
    } catch (error) {
      console.error(error)
      throw new HttpException("Failed to fetch user avatars", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("outfit")
  async outfit(
    @Body() dto: { 
      shirt_id: string; 
      accessories_id: string; 
      pant_id: string; 
      shoe_id: string; 
      profile_picture: string 
    },
    req: RequestWithUser,
  ) {
    try {
      console.log("Outfit generation request received")
      return this.avatarService.outfit(dto, req.user?.userId)
    } catch (error) {
      console.error(error)
      throw new HttpException("Outfit generation failed", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("swipe-state")
  async getSwipeState(req: RequestWithUser) {
    try {
      const userId = req.user.userId
      return await this.avatarService.getSwipeState(userId)
    } catch (error) {
      console.error(error)
      throw new HttpException("Failed to get swipe state", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("swipe-reset")
  async resetSwipe(req: RequestWithUser) {
    try {
      const userId = req.user.userId
      return await this.avatarService.resetSwipeState(userId)
    } catch (error) {
      console.error(error)
      throw new HttpException("Failed to reset swipe state", HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
