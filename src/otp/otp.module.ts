import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from './schemas/otp.schema/otp.schema';
import { OtpService } from './otp.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }])],
  providers: [OtpService],
  exports: [OtpService], // Make it available to AuthModule
})
export class OtpModule {}