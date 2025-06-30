import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { ImageProcessingController } from "./image-processing.controller"
import { ImageProcessingService } from "./image-processing.service"
import { ProcessedImage, ProcessedImageSchema } from "./schemas/processed-image.schema"
import { ImageCache, ImageCacheSchema } from "./schemas/image-cache.schema"
import { AwsModule } from "../aws/aws.module"

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProcessedImage.name, schema: ProcessedImageSchema },
      { name: ImageCache.name, schema: ImageCacheSchema },
    ]),
    AwsModule,
  ],
  controllers: [ImageProcessingController],
  providers: [
    {
      provide: ImageProcessingService,
      useFactory: (processedImageModel, imageCacheModel, awsService) => {
        return new ImageProcessingService(processedImageModel, imageCacheModel, awsService)
      },
      inject: ["ProcessedImageModel", "ImageCacheModel", "AwsService"],
    },
    {
      provide: "ProcessedImageModel",
      useFactory: (connection) => connection.model("ProcessedImage"),
      inject: ["DatabaseConnection"],
    },
    {
      provide: "ImageCacheModel",
      useFactory: (connection) => connection.model("ImageCache"),
      inject: ["DatabaseConnection"],
    },
    {
      provide: "AwsService",
      useFactory: () => {
        const { AwsService } = require("../aws/aws.service")
        return new AwsService()
      },
    },
  ],
  exports: [ImageProcessingService],
})
export class ImageProcessingModule {}
