import { IsString } from 'class-validator';

export class CreateAvatarDto {
  @IsString()
  shirtUrl: string;

  @IsString()
  pantUrl: string;

  @IsString()
  shoeUrl: string;

  @IsString()
  accessoryUrl: string;
}
