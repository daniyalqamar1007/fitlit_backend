import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto } from './dto/create-rating.tdo';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/interfaces/interface';

@Controller('rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createRating(
    @Body() createRatingDto: CreateRatingDto,
    @Req() req: any,
  ) {
    try {
      const userId = req.user.userId;
    //   console.log('rating hit for user', userId);

      const rating = await this.ratingService.createRating(
        userId,
        createRatingDto,
      );

      return {
        success: true,
        message: 'Rating submitted successfully',
        // data: rating,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to submit rating',
      };
    }
  }

  @Get('my-ratings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUserRatings(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    // console.log('get rating hits');
    try {
    //   console.log('get rating hits');

      const userId = req.user.userId || req.user.id;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;

      const ratings = await this.ratingService.getUserRatings(
        userId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        ratings: ratings,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch ratings',
      };
    }
  }
}
