import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AppMailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendOtpEmail(to: string, otp: string, userName?: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color:rgb(162, 199, 77);">Welcome to Fitlit!</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for joining Fitlit! We're excited to have you as part of our  community.</p>
        <p>With Fitlit, you can:</p>
        <ul>
          <li>Track your daily workouts</li>
          <li>Set fitness goals</li>
          <li>Connect with other fitness enthusiasts</li>
          <li>heres your otp ${otp}</li>

        </ul>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Happy fitness journey!</p>
        <p>The Fitlit Team</p>
      </div>
      `,
    });
  }


}
