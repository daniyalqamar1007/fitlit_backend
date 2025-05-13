import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class AdminUserResponseDto {
  userId: number;
  name: string;
  email: string;
  isAdmin: boolean;
  avatars?: any[];
  shirts?: any[];
  pants?: any[];
  shoes?: any[];
  accessories?: any[];
  //   createdAt: Date;
  //   updatedAt: Date;
}

export class QueryParamsDto {
  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;
}
