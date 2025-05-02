import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './schemas/otp.schema/otp.schema';

@Injectable()
export class OtpService {
  constructor(@InjectModel(Otp.name) private otpModel: Model<Otp>) {}

  async saveOtp(email: string, otp: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await this.otpModel.create({ email, otp, expiresAt });
    console.log(otp);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = await this.otpModel.findOne({ email, otp });
    console.log(otp, email, record);
    if (!record) return false;

    if (record.expiresAt < new Date()) return false;
    await this.otpModel.deleteOne({ _id: record._id }); // cleanup
    return true;
  }
}
