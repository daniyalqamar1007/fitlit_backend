import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Email must be in a valid format',
  })
  @Transform(({ value }) => value.trim())
  email: string;

  @MinLength(6)
  @Transform(({ value }) => value.trim())
  password: string;
}
