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
import { Wardrobeservice } from './wardrobe.service';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClothingCategory } from './schemas/wardrobe.schema';
import { Request } from 'express';


interface RequestWithUser extends Request {
  user: {
    userId: string;
    
  };
}

@Controller('wardrobe-items')
export class WardrobeController {
  constructor(private readonly wardrobeservice: Wardrobeservice) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createClothingDto: CreateClothingDto,
  ) {
    const userId = req.user.userId;
    return this.wardrobeservice.create(userId, createClothingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('category') category?: ClothingCategory,
    @Query('subCategory') subCategory?: string,
  ) {
    return this.wardrobeservice.findAll(userId, category, subCategory);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wardrobeservice.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.wardrobeservice.remove(id, userId);
  }
} 
