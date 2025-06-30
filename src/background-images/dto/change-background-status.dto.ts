import { IsString, IsNotEmpty } from "class-validator"

export class ChangeBackgroundStatusDto {
  @IsString()
  @IsNotEmpty()
  background_image_id: string

  isActive: boolean
}
