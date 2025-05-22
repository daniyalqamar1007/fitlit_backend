import { forwardRef, Module } from '@nestjs/common';
import { AvatarController } from './avatar.controller';
import { AvatarService } from './avatar.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Avatar, AvatarSchema } from './schemas/avatar.schema';
import { WardrobeModule } from 'src/wardrobe/wardrobe.module';
import { AwsModule } from 'src/aws/aws.module';
import {
  WardrobeItem,
  WardrobeItemSchema,
} from 'src/wardrobe/schemas/wardrobe.schema';

@Module({
  imports: [
    forwardRef(() => WardrobeModule),
    AwsModule,
    MongooseModule.forFeature([
      { name: Avatar.name, schema: AvatarSchema },
      { name: WardrobeItem.name, schema: WardrobeItemSchema },
    ]),
  ],
  controllers: [AvatarController],
  providers: [AvatarService],
  exports: [AvatarService],
})
export class AvatarModule {}
