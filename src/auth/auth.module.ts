// auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailerModule } from '../mailer/mailer.module'; 
import { AwsService } from 'src/aws/aws.service';
import { AvatarService } from 'src/avatar/avatar.service';
import { AvatarModule } from 'src/avatar/avatar.module';

@Module({
  imports: [
    AvatarModule,
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
      signOptions: {
        expiresIn: '7d',
      },
    }),
    MailerModule,
  ],
  providers: [AuthService, JwtStrategy, AwsService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
