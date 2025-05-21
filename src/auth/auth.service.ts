import { AvatarService } from 'src/avatar/avatar.service';
import { AwsService } from 'src/aws/aws.service';
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

import * as bcrypt from 'bcrypt';
import { AppMailerService } from '../mailer/mailer.service';
import { ForgotPasswordDto } from './dto/forgotpassword.dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/resetpassword.dto/resetpassword.dto';
import * as Multer from 'multer';
import * as axios from 'axios';
import { OtpVerifyDto } from './dto/signup.dto/otp-verify.dto';




@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private AwsService: AwsService,
    private mailerService: AppMailerService,
    private AvatarService : AvatarService,
  ) {}

  async fetchImageBufferOrBase64(
    imageUrl: string,
    asBase64 = true,
  ): Promise<string | Buffer> {
    const response: any = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(response.data, 'binary');

    return asBase64 ? buffer.toString('base64') : buffer;
  }
  async generateOtp(dto: CreateUserDto) {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already registered');

      const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

      await this.mailerService.sendOtpEmail(dto.email, otp);
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

  async completeSignup(dto: OtpVerifyDto, file: Multer.file) {
    // console.log(file.path);
    // console.log(dto)
    // return file
    try {
      const buffer: any = await this.AvatarService.getSignupAvatar(file.path);
      // console.log('openai buffer', buffer)
      // const buffer = await this.fetchImageBufferOrBase64(
      //   'https://images.pexels.com/photos/31588241/pexels-photo-31588241/free-photo-of-classic-cadillac-car-front-in-las-vegas.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      // );

      console.log(buffer);

      // Upload to AWS S3
      const imageUrl = await this.AwsService.uploadFile(buffer, file);

      console.log(imageUrl);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const existing = await this.userService.findByEmail(dto.email);
      console.log(existing);
      if (existing) throw new BadRequestException('Email already registered');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const user = await this.userService.createUser({
        ...dto,
        profilePicture: imageUrl,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        password: hashedPassword,
      });

      const token = this.generateToken(user);

      return {
        message: 'Signup successful',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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

  async forgotPasswordOtpGenertor(dto: ForgotPasswordDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (!existing) throw new BadRequestException('Email not registered');

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

    await this.mailerService.sendOtpEmailForgotPassword(dto.email, otp);

    return {
      otp,
      message: 'OTP send to your email',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userService.updatePassword(dto.email, hashed);
    return { message: 'Password updated successfully' };
  }
}
