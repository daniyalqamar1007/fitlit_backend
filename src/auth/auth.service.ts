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
import { AppMailerService } from '../mailer/mailer.service';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailerService: AppMailerService,
  ) {}

  async generateOtp(dto: CreateUserDto) {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already registered');

      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

      await this.mailerService.sendOtpEmail(dto.email, otp, dto.name);
      return {
        otp,
        message: 'OTP sent to your email. Complete signup after verifying OTP.',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send OTP',
        error.message,
      );
    }
  }

  async completeSignup(dto: CreateUserDto) {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already registered');

      const user = await this.userService.createUser(dto);

      const token = this.generateToken(user);

      return {
        message: 'Signup successful',
        userId: user.userId,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Signup failed', error.message);
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
