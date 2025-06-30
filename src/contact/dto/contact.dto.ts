import { IsNotEmpty, IsString, MaxLength } from "class-validator"

export class ContactDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsString()
  email: string

  @IsString()
  phone?: string

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message: string
}
