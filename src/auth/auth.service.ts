import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/signup.dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/signin.dto/signin.dto';
import { OtpVerifyDto } from './dto/signup.dto/otp-verify.dto';
import * as bcrypt from 'bcrypt';
import { OtpService } from '../otp/otp.service';
import { AppMailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private mailerService: AppMailerService,
  ) {}

  // Signup Step 1: Send OTP
  async signupWithOtp(dto: CreateUserDto) {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already registered');

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      await this.otpService.saveOtp(dto.email, otp); // Save OTP to DB
      await this.mailerService.sendOtpEmail(dto.email, otp); // Send email
      console.log("email send to this mail",dto.email,otp);

      // Store DTO data in memory/cache (if needed), or just re-send full DTO on verify
      return { message: 'OTP sent to your email' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send OTP',
        error.message,
      );
    }
  }

  // Signup Step 2: Verify OTP and Register
  async verifyOtpAndRegister(dto: OtpVerifyDto) {
    try {
      const isValid = await this.otpService.verifyOtp(dto.email, dto.otp);
      console.log(dto.email,dto.otp,dto ) ;
      if (!isValid) throw new UnauthorizedException('Invalid or expired OTP');

      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('User already exists');

      // Create user — you may need to pass password and other info too
      const user = await this.userService.createUser({
        email: dto.email,
        password: dto.password,
        name: dto.name,
      });

      const token = this.generateToken(user);
      
      return {
        message: 'Signup successful',
        userId: user.userId,
        access_token: token,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      )
        throw error;

      throw new InternalServerErrorException(
        'Signup verification failed',
        error.message,
      );
    }
  }

  
  async signin(loginDto: LoginDto) {
    try {
      const user = await this.userService.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const token = this.generateToken(user);

      return {
        message: 'Login successful',
        userId: user.userId,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Login failed. Please try again.');
    }
  }

  // Token generation
  private generateToken(user: any): string {
    const payload = {
      sub: user.userId,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}

