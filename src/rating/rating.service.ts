import { Injectable } from "@nestjs/common"
import type { Model } from "mongoose"
import type { Rating, RatingDocument } from "./schemas/rating.schema"
import type { UserService } from "../user/user.service"

@Injectable()
export class RatingService {
  private ratingModel: Model<RatingDocument>
  private userService: UserService

  constructor(ratingModel: Model<RatingDocument>, userService: UserService) {
    this.ratingModel = ratingModel
    this.userService = userService
  }

  async createRating(ratingData: Partial<Rating>): Promise<Rating> {
    // Check if user already rated this item
    const existingRating = await this.ratingModel.findOne({
      userId: ratingData.userId,
      targetId: ratingData.targetId,
    })

    if (existingRating) {
      // Update existing rating
      Object.assign(existingRating, ratingData)
      return existingRating.save()
    }

    // Create new rating
    const rating = new this.ratingModel(ratingData)
    return rating.save()
  }

  async getUserRatings(userId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit

      const [ratings, total] = await Promise.all([
        this.ratingModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        this.ratingModel.countDocuments({ userId }).exec(),
      ])

      return {
        ratings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      }
    } catch (error) {
      throw new Error("Failed to fetch user ratings")
    }
  }

  async getAllRatings(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit

      const [ratings, total, averageRating] = await Promise.all([
        this.ratingModel
          .find({ isDeleted: false })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("userId", "name email")
          .exec(),
        this.ratingModel.countDocuments({ isDeleted: false }).exec(),
        this.ratingModel
          .aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, avgRating: { $avg: "$rating" } } }])
          .exec(),
      ])

      return {
        ratings,
        averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      }
    } catch (error) {
      throw new Error("Failed to fetch ratings")
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
            averageRating: { $avg: "$rating" },
            ratingDistribution: {
              $push: "$rating",
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRatings: 1,
            averageRating: { $round: ["$averageRating", 1] },
            ratingDistribution: 1,
          },
        },
      ])

      if (stats.length === 0) {
        return {
          totalRatings: 0,
          averageRating: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        }
      }

      const result = stats[0]
      const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

      result.ratingDistribution.forEach((rating) => {
        ratingBreakdown[rating]++
      })

      return {
        totalRatings: result.totalRatings,
        averageRating: result.averageRating,
        ratingBreakdown,
      }
    } catch (error) {
      throw new Error("Failed to fetch rating statistics")
    }
  }

  async getRatingsForTarget(targetId: string): Promise<Rating[]> {
    return this.ratingModel.find({ targetId }).populate("userId", "name").exec()
  }

  async getAverageRating(targetId: string): Promise<{ average: number; count: number }> {
    const result = await this.ratingModel.aggregate([
      { $match: { targetId } },
      {
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])

    return result[0] || { average: 0, count: 0 }
  }
}
