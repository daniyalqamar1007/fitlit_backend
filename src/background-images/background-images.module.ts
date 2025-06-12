import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackgroundImagesController } from './background-images.controller';
import { BackgroundImagesService } from './background-images.service';
import { BackgroundImage, BackgroundImageSchema } from './schemas/background-image.schema';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BackgroundImage.name, schema: BackgroundImageSchema },
    ]),
    AwsModule,
  ],
  controllers: [BackgroundImagesController],
  providers: [BackgroundImagesService],
  exports: [BackgroundImagesService],
})
export class BackgroundImagesModule {} 