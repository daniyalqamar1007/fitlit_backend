import { Injectable } from "@nestjs/common"

@Injectable()
export class AppService {
  getHello(): string {
    return "FitLit Backend API is running!"
  }
}
