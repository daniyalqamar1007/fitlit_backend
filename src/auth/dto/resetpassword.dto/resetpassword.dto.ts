import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Email must be in a valid format (e.g., user@example.com)',
  })
  @Transform(({ value }) => value.trim())
  email: string;

  @MinLength(6)
  @Transform(({ value }) => value.trim())
  newPassword: string;
}
