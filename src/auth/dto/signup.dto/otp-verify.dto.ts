import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class OtpVerifyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  profilePicture: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
