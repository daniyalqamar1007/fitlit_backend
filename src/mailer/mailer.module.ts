import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { AppMailerService } from './mailer.service';

@Module({
  imports: [
    NestMailerModule.forRoot({
      transport: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        auth: {
          user: 'b1cfc46963c34c',
          pass: '49daf89d2ef9ad',
        },
      },
      defaults: {
        from: '"Fitlit App" <no-reply@fitlit.com>',
      },
    }),
  ],
  providers: [AppMailerService],
  exports: [AppMailerService],
})
export class MailerModule {}
