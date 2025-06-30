import { Injectable } from "@nestjs/common"
import * as nodemailer from "nodemailer"

@Injectable()
export class MailerService {
  private transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@fitlit.com",
      to: email,
      subject: "Verify Your Account - FitLit",
      html: `
        <h2>Welcome to FitLit!</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    }

    await this.transporter.sendMail(mailOptions)
  }

  async sendResetToken(email: string, token: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@fitlit.com",
      to: email,
      subject: "Reset Your Password - FitLit",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your password reset code is: <strong>${token}</strong></p>
        <p>This code will expire in 15 minutes.</p>
      `,
    }

    await this.transporter.sendMail(mailOptions)
  }
}
