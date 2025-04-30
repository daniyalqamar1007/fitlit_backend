import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDto } from './dto/signup.dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/signin.dto/signin.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: CreateUserDto) {
    try {
      const existing = await this.userService.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Email already in use');

      const user = await this.userService.createUser(dto);

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        message: 'Signup successful',
        userId: user.userId,
        access_token: token,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException('Signup failed', error.message);
    }
  }

  async signin(loginDto: LoginDto) {
    try {
      // Find user by email
      const user = await this.userService.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        message: 'Login successful',
        userId: user.userId,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Login failed. Please try again.');
    }
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.userId,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
