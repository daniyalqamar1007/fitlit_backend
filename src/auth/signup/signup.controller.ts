import { Controller, Post, Body } from '@nestjs/common';
import { SignupService } from './signup.service';
import { CreateSignupDto } from './dto/create-signup.dto/create-signup.dto';

@Controller('auth/signup')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @Post()
  signup(@Body() createSignupDto: CreateSignupDto) {
    return this.signupService.signup(createSignupDto);
  }
}
