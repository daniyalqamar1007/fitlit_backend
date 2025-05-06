import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wardrobeservice } from './wardrobe.service';
import { WardrobeController } from './wardrobe.controller';
import { Clothing, ClothingSchema } from './schemas/wardrobe.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Clothing.name, schema: ClothingSchema },
    ]),
  ],
  controllers: [WardrobeController],
  providers: [Wardrobeservice],
  exports: [Wardrobeservice],
})
export class ClothingModule {}
