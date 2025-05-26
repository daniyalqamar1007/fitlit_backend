import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Rating, RatingSchema } from './schemas/rating.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]),
    RatingModule,
    UserModule
  ],
  controllers: [RatingController],
  providers: [RatingService,],
  exports: [RatingService],
})
export class RatingModule {}
