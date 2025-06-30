import { Module, forwardRef } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { AvatarController } from "./avatar.controller"
import { AvatarService } from "./avatar.service"
import { Avatar, AvatarSchema } from "./schemas/avatar.schema"
import { WardrobeModule } from "../wardrobe/wardrobe.module"
import { AwsModule } from "../aws/aws.module"
import { NotificationModule } from "../notifications/notification.module"
import { ImageProcessingModule } from "../image-processing/image-processing.module"

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Avatar.name, schema: AvatarSchema }]),
    forwardRef(() => WardrobeModule),
    AwsModule,
    NotificationModule,
    ImageProcessingModule,
  ],
  controllers: [AvatarController],
  providers: [
    {
      provide: AvatarService,
      useFactory: (avatarModel, wardrobeModel, awsService, notificationService, imageProcessingService) => {
        return new AvatarService(avatarModel, wardrobeModel, awsService, notificationService, imageProcessingService)
      },
      inject: ["AvatarModel", "WardrobeItemModel", "AwsService", "NotificationService", "ImageProcessingService"],
    },
    {
      provide: "AvatarModel",
      useFactory: (connection) => connection.model("Avatar"),
      inject: ["DatabaseConnection"],
    },
    {
      provide: "WardrobeItemModel",
      useFactory: (connection) => connection.model("WardrobeItem"),
      inject: ["DatabaseConnection"],
    },
    {
      provide: "AwsService",
      useFactory: () => {
        const { AwsService } = require("../aws/aws.service")
        return new AwsService()
      },
    },
    {
      provide: "NotificationService",
      useFactory: () => {
        const { NotificationService } = require("../notifications/notification.service")
        return new NotificationService()
      },
    },
    {
      provide: "ImageProcessingService",
      useFactory: () => {
        const { ImageProcessingService } = require("../image-processing/image-processing.service")
        return new ImageProcessingService()
      },
    },
  ],
  exports: [AvatarService, MongooseModule],
})
export class AvatarModule {}
