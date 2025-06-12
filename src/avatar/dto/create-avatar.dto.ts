import { IsString, Matches } from 'class-validator';

export class CreateAvatarDto {


  @IsString()
  shirt_id: string;

  @IsString()
  pant_id: string;

  @IsString()
  shoe_id: string;

  @IsString()
  
  accessories_id: string;
  @IsString()
  
  stored_message: string;

  @IsString()
  avatarUrl: string;
  @IsString()
  backgroundimageurl: string;

  @Matches(/^\d{2}\/\d{2}\/\d{4}$/, {
    message: 'date must be in dd/mm/yyyy format',
  })
  date: string;
}
