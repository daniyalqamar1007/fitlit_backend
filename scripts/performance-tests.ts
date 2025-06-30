import axios from "axios"
import * as fs from "fs"
import * as path from "path"

interface PerformanceMetrics {
  operation: string
  startTime: number
  endTime: number
  duration: number
  success: boolean
  error?: string
  cacheHit?: boolean
  responseSize?: number
}

interface TestConfig {
  baseUrl: string
  authToken: string
  testUserId: string
  iterations: number
  concurrentUsers: number
}

class SwipePerformanceTester {
  private metrics: PerformanceMetrics[] = []
  private config: TestConfig

  constructor(config: TestConfig) {
    this.config = config
  }

  private async makeRequest(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any,
    files?: any,
  ): Promise<PerformanceMetrics> {
    const startTime = Date.now()
    const operation = `${method} ${endpoint}`

    try {
      const headers = {
        Authorization: `Bearer ${this.config.authToken}`,
        "Content-Type": "application/json",
      }

      let response
      if (method === "GET") {
        response = await axios.get(`${this.config.baseUrl}${endpoint}`, { headers })
      } else if (method === "POST") {
        response = await axios.post(`${this.config.baseUrl}${endpoint}`, data, { headers })
      } else if (method === "PUT") {
        response = await axios.put(`${this.config.baseUrl}${endpoint}`, data, { headers })
      } else if (method === "DELETE") {
        response = await axios.delete(`${this.config.baseUrl}${endpoint}`, { headers })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      const metric: PerformanceMetrics = {
        operation,
        startTime,
        endTime,
        duration,
        success: true,
        cacheHit: response?.headers["x-cache-hit"] === "true",
        responseSize: JSON.stringify(response?.data).length,
      }

      this.metrics.push(metric)
      return metric
    } catch (error: any) {
      const endTime = Date.now()
      const duration = endTime - startTime

      const metric: PerformanceMetrics = {
        operation,
        startTime,
        endTime,
        duration,
        success: false,
        error: error.message,
      }

      this.metrics.push(metric)
      return metric
    }
  }

  async testSwipePerformance(): Promise<void> {
    console.log("🚀 Starting Swipe Performance Tests...\n")

    // Test 1: Single Swipe Operations
    await this.testSingleSwipeOperations()

    // Test 2: Rapid Swipe Sequences
    await this.testRapidSwipeSequences()

    // Test 3: Concurrent User Swipes
    await this.testConcurrentUserSwipes()

    // Test 4: Avatar Generation Performance
    await this.testAvatarGenerationPerformance()

    // Test 5: Cache Performance
    await this.testCachePerformance()

    // Test 6: Swipe State Management
    await this.testSwipeStateManagement()

    // Generate Performance Report
    this.generatePerformanceReport()
  }

  private async testSingleSwipeOperations(): Promise<void> {
    console.log("📊 Testing Single Swipe Operations...")

    const categories = ["shirt", "pants", "shoes", "accessories"]
    const directions = ["left", "right"]

    for (const category of categories) {
      for (const direction of directions) {
        const swipeData = {
          direction,
          category,
          itemId: "507f1f77bcf86cd799439011", // Mock ObjectId
        }

        const metric = await this.makeRequest("POST", "/avatar/swipe-outfit", swipeData)
        console.log(`  ✓ ${category} ${direction} swipe: ${metric.duration}ms`)
      }
    }
    console.log()
  }

  private async testRapidSwipeSequences(): Promise<void> {
    console.log("⚡ Testing Rapid Swipe Sequences...")

    const rapidSwipes = []
    for (let i = 0; i < 20; i++) {
      const swipeData = {
        direction: i % 2 === 0 ? "left" : "right",
        category: "shirt",
        itemId: "507f1f77bcf86cd799439011",
      }
      rapidSwipes.push(this.makeRequest("POST", "/avatar/swipe-outfit", swipeData))
    }

    const results = await Promise.all(rapidSwipes)
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    console.log(`  ✓ 20 rapid swipes average: ${avgDuration.toFixed(2)}ms`)
    console.log(`  ✓ Total time: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`)
    console.log()
  }

  private async testConcurrentUserSwipes(): Promise<void> {
    console.log("👥 Testing Concurrent User Swipes...")

    const concurrentSwipes = []
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      const swipeData = {
        direction: "right",
        category: "shirt",
        itemId: "507f1f77bcf86cd799439011",
      }
      concurrentSwipes.push(this.makeRequest("POST", "/avatar/swipe-outfit", swipeData))
    }

    const startTime = Date.now()
    const results = await Promise.all(concurrentSwipes)
    const totalTime = Date.now() - startTime

    const successCount = results.filter((r) => r.success).length
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length

    console.log(`  ✓ ${this.config.concurrentUsers} concurrent swipes`)
    console.log(`  ✓ Success rate: ${((successCount / results.length) * 100).toFixed(1)}%`)
    console.log(`  ✓ Average response time: ${avgDuration.toFixed(2)}ms`)
    console.log(`  ✓ Total execution time: ${totalTime}ms`)
    console.log()
  }

  private async testAvatarGenerationPerformance(): Promise<void> {
    console.log("🎨 Testing Avatar Generation Performance...")

    const outfitData = {
      shirt_id: "507f1f77bcf86cd799439011",
      accessories_id: "507f1f77bcf86cd799439012",
      pant_id: "507f1f77bcf86cd799439013",
      shoe_id: "507f1f77bcf86cd799439014",
      profile_picture: "https://example.com/profile.jpg",
    }

    const metric = await this.makeRequest("POST", "/avatar/outfit", outfitData)
    console.log(`  ✓ Avatar generation: ${metric.duration}ms`)

    // Test background processing status
    const statusMetric = await this.makeRequest("GET", "/avatar/user-avatars")
    console.log(`  ✓ Avatar status check: ${statusMetric.duration}ms`)
    console.log()
  }

  private async testCachePerformance(): Promise<void> {
    console.log("💾 Testing Cache Performance...")

    // First request (cache miss)
    const firstRequest = await this.makeRequest("POST", "/image-processing/remove-background", {
      imageUrl: "https://example.com/test-image.jpg",
    })
    console.log(`  ✓ First request (cache miss): ${firstRequest.duration}ms`)

    // Second request (cache hit)
    const secondRequest = await this.makeRequest("POST", "/image-processing/remove-background", {
      imageUrl: "https://example.com/test-image.jpg",
    })
    console.log(`  ✓ Second request (cache hit): ${secondRequest.duration}ms`)

    const speedImprovement = ((firstRequest.duration - secondRequest.duration) / firstRequest.duration) * 100
    console.log(`  ✓ Cache speed improvement: ${speedImprovement.toFixed(1)}%`)
    console.log()
  }

  private async testSwipeStateManagement(): Promise<void> {
    console.log("🔄 Testing Swipe State Management...")

    // Get initial state
    const initialState = await this.makeRequest("GET", "/avatar/swipe-state")
    console.log(`  ✓ Get initial state: ${initialState.duration}ms`)

    // Perform multiple swipes
    for (let i = 0; i < 5; i++) {
      const swipeData = {
        direction: i % 2 === 0 ? "left" : "right",
        category: "shirt",
        itemId: "507f1f77bcf86cd799439011",
      }
      await this.makeRequest("POST", "/avatar/swipe-outfit", swipeData)
    }

    // Get updated state
    const updatedState = await this.makeRequest("GET", "/avatar/swipe-state")
    console.log(`  ✓ Get updated state: ${updatedState.duration}ms`)

    // Reset state
    const resetState = await this.makeRequest("POST", "/avatar/swipe-reset")
    console.log(`  ✓ Reset state: ${resetState.duration}ms`)
    console.log()
  }

  private generatePerformanceReport(): void {
    console.log("📈 Performance Test Results Summary")
    console.log("=".repeat(50))

    const successfulMetrics = this.metrics.filter((m) => m.success)
    const failedMetrics = this.metrics.filter((m) => !m.success)

    // Overall Statistics
    const totalRequests = this.metrics.length
    const successRate = ((successfulMetrics.length / totalRequests) * 100).toFixed(1)
    const avgResponseTime = successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / successfulMetrics.length

    console.log(`\n📊 Overall Statistics:`)
    console.log(`  Total Requests: ${totalRequests}`)
    console.log(`  Success Rate: ${successRate}%`)
    console.log(`  Average Response Time: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`  Failed Requests: ${failedMetrics.length}`)

    // Performance by Operation
    const operationStats = this.groupMetricsByOperation()
    console.log(`\n⚡ Performance by Operation:`)

    Object.entries(operationStats).forEach(([operation, stats]) => {
      console.log(`  ${operation}:`)
      console.log(`    Average: ${stats.avg.toFixed(2)}ms`)
      console.log(`    Min: ${stats.min}ms`)
      console.log(`    Max: ${stats.max}ms`)
      console.log(`    Success Rate: ${stats.successRate.toFixed(1)}%`)
    })

    // Speed Benchmarks
    console.log(`\n🏆 Speed Benchmarks:`)
    const swipeOperations = successfulMetrics.filter((m) => m.operation.includes("swipe"))
    const avgSwipeTime = swipeOperations.reduce((sum, m) => sum + m.duration, 0) / swipeOperations.length

    console.log(`  Average Swipe Time: ${avgSwipeTime.toFixed(2)}ms`)
    console.log(`  Target: <500ms - ${avgSwipeTime < 500 ? "✅ PASSED" : "❌ FAILED"}`)

    // Cache Performance
    const cacheHits = successfulMetrics.filter((m) => m.cacheHit).length
    const cacheHitRate = ((cacheHits / successfulMetrics.length) * 100).toFixed(1)
    console.log(`  Cache Hit Rate: ${cacheHitRate}%`)
    console.log(`  Target: >80% - ${Number.parseFloat(cacheHitRate) > 80 ? "✅ PASSED" : "❌ FAILED"}`)

    // Performance Grades
    console.log(`\n🎯 Performance Grades:`)
    this.gradePerformance(avgSwipeTime, Number.parseFloat(cacheHitRate), Number.parseFloat(successRate))

    // Save detailed report
    this.saveDetailedReport()
  }

  private groupMetricsByOperation(): Record<string, any> {
    const grouped: Record<string, PerformanceMetrics[]> = {}

    this.metrics.forEach((metric) => {
      if (!grouped[metric.operation]) {
        grouped[metric.operation] = []
      }
      grouped[metric.operation].push(metric)
    })

    const stats: Record<string, any> = {}
    Object.entries(grouped).forEach(([operation, metrics]) => {
      const successful = metrics.filter((m) => m.success)
      const durations = successful.map((m) => m.duration)

      stats[operation] = {
        avg: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
        min: Math.min(...durations) || 0,
        max: Math.max(...durations) || 0,
        successRate: (successful.length / metrics.length) * 100 || 0,
        count: metrics.length,
      }
    })

    return stats
  }

  private gradePerformance(avgSwipeTime: number, cacheHitRate: number, successRate: number): void {
    let grade = "F"
    let score = 0

    // Swipe Speed (40% weight)
    if (avgSwipeTime < 200) score += 40
    else if (avgSwipeTime < 500) score += 30
    else if (avgSwipeTime < 1000) score += 20
    else score += 10

    // Cache Hit Rate (30% weight)
    if (cacheHitRate > 90) score += 30
    else if (cacheHitRate > 80) score += 25
    else if (cacheHitRate > 70) score += 20
    else if (cacheHitRate > 60) score += 15
    else score += 10

    // Success Rate (30% weight)
    if (successRate > 99) score += 30
    else if (successRate > 95) score += 25
    else if (successRate > 90) score += 20
    else if (successRate > 85) score += 15
    else score += 10

    if (score >= 90) grade = "A+"
    else if (score >= 85) grade = "A"
    else if (score >= 80) grade = "B+"
    else if (score >= 75) grade = "B"
    else if (score >= 70) grade = "C+"
    else if (score >= 65) grade = "C"
    else if (score >= 60) grade = "D"

    console.log(`  Overall Grade: ${grade} (${score}/100)`)

    if (score >= 85) {
      console.log(`  🎉 Excellent performance! Swipe functionality is optimized.`)
    } else if (score >= 75) {
      console.log(`  👍 Good performance with room for improvement.`)
    } else if (score >= 65) {
      console.log(`  ⚠️  Average performance. Consider optimizations.`)
    } else {
      console.log(`  🚨 Poor performance. Immediate optimization needed.`)
    }
  }

  private saveDetailedReport(): void {
    const reportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      metrics: this.metrics,
      summary: {
        totalRequests: this.metrics.length,
        successfulRequests: this.metrics.filter((m) => m.success).length,
        failedRequests: this.metrics.filter((m) => !m.success).length,
        averageResponseTime:
          this.metrics.filter((m) => m.success).reduce((sum, m) => sum + m.duration, 0) /
          this.metrics.filter((m) => m.success).length,
        cacheHitRate: (this.metrics.filter((m) => m.cacheHit).length / this.metrics.length) * 100,
      },
    }

    const reportPath = path.join(process.cwd(), "performance-reports", `swipe-performance-${Date.now()}.json`)

    // Create directory if it doesn't exist
    const dir = path.dirname(reportPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    console.log(`\n💾 Detailed report saved to: ${reportPath}`)
  }
}

// Load test configuration
async function loadTestConfig(): Promise<TestConfig> {
  // You can load this from environment variables or config file
  return {
    baseUrl: process.env.TEST_BASE_URL || "http://localhost:3099",
    authToken: process.env.TEST_AUTH_TOKEN || "your-test-jwt-token",
    testUserId: process.env.TEST_USER_ID || "test-user-id",
    iterations: Number.parseInt(process.env.TEST_ITERATIONS || "10"),
    concurrentUsers: Number.parseInt(process.env.TEST_CONCURRENT_USERS || "5"),
  }
}

// Run performance tests
async function runPerformanceTests() {
  try {
    const config = await loadTestConfig()
    const tester = new SwipePerformanceTester(config)

    console.log("🔥 FitLit Swipe Performance Test Suite")
    console.log("=".repeat(50))
    console.log(`Base URL: ${config.baseUrl}`)
    console.log(`Iterations: ${config.iterations}`)
    console.log(`Concurrent Users: ${config.concurrentUsers}`)
    console.log("=".repeat(50))
    console.log()

    await tester.testSwipePerformance()
  } catch (error) {
    console.error("❌ Performance test failed:", error)
    process.exit(1)
  }
}

// Export for use in other scripts
export { SwipePerformanceTester, type PerformanceMetrics, type TestConfig }

// Run if called directly
if (require.main === module) {
  runPerformanceTests()
}
