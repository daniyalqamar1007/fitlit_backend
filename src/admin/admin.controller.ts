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

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
