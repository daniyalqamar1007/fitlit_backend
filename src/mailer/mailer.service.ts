import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AppMailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendOtpEmail(to: string, otp: string) {
    console.log("mail is generated and send to ",to);

    await this.mailerService.sendMail({
      to,
      subject: 'Your OTP Code',
      html: `
        <p>Hello,</p>
        <p>Your OTP is: <b>${otp}</b></p>
        <p>This code will expire in 5 minutes.</p>
      `,
    });
    
  }
  // async sendTokenEmail(to: string, token: string) {
  //   await this.mailerService.sendMail({
  //     to,
  //     subject: 'Your Access Token',
  //     html: `
  //       <p>Hello,</p>
  //       <p>Your access token is:</p>
  //       <pre style="background:#eee;padding:10px;">${token}</pre>
  //       <p>Please use it to complete your login.</p>
  //     `,
  //   });
  // }
}




// import { Injectable } from '@nestjs/common';
// import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

// @Injectable()
// export class AppMailerService {
//   constructor(private readonly mailerService: NestMailerService) {}

//   async sendOtpEmail(to: string, otp: string) {
//     await this.mailerService.sendMail({
//       to,
//       subject: 'Your OTP Code',
//       template: 'otp',
//       context: { otp },
//     });
//   }

//   async sendTokenEmail(to: string, token: string) {
//     await this.mailerService.sendMail({
//       to,
//       subject: 'Your Access Token',
//       template: 'token',
//       context: { token },
//     });
//   }
// }
