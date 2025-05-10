import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class AdminUserResponseDto {
  userId: number;
  name: string;
  email: string;
  isAdmin: boolean;
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
