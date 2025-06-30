import { Injectable } from "@nestjs/common"
import type { Model } from "mongoose"
import type { ContactDto } from "./dto/contact.dto"

@Injectable()
export class ContactService {
  constructor(private contactModel: Model<any>) {}

  async submitContact(contactDto: ContactDto): Promise<any> {
    const contact = new this.contactModel(contactDto)
    return contact.save()
  }

  async getAllContacts(): Promise<any[]> {
    return this.contactModel.find().sort({ createdAt: -1 }).exec()
  }
}
