import { IsNotEmpty, IsNumber, IsString, Min, Max, MaxLength } from "class-validator"

export class CreateRatingDto {
  @IsNotEmpty()
  @IsString()
  targetId: string

  @IsNotEmpty()
  @IsString()
  targetType: "avatar" | "wardrobe_item"

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number

  @IsString()
  @MaxLength(1000)
  comment?: string
}
