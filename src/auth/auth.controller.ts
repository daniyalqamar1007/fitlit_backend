import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/signup.dto/signup.dto';
import { LoginDto } from './dto/signin.dto/signin.dto';
import { OtpVerifyDto } from './dto/signup.dto/otp-verify.dto';



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


}

