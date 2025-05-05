import { IsEnum, IsOptional, IsString, IsUrl, Validate } from 'class-validator';
import {
  ClothingCategory,
  ShirtSubCategory,
  PantSubCategory,
  ShoeSubCategory,
  AccessorySubCategory,
} from '../schemas/clothing.schema';
import { SubCategoryValidator } from './create-clothing.dto';

export class UpdateClothingDto {
  @IsEnum(ClothingCategory)
  @IsOptional()
  category?: ClothingCategory;

  @IsUrl()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  @Validate(SubCategoryValidator)
  sub_category?: string;
}
