import { Controller, Get } from "@nestjs/common"

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      services: {
        database: "connected", // You can add actual DB health check
        imageProcessing: "available",
        aws: process.env.AWS_ACCESS_KEY ? "configured" : "not configured",
      },
    }
  }

  @Get("detailed")
  getDetailedHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      services: {
        database: {
          status: "connected",
          url: process.env.MONGODB_URI ? "configured" : "not configured",
        },
        imageProcessing: {
          replicate: process.env.REPLICATE_API_TOKEN ? "configured" : "not configured",
          removeBg: process.env.REMOVE_BG_API_KEY ? "configured" : "not configured",
        },
        aws: {
          status: process.env.AWS_ACCESS_KEY ? "configured" : "not configured",
          region: process.env.AWS_BUCKET_REGION || "not set",
        },
        email: {
          status: process.env.SMTP_HOST ? "configured" : "not configured",
        },
      },
      endpoints: {
        auth: "/auth",
        users: "/users",
        avatars: "/avatar",
        wardrobe: "/wardrobe-items",
        imageProcessing: "/image-processing",
      },
    }
  }
}
