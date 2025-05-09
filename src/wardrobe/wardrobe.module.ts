import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WardrobeService } from './wardrobe.service';
import { WardrobeController } from './wardrobe.controller';
import { WardrobeItem, WardrobeItemSchema } from './schemas/wardrobe.schema';
import { AwsService } from '../aws/aws.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forFeature([
      { name: WardrobeItem.name, schema: WardrobeItemSchema },
    ]),
  ],
  controllers: [WardrobeController],
  providers: [WardrobeService, AwsService],
  exports: [WardrobeService],
})
export class WardrobeModule {}
