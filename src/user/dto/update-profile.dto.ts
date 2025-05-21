import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString()
  onProfileChange: string;

  @IsOptional()
  @IsString()
  profilePicture?: string; // This will store the image URL after upload
}
