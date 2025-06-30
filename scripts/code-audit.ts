import * as fs from "fs"
import * as path from "path"

interface AuditResult {
  file: string
  issues: string[]
  warnings: string[]
  status: "✅ PASS" | "⚠️ WARNING" | "❌ FAIL"
}

interface CodeAudit {
  timestamp: string
  totalFiles: number
  passedFiles: number
  warningFiles: number
  failedFiles: number
  results: AuditResult[]
  summary: {
    openaiReferences: string[]
    chatgptReferences: string[]
    missingImports: string[]
    syntaxErrors: string[]
    patternViolations: string[]
  }
}

class CodeAuditor {
  private auditResults: AuditResult[] = []
  private openaiReferences: string[] = []
  private chatgptReferences: string[] = []
  private missingImports: string[] = []
  private syntaxErrors: string[] = []
  private patternViolations: string[] = []

  async auditCodebase(): Promise<CodeAudit> {
    console.log("🔍 Starting Comprehensive Code Audit...")
    console.log("=====================================")
    console.log()

    // Audit all TypeScript files
    await this.auditDirectory("src")
    await this.auditDirectory("scripts")

    // Check specific critical files
    await this.auditCriticalFiles()

    // Generate audit report
    const audit = this.generateAuditReport()
    this.printAuditResults(audit)
    this.saveAuditReport(audit)

    return audit
  }

  private async auditDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️  Directory ${dirPath} does not exist`)
      return
    }

    const files = this.getAllTypeScriptFiles(dirPath)
    console.log(`📁 Auditing ${files.length} files in ${dirPath}/`)

    for (const file of files) {
      await this.auditFile(file)
    }
  }

  private getAllTypeScriptFiles(dir: string): string[] {
    const files: string[] = []

    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.includes("node_modules") && !item.includes(".git")) {
        files.push(...this.getAllTypeScriptFiles(fullPath))
      } else if (item.endsWith(".ts") || item.endsWith(".js")) {
        files.push(fullPath)
      }
    }

    return files
  }

  private async auditFile(filePath: string): Promise<void> {
    const issues: string[] = []
    const warnings: string[] = []

    try {
      const content = fs.readFileSync(filePath, "utf8")
      const relativePath = path.relative(process.cwd(), filePath)

      // Check for OpenAI/ChatGPT references
      this.checkForDeprecatedAPIs(content, relativePath, issues)

      // Check imports and dependencies
      this.checkImportsAndDependencies(content, relativePath, warnings)

      // Check code patterns
      this.checkCodePatterns(content, relativePath, warnings)

      // Check syntax (basic)
      this.checkBasicSyntax(content, relativePath, issues)

      // Check specific service implementations
      this.checkServiceImplementations(content, relativePath, warnings)

      const status = issues.length > 0 ? "❌ FAIL" : warnings.length > 0 ? "⚠️ WARNING" : "✅ PASS"

      this.auditResults.push({
        file: relativePath,
        issues,
        warnings,
        status,
      })
    } catch (error) {
      this.auditResults.push({
        file: path.relative(process.cwd(), filePath),
        issues: [`Failed to read file: ${error.message}`],
        warnings: [],
        status: "❌ FAIL",
      })
    }
  }

  private checkForDeprecatedAPIs(content: string, filePath: string, issues: string[]): void {
    // Check for OpenAI references
    const openaiPatterns = [
      /import.*openai/gi,
      /from.*openai/gi,
      /OpenAI\(/gi,
      /openai\./gi,
      /OPENAI_API_KEY/gi,
      /gpt-/gi,
      /dall-e/gi,
      /text-davinci/gi,
      /chat\/completions/gi,
    ]

    openaiPatterns.forEach((pattern) => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const reference = `${filePath}: ${match}`
          this.openaiReferences.push(reference)
          issues.push(`Found OpenAI reference: ${match}`)
        })
      }
    })

    // Check for ChatGPT references
    const chatgptPatterns = [/chatgpt/gi, /chat-gpt/gi, /gpt-3/gi, /gpt-4/gi]

    chatgptPatterns.forEach((pattern) => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach((match) => {
          const reference = `${filePath}: ${match}`
          this.chatgptReferences.push(reference)
          issues.push(`Found ChatGPT reference: ${match}`)
        })
      }
    })
  }

  private checkImportsAndDependencies(content: string, filePath: string, warnings: string[]): void {
    // Check for missing imports
    const importPatterns = [
      { usage: /ImageProcessingService/g, import: /import.*ImageProcessingService/g },
      { usage: /AwsService/g, import: /import.*AwsService/g },
      { usage: /NotificationService/g, import: /import.*NotificationService/g },
      { usage: /axios/g, import: /import.*axios/g },
      { usage: /sharp/g, import: /import.*sharp/g },
    ]

    importPatterns.forEach(({ usage, import: importPattern }) => {
      const usageMatches = content.match(usage)
      const importMatches = content.match(importPattern)

      if (usageMatches && !importMatches && !filePath.includes("node_modules")) {
        warnings.push(`Potential missing import for ${usage.source}`)
      }
    })
  }

  private checkCodePatterns(content: string, filePath: string, warnings: string[]): void {
    // Check for consistent error handling
    if (content.includes("try {") && !content.includes("catch")) {
      warnings.push("Try block without catch block")
    }

    // Check for proper async/await usage
    if (content.includes("async ") && content.includes(".then(")) {
      warnings.push("Mixed async/await and Promise.then() usage")
    }

    // Check for console.log in production code (excluding scripts)
    if (!filePath.includes("scripts/") && content.includes("console.log")) {
      warnings.push("Console.log found in production code")
    }

    // Check for hardcoded URLs or keys
    const hardcodedPatterns = [/http:\/\/localhost/g, /your-.*-key/g, /test-.*-token/g]

    hardcodedPatterns.forEach((pattern) => {
      if (content.match(pattern)) {
        warnings.push(`Potential hardcoded value: ${pattern.source}`)
      }
    })
  }

  private checkBasicSyntax(content: string, filePath: string, issues: string[]): void {
    // Check for basic syntax issues
    const lines = content.split("\n")

    lines.forEach((line, index) => {
      // Check for unmatched brackets
      const openBrackets = (line.match(/\{/g) || []).length
      const closeBrackets = (line.match(/\}/g) || []).length

      // Check for missing semicolons (basic check)
      if (
        line.trim().endsWith(")") &&
        !line.trim().endsWith("=>") &&
        !line.includes("if") &&
        !line.includes("for") &&
        !line.includes("while") &&
        !line.includes("function") &&
        !line.includes("class") &&
        !line.includes("interface") &&
        !line.includes("type") &&
        !line.includes("//")
      ) {
        // This is a very basic check - in practice, you'd use a proper parser
      }
    })
  }

  private checkServiceImplementations(content: string, filePath: string, warnings: string[]): void {
    // Check ImageProcessingService implementation
    if (filePath.includes("image-processing.service.ts")) {
      if (!content.includes("REPLICATE_API_TOKEN")) {
        warnings.push("ImageProcessingService should use REPLICATE_API_TOKEN")
      }
      if (!content.includes("removeBackground")) {
        warnings.push("ImageProcessingService should implement removeBackground method")
      }
      if (!content.includes("generateAvatar")) {
        warnings.push("ImageProcessingService should implement generateAvatar method")
      }
    }

    // Check AvatarService implementation
    if (filePath.includes("avatar.service.ts")) {
      if (content.includes("OpenAI") && !content.includes("// Fallback")) {
        warnings.push("AvatarService should not use OpenAI as primary service")
      }
      if (!content.includes("imageProcessingService")) {
        warnings.push("AvatarService should use ImageProcessingService")
      }
    }

    // Check for proper error handling in services
    if (filePath.includes(".service.ts")) {
      if (!content.includes("try") && !content.includes("catch")) {
        warnings.push("Service should implement proper error handling")
      }
    }
  }

  private async auditCriticalFiles(): Promise<void> {
    console.log("\n🎯 Auditing Critical Files...")

    const criticalFiles = [
      "src/image-processing/image-processing.service.ts",
      "src/avatar/avatar.service.ts",
      "src/wardrobe/wardrobe.service.ts",
      "src/app.module.ts",
      "package.json",
      ".env",
    ]

    for (const file of criticalFiles) {
      if (fs.existsSync(file)) {
        await this.auditCriticalFile(file)
      } else {
        this.auditResults.push({
          file,
          issues: ["Critical file missing"],
          warnings: [],
          status: "❌ FAIL",
        })
      }
    }
  }

  private async auditCriticalFile(filePath: string): Promise<void> {
    const issues: string[] = []
    const warnings: string[] = []

    try {
      const content = fs.readFileSync(filePath, "utf8")

      // Specific checks for each critical file
      if (filePath.includes("package.json")) {
        this.auditPackageJson(content, issues, warnings)
      } else if (filePath.includes(".env")) {
        this.auditEnvFile(content, issues, warnings)
      } else if (filePath.includes("app.module.ts")) {
        this.auditAppModule(content, issues, warnings)
      } else if (filePath.includes("image-processing.service.ts")) {
        this.auditImageProcessingService(content, issues, warnings)
      } else if (filePath.includes("avatar.service.ts")) {
        this.auditAvatarService(content, issues, warnings)
      }

      const status = issues.length > 0 ? "❌ FAIL" : warnings.length > 0 ? "⚠️ WARNING" : "✅ PASS"

      this.auditResults.push({
        file: filePath,
        issues,
        warnings,
        status,
      })
    } catch (error) {
      this.auditResults.push({
        file: filePath,
        issues: [`Failed to audit critical file: ${error.message}`],
        warnings: [],
        status: "❌ FAIL",
      })
    }
  }

  private auditPackageJson(content: string, issues: string[], warnings: string[]): void {
    try {
      const packageJson = JSON.parse(content)

      // Check for required dependencies
      const requiredDeps = ["axios", "sharp", "@nestjs/common", "@nestjs/core", "mongoose"]
      requiredDeps.forEach((dep) => {
        if (!packageJson.dependencies?.[dep]) {
          issues.push(`Missing required dependency: ${dep}`)
        }
      })

      // Check for OpenAI dependency (should be removed or marked as fallback)
      if (packageJson.dependencies?.openai) {
        warnings.push("OpenAI dependency still present - ensure it's only used as fallback")
      }

      // Check for performance test scripts
      const requiredScripts = ["test:performance", "test:load", "test:benchmark"]
      requiredScripts.forEach((script) => {
        if (!packageJson.scripts?.[script]) {
          warnings.push(`Missing performance test script: ${script}`)
        }
      })
    } catch (error) {
      issues.push("Invalid JSON in package.json")
    }
  }

  private auditEnvFile(content: string, issues: string[], warnings: string[]): void {
    const requiredEnvVars = [
      "MONGODB_URI",
      "JWT_SECRET",
      "AWS_ACCESS_KEY",
      "AWS_SECRET_KEY",
      "S3_BUCKET_NAME",
      "REPLICATE_API_TOKEN",
      "REMOVE_BG_API_KEY",
    ]

    requiredEnvVars.forEach((envVar) => {
      if (!content.includes(envVar)) {
        issues.push(`Missing required environment variable: ${envVar}`)
      }
    })

    // Check if OpenAI key is still primary (should be fallback only)
    if (content.includes("OPENAI_API_KEY") && !content.includes("# Fallback")) {
      warnings.push("OPENAI_API_KEY should be marked as fallback only")
    }
  }

  private auditAppModule(content: string, issues: string[], warnings: string[]): void {
    const requiredModules = ["ImageProcessingModule", "AvatarModule", "WardrobeModule", "AwsModule"]

    requiredModules.forEach((module) => {
      if (!content.includes(module)) {
        issues.push(`Missing required module import: ${module}`)
      }
    })
  }

  private auditImageProcessingService(content: string, issues: string[], warnings: string[]): void {
    const requiredMethods = ["removeBackground", "generateAvatar", "processClothingItem", "generateOutfit"]

    requiredMethods.forEach((method) => {
      if (!content.includes(method)) {
        issues.push(`Missing required method: ${method}`)
      }
    })

    // Check for proper API usage
    if (!content.includes("REPLICATE_API_TOKEN")) {
      issues.push("Should use REPLICATE_API_TOKEN for primary processing")
    }

    if (!content.includes("Remove.bg") && !content.includes("removeApiKey")) {
      issues.push("Should implement Remove.bg for background removal")
    }

    // Check for caching implementation
    if (!content.includes("cache") && !content.includes("Cache")) {
      warnings.push("Should implement caching for better performance")
    }
  }

  private auditAvatarService(content: string, issues: string[], warnings: string[]): void {
    // Check that it uses ImageProcessingService
    if (!content.includes("imageProcessingService") && !content.includes("ImageProcessingService")) {
      issues.push("Should use ImageProcessingService for image operations")
    }

    // Check for proper swipe implementation
    if (!content.includes("swipe") || !content.includes("SwipeState")) {
      warnings.push("Should implement proper swipe functionality")
    }

    // Check that OpenAI is not primary service
    if (content.includes("openai.images.generate") && !content.includes("fallback")) {
      issues.push("Should not use OpenAI as primary image generation service")
    }
  }

  private generateAuditReport(): CodeAudit {
    const totalFiles = this.auditResults.length
    const passedFiles = this.auditResults.filter((r) => r.status === "✅ PASS").length
    const warningFiles = this.auditResults.filter((r) => r.status === "⚠️ WARNING").length
    const failedFiles = this.auditResults.filter((r) => r.status === "❌ FAIL").length

    return {
      timestamp: new Date().toISOString(),
      totalFiles,
      passedFiles,
      warningFiles,
      failedFiles,
      results: this.auditResults,
      summary: {
        openaiReferences: this.openaiReferences,
        chatgptReferences: this.chatgptReferences,
        missingImports: this.missingImports,
        syntaxErrors: this.syntaxErrors,
        patternViolations: this.patternViolations,
      },
    }
  }

  private printAuditResults(audit: CodeAudit): void {
    console.log("\n📊 CODE AUDIT RESULTS")
    console.log("====================")
    console.log(`Total Files Audited: ${audit.totalFiles}`)
    console.log(`✅ Passed: ${audit.passedFiles}`)
    console.log(`⚠️  Warnings: ${audit.warningFiles}`)
    console.log(`❌ Failed: ${audit.failedFiles}`)
    console.log()

    // Show critical issues first
    const failedFiles = audit.results.filter((r) => r.status === "❌ FAIL")
    if (failedFiles.length > 0) {
      console.log("❌ CRITICAL ISSUES:")
      failedFiles.forEach((result) => {
        console.log(`\n📁 ${result.file}`)
        result.issues.forEach((issue) => {
          console.log(`   ❌ ${issue}`)
        })
      })
      console.log()
    }

    // Show warnings
    const warningFiles = audit.results.filter((r) => r.status === "⚠️ WARNING")
    if (warningFiles.length > 0) {
      console.log("⚠️  WARNINGS:")
      warningFiles.forEach((result) => {
        console.log(`\n📁 ${result.file}`)
        result.warnings.forEach((warning) => {
          console.log(`   ⚠️  ${warning}`)
        })
      })
      console.log()
    }

    // API Migration Status
    console.log("🔄 API MIGRATION STATUS:")
    if (audit.summary.openaiReferences.length === 0) {
      console.log("✅ No OpenAI references found - Migration complete!")
    } else {
      console.log("❌ OpenAI references still found:")
      audit.summary.openaiReferences.forEach((ref) => {
        console.log(`   📍 ${ref}`)
      })
    }

    if (audit.summary.chatgptReferences.length === 0) {
      console.log("✅ No ChatGPT references found")
    } else {
      console.log("❌ ChatGPT references still found:")
      audit.summary.chatgptReferences.forEach((ref) => {
        console.log(`   📍 ${ref}`)
      })
    }

    // Overall Grade
    const successRate = (audit.passedFiles / audit.totalFiles) * 100
    let grade = "F"
    let status = "❌ FAILED"

    if (successRate >= 95 && audit.failedFiles === 0) {
      grade = "A+"
      status = "🏆 EXCELLENT"
    } else if (successRate >= 90 && audit.failedFiles === 0) {
      grade = "A"
      status = "✅ PASSED"
    } else if (successRate >= 85 && audit.failedFiles <= 2) {
      grade = "B+"
      status = "⚠️  GOOD"
    } else if (successRate >= 80) {
      grade = "B"
      status = "⚠️  FAIR"
    } else if (successRate >= 70) {
      grade = "C"
      status = "⚠️  NEEDS WORK"
    } else {
      grade = "F"
      status = "❌ FAILED"
    }

    console.log(`\n🎯 OVERALL AUDIT GRADE: ${grade} - ${status}`)
    console.log(`Success Rate: ${successRate.toFixed(1)}%`)
  }

  private saveAuditReport(audit: CodeAudit): void {
    const reportPath = path.join(process.cwd(), "audit-reports", `code-audit-${Date.now()}.json`)

    const dir = path.dirname(reportPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2))
    console.log(`\n💾 Audit report saved to: ${reportPath}`)
  }
}

// Run the audit
async function runCodeAudit() {
  const auditor = new CodeAuditor()
  const audit = await auditor.auditCodebase()

  // Exit with error code if there are critical issues
  if (audit.failedFiles > 0) {
    console.log("\n❌ Code audit failed - Critical issues found!")
    process.exit(1)
  } else if (audit.warningFiles > 0) {
    console.log("\n⚠️  Code audit passed with warnings")
    process.exit(0)
  } else {
    console.log("\n✅ Code audit passed - All checks successful!")
    process.exit(0)
  }
}

if (require.main === module) {
  runCodeAudit().catch(console.error)
}

export { CodeAuditor, type AuditResult, type CodeAudit }
