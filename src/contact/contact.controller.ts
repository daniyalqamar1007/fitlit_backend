import { Controller, Post, Get, UseGuards } from "@nestjs/common"
import type { ContactService } from "./contact.service"
import type { ContactDto } from "./dto/contact.dto"
import { AdminAuthGuard } from "../admin/guards/admin-auth.guard"

@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContact(contactDto: ContactDto) {
    return this.contactService.submitContact(contactDto)
  }

  @UseGuards(AdminAuthGuard)
  @Get()
  async getAllContacts() {
    return this.contactService.getAllContacts()
  }
}
