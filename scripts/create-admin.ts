import { NestFactory } from "@nestjs/core"
import { AppModule } from "../src/app.module"
import { AdminService } from "../src/admin/admin.service"

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const adminService = app.get(AdminService)

  try {
    const admin = await adminService.createAdmin({
      email: "admin@fitlit.com",
      password: "admin123",
      name: "Admin User",
    })
    console.log("Admin created successfully:", admin)
  } catch (error) {
    console.error("Error creating admin:", error)
  }

  await app.close()
}

bootstrap()
