import { Transform } from "class-transformer"
import { IsEmail, Matches } from "class-validator"

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Please provide a valid email address" })
  @Matches(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: "Email must be in a valid format (e.g., user@example.com)",
  })
  @Transform(({ value }) => value.trim())
  email: string
}
