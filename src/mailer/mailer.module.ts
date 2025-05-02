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


// import { Module } from '@nestjs/common';
// import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { join } from 'path';
// import { AppMailerService } from './mailer.service';

// @Module({
//   imports: [
//     NestMailerModule.forRoot({
//       transport: {
//         service: 'gmail',
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       },
//       defaults: {
//         from: '"Fitlit App" <no-reply@fitlit.com>',
//       },
//       template: {
//         dir: join(__dirname, 'templates'),
//         adapter: new HandlebarsAdapter(),
//         options: {
//           strict: true,
//         },
//       },
//     }),
//   ],
//   providers: [AppMailerService],
//   exports: [AppMailerService], // ✅ export renamed service
// })
// export class MailerModule {}
