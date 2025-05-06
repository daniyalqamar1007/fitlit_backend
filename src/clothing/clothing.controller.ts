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
import { ClothingService } from './clothing.service';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClothingCategory } from './schemas/clothing.schema';
import { Request } from 'express';


interface RequestWithUser extends Request {
  user: {
    userId: string;
    
  };
}

@Controller('clothing-items')
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createClothingDto: CreateClothingDto,
  ) {
    const userId = req.user.userId;
    return this.clothingService.create(userId, createClothingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('category') category?: ClothingCategory,
    @Query('subCategory') subCategory?: string,
  ) {
    return this.clothingService.findAll(userId, category, subCategory);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clothingService.findOne(id);
  }



  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.clothingService.remove(id, userId);
  }
}
