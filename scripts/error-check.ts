import * as fs from "fs"
import * as path from "path"

interface ErrorCheck {
  file: string
  errors: string[]
  warnings: string[]
  severity: "🟢 CLEAN" | "🟡 WARNINGS" | "🔴 ERRORS"
}

interface SystemCheck {
  timestamp: string
  totalFiles: number
  cleanFiles: number
  warningFiles: number
  errorFiles: number
  checks: ErrorCheck[]
  summary: {
    criticalErrors: string[]
    commonIssues: string[]
    recommendations: string[]
  }
}

class BackendErrorChecker {
  private checks: ErrorCheck[] = []
  private criticalErrors: string[] = []
  private commonIssues: string[] = []
  private recommendations: string[] = []

  async checkBackendErrors(): Promise<SystemCheck> {
    console.log("🔍 Checking Backend for Errors...")
    console.log("=================================")
    console.log()

    // Check critical files
    await this.checkCriticalFiles()

    // Check service files
    await this.checkServiceFiles()

    // Check configuration files
    await this.checkConfigurationFiles()

    // Check dependencies
    await this.checkDependencies()

    // Check environment setup
    await this.checkEnvironmentSetup()

    // Generate system check report
    const systemCheck = this.generateSystemCheck()
    this.printErrorReport(systemCheck)
    this.generateRunInstructions()

    return systemCheck
  }

  private async checkCriticalFiles(): Promise<void> {
    console.log("📁 Checking Critical Files...")

    const criticalFiles = [
      { path: "src/main.ts", required: true },
      { path: "src/app.module.ts", required: true },
      { path: "package.json", required: true },
      { path: ".env", required: false },
      { path: "tsconfig.json", required: true },
      { path: "nest-cli.json", required: true },
    ]

    for (const file of criticalFiles) {
      await this.checkFile(file.path, file.required)
    }
  }

  private async checkServiceFiles(): Promise<void> {
    console.log("🔧 Checking Service Files...")

    const serviceFiles = [
      "src/auth/auth.service.ts",
      "src/user/user.service.ts",
      "src/avatar/avatar.service.ts",
      "src/wardrobe/wardrobe.service.ts",
      "src/image-processing/image-processing.service.ts",
      "src/aws/aws.service.ts",
    ]

    for (const file of serviceFiles) {
      await this.checkServiceFile(file)
    }
  }

  private async checkFile(filePath: string, required: boolean): Promise<void> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!fs.existsSync(filePath)) {
      if (required) {
        errors.push(`Critical file missing: ${filePath}`)
        this.criticalErrors.push(`Missing required file: ${filePath}`)
      } else {
        warnings.push(`Optional file missing: ${filePath}`)
      }
    } else {
      try {
        const content = fs.readFileSync(filePath, "utf8")

        // Check for basic syntax issues
        if (filePath.endsWith(".json")) {
          try {
            JSON.parse(content)
          } catch (e) {
            errors.push(`Invalid JSON syntax in ${filePath}`)
          }
        }

        // Check for common issues
        if (filePath === "src/main.ts") {
          this.checkMainFile(content, errors, warnings)
        } else if (filePath === "src/app.module.ts") {
          this.checkAppModule(content, errors, warnings)
        } else if (filePath === "package.json") {
          this.checkPackageJson(content, errors, warnings)
        }
      } catch (error) {
        errors.push(`Cannot read file: ${filePath} - ${error.message}`)
      }
    }

    const severity = errors.length > 0 ? "🔴 ERRORS" : warnings.length > 0 ? "🟡 WARNINGS" : "🟢 CLEAN"

    this.checks.push({
      file: filePath,
      errors,
      warnings,
      severity,
    })
  }

  private checkMainFile(content: string, errors: string[], warnings: string[]): void {
    if (!content.includes("NestFactory.create")) {
      errors.push("Missing NestFactory.create in main.ts")
    }

    if (!content.includes("app.listen")) {
      errors.push("Missing app.listen in main.ts")
    }

    if (!content.includes("enableCors")) {
      warnings.push("CORS not enabled - may cause frontend connection issues")
    }

    if (!content.includes("ValidationPipe")) {
      warnings.push("Global validation pipe not configured")
    }
  }

  private checkAppModule(content: string, errors: string[], warnings: string[]): void {
    const requiredModules = [
      "MongooseModule",
      "ConfigModule",
      "AuthModule",
      "UserModule",
      "AvatarModule",
      "WardrobeModule",
    ]

    requiredModules.forEach((module) => {
      if (!content.includes(module)) {
        errors.push(`Missing required module: ${module}`)
      }
    })

    if (!content.includes("forRoot")) {
      errors.push("Missing database configuration")
    }
  }

  private checkPackageJson(content: string, errors: string[], warnings: string[]): void {
    try {
      const packageJson = JSON.parse(content)

      const requiredDeps = ["@nestjs/common", "@nestjs/core", "@nestjs/mongoose", "mongoose", "bcrypt", "jsonwebtoken"]

      requiredDeps.forEach((dep) => {
        if (!packageJson.dependencies?.[dep]) {
          errors.push(`Missing required dependency: ${dep}`)
        }
      })

      const requiredScripts = ["start", "start:dev", "build"]
      requiredScripts.forEach((script) => {
        if (!packageJson.scripts?.[script]) {
          warnings.push(`Missing script: ${script}`)
        }
      })
    } catch (e) {
      errors.push("Invalid package.json format")
    }
  }

  private async checkServiceFile(filePath: string): Promise<void> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!fs.existsSync(filePath)) {
      warnings.push(`Service file not found: ${filePath}`)
      this.checks.push({
        file: filePath,
        errors,
        warnings,
        severity: "🟡 WARNINGS",
      })
      return
    }

    try {
      const content = fs.readFileSync(filePath, "utf8")

      // Check for basic service structure
      if (!content.includes("@Injectable()")) {
        errors.push("Missing @Injectable() decorator")
      }

      if (!content.includes("export class")) {
        errors.push("Missing class export")
      }

      // Check for proper imports
      if (!content.includes("import") && content.length > 100) {
        warnings.push("No imports found - may be incomplete")
      }

      // Service-specific checks
      if (filePath.includes("auth.service.ts")) {
        this.checkAuthService(content, errors, warnings)
      } else if (filePath.includes("avatar.service.ts")) {
        this.checkAvatarService(content, errors, warnings)
      } else if (filePath.includes("image-processing.service.ts")) {
        this.checkImageProcessingService(content, errors, warnings)
      }
    } catch (error) {
      errors.push(`Cannot read service file: ${error.message}`)
    }

    const severity = errors.length > 0 ? "🔴 ERRORS" : warnings.length > 0 ? "🟡 WARNINGS" : "🟢 CLEAN"

    this.checks.push({
      file: filePath,
      errors,
      warnings,
      severity,
    })
  }

  private checkAuthService(content: string, errors: string[], warnings: string[]): void {
    if (!content.includes("bcrypt")) {
      errors.push("Missing bcrypt for password hashing")
    }

    if (!content.includes("jwt") && !content.includes("JwtService")) {
      errors.push("Missing JWT implementation")
    }
  }

  private checkAvatarService(content: string, errors: string[], warnings: string[]): void {
    if (content.includes("openai") && !content.includes("fallback")) {
      warnings.push("OpenAI usage without fallback marking")
    }

    if (!content.includes("imageProcessingService")) {
      warnings.push("Should use ImageProcessingService for image operations")
    }
  }

  private checkImageProcessingService(content: string, errors: string[], warnings: string[]): void {
    if (!content.includes("REPLICATE_API_TOKEN")) {
      warnings.push("Missing Replicate API integration")
    }

    if (!content.includes("removeBackground")) {
      errors.push("Missing removeBackground method")
    }
  }

  private async checkConfigurationFiles(): Promise<void> {
    console.log("⚙️ Checking Configuration Files...")

    const configFiles = ["tsconfig.json", "nest-cli.json", ".env"]

    for (const file of configFiles) {
      await this.checkConfigFile(file)
    }
  }

  private async checkConfigFile(filePath: string): Promise<void> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!fs.existsSync(filePath)) {
      if (filePath === ".env") {
        warnings.push("No .env file found - using environment variables")
      } else {
        errors.push(`Missing configuration file: ${filePath}`)
      }
    } else {
      try {
        const content = fs.readFileSync(filePath, "utf8")

        if (filePath === ".env") {
          this.checkEnvFile(content, errors, warnings)
        } else if (filePath.endsWith(".json")) {
          try {
            JSON.parse(content)
          } catch (e) {
            errors.push(`Invalid JSON in ${filePath}`)
          }
        }
      } catch (error) {
        errors.push(`Cannot read ${filePath}: ${error.message}`)
      }
    }

    const severity = errors.length > 0 ? "🔴 ERRORS" : warnings.length > 0 ? "🟡 WARNINGS" : "🟢 CLEAN"

    this.checks.push({
      file: filePath,
      errors,
      warnings,
      severity,
    })
  }

  private checkEnvFile(content: string, errors: string[], warnings: string[]): void {
    const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "PORT"]

    const recommendedEnvVars = ["AWS_ACCESS_KEY", "AWS_SECRET_KEY", "S3_BUCKET_NAME", "REPLICATE_API_TOKEN"]

    requiredEnvVars.forEach((envVar) => {
      if (!content.includes(envVar)) {
        errors.push(`Missing required environment variable: ${envVar}`)
      }
    })

    recommendedEnvVars.forEach((envVar) => {
      if (!content.includes(envVar)) {
        warnings.push(`Missing recommended environment variable: ${envVar}`)
      }
    })
  }

  private async checkDependencies(): Promise<void> {
    console.log("📦 Checking Dependencies...")

    if (!fs.existsSync("package.json")) {
      this.criticalErrors.push("package.json not found")
      return
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
      const errors: string[] = []
      const warnings: string[] = []

      // Check for conflicting versions
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

      // Check NestJS version consistency
      const nestjsPackages = Object.keys(deps).filter((pkg) => pkg.startsWith("@nestjs/"))
      const nestjsVersions = new Set(nestjsPackages.map((pkg) => deps[pkg]))

      if (nestjsVersions.size > 1) {
        warnings.push("Inconsistent NestJS package versions detected")
      }

      // Check for missing peer dependencies
      if (deps["@nestjs/mongoose"] && !deps["mongoose"]) {
        errors.push("Missing peer dependency: mongoose")
      }

      if (deps["@nestjs/jwt"] && !deps["jsonwebtoken"]) {
        warnings.push("Missing peer dependency: jsonwebtoken")
      }

      const severity = errors.length > 0 ? "🔴 ERRORS" : warnings.length > 0 ? "🟡 WARNINGS" : "🟢 CLEAN"

      this.checks.push({
        file: "Dependencies",
        errors,
        warnings,
        severity,
      })
    } catch (error) {
      this.criticalErrors.push(`Cannot parse package.json: ${error.message}`)
    }
  }

  private async checkEnvironmentSetup(): Promise<void> {
    console.log("🌍 Checking Environment Setup...")

    const errors: string[] = []
    const warnings: string[] = []

    // Check Node.js version
    const nodeVersion = process.version
    const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0])

    if (majorVersion < 16) {
      errors.push(`Node.js version ${nodeVersion} is too old. Minimum required: 16.x`)
    } else if (majorVersion < 18) {
      warnings.push(`Node.js version ${nodeVersion} works but 18.x+ recommended`)
    }

    // Check if node_modules exists
    if (!fs.existsSync("node_modules")) {
      errors.push("node_modules not found - run 'npm install'")
    }

    // Check TypeScript compilation
    if (fs.existsSync("tsconfig.json")) {
      try {
        // This is a basic check - in practice you'd run tsc --noEmit
        const tsconfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"))
        if (!tsconfig.compilerOptions) {
          warnings.push("Invalid TypeScript configuration")
        }
      } catch (e) {
        errors.push("Invalid tsconfig.json")
      }
    }

    const severity = errors.length > 0 ? "🔴 ERRORS" : warnings.length > 0 ? "🟡 WARNINGS" : "🟢 CLEAN"

    this.checks.push({
      file: "Environment",
      errors,
      warnings,
      severity,
    })
  }

  private generateSystemCheck(): SystemCheck {
    const totalFiles = this.checks.length
    const cleanFiles = this.checks.filter((c) => c.severity === "🟢 CLEAN").length
    const warningFiles = this.checks.filter((c) => c.severity === "🟡 WARNINGS").length
    const errorFiles = this.checks.filter((c) => c.severity === "🔴 ERRORS").length

    // Generate recommendations
    if (errorFiles > 0) {
      this.recommendations.push("Fix critical errors before running the backend")
    }

    if (warningFiles > 0) {
      this.recommendations.push("Address warnings for optimal performance")
    }

    this.recommendations.push("Ensure all environment variables are properly set")
    this.recommendations.push("Run 'npm install' to install dependencies")
    this.recommendations.push("Use 'npm run start:dev' for development")

    return {
      timestamp: new Date().toISOString(),
      totalFiles,
      cleanFiles,
      warningFiles,
      errorFiles,
      checks: this.checks,
      summary: {
        criticalErrors: this.criticalErrors,
        commonIssues: this.commonIssues,
        recommendations: this.recommendations,
      },
    }
  }

  private printErrorReport(systemCheck: SystemCheck): void {
    console.log("\n📊 BACKEND ERROR CHECK RESULTS")
    console.log("==============================")
    console.log(`Total Checks: ${systemCheck.totalFiles}`)
    console.log(`🟢 Clean: ${systemCheck.cleanFiles}`)
    console.log(`🟡 Warnings: ${systemCheck.warningFiles}`)
    console.log(`🔴 Errors: ${systemCheck.errorFiles}`)
    console.log()

    // Show critical errors first
    if (systemCheck.summary.criticalErrors.length > 0) {
      console.log("🚨 CRITICAL ERRORS:")
      systemCheck.summary.criticalErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`)
      })
      console.log()
    }

    // Show detailed results
    systemCheck.checks.forEach((check) => {
      if (check.errors.length > 0 || check.warnings.length > 0) {
        console.log(`${check.severity} ${check.file}`)

        check.errors.forEach((error) => {
          console.log(`  🔴 ${error}`)
        })

        check.warnings.forEach((warning) => {
          console.log(`  🟡 ${warning}`)
        })
        console.log()
      }
    })

    // Overall status
    console.log("🎯 OVERALL STATUS:")
    if (systemCheck.errorFiles === 0) {
      console.log("✅ BACKEND READY TO RUN")
    } else {
      console.log("❌ BACKEND HAS CRITICAL ERRORS - FIX BEFORE RUNNING")
    }
  }

  private generateRunInstructions(): void {
    console.log("\n🚀 BACKEND & FRONTEND RUN INSTRUCTIONS")
    console.log("======================================")

    console.log("\n📋 PREREQUISITES:")
    console.log("1. Node.js 16+ installed")
    console.log("2. MongoDB running (local or cloud)")
    console.log("3. Environment variables configured")
    console.log("4. Dependencies installed")

    console.log("\n🔧 BACKEND SETUP:")
    console.log("```bash")
    console.log("# 1. Install dependencies")
    console.log("npm install")
    console.log("")
    console.log("# 2. Set up environment variables")
    console.log("cp .env.example .env  # if available")
    console.log("# Edit .env with your values")
    console.log("")
    console.log("# 3. Start MongoDB (if local)")
    console.log("mongod  # or brew services start mongodb-community")
    console.log("")
    console.log("# 4. Run backend in development mode")
    console.log("npm run start:dev")
    console.log("")
    console.log("# Alternative: Run in production mode")
    console.log("npm run build")
    console.log("npm run start:prod")
    console.log("```")

    console.log("\n🎨 FRONTEND SETUP (React/Next.js):")
    console.log("```bash")
    console.log("# Navigate to frontend directory")
    console.log("cd ../frontend  # or your frontend folder")
    console.log("")
    console.log("# Install frontend dependencies")
    console.log("npm install")
    console.log("")
    console.log("# Set up frontend environment")
    console.log("# Create .env.local with:")
    console.log("NEXT_PUBLIC_API_URL=http://localhost:3099")
    console.log("# or your backend URL")
    console.log("")
    console.log("# Start frontend development server")
    console.log("npm run dev")
    console.log("```")

    console.log("\n🔄 RUNNING BOTH TOGETHER:")
    console.log("```bash")
    console.log("# Terminal 1 - Backend")
    console.log("cd backend")
    console.log("npm run start:dev")
    console.log("")
    console.log("# Terminal 2 - Frontend")
    console.log("cd frontend")
    console.log("npm run dev")
    console.log("")
    console.log("# Access:")
    console.log("# Backend API: http://localhost:3099")
    console.log("# Frontend: http://localhost:3000")
    console.log("```")

    console.log("\n🐳 DOCKER SETUP (Optional):")
    console.log("```bash")
    console.log("# If you have docker-compose.yml")
    console.log("docker-compose up -d")
    console.log("")
    console.log("# Or individual containers")
    console.log("docker run -d -p 27017:27017 mongo")
    console.log("npm run start:dev")
    console.log("```")

    console.log("\n🔍 TROUBLESHOOTING:")
    console.log("• Port conflicts: Change PORT in .env")
    console.log("• MongoDB connection: Check MONGODB_URI")
    console.log("• CORS issues: Verify enableCors() in main.ts")
    console.log("• Missing modules: Run 'npm install'")
    console.log("• TypeScript errors: Run 'npm run build'")

    console.log("\n📱 TESTING THE CONNECTION:")
    console.log("```bash")
    console.log("# Test backend health")
    console.log("curl http://localhost:3099/health")
    console.log("")
    console.log("# Test API endpoint")
    console.log("curl http://localhost:3099/api/users")
    console.log("```")
  }
}

// Run error check
async function runErrorCheck() {
  const checker = new BackendErrorChecker()
  const result = await checker.checkBackendErrors()

  // Save error report
  const reportPath = path.join(process.cwd(), "audit-reports", `error-check-${Date.now()}.json`)
  const dir = path.dirname(reportPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2))
  console.log(`\n💾 Error check report saved to: ${reportPath}`)

  return result
}

if (require.main === module) {
  runErrorCheck().catch(console.error)
}

export { BackendErrorChecker, type ErrorCheck, type SystemCheck }
