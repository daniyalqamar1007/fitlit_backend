import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class ContactService {
  constructor(
    private readonly userService: UserService,
    private readonly mailerService: NestMailerService,
  ) {}

  async sendContactEmail(userId: number, message: string ,phoneNo:string): Promise<void> {
    try {
        // const User = mongoose.model('User', userSchema);
      // Get user details

      console.log(userId);
      const user = await this.userService.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Prepare email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Contact Form Submission - FitLit App
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">User Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${user.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${user.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Phone:</td>
                <td style="padding: 8px 0; color: #333;">${phoneNo || 'Not provided'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
            <h3 style="color: #495057; margin-top: 0;">Message:</h3>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 8px; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">This email was sent from the FitLit app contact form.</p>
            <p style="margin: 5px 0 0 0;">Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;

      // Send email
      console.log("sendeing mail to user id ", userId);
      await this.mailerService.sendMail({
        to: 'daniyalqamar1007@gmail.com',
        subject: `Contact Form - FitLit App | ${user.name}`,
        html: emailContent,
      });
    } catch (error) {
      console.error('Error sending contact email:', error);
      throw new Error('Failed to send contact message');
    }
  }
}
