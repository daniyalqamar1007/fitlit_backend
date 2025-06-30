import { IsOptional, IsString, IsEmail, IsEnum } from "class-validator"

export enum Gender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export class UpdateUserDto {
  id: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsString()
  phoneNo?: string

  @IsOptional()
  @IsString()
  profilePicture?: string // URL or base64 string

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @IsOptional()
  @IsString()
  role?: string
}
