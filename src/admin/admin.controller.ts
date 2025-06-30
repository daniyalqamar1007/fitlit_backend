import { Controller, Get, Post, Delete, Param, UseGuards, Put, UseInterceptors, UploadedFile } from "@nestjs/common"
import type { AdminService } from "./admin.service"
import { AdminAuthGuard } from "./guards/admin-auth.guard"
import type { QueryParamsDto, AdminUserResponseDto } from "./dto/admin-user.dto"
import type { UserDocument } from "src/user/schemas/user.schema"
import type { UpdateUserDto } from "./dto/update-user.dto"
import { multerOptions } from "src/aws/aws.multer.config"
import { FileInterceptor } from "@nestjs/platform-express"
import type * as Multer from "multer"
import type { AdminUserDto } from "./dto/admin-user.dto"

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("login")
  async login(loginDto: { email: string; password: string }) {
    return this.adminService.login(loginDto.email, loginDto.password)
  }

  @UseGuards(AdminAuthGuard)
  @Get("users")
  async getAllUsers(queryParams: QueryParamsDto) {
    return this.adminService.getAllUsers(queryParams)
  }

  @UseGuards(AdminAuthGuard)
  @Post("users")
  async createUser(createUserDto: AdminUserDto) {
    return this.adminService.createUser(createUserDto)
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string): Promise<AdminUserResponseDto> {
    return this.adminService.getUserById(Number.parseInt(id));
  }

  @Get("new-users")
  async getNewUsers(days = 7) {
    const newUsers = await this.adminService.getNewUsers(days)

    return {
      count: newUsers.length,
      users: newUsers.map((user: UserDocument) => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })),
    }
  }

  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(Number.parseInt(userId));
  }

  @Post("users/make-admin")
  async makeAdmin(email: string): Promise<AdminUserResponseDto> {
    return this.adminService.createAdminUser(email)
  }

  @Post('users/:userId/revoke-admin')
  async revokeAdmin(@Param('userId') userId: string): Promise<AdminUserResponseDto> {
    return this.adminService.revokeAdminAccess(Number.parseInt(userId));
  }

  @UseGuards(AdminAuthGuard)
  @Post("users/update")
  async updateUser(updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(updateUserDto)
  }

  @Get("wardrobe/shirts")
  async getAllShirts() {
    return this.adminService.getAllWardrobeItems("Shirts")
  }

  @Get("wardrobe/pants")
  async getAllPants() {
    return this.adminService.getAllWardrobeItems("Pants")
  }

  @Get("wardrobe/shoes")
  async getAllShoes() {
    return this.adminService.getAllWardrobeItems("Shoes")
  }

  @Get("wardrobe/accessories")
  async getAllAccessories() {
    return this.adminService.getAllWardrobeItems("Accessories")
  }

  @Get("avatars")
  async getAllAvatars() {
    return this.adminService.getAllAvatars()
  }

  @Get("count")
  async getAdminCount() {
    return this.adminService.getAdminCount()
  }

  @Put("users/:userId")
  @UseInterceptors(FileInterceptor("file", multerOptions))
  async updateUserById(
    @Param('userId') userId: string,
    updateUserDto: any,
    @UploadedFile() file?: Multer.File,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.updateUser(Number.parseInt(userId), updateUserDto, file)
  }
}
