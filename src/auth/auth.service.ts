import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async signup(dto: CreateUserDto) {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already in use');

      return await this.userService.createUser(dto);
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException('Signup failed', error.message);
    }
  }
}
