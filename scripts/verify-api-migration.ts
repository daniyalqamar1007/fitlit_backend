import * as fs from "fs"
import * as path from "path"

interface MigrationCheck {
  file: string
  oldApiUsage: string[]
  newApiUsage: string[]
  migrationStatus: "✅ COMPLETE" | "⚠️ PARTIAL" | "❌ NOT_STARTED"
  issues: string[]
}

interface MigrationReport {
  timestamp: string
  totalFiles: number
  completelyMigrated: number
  partiallyMigrated: number
  notMigrated: number
  checks: MigrationCheck[]
  summary: {
    openaiUsage: number
    replicateUsage: number
    removeBgUsage: number
    fallbackImplementations: number
  }
}

class APIMigrationVerifier {
  private checks: MigrationCheck[] = []

  async verifyMigration(): Promise<MigrationReport> {
    console.log("🔍 Verifying API Migration Status...")
    console.log("===================================")
    console.log()

    // Check all service files
    await this.checkServiceFiles()

    // Check configuration files
    await this.checkConfigFiles()

    // Check environment files
    await this.checkEnvFiles()

    // Generate migration report
    const report = this.generateMigrationReport()
    this.printMigrationReport(report)
    this.saveMigrationReport(report)

    return report
  }

  private async checkServiceFiles(): Promise<void> {
    const serviceFiles = [
      "src/image-processing/image-processing.service.ts",
      "src/avatar/avatar.service.ts",
      "src/wardrobe/wardrobe.service.ts",
      "src/background-images/background-images.service.ts",
      "src/avatar/utils/openai.service.ts",
    ]

    console.log("🔧 Checking Service Files...")

    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        await this.checkServiceFile(file)
      }
    }
  }

  private async checkServiceFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, "utf8")
    const oldApiUsage: string[] = []
    const newApiUsage: string[] = []
    const issues: string[] = []

    // Check for old API usage
    const oldApiPatterns = [
      { pattern: /import.*openai/gi, name: "OpenAI import" },
      { pattern: /new OpenAI/gi, name: "OpenAI instantiation" },
      { pattern: /openai\.images\.generate/gi, name: "OpenAI image generation" },
      { pattern: /openai\.images\.edit/gi, name: "OpenAI image editing" },
      { pattern: /dall-e/gi, name: "DALL-E model usage" },
      { pattern: /gpt-/gi, name: "GPT model usage" },
    ]

    oldApiPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern)
      if (matches) {
        oldApiUsage.push(...matches.map((match) => `${name}: ${match}`))
      }
    })

    // Check for new API usage
    const newApiPatterns = [
      { pattern: /REPLICATE_API_TOKEN/gi, name: "Replicate API Token" },
      { pattern: /api\.replicate\.com/gi, name: "Replicate API endpoint" },
      { pattern: /REMOVE_BG_API_KEY/gi, name: "Remove.bg API Key" },
      { pattern: /api\.remove\.bg/gi, name: "Remove.bg API endpoint" },
      { pattern: /removeBackground/gi, name: "Background removal method" },
      { pattern: /generateAvatar/gi, name: "Avatar generation method" },
      { pattern: /processClothingItem/gi, name: "Clothing processing method" },
    ]

    newApiPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern)
      if (matches) {
        newApiUsage.push(...matches.map((match) => `${name}: ${match}`))
      }
    })

    // Determine migration status
    let migrationStatus: "✅ COMPLETE" | "⚠️ PARTIAL" | "❌ NOT_STARTED"

    if (oldApiUsage.length === 0 && newApiUsage.length > 0) {
      migrationStatus = "✅ COMPLETE"
    } else if (oldApiUsage.length > 0 && newApiUsage.length > 0) {
      migrationStatus = "⚠️ PARTIAL"
      // Check if old API is marked as fallback
      if (content.includes("fallback") || content.includes("Fallback")) {
        issues.push("Old API usage found but marked as fallback - OK")
      } else {
        issues.push("Old API usage found without fallback marking")
      }
    } else if (oldApiUsage.length > 0 && newApiUsage.length === 0) {
      migrationStatus = "❌ NOT_STARTED"
      issues.push("Still using old APIs without new implementation")
    } else {
      migrationStatus = "⚠️ PARTIAL"
      issues.push("No API usage detected - may need implementation")
    }

    // Specific checks for each service
    if (filePath.includes("image-processing.service.ts")) {
      this.checkImageProcessingService(content, issues)
    } else if (filePath.includes("avatar.service.ts")) {
      this.checkAvatarService(content, issues)
    }

    this.checks.push({
      file: filePath,
      oldApiUsage,
      newApiUsage,
      migrationStatus,
      issues,
    })
  }

  private checkImageProcessingService(content: string, issues: string[]): void {
    // Should have Replicate integration
    if (!content.includes("REPLICATE_API_TOKEN")) {
      issues.push("Missing Replicate API integration")
    }

    // Should have Remove.bg integration
    if (!content.includes("REMOVE_BG_API_KEY") && !content.includes("removeApiKey")) {
      issues.push("Missing Remove.bg API integration")
    }

    // Should have caching
    if (!content.includes("cache") && !content.includes("Cache")) {
      issues.push("Missing caching implementation")
    }

    // Should have fallback methods
    if (!content.includes("fallback")) {
      issues.push("Missing fallback implementations")
    }

    // Check for required methods
    const requiredMethods = ["removeBackground", "generateAvatar", "processClothingItem", "generateOutfit"]
    requiredMethods.forEach((method) => {
      if (!content.includes(method)) {
        issues.push(`Missing required method: ${method}`)
      }
    })
  }

  private checkAvatarService(content: string, issues: string[]): void {
    // Should use ImageProcessingService
    if (!content.includes("imageProcessingService") && !content.includes("ImageProcessingService")) {
      issues.push("Should delegate to ImageProcessingService")
    }

    // Should not use OpenAI directly (except for fallback)
    if (content.includes("openai.images") && !content.includes("fallback")) {
      issues.push("Direct OpenAI usage without fallback marking")
    }

    // Should have swipe functionality
    if (!content.includes("swipe")) {
      issues.push("Missing swipe functionality")
    }
  }

  private async checkConfigFiles(): Promise<void> {
    console.log("⚙️  Checking Configuration Files...")

    const configFiles = ["src/app.module.ts", "package.json"]

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        await this.checkConfigFile(file)
      }
    }
  }

  private async checkConfigFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, "utf8")
    const oldApiUsage: string[] = []
    const newApiUsage: string[] = []
    const issues: string[] = []

    if (filePath.includes("package.json")) {
      try {
        const packageJson = JSON.parse(content)

        // Check dependencies
        if (packageJson.dependencies?.openai) {
          oldApiUsage.push("OpenAI dependency in package.json")
        }

        if (packageJson.dependencies?.axios) {
          newApiUsage.push("Axios for API calls")
        }

        if (packageJson.dependencies?.sharp) {
          newApiUsage.push("Sharp for image processing")
        }

        // Check for performance test scripts
        if (!packageJson.scripts?.["test:performance"]) {
          issues.push("Missing performance test scripts")
        }
      } catch (error) {
        issues.push("Invalid package.json format")
      }
    }

    let migrationStatus: "✅ COMPLETE" | "⚠️ PARTIAL" | "❌ NOT_STARTED"
    if (oldApiUsage.length === 0 && newApiUsage.length > 0) {
      migrationStatus = "✅ COMPLETE"
    } else if (oldApiUsage.length > 0 && newApiUsage.length > 0) {
      migrationStatus = "⚠️ PARTIAL"
    } else {
      migrationStatus = "❌ NOT_STARTED"
    }

    this.checks.push({
      file: filePath,
      oldApiUsage,
      newApiUsage,
      migrationStatus,
      issues,
    })
  }

  private async checkEnvFiles(): Promise<void> {
    console.log("🔐 Checking Environment Files...")

    const envFiles = [".env", ".env.example"]

    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        await this.checkEnvFile(file)
      }
    }
  }

  private async checkEnvFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, "utf8")
    const oldApiUsage: string[] = []
    const newApiUsage: string[] = []
    const issues: string[] = []

    // Check for old API keys
    if (content.includes("OPENAI_API_KEY")) {
      if (content.includes("# Fallback") || content.includes("# Optional")) {
        oldApiUsage.push("OPENAI_API_KEY (marked as fallback)")
      } else {
        oldApiUsage.push("OPENAI_API_KEY (not marked as fallback)")
        issues.push("OPENAI_API_KEY should be marked as fallback only")
      }
    }

    // Check for new API keys
    if (content.includes("REPLICATE_API_TOKEN")) {
      newApiUsage.push("REPLICATE_API_TOKEN")
    } else {
      issues.push("Missing REPLICATE_API_TOKEN")
    }

    if (content.includes("REMOVE_BG_API_KEY")) {
      newApiUsage.push("REMOVE_BG_API_KEY")
    } else {
      issues.push("Missing REMOVE_BG_API_KEY")
    }

    // Check for performance settings
    if (content.includes("IMAGE_CACHE_TTL")) {
      newApiUsage.push("IMAGE_CACHE_TTL (performance optimization)")
    }

    if (content.includes("MAX_CONCURRENT_PROCESSING")) {
      newApiUsage.push("MAX_CONCURRENT_PROCESSING (performance optimization)")
    }

    let migrationStatus: "✅ COMPLETE" | "⚠️ PARTIAL" | "❌ NOT_STARTED"
    if (newApiUsage.length >= 2 && issues.length === 0) {
      migrationStatus = "✅ COMPLETE"
    } else if (newApiUsage.length > 0) {
      migrationStatus = "⚠️ PARTIAL"
    } else {
      migrationStatus = "❌ NOT_STARTED"
    }

    this.checks.push({
      file: filePath,
      oldApiUsage,
      newApiUsage,
      migrationStatus,
      issues,
    })
  }

  private generateMigrationReport(): MigrationReport {
    const totalFiles = this.checks.length
    const completelyMigrated = this.checks.filter((c) => c.migrationStatus === "✅ COMPLETE").length
    const partiallyMigrated = this.checks.filter((c) => c.migrationStatus === "⚠️ PARTIAL").length
    const notMigrated = this.checks.filter((c) => c.migrationStatus === "❌ NOT_STARTED").length

    // Count API usage
    const openaiUsage = this.checks.reduce((sum, c) => sum + c.oldApiUsage.length, 0)
    const replicateUsage = this.checks.filter((c) => c.newApiUsage.some((usage) => usage.includes("Replicate"))).length
    const removeBgUsage = this.checks.filter((c) => c.newApiUsage.some((usage) => usage.includes("Remove.bg"))).length
    const fallbackImplementations = this.checks.filter((c) =>
      c.issues.some((issue) => issue.includes("fallback")),
    ).length

    return {
      timestamp: new Date().toISOString(),
      totalFiles,
      completelyMigrated,
      partiallyMigrated,
      notMigrated,
      checks: this.checks,
      summary: {
        openaiUsage,
        replicateUsage,
        removeBgUsage,
        fallbackImplementations,
      },
    }
  }

  private printMigrationReport(report: MigrationReport): void {
    console.log("\n📊 API MIGRATION VERIFICATION REPORT")
    console.log("====================================")
    console.log(`Total Files Checked: ${report.totalFiles}`)
    console.log(`✅ Completely Migrated: ${report.completelyMigrated}`)
    console.log(`⚠️  Partially Migrated: ${report.partiallyMigrated}`)
    console.log(`❌ Not Migrated: ${report.notMigrated}`)
    console.log()

    console.log("📈 API Usage Summary:")
    console.log(`OpenAI References: ${report.summary.openaiUsage}`)
    console.log(`Replicate Integration: ${report.summary.replicateUsage} files`)
    console.log(`Remove.bg Integration: ${report.summary.removeBgUsage} files`)
    console.log(`Fallback Implementations: ${report.summary.fallbackImplementations} files`)
    console.log()

    // Show detailed results
    console.log("📋 Detailed Migration Status:")
    report.checks.forEach((check) => {
      console.log(`\n${check.migrationStatus} ${check.file}`)

      if (check.oldApiUsage.length > 0) {
        console.log("  🔴 Old API Usage:")
        check.oldApiUsage.forEach((usage) => {
          console.log(`    • ${usage}`)
        })
      }

      if (check.newApiUsage.length > 0) {
        console.log("  🟢 New API Usage:")
        check.newApiUsage.forEach((usage) => {
          console.log(`    • ${usage}`)
        })
      }

      if (check.issues.length > 0) {
        console.log("  ⚠️  Issues:")
        check.issues.forEach((issue) => {
          console.log(`    • ${issue}`)
        })
      }
    })

    // Overall migration status
    console.log("\n🎯 OVERALL MIGRATION STATUS:")
    const migrationPercentage = (report.completelyMigrated / report.totalFiles) * 100

    if (migrationPercentage === 100 && report.summary.openaiUsage === 0) {
      console.log("🏆 MIGRATION COMPLETE - All APIs successfully migrated!")
    } else if (migrationPercentage >= 80) {
      console.log("✅ MIGRATION MOSTLY COMPLETE - Minor issues remaining")
    } else if (migrationPercentage >= 60) {
      console.log("⚠️  MIGRATION IN PROGRESS - Significant work remaining")
    } else {
      console.log("❌ MIGRATION NOT COMPLETE - Major work required")
    }

    console.log(`Migration Progress: ${migrationPercentage.toFixed(1)}%`)
  }

  private saveMigrationReport(report: MigrationReport): void {
    const reportPath = path.join(process.cwd(), "audit-reports", `migration-report-${Date.now()}.json`)

    const dir = path.dirname(reportPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n💾 Migration report saved to: ${reportPath}`)
  }
}

// Run migration verification
async function runMigrationVerification() {
  const verifier = new APIMigrationVerifier()
  const report = await verifier.verifyMigration()

  // Exit with appropriate code
  if (report.completelyMigrated === report.totalFiles && report.summary.openaiUsage === 0) {
    console.log("\n✅ Migration verification passed!")
    process.exit(0)
  } else if (report.notMigrated === 0) {
    console.log("\n⚠️  Migration verification passed with warnings")
    process.exit(0)
  } else {
    console.log("\n❌ Migration verification failed!")
    process.exit(1)
  }
}

if (require.main === module) {
  runMigrationVerification().catch(console.error)
}

export { APIMigrationVerifier, type MigrationCheck, type MigrationReport }
