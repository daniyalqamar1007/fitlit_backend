import { Controller, Post, Get, Body, Param, UseGuards, Req } from "@nestjs/common"
import type { RatingService } from "./rating.service"
import type { CreateRatingDto } from "./dto/create-rating.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { RequestWithUser } from "../interfaces/interface"

@Controller("ratings")
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createRating(@Body() createRatingDto: CreateRatingDto, @Req() req: RequestWithUser) {
    return this.ratingService.createRating({
      ...createRatingDto,
      userId: req.user.userId,
    })
  }

  @Get(':targetId')
  async getRatings(@Param('targetId') targetId: string) {
    return this.ratingService.getRatingsForTarget(targetId);
  }

  @Get(':targetId/average')
  async getAverageRating(@Param('targetId') targetId: string) {
    return this.ratingService.getAverageRating(targetId);
  }
}
