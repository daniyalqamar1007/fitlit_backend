import { Controller, Get, Post, Param, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import type { UserService } from "./user.service"
import type { UpdateProfileDto } from "./dto/update-profile.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { RequestWithUser } from "../interfaces/interface"
import { multerOptions } from "../aws/aws.multer.config"
import type * as Express from "express"

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(req: RequestWithUser) {
    return this.userService.getProfile(req.user.userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post("profile")
  @UseInterceptors(FileInterceptor("profilePicture", multerOptions))
  async updateProfile(
    updateProfileDto: UpdateProfileDto,
    req: RequestWithUser,
    @UploadedFile() file?: Express.Express.Multer.File,
  ) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto, file)
  }

  @UseGuards(JwtAuthGuard)
  @Post("follow/:userId")
  async followUser(@Param('userId') userId: string, req: RequestWithUser) {
    return this.userService.followUser(req.user.userId, userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post("unfollow/:userId")
  async unfollowUser(@Param('userId') userId: string, req: RequestWithUser) {
    return this.userService.unfollowUser(req.user.userId, userId)
  }

  @UseGuards(JwtAuthGuard)
  @Get("followers")
  async getFollowers(req: RequestWithUser) {
    return this.userService.getFollowers(req.user.userId)
  }

  @UseGuards(JwtAuthGuard)
  @Get("following")
  async getFollowing(req: RequestWithUser) {
    return this.userService.getFollowing(req.user.userId)
  }
}
