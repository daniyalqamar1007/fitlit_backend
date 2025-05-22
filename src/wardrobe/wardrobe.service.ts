/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-empty */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WardrobeItem } from './schemas/wardrobe.schema';
import { AvatarService } from 'src/avatar/avatar.service';
import { AwsService } from 'src/aws/aws.service';
import * as fs from 'fs';
import { wardrobeItemSwipe } from './wardrobe.controller';

type SwipeItem = { _id: Types.ObjectId; avatar?: string };

type SwipeState = {
  leftSwipe: SwipeItem[];
  rightSwipe: SwipeItem[];
  index: number;
};

type UserSwipeState = {
  shirt: SwipeState;
  pants: SwipeState;
  shoes: SwipeState;
};

@Injectable()
export class WardrobeService {
  private userSwipeState: { [userId: string]: UserSwipeState } = {};
  // private rightShirtSwipe: { _id: Types.ObjectId; avatar?: string }[] = [];
  // private leftShirtSwipe: { _id: Types.ObjectId; avatar?: string }[] = [];
  // private shirtSwipeIndex = 0;

  // private rightPantsSwipe: { _id: Types.ObjectId; avatar?: string }[] = [];
  // private leftPantsSwipe: { _id: Types.ObjectId; avatar?: string }[] = [];
  // private pantsSwipeIndex = 0;

  // private rightShoesSwipe: { _id: Types.ObjectId; avatar?: string }[] = [];
  // private leftShoesSwipe: { _id: Types.ObjectId; avatar?: string }[] = [];
  // private shoesSwipeIndex = 0;

  constructor(
    @InjectModel(WardrobeItem.name)
    private wardrobeItemModel: Model<WardrobeItem>,
    // private readonly avatarService: AvatarService,
     @Inject(forwardRef(() => AvatarService))
  private readonly avatarService: AvatarService,
    private readonly awsS3Service: AwsService,
  ) {}

  async create(userId: string, createWardrobeItemDto: any, file: any) {
    try {
      const category = createWardrobeItemDto.category;

      const [response1, response2] = await Promise.all([
        await this.avatarService.getUpdated3DAvatar(
          file.path,
          createWardrobeItemDto.category,
          `Convert this ${category} image (a ${category}) into a detailed 3D model of the ${category}  only,
          preserving the fabric texture, shape, and design features. Focus solely on the ${category}
          without any background or other objects.`,
        ),
        await this.avatarService.generateUpdatedAvatar(
          createWardrobeItemDto.avatar,
          file.path,
          category,
        ),
      ]);

      console.log(response2);
      if (!response1 || typeof response1 === 'boolean') {
        throw new BadRequestException('Failed to generate avatar buffer');
      }
      if (!response2 || typeof response2 === 'boolean') {
        throw new BadRequestException('Failed to generate avatar buffer');
      }
      const imageUrl1 = await this.awsS3Service.uploadFile(response1, file);
      const imageUrl2 = await this.awsS3Service.uploadFile(response2);
      console.log(imageUrl1);
      console.log(imageUrl2);

      const newWardrobeItem = new this.wardrobeItemModel({
        ...createWardrobeItemDto,
        user_id: userId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        category,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        sub_category: createWardrobeItemDto.sub_category,
        image_url: imageUrl1,
        avatar_url: imageUrl2,
      });

      return newWardrobeItem.save();
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      fs.unlink(file.path, (err: any) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }

  clearSwipeState(userId: string) {
    delete this.userSwipeState[userId];
  }

  async findAll(
    userId?: string,
    category?: string,
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

export interface SwipeResponse {
  avatar: string | null;
}
