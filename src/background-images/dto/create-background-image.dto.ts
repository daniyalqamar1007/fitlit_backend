import { IsString, IsOptional } from 'class-validator';

export class CreateBackgroundImageDto {
  @IsString()
  @IsOptional()
  prompt?: string;
} 