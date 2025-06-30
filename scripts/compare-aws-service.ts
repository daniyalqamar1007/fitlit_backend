import * as fs from "fs"
import * as path from "path"

interface ComparisonResult {
  file: string
  hasChanges: boolean
  differences: string[]
  issues: string[]
  status: "✅ IDENTICAL" | "⚠️ MINOR_CHANGES" | "❌ MAJOR_CHANGES"
}

class AWSServiceComparator {
  private providedContent: string
  private currentContent: string

  constructor() {
    // The provided content from the user
    this.providedContent = `import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseDto } from './dto/response.dto';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as Multer from 'multer';

@Injectable()
export class AwsService {
  private s3: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: process.env.AWS_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;
  }

  // async uploadFile(base64: any, file?: Multer.File): Promise<string> {
  //   const fileKey = \`wardrobe/\${Date.now()}-\${file?.originalname || 'image.png'}\`;
  //   // Remove the base64 header if it exists (optional safety step)
  //   const base64Data = base64.replace(/^data:image\\/\\w+;base64,/, '');
  //   const buffer = Buffer.from(base64Data, 'base64'); // ✅ convert to binary buffer
  //   const command = new PutObjectCommand({
  //     Bucket: this.bucketName,
  //     Key: fileKey,
  //     Body: buffer, // ✅ use buffer, not base64 string
  //     ContentType: file?.mimetype || 'image/png',
  //     // ACL: 'public-read', // optional
  //   });
  //   await this.s3.send(command);
  //   return \`https://\${this.bucketName}.s3.\${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/\${fileKey}\`;
  // }

  // async uploadFile(buffer: any, file?:  Multer.File ): Promise<string> {
  //   const fileKey = \`wardrobe/\${Date.now()}-\${file.originalname}\`;
  //   const command = new PutObjectCommand({
  //     Bucket: this.bucketName,
  //     Key: fileKey,
  //     Body: buffer,
  //     ContentType: file.mimetype,
  //     // ACL: 'public-read', // Make the file publicly accessible
  //   });
  //   await this.s3.send(command);
  //   // Generate the public URL
  //   return \`https://\${this.bucketName}.s3.\${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/\${fileKey}\`;
  // }

  async uploadFile(buffer: Buffer, file?: Multer.File): Promise<string> {
    const fileKey = \`wardrobe/\${Date.now()}-\${file?.originalname || 'image.png'}\`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: buffer, // Already a buffer — no conversion needed
      ContentType: 'image/png',
      // ACL: 'public-read', // optional
    });
    await this.s3.send(command);
    return \`https://\${this.bucketName}.s3.\${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/\${fileKey}\`;
  }

  async uploadFileDress(file: Multer.File, userId: string): Promise<string> {
    const fileKey = \`wardrobe/\${userId}/\${Date.now()}-\${file.originalname}\`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Make the file publicly accessible
    });
    await this.s3.send(command);
    // Generate the public URL
    return \`https://\${this.bucketName}.s3.\${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/\${fileKey}\`;
  }

  async generateSignedUrl(
    fileName: string,
    contentType: string,
    timeStamp?: string,
  ) {
    try {
      if (timeStamp) {
        const key = fileName;
        // console.log(key)
        // Create a PutObjectCommand with the correct parameters
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
        });
        // Generate the signed URL
        const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes
        return {
          success: false,
          statusCode: HttpStatus.OK,
          msg: {
            url,
            key,
          },
        };
      } else {
        const key = \`\${Date.now()}-\${fileName}\`;
        // Create a PutObjectCommand with the correct parameters
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
        });
        // Generate the signed URL
        const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes
        return {
          success: false,
          statusCode: HttpStatus.OK,
          msg: {
            url,
            key,
          },
        };
      }
    } catch (e) {
      return { success: false, statusCode: HttpStatus.INTERNAL_SERVER_ERROR };
    }
  }

  async deleteFile(key: string): Promise<ResponseDto> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3.send(command);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: \`File \${key} deleted successfully\`,
      };
    } catch (error) {
      console.log(\`Failed to delete file: \${error.message}\`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: error.message,
      };
    }
  }
}`

    // Read the current content from the file
    const currentFilePath = "src/aws/aws.service.ts"
    if (fs.existsSync(currentFilePath)) {
      this.currentContent = fs.readFileSync(currentFilePath, "utf8")
    } else {
      this.currentContent = ""
    }
  }

  compareContent(): ComparisonResult {
    const differences: string[] = []
    const issues: string[] = []

    console.log("🔍 Comparing AWS Service Content...")
    console.log("=================================")

    // Normalize content for comparison (remove extra whitespace, normalize line endings)
    const normalizeContent = (content: string): string => {
      return content
        .replace(/\r\n/g, "\n") // Normalize line endings
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/\s*{\s*/g, "{") // Normalize braces
        .replace(/\s*}\s*/g, "}") // Normalize braces
        .replace(/\s*;\s*/g, ";") // Normalize semicolons
        .trim()
    }

    const normalizedProvided = normalizeContent(this.providedContent)
    const normalizedCurrent = normalizeContent(this.currentContent)

    // Check if files are identical
    if (normalizedProvided === normalizedCurrent) {
      return {
        file: "src/aws/aws.service.ts",
        hasChanges: false,
        differences: [],
        issues: [],
        status: "✅ IDENTICAL",
      }
    }

    // Detailed comparison
    this.compareImports(differences)
    this.compareClassStructure(differences)
    this.compareMethods(differences, issues)
    this.compareCommentedCode(differences, issues)

    // Determine status
    let status: "✅ IDENTICAL" | "⚠️ MINOR_CHANGES" | "❌ MAJOR_CHANGES"
    if (issues.length > 0) {
      status = "❌ MAJOR_CHANGES"
    } else if (differences.length > 0) {
      status = "⚠️ MINOR_CHANGES"
    } else {
      status = "✅ IDENTICAL"
    }

    return {
      file: "src/aws/aws.service.ts",
      hasChanges: differences.length > 0 || issues.length > 0,
      differences,
      issues,
      status,
    }
  }

  private compareImports(differences: string[]): void {
    const providedImports = this.extractImports(this.providedContent)
    const currentImports = this.extractImports(this.currentContent)

    // Check for missing imports
    providedImports.forEach((imp) => {
      if (!currentImports.includes(imp)) {
        differences.push(`Missing import: ${imp}`)
      }
    })

    // Check for extra imports
    currentImports.forEach((imp) => {
      if (!providedImports.includes(imp)) {
        differences.push(`Extra import in current file: ${imp}`)
      }
    })
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?/g
    const matches = content.match(importRegex) || []
    return matches.map((match) => match.trim())
  }

  private compareClassStructure(differences: string[]): void {
    // Check class declaration
    const providedClass = this.providedContent.match(/export class AwsService\s*{/)
    const currentClass = this.currentContent.match(/export class AwsService\s*{/)

    if (!providedClass && currentClass) {
      differences.push("Class declaration differs")
    }

    // Check constructor
    const providedConstructor = this.providedContent.includes("constructor(private configService: ConfigService)")
    const currentConstructor = this.currentContent.includes("constructor(private configService: ConfigService)")

    if (providedConstructor !== currentConstructor) {
      differences.push("Constructor signature differs")
    }
  }

  private compareMethods(differences: string[], issues: string[]): void {
    const providedMethods = this.extractMethods(this.providedContent)
    const currentMethods = this.extractMethods(this.currentContent)

    // Check for method differences
    const methodNames = new Set([...Object.keys(providedMethods), ...Object.keys(currentMethods)])

    methodNames.forEach((methodName) => {
      const providedMethod = providedMethods[methodName]
      const currentMethod = currentMethods[methodName]

      if (providedMethod && !currentMethod) {
        differences.push(`Method missing in current file: ${methodName}`)
      } else if (!providedMethod && currentMethod) {
        differences.push(`Extra method in current file: ${methodName}`)
      } else if (providedMethod && currentMethod) {
        // Compare method signatures
        const providedSignature = this.extractMethodSignature(providedMethod)
        const currentSignature = this.extractMethodSignature(currentMethod)

        if (providedSignature !== currentSignature) {
          differences.push(`Method signature differs: ${methodName}`)
          differences.push(`  Provided: ${providedSignature}`)
          differences.push(`  Current: ${currentSignature}`)
        }

        // Check for critical differences in implementation
        this.checkMethodImplementation(methodName, providedMethod, currentMethod, issues)
      }
    })
  }

  private extractMethods(content: string): Record<string, string> {
    const methods: Record<string, string> = {}
    const methodRegex = /async\s+(\w+)\s*$$[^)]*$$[^{]*{[^}]*(?:{[^}]*}[^}]*)*}/g
    let match

    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1]
      const methodBody = match[0]
      methods[methodName] = methodBody
    }

    return methods
  }

  private extractMethodSignature(methodContent: string): string {
    const signatureMatch = methodContent.match(/async\s+\w+\s*$$[^)]*$$[^{]*/)
    return signatureMatch ? signatureMatch[0].trim() : ""
  }

  private checkMethodImplementation(
    methodName: string,
    providedMethod: string,
    currentMethod: string,
    issues: string[],
  ): void {
    // Check for critical implementation differences
    if (methodName === "uploadFile") {
      // Check if the method signature is compatible
      const providedHasBuffer = providedMethod.includes("buffer: Buffer")
      const currentHasBuffer = currentMethod.includes("buffer: Buffer")

      if (providedHasBuffer !== currentHasBuffer) {
        issues.push(`uploadFile method signature incompatibility detected`)
      }

      // Check for proper error handling
      if (providedMethod.includes("try") !== currentMethod.includes("try")) {
        issues.push(`uploadFile error handling differs`)
      }
    }

    if (methodName === "deleteFile") {
      // Check return type consistency
      const providedReturnsResponseDto = providedMethod.includes("Promise<ResponseDto>")
      const currentReturnsResponseDto = currentMethod.includes("Promise<ResponseDto>")

      if (providedReturnsResponseDto !== currentReturnsResponseDto) {
        issues.push(`deleteFile return type differs`)
      }
    }
  }

  private compareCommentedCode(differences: string[], issues: string[]): void {
    // Check for commented out code that might indicate incomplete migration
    const providedComments = this.extractCommentedCode(this.providedContent)
    const currentComments = this.extractCommentedCode(this.currentContent)

    if (providedComments.length !== currentComments.length) {
      differences.push(`Different amount of commented code blocks`)
    }

    // Check if there are multiple uploadFile implementations (commented vs active)
    const providedUploadFileCount = (this.providedContent.match(/uploadFile/g) || []).length
    const currentUploadFileCount = (this.currentContent.match(/uploadFile/g) || []).length

    if (providedUploadFileCount !== currentUploadFileCount) {
      differences.push(`Different number of uploadFile method references`)
    }

    // Check for potential issues with commented code
    if (providedComments.some((comment) => comment.includes("uploadFile"))) {
      issues.push(`Commented uploadFile implementations found - may indicate incomplete refactoring`)
    }
  }

  private extractCommentedCode(content: string): string[] {
    const commentBlocks: string[] = []
    const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g
    const singleLineCommentRegex = /\/\/.*$/gm

    const multiLineMatches = content.match(multiLineCommentRegex) || []
    const singleLineMatches = content.match(singleLineCommentRegex) || []

    commentBlocks.push(...multiLineMatches, ...singleLineMatches)
    return commentBlocks
  }

  printComparison(result: ComparisonResult): void {
    console.log(`\n📊 AWS SERVICE COMPARISON RESULTS`)
    console.log("=================================")
    console.log(`File: ${result.file}`)
    console.log(`Status: ${result.status}`)
    console.log(`Has Changes: ${result.hasChanges ? "Yes" : "No"}`)
    console.log()

    if (result.differences.length > 0) {
      console.log("📋 DIFFERENCES FOUND:")
      result.differences.forEach((diff, index) => {
        console.log(`  ${index + 1}. ${diff}`)
      })
      console.log()
    }

    if (result.issues.length > 0) {
      console.log("🚨 CRITICAL ISSUES:")
      result.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`)
      })
      console.log()
    }

    if (result.status === "✅ IDENTICAL") {
      console.log("✅ VERIFICATION PASSED: Content is identical to current implementation")
    } else if (result.status === "⚠️ MINOR_CHANGES") {
      console.log("⚠️  MINOR DIFFERENCES: Some formatting or non-critical differences found")
    } else {
      console.log("❌ MAJOR CHANGES: Critical differences that may affect functionality")
    }
  }

  generateDetailedReport(): void {
    console.log("\n📄 DETAILED CONTENT ANALYSIS")
    console.log("============================")

    // Analyze the provided content structure
    console.log("🔍 Provided Content Analysis:")
    console.log(`  - Lines of code: ${this.providedContent.split("\n").length}`)
    console.log(`  - Import statements: ${this.extractImports(this.providedContent).length}`)
    console.log(`  - Methods: ${Object.keys(this.extractMethods(this.providedContent)).length}`)
    console.log(`  - Commented code blocks: ${this.extractCommentedCode(this.providedContent).length}`)

    // Analyze the current content structure
    if (this.currentContent) {
      console.log("\n🔍 Current File Analysis:")
      console.log(`  - Lines of code: ${this.currentContent.split("\n").length}`)
      console.log(`  - Import statements: ${this.extractImports(this.currentContent).length}`)
      console.log(`  - Methods: ${Object.keys(this.extractMethods(this.currentContent)).length}`)
      console.log(`  - Commented code blocks: ${this.extractCommentedCode(this.currentContent).length}`)
    } else {
      console.log("\n❌ Current file not found!")
    }

    // Method-by-method analysis
    console.log("\n📋 Method Analysis:")
    const providedMethods = this.extractMethods(this.providedContent)
    Object.keys(providedMethods).forEach((methodName) => {
      console.log(`  ✓ ${methodName}`)
    })

    // Check for potential issues
    console.log("\n🔍 Potential Issues Check:")
    const issues = []

    // Check for multiple uploadFile implementations
    const uploadFileMatches = this.providedContent.match(/async uploadFile/g) || []
    if (uploadFileMatches.length > 1) {
      issues.push(`Multiple uploadFile method definitions found (${uploadFileMatches.length})`)
    }

    // Check for hardcoded values
    if (this.providedContent.includes("'image/png'")) {
      issues.push("Hardcoded content type 'image/png' found")
    }

    // Check for proper error handling
    const methodsWithTryCatch = (this.providedContent.match(/try\s*{/g) || []).length
    const totalMethods = Object.keys(providedMethods).length
    if (methodsWithTryCatch < totalMethods) {
      issues.push(`Not all methods have try-catch blocks (${methodsWithTryCatch}/${totalMethods})`)
    }

    if (issues.length === 0) {
      console.log("  ✅ No issues detected")
    } else {
      issues.forEach((issue, index) => {
        console.log(`  ⚠️  ${index + 1}. ${issue}`)
      })
    }
  }
}

// Run the comparison
function runAWSServiceComparison() {
  const comparator = new AWSServiceComparator()
  const result = comparator.compareContent()

  comparator.printComparison(result)
  comparator.generateDetailedReport()

  // Save comparison report
  const reportPath = path.join(process.cwd(), "audit-reports", `aws-service-comparison-${Date.now()}.json`)
  const dir = path.dirname(reportPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2))
  console.log(`\n💾 Comparison report saved to: ${reportPath}`)

  return result
}

if (require.main === module) {
  const result = runAWSServiceComparison()
  process.exit(result.status === "❌ MAJOR_CHANGES" ? 1 : 0)
}

export { AWSServiceComparator, type ComparisonResult }
