import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import * as jwt from "jsonwebtoken"

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = request.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return false
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
      if (decoded.role !== "admin") {
        return false
      }
      request.user = decoded
      return true
    } catch {
      return false
    }
  }
}
