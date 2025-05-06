import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { MailerModule } from './mailer/mailer.module';
import { ClothingModule } from './clothing/wardrobe.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? ''),
    AuthModule,
    UserModule,
    MailerModule,
    ClothingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
