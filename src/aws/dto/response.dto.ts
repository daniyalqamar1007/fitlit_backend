import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ResponseDto {
  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @IsNotEmpty()
  @IsNumber()
  statusCode: number;

  @IsOptional()
  data?: any; // If you want to validate assistant, you can replace any with a proper type or class.

  @IsOptional()
  @IsString()
  msg?: string;
}
