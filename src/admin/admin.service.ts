// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { AdminUserResponseDto, QueryParamsDto } from './dto/admin-user.dto';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getAllUsers(
    queryParams: QueryParamsDto,
  ): Promise<{
    users: AdminUserResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, searchTerm, emailVerified } = queryParams;
    const skip = (page - 1) * limit;

    // Build filter based on query parameters
    const filter: any = {};

    if (emailVerified !== undefined) {
      filter.emailVerified = emailVerified;
    }

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

    return {
      users: users.map((user) => this.mapToAdminUserResponse(user)),
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

    return this.mapToAdminUserResponse(user);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const result = await this.userModel.deleteOne({ userId }).exec();

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
}
