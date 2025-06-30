import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { ConfigModule } from "@nestjs/config"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { AuthModule } from "./auth/auth.module"
import { UserModule } from "./user/user.module"
import { AvatarModule } from "./avatar/avatar.module"
import { WardrobeModule } from "./wardrobe/wardrobe.module"
import { AwsModule } from "./aws/aws.module"
import { BackgroundImagesModule } from "./background-images/background-images.module"
import { ImageProcessingModule } from "./image-processing/image-processing.module"
import { NotificationModule } from "./notifications/notification.module"
import { RatingModule } from "./rating/rating.module"
import { ContactModule } from "./contact/contact.module"
import { AdminModule } from "./admin/admin.module"
import { AppSettingsModule } from "./app-settings/app-settings.module"
import { MailerModule } from "./mailer/mailer.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || "mongodb://localhost:27017/fitlit"),
    AuthModule,
    UserModule,
    AvatarModule,
    WardrobeModule,
    AwsModule,
    BackgroundImagesModule,
    ImageProcessingModule,
    NotificationModule,
    RatingModule,
    ContactModule,
    AdminModule,
    AppSettingsModule,
    MailerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
