import { IsDateString, IsString, Matches } from 'class-validator';

export class CreateAvatarDto {
  @IsString()
  shirt_id: string;

  @IsString()
  pant_id: string;

  @IsString()
  shoe_id: string;

  @IsString()
  accessory_id: string;

  @IsString()
  avatarUrl: string;

  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'date must be in dd/mm/yyyy format',
  })
  date: string;
}
