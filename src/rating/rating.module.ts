import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { RatingController } from "./rating.controller"
import { RatingService } from "./rating.service"
import { Rating, RatingSchema } from "./schemas/rating.schema"

@Module({
  imports: [MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }])],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
