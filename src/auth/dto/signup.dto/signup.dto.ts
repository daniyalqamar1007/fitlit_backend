import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @MinLength(6) password: string;
  @IsOptional() phoneNumber?: string;
  @IsOptional() profilePhoto?: string;
  @IsOptional() @IsEnum(['male', 'female', 'other']) gender?: string;
}
