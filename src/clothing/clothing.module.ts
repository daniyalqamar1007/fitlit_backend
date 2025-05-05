import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClothingService } from './clothing.service';
import { ClothingController } from './clothing.controller';
import { Clothing, ClothingSchema } from './schemas/clothing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Clothing.name, schema: ClothingSchema },
    ]),
  ],
  controllers: [ClothingController],
  providers: [ClothingService],
  exports: [ClothingService],
})
export class ClothingModule {}
