import { IsString, Matches } from "class-validator"

export class CreateAvatarDto {
  @IsString()
  shirt_id: string

  @IsString()
  pant_id: string

  @IsString()
  shoe_id: string

  @IsString()
  accessories_id: string

  @IsString()
  backgroundimageurl?: string

  @IsString()
  stored_message?: string

  @IsString()
  avatarUrl: string

  stackimage?: any

  @Matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: "date must be in dd/mm/yyyy format",
  })
  date?: string
}
