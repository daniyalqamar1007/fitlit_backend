import { IsEnum, IsNotEmpty, IsString, IsUrl, Validate } from 'class-validator';
import {
  ClothingCategory,
  ShirtSubCategory,
  PantSubCategory,
  ShoeSubCategory,
  AccessorySubCategory,
} from '../schemas/wardrobe.schema';

export class SubCategoryValidator {
  validate(value: string, args: any) {
    const category = args.object.category;

    if (!category) return true;

    const validSubCategories = {
      [ClothingCategory.SHIRT]: Object.values(ShirtSubCategory),
      [ClothingCategory.PANT]: Object.values(PantSubCategory),
      [ClothingCategory.SHOE]: Object.values(ShoeSubCategory),
      [ClothingCategory.ACCESSORY]: Object.values(AccessorySubCategory),
    };

    return validSubCategories[category].includes(value);
  }

  defaultMessage() {
    return 'sub_category must be valid for the selected category';
  }
}

export class CreateClothingDto {
  @IsEnum(ClothingCategory)
  @IsNotEmpty()
  category: ClothingCategory;

  @IsUrl()
  @IsNotEmpty()
  image_url: string;

  @IsString()
  @IsNotEmpty()
  @Validate(SubCategoryValidator)
  sub_category: string;
}
