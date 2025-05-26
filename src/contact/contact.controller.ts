import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async contactUs(@Body() contactDto: ContactDto, @Req() req: any) {
    try {
      const userId = req.user.userId ;
      const result = await this.contactService.sendContactEmail(
        userId,
        contactDto.message,
        contactDto.phoneNo,
      );

      return {
        success: true,
        message:
          'Your message has been sent successfully. We will get back to you soon.',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to send message',
      };
    }
  }
}
