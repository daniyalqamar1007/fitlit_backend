import { IsNotEmpty, IsString, IsOptional, Validate } from 'class-validator';

import {
  WardrobeItemCategory,
  ShirtSubCategory,
  PantsSubCategory,
  AccessoriesSubCategory,
  ShoesSubCategory,
} from '../schemas/wardrobe.schema';

export class SubCategoryValidator {
  validate(value: string, args: any) {
    const category = args.object.category;

    const validSubCategories = {
      [WardrobeItemCategory.SHIRTS]: Object.values(ShirtSubCategory),
      [WardrobeItemCategory.PANTS]: Object.values(PantsSubCategory),
      [WardrobeItemCategory.ACCESSORIES]: Object.values(AccessoriesSubCategory),
      [WardrobeItemCategory.SHOES]: Object.values(ShoesSubCategory),
    };

    return validSubCategories[category]?.includes(value) || false;
  }

  defaultMessage() {
    return 'sub_category must be valid for the selected category';
  }
}

export class CreateWardrobeItemDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  @Validate(SubCategoryValidator)
  sub_category: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}
