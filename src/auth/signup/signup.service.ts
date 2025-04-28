import { Injectable } from '@nestjs/common';
import { CreateSignupDto } from './dto/create-signup.dto/create-signup.dto';

@Injectable()
export class SignupService {
  private users:CreateSignupDto[] = []; // Use this array temporarily, replace it with MongoDB logic later

  signup(createSignupDto: CreateSignupDto) {
    const newUser = {
      id: this.users.length + 1,
      ...createSignupDto,
    };
    this.users.push(newUser);
    return newUser;

  }
}


