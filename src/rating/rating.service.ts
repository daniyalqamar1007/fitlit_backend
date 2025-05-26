import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating } from './schemas/rating.schema';
import { CreateRatingDto } from './dto/create-rating.tdo';
import { UserService } from '../user/user.service';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    private userService: UserService,
  ) {}

  async createRating(
    userId: number,
    createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    try {
      // Verify user exists
      await this.userService.findById(userId);

      // Create new rating

    //   console.log('rating hit in service for user', userId);

      const newRating = new this.ratingModel({
        userId: userId,
        rating: createRatingDto.rating,
        message: createRatingDto.message,
      });

      const savedRating = await newRating.save();

    //   console.log(savedRating);

      return savedRating;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid rating data provided');
      }
      throw error;
    }
  }

  async getUserRatings(userId: string, page: number = 1, limit: number = 10) {
    // console.log("get rating hits inside service");
    try {
    // console.log('get rating hits inside service');

      

      const [ratings] = await Promise.all([
        this.ratingModel
          .find({ userId: userId})
          .sort({ createdAt: -1 })
          .limit(limit)
          .exec(),
        
      ]);

      return {
        ratings,
      };
    } catch (error) {
      throw new Error('Failed to fetch user ratings');
    }
  }

  async getAllRatings(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [ratings, total, averageRating] = await Promise.all([
        this.ratingModel
          .find({ isDeleted: false })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'name email')
          .exec(),
        this.ratingModel.countDocuments({ isDeleted: false }).exec(),
        this.ratingModel
          .aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } },
          ])
          .exec(),
      ]);

      return {
        ratings,
        averageRating:
          averageRating.length > 0
            ? Math.round(averageRating[0].avgRating * 10) / 10
            : 0,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error('Failed to fetch ratings');
    }
  }

  async getRatingStats() {
    try {
      const stats = await this.ratingModel.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating',
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRatings: 1,
            averageRating: { $round: ['$averageRating', 1] },
            ratingDistribution: 1,
          },
        },
      ]);

      if (stats.length === 0) {
        return {
          totalRatings: 0,
          averageRating: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        };
      }

      const result = stats[0];
      const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      result.ratingDistribution.forEach((rating) => {
        ratingBreakdown[rating]++;
      });

      return {
        totalRatings: result.totalRatings,
        averageRating: result.averageRating,
        ratingBreakdown,
      };
    } catch (error) {
      throw new Error('Failed to fetch rating statistics');
    }
  }
}
