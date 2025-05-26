import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneNo: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message: string;
}
