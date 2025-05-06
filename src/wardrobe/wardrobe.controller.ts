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
} from '@nestjs/common';
import { WardrobeService } from './wardrobe.service';
import { CreateWardrobeItemDto } from './dto/create-wardrobe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WardrobeItemCategory } from './schemas/wardrobe.schema';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('wardrobe-items')
export class WardrobeController {
  constructor(private readonly wardrobeService: WardrobeService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createWardrobeItemDto: CreateWardrobeItemDto,
  ) {
    const userId = req.user.userId;
    return this.wardrobeService.create(userId, createWardrobeItemDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('category') category?: WardrobeItemCategory,
    @Query('subCategory') subCategory?: string,
  ) {
    return this.wardrobeService.findAll(userId, category, subCategory);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wardrobeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.wardrobeService.remove(id, userId);
  }
}
