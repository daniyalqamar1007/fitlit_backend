import { Module } from "@nestjs/common"
import { MailerModule as NestMailerModule } from "@nestjs-modules/mailer"
import { MailerService } from "./mailer.service"

@Module({
  imports: [
    NestMailerModule.forRoot({
      transport: {
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: "daniyalqamar1007@gmail.com",
          pass: "omsz wbsy wgdf ubqi",
        },
      },
      defaults: {
        from: '"Fitlit App" <no-reply@fitlit.com>',
      },
    }),
  ],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
