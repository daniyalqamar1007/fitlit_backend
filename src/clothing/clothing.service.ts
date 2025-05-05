import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Clothing, ClothingCategory } from './schemas/clothing.schema';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';

@Injectable()
export class ClothingService {
  constructor(
    @InjectModel(Clothing.name) private clothingModel: Model<Clothing>,
  ) {}

  async create(
    userId: string,
    createClothingDto: CreateClothingDto,
  ): Promise<Clothing> {
    try {
      const newClothing = new this.clothingModel({
        ...createClothingDto,
        user_id: new Types.ObjectId(userId),
      });
      return newClothing.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    userId?: string,
    category?: ClothingCategory,
    subCategory?: string,
  ): Promise<Clothing[]> {
    const query: any = {};

    if (userId) {
      query.user_id = new Types.ObjectId(userId);
    }

    if (category) {
      query.category = category;
    }

    if (subCategory) {
      query.sub_category = subCategory;
    }

    return this.clothingModel.find(query).exec();
  }

  async findOne(id: string): Promise<Clothing> {
    const clothing = await this.clothingModel.findById(id).exec();
    if (!clothing) {
      throw new NotFoundException(`Clothing item with ID ${id} not found`);
    }
    return clothing;
  }

  async update(
    id: string,
    userId: string,
    updateClothingDto: UpdateClothingDto,
  ): Promise<Clothing> {
    try {
      const clothing = await this.clothingModel
        .findOneAndUpdate(
          { _id: id, user_id: new Types.ObjectId(userId) },
          { $set: updateClothingDto },
          { new: true },
        )
        .exec();

      if (!clothing) {
        throw new NotFoundException(
          `Clothing item with ID ${id} not found or you don't have permission`,
        );
      }

      return clothing;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await this.clothingModel
      .deleteOne({
        _id: id,
        user_id: new Types.ObjectId(userId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Clothing item with ID ${id} not found or you don't have permission`,
      );
    }

    return true;
  }
}
