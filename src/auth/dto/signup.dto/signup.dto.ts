import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Email must be in a valid format (e.g., user@example.com)',
  })
  @Transform(({ value }) => value.trim())
  email: string;

  @MinLength(6)
  @Transform(({ value }) => value.trim())
  password: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  phoneNumber?: string;

  @IsOptional()
  profilePhoto?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other'])
  gender?: string;
}
