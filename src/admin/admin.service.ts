import { WardrobeModule } from './../wardrobe/wardrobe.module';
// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { AdminUserResponseDto, QueryParamsDto } from './dto/admin-user.dto';
import { Avatar } from '../avatar/schemas/avatar.schema'; // adjust path as needed
import { WardrobeItem } from 'src/wardrobe/schemas/wardrobe.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Avatar.name) private avatarModel: Model<Avatar>,
    @InjectModel(WardrobeItem.name) private wardrobeModel: Model<WardrobeItem>,
  ) {}

  async getNewUsers(days: number = 7): Promise<User[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    return this.userModel
      .find({
        createdAt: { $gte: threshold },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getNewUserCount(days: number = 7): Promise<number> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    return this.userModel
      .countDocuments({
        createdAt: { $gte: threshold },
      })
      .exec();
  }

  async getAllUsers(queryParams: QueryParamsDto): Promise<{
    users: AdminUserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, searchTerm, emailVerified } = queryParams;
    const skip = (page - 1) * limit;

    // Build filter based on query parameters
    const filter: any = {};

    // if (emailVerified !== undefined) {
    //   filter.emailVerified = emailVerified;
    // }

    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const users = await this.userModel
      .find(filter)
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments(filter);

    const usersWithAvatarCount = await Promise.all(
      users.map(async (user) => {
        const avatarCount = await this.avatarModel
          .countDocuments({ user_id: user.userId })
          .exec();
        return {
          ...this.mapToAdminUserResponse(user),
          avatarCount,
        };
      }),
    );

    return {
      users: usersWithAvatarCount,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async getUserById(userId: number): Promise<AdminUserResponseDto> {
    const user = await this.userModel.findOne({ userId }).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const avatars = await this.avatarModel
      .find({ user_id: userId })
      .lean()
      .exec();

    const shirts = await this.wardrobeModel
      .find({ user_id: userId, category: 'Shirts' })
      .lean()
      .exec();

    const pants = await this.wardrobeModel
      .find({ user_id: userId, category: 'Pants' })
      .lean()
      .exec();

    const shoes = await this.wardrobeModel
      .find({ user_id: userId, category: 'Shoes' })
      .lean()
      .exec();

    const accessories = await this.wardrobeModel
      .find({ user_id: userId, category: 'Accessories' })
      .lean()
      .exec();

    return {
      ...this.mapToAdminUserResponse(user),
      avatars,
      shirts,
      pants,
      shoes,
      accessories,
    };
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const result = await this.userModel.deleteOne({ userId }).exec();

    // Delete avatars linked to the user
    await this.avatarModel.deleteMany({ user_id: userId }).exec();

    // Delete wardrobe items linked to the user
    await this.wardrobeModel.deleteMany({ user_id: userId }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return { message: `User with ID ${userId} has been successfully deleted` };
  }

  async createAdminUser(email: string): Promise<AdminUserResponseDto> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    user.isAdmin = true;
    await user.save();

    return this.mapToAdminUserResponse(user);
  }

  async revokeAdminAccess(userId: number): Promise<AdminUserResponseDto> {
    const user = await this.userModel.findOne({ userId }).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.isAdmin) {
      user.isAdmin = false;
      await user.save();
    }

    return this.mapToAdminUserResponse(user);
  }

  private mapToAdminUserResponse(user: UserDocument): AdminUserResponseDto {
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }

  async getAllWardrobeItems(category: string) {
    const items = await this.wardrobeModel
      .aggregate([{ $match: { category } }])
      .exec();
    console.log(items.length);

    const count = await this.wardrobeModel.countDocuments({ category }).exec();
    console.log(count);

    return {
      items,
      count,
    };
  }

  async getAllAvatars() {
    const avatars = await this.avatarModel.find().lean().exec();

    const count = await this.avatarModel.countDocuments().exec();

    return {
      avatars,
      count,
    };
  }

  async getAdminCount() {
    const count = await this.userModel.countDocuments({ isAdmin: true }).exec();

    return {
      count,
    };
  }
}
