import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { MailerModule } from './mailer/mailer.module';
import { WardrobeModule } from './wardrobe/wardrobe.module';
import { AwsModule } from './aws/aws.module';
import { AvatarModule } from './avatar/avatar.module';
import { AdminModule } from './admin/admin.module';
import { ContactModule } from './contact/contact.module';
import { RatingModule } from './rating/rating.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? ''),
    AuthModule,
    UserModule,
    MailerModule,
    WardrobeModule,
    AwsModule,
    AvatarModule,
    AdminModule,
    ContactModule,
    RatingModule,
  ],
  controllers: [AppController],
  providers: [AppService],

})

export class AppModule {}
