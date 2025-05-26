import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateRatingDto {

  userId
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message: string;
}
