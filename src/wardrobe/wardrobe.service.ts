import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WardrobeItem, WardrobeItemCategory } from './schemas/wardrobe.schema';
import { CreateWardrobeItemDto } from './dto/create-wardrobe.dto';

@Injectable()
export class WardrobeService {
  constructor(
    @InjectModel(WardrobeItem.name)
    private wardrobeItemModel: Model<WardrobeItem>,
  ) {}

  async create(
    userId: string,
    createWardrobeItemDto: CreateWardrobeItemDto,
  ): Promise<WardrobeItem> {
    try {
      const newWardrobeItem = new this.wardrobeItemModel({
        ...createWardrobeItemDto,
        user_id: userId,
      });
      return newWardrobeItem.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    userId?: string,
    category?: WardrobeItemCategory,
    subCategory?: string,
  ): Promise<WardrobeItem[]> {
    const query: any = {};

    if (userId) {
      query.user_id = userId;
    }

    if (category) {
      query.category = category;
    }

    if (subCategory) {
      query.sub_category = subCategory;
    }

    return this.wardrobeItemModel.find(query).exec();
  }

  async findOne(id: string): Promise<WardrobeItem> {
    const wardrobeItem = await this.wardrobeItemModel.findById(id).exec();
    if (!wardrobeItem) {
      throw new NotFoundException(`Wardrobe item with ID ${id} not found`);
    }
    return wardrobeItem;
  }

  async remove(id: string, userId: string): Promise<boolean> {
    // First check if the item exists at all
    const item = await this.wardrobeItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Wardrobe item with ID ${id} not found`);
    }

    // Then delete by ID only, without checking user ID
    const result = await this.wardrobeItemModel
      .deleteOne({
        _id: id,
      })
      .exec();

    return true;
  }
}
