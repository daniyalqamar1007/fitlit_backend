import { AwsService } from './../aws/aws.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/signup.dto/signup.dto';
import { LoginDto } from './dto/signin.dto/signin.dto';
import { OtpVerifyDto } from './dto/signup.dto/otp-verify.dto';
import { ForgotPasswordDto } from './dto/forgotpassword.dto/forgotpassword.dto';
import { ResetPasswordDto } from './dto/resetpassword.dto/resetpassword.dto';
import * as Multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarService } from 'src/avatar/avatar.service';
import { Avatar, AvatarDocument } from 'src/avatar/schemas/avatar.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { multerOptions, uploadsPath } from 'src/aws/aws.multer.config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private readonly authService: AuthService,
    private readonly AwsService: AwsService,
    private readonly AvatarService: AvatarService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: CreateUserDto) {
    const result = await this.authService.generateOtp(dto);
    return result;
  }

  @Post('verify-otp')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async verifyOtp(@Body() dto?: any, @UploadedFile() file?: Multer.File) {
    return this.authService.completeSignup(dto,file)
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

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: any) {
    try {
      const userId = req.user.userId || req.user.id;
      const result = await this.userService.softDeleteUser(userId);
      
      return {
        ...result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete account'
      };
    }
  }
}
  
