import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"
import type { Model } from "mongoose"
import * as bcrypt from "bcrypt"
import type { UserDocument } from "../user/schemas/user.schema"
import type { SignupDto } from "./dto/signup.dto/signup.dto"
import type { SigninDto } from "./dto/signin.dto/signin.dto"
import type { OtpVerifyDto } from "./dto/signup.dto/otp-verify.dto"
import type { ForgotPasswordDto } from "./dto/forgotpassword.dto/forgotpassword.dto"
import type { ResetPasswordDto } from "./dto/resetpassword.dto/resetpassword.dto"
import type { MailerService } from "../mailer/mailer.service"

@Injectable()
export class AuthService {
  private userModel: Model<UserDocument>
  private jwtService: JwtService
  private mailerService: MailerService

  constructor(userModel: Model<UserDocument>, jwtService: JwtService, mailerService: MailerService) {
    this.userModel = userModel
    this.jwtService = jwtService
    this.mailerService = mailerService
  }

  async signup(signupDto: SignupDto) {
    const existingUser = await this.userModel.findOne({ email: signupDto.email })
    if (existingUser) {
      throw new BadRequestException("User already exists")
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedPassword = await bcrypt.hash(signupDto.password, 10)

    const user = new this.userModel({
      ...signupDto,
      password: hashedPassword,
      otp,
      isVerified: false,
    })

    await user.save()
    await this.mailerService.sendOtp(signupDto.email, otp)

    return {
      message: "OTP sent to your email",
      userId: user._id,
    }
  }

  async verifyOtp(otpVerifyDto: OtpVerifyDto) {
    const user = await this.userModel.findById(otpVerifyDto.userId)
    if (!user || user.otp !== otpVerifyDto.otp) {
      throw new BadRequestException("Invalid OTP")
    }

    user.isVerified = true
    user.otp = undefined
    await user.save()

    const token = this.jwtService.sign({ userId: user._id })

    return {
      message: "Account verified successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    }
  }

  async signin(signinDto: SigninDto) {
    const user = await this.userModel.findOne({ email: signinDto.email })
    if (!user || !(await bcrypt.compare(signinDto.password, user.password))) {
      throw new UnauthorizedException("Invalid credentials")
    }

    if (!user.isVerified) {
      throw new UnauthorizedException("Please verify your account first")
    }

    const token = this.jwtService.sign({ userId: user._id })

    return {
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email })
    if (!user) {
      throw new BadRequestException("User not found")
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
    user.resetToken = resetToken
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    await user.save()

    await this.mailerService.sendResetToken(user.email, resetToken)

    return {
      message: "Reset token sent to your email",
      userId: user._id,
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userModel.findById(resetPasswordDto.userId)
    if (!user || user.resetToken !== resetPasswordDto.token || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException("Invalid or expired reset token")
    }

    user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10)
    user.resetToken = undefined
    user.resetTokenExpiry = undefined
    await user.save()

    return {
      message: "Password reset successfully",
    }
  }

  async refreshToken(userId: string) {
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    const token = this.jwtService.sign({ userId: user._id })

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    }
  }
}
