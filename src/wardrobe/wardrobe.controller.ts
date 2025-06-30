import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import type { WardrobeService } from "./wardrobe.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { AwsService } from "../aws/aws.service"
import type * as Multer from "multer"
import type { RequestWithUser } from "src/interfaces/interface"
import { multerOptions } from "src/aws/aws.multer.config"

@Controller("wardrobe-items")
export class WardrobeController {
  constructor(
    private readonly wardrobeService: WardrobeService,
    private readonly awsS3Service: AwsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async create(req: RequestWithUser, @Body() createWardrobeItemDto: any, @UploadedFile() file: Multer.File) {
    if (!file) {
      throw new BadRequestException("Image file is required")
    }
    const userId = req.user.userId
    return this.wardrobeService.create(userId, createWardrobeItemDto, file)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(req: RequestWithUser, @Query('category') category?: string, @Query('subCategory') subCategory?: string) {
    const userId = req.user.userId
    return this.wardrobeService.findAll(userId, category, subCategory)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wardrobeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("swipe")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async swipe(req: RequestWithUser, @Body() dto: WardrobeItemSwipe, @UploadedFile() file: Multer.File) {
    return this.wardrobeService.swipe(req.user.userId, dto, file)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async remove(@Param('id') id: string, req: RequestWithUser) {
    const userId = req.user.userId
    const item = await this.wardrobeService.findOne(id)

    // Delete from S3 first
    if (item.image_url) {
      await this.awsS3Service.deleteFile(item.image_url)
    }

    // Then remove from database
    return this.wardrobeService.remove(id, userId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete("swipe/reset")
  async resetSwipe(req: RequestWithUser) {
    const userId = req.user?.userId
    this.wardrobeService.clearSwipeState(userId)
    return { message: "Swipe history cleared." }
  }

  @UseGuards(JwtAuthGuard)
  @Get("swipe/next/:category")
  async getNextSwipeItem(@Param('category') category: string, req: RequestWithUser) {
    const userId = req.user.userId
    return this.wardrobeService.getNextSwipeItem(userId, category)
  }

  @UseGuards(JwtAuthGuard)
  @Get("swipe/state")
  async getSwipeState(req: RequestWithUser) {
    const userId = req.user.userId
    return this.wardrobeService.getSwipeState(userId)
  }
}

export interface WardrobeItemSwipe {
  swipeCategory: string
  swipeAngle: string
  category: string
  direction: "left" | "right"
  itemId: string
}
