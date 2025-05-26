import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class AdminUserResponseDto {
  userId: number;
  name: string;
  email: string;
  phoneNo?: string;
  profilePicture?: string;
  gender?: string;
  isAdmin: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  avatarCount?: number;
  avatars?: any[];
  shirts?: any[];
  pants?: any[];
  shoes?: any[];
  accessories?: any[];
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
