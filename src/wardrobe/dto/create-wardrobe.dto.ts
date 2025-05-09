import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  Validate,
} from 'class-validator';

import {
  WardrobeItemCategory,
  TopSubCategory,
  BottomSubCategory,
  FootwearSubCategory,
  AccessorySubCategory,
  OuterwearSubCategory,
  DressSubCategory,
} from '../schemas/wardrobe.schema';

export class SubCategoryValidator {
  validate(value: string, args: any) {
    const category = args.object.category;

    if (!category) return true;

    const validSubCategories = {
      [WardrobeItemCategory.TOP]: Object.values(TopSubCategory),
      [WardrobeItemCategory.BOTTOM]: Object.values(BottomSubCategory),
      [WardrobeItemCategory.FOOTWEAR]: Object.values(FootwearSubCategory),
      [WardrobeItemCategory.ACCESSORIES]: Object.values(AccessorySubCategory),
      [WardrobeItemCategory.OUTERWEAR]: Object.values(OuterwearSubCategory),
      [WardrobeItemCategory.DRESSES]: Object.values(DressSubCategory),
    };

    return validSubCategories[category]?.includes(value) || false;
  }

  defaultMessage() {
    return 'sub_category must be valid for the selected category';
  }
}

export class CreateWardrobeItemDto {
  @IsEnum(WardrobeItemCategory)
  @IsNotEmpty()
  category: WardrobeItemCategory;

  @IsString()
  @IsOptional()
  image_url?: string; // Now optional, will be generated after file upload

  @IsString()
  @IsNotEmpty()
  @Validate(SubCategoryValidator)
  sub_category: string;
}
