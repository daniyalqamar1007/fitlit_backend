import { Module, forwardRef } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { WardrobeController } from "./wardrobe.controller"
import { WardrobeService } from "./wardrobe.service"
import { WardrobeItem, WardrobeItemSchema } from "./schemas/wardrobe.schema"
import { AvatarModule } from "../avatar/avatar.module"
import { AwsModule } from "../aws/aws.module"
import { ImageProcessingModule } from "../image-processing/image-processing.module"

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WardrobeItem.name, schema: WardrobeItemSchema }]),
    forwardRef(() => AvatarModule),
    AwsModule,
    ImageProcessingModule,
  ],
  controllers: [WardrobeController],
  providers: [WardrobeService],
  exports: [WardrobeService, MongooseModule],
})
export class WardrobeModule {}
