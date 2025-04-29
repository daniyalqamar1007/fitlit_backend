import { Injectable, BadRequestException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async signup(dto: CreateUserDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already in use');

    return this.userService.createUser(dto);
  }
}
