import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { QueryParamsDto, AdminUserResponseDto } from './dto/admin-user.dto';
import { UserDocument } from 'src/user/schemas/user.schema';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get('users')
  async getAllUsers(@Query() queryParams: QueryParamsDto) {
    return this.adminService.getAllUsers(queryParams);
  }

  @Get('users/:id')
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.getUserById(id);
  }

  @Get('new-users')
  async getNewUsers(@Query('days') days: number = 7) {
    const newUsers = await this.adminService.getNewUsers(days);

    return {
      count: newUsers.length,
      users: newUsers.map((user: UserDocument) => ({
        userId: user.userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })),
    };
  }

  @Delete('users/:userId')
  async deleteUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.deleteUser(userId);
  }

  @Post('users/make-admin')
  async makeAdmin(@Body('email') email: string): Promise<AdminUserResponseDto> {
    return this.adminService.createAdminUser(email);
  }

  @Post('users/:userId/revoke-admin')
  async revokeAdmin(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AdminUserResponseDto> {
    return this.adminService.revokeAdminAccess(userId);
  }
}
