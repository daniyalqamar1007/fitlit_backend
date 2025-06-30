import { Controller, Post, UseGuards } from "@nestjs/common"
import type { AuthService } from "./auth.service"
import type { SignupDto } from "./dto/signup.dto/signup.dto"
import type { SigninDto } from "./dto/signin.dto/signin.dto"
import type { OtpVerifyDto } from "./dto/signup.dto/otp-verify.dto"
import type { ForgotPasswordDto } from "./dto/forgotpassword.dto/forgotpassword.dto"
import type { ResetPasswordDto } from "./dto/resetpassword.dto/resetpassword.dto"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import type { RequestWithUser } from "../interfaces/interface"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(signupDto: SignupDto) {
    return this.authService.signup(signupDto)
  }

  @Post("verify-otp")
  async verifyOtp(otpVerifyDto: OtpVerifyDto) {
    return this.authService.verifyOtp(otpVerifyDto)
  }

  @Post("signin")
  async signin(signinDto: SigninDto) {
    return this.authService.signin(signinDto)
  }

  @Post("forgot-password")
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post("reset-password")
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto)
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  async refresh(req: RequestWithUser) {
    return this.authService.refreshToken(req.user.userId)
  }
}
