// auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OtpModule } from 'src/otp/otp.module';
import { MailerModule } from '../mailer/mailer.module'; // ✅ your local module, not @nestjs-modules/mailer

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
      signOptions: {
        expiresIn: '7d',
      },
    }),
    OtpModule,
    MailerModule, 
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}


// import { Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { UserModule } from '../user/user.module';
// import { PassportModule } from '@nestjs/passport';
// import { JwtModule } from '@nestjs/jwt';
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { OtpModule } from 'src/otp/otp.module';
// import { MailerModule } from '@nestjs-modules/mailer';

// @Module({
//   imports: [
//     UserModule,
//     PassportModule,
//     JwtModule.register({
//       secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
//       signOptions: {
//         expiresIn: '7d',
//       },
//     }),
//     OtpModule,
//     MailerModule
//   ],
//   providers: [AuthService, JwtStrategy],
//   controllers: [AuthController],
//   exports: [AuthService],
// })
// export class AuthModule {}
