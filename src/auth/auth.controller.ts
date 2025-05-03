import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/signup.dto/signup.dto';
import { LoginDto } from './dto/signin.dto/signin.dto';
import { OtpVerifyDto } from './dto/signup.dto/otp-verify.dto';
import { ForgotPasswordDto } from './dto/forgotpassword.dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/resetpassword.dto/resetpassword.dto';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: CreateUserDto) {
    const result = await this.authService.generateOtp(dto);
    return result;
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.completeSignup(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.signin(loginDto);
  }

  @Post('forgot-Password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPasswordOtpGenertor(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
