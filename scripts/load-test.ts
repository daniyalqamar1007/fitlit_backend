import axios from "axios"
import * as cluster from "cluster"
import * as os from "os"

interface LoadTestConfig {
  baseUrl: string
  authToken: string
  duration: number // seconds
  rampUpTime: number // seconds
  maxUsers: number
  requestsPerSecond: number
}

interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  requestsPerSecond: number
  errors: string[]
  percentiles: {
    p50: number
    p90: number
    p95: number
    p99: number
  }
}

class SwipeLoadTester {
  private config: LoadTestConfig
  private results: number[] = []
  private errors: string[] = []
  private startTime = 0

  constructor(config: LoadTestConfig) {
    this.config = config
  }

  async runLoadTest(): Promise<LoadTestResult> {
    console.log("🚀 Starting Swipe Load Test...")
    console.log(`Duration: ${this.config.duration}s`)
    console.log(`Max Users: ${this.config.maxUsers}`)
    console.log(`Target RPS: ${this.config.requestsPerSecond}`)
    console.log()

    if (cluster.isMaster) {
      return this.runMasterProcess()
    } else {
      return this.runWorkerProcess()
    }
  }

  private async runMasterProcess(): Promise<LoadTestResult> {
    const numCPUs = Math.min(os.cpus().length, this.config.maxUsers)
    const workersData: LoadTestResult[] = []

    console.log(`Spawning ${numCPUs} worker processes...`)

    // Spawn workers
    for (let i = 0; i < numCPUs; i++) {
      const worker = cluster.fork()

      worker.on("message", (data: LoadTestResult) => {
        workersData.push(data)

        if (workersData.length === numCPUs) {
          // All workers completed, aggregate results
          const aggregatedResults = this.aggregateResults(workersData)
          this.printResults(aggregatedResults)
          process.exit(0)
        }
      })
    }

    return new Promise((resolve) => {
      // This will be resolved when all workers complete
    })
  }

  private async runWorkerProcess(): Promise<LoadTestResult> {
    this.startTime = Date.now()
    const endTime = this.startTime + this.config.duration * 1000
    const requestInterval = 1000 / (this.config.requestsPerSecond / this.config.maxUsers)

    const swipeRequests = [
      {
        endpoint: "/avatar/swipe-outfit",
        data: { direction: "right", category: "shirt", itemId: "507f1f77bcf86cd799439011" },
      },
      {
        endpoint: "/avatar/swipe-outfit",
        data: { direction: "left", category: "pants", itemId: "507f1f77bcf86cd799439012" },
      },
      {
        endpoint: "/wardrobe-items/swipe",
        data: { swipeCategory: "shoes", direction: "right", itemId: "507f1f77bcf86cd799439013" },
      },
      { endpoint: "/avatar/swipe-state", data: null },
      { endpoint: "/wardrobe-items/swipe/next/shirt", data: null },
    ]

    while (Date.now() < endTime) {
      const request = swipeRequests[Math.floor(Math.random() * swipeRequests.length)]

      try {
        const startTime = Date.now()

        if (request.data) {
          await axios.post(`${this.config.baseUrl}${request.endpoint}`, request.data, {
            headers: { Authorization: `Bearer ${this.config.authToken}` },
          })
        } else {
          await axios.get(`${this.config.baseUrl}${request.endpoint}`, {
            headers: { Authorization: `Bearer ${this.config.authToken}` },
          })
        }

        const responseTime = Date.now() - startTime
        this.results.push(responseTime)
      } catch (error: any) {
        this.errors.push(error.message)
      }

      // Wait for next request
      await new Promise((resolve) => setTimeout(resolve, requestInterval))
    }

    const result = this.calculateResults()

    if (process.send) {
      process.send(result)
    }

    return result
  }

  private calculateResults(): LoadTestResult {
    const totalRequests = this.results.length + this.errors.length
    const successfulRequests = this.results.length
    const failedRequests = this.errors.length

    if (this.results.length === 0) {
      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        errors: this.errors,
        percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 },
      }
    }

    const sortedResults = this.results.sort((a, b) => a - b)
    const averageResponseTime = this.results.reduce((sum, time) => sum + time, 0) / this.results.length
    const minResponseTime = Math.min(...this.results)
    const maxResponseTime = Math.max(...this.results)

    const actualDuration = (Date.now() - this.startTime) / 1000
    const requestsPerSecond = totalRequests / actualDuration

    const percentiles = {
      p50: this.getPercentile(sortedResults, 50),
      p90: this.getPercentile(sortedResults, 90),
      p95: this.getPercentile(sortedResults, 95),
      p99: this.getPercentile(sortedResults, 99),
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errors: this.errors,
      percentiles,
    }
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[index] || 0
  }

  private aggregateResults(workersData: LoadTestResult[]): LoadTestResult {
    const totalRequests = workersData.reduce((sum, data) => sum + data.totalRequests, 0)
    const successfulRequests = workersData.reduce((sum, data) => sum + data.successfulRequests, 0)
    const failedRequests = workersData.reduce((sum, data) => sum + data.failedRequests, 0)

    const allResponseTimes = workersData.flatMap((data) =>
      Array(data.successfulRequests).fill(data.averageResponseTime),
    )

    const averageResponseTime = allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length || 0
    const minResponseTime = Math.min(...workersData.map((data) => data.minResponseTime))
    const maxResponseTime = Math.max(...workersData.map((data) => data.maxResponseTime))
    const requestsPerSecond = workersData.reduce((sum, data) => sum + data.requestsPerSecond, 0)

    const allErrors = workersData.flatMap((data) => data.errors)

    // Aggregate percentiles (simplified)
    const percentiles = {
      p50: workersData.reduce((sum, data) => sum + data.percentiles.p50, 0) / workersData.length,
      p90: workersData.reduce((sum, data) => sum + data.percentiles.p90, 0) / workersData.length,
      p95: workersData.reduce((sum, data) => sum + data.percentiles.p95, 0) / workersData.length,
      p99: workersData.reduce((sum, data) => sum + data.percentiles.p99, 0) / workersData.length,
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond,
      errors: allErrors,
      percentiles,
    }
  }

  private printResults(results: LoadTestResult): void {
    console.log("\n🏁 Load Test Results")
    console.log("=".repeat(50))
    console.log(`Total Requests: ${results.totalRequests}`)
    console.log(
      `Successful: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%)`,
    )
    console.log(
      `Failed: ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(1)}%)`,
    )
    console.log(`Requests/sec: ${results.requestsPerSecond.toFixed(2)}`)
    console.log()

    console.log("📊 Response Times:")
    console.log(`Average: ${results.averageResponseTime.toFixed(2)}ms`)
    console.log(`Min: ${results.minResponseTime}ms`)
    console.log(`Max: ${results.maxResponseTime}ms`)
    console.log()

    console.log("📈 Percentiles:")
    console.log(`50th: ${results.percentiles.p50.toFixed(2)}ms`)
    console.log(`90th: ${results.percentiles.p90.toFixed(2)}ms`)
    console.log(`95th: ${results.percentiles.p95.toFixed(2)}ms`)
    console.log(`99th: ${results.percentiles.p99.toFixed(2)}ms`)
    console.log()

    // Performance Assessment
    console.log("🎯 Performance Assessment:")
    if (results.averageResponseTime < 500) {
      console.log("✅ Excellent: Average response time < 500ms")
    } else if (results.averageResponseTime < 1000) {
      console.log("⚠️  Good: Average response time < 1000ms")
    } else {
      console.log("❌ Poor: Average response time > 1000ms")
    }

    if (results.percentiles.p95 < 1000) {
      console.log("✅ Excellent: 95th percentile < 1000ms")
    } else if (results.percentiles.p95 < 2000) {
      console.log("⚠️  Good: 95th percentile < 2000ms")
    } else {
      console.log("❌ Poor: 95th percentile > 2000ms")
    }

    const successRate = (results.successfulRequests / results.totalRequests) * 100
    if (successRate > 99) {
      console.log("✅ Excellent: Success rate > 99%")
    } else if (successRate > 95) {
      console.log("⚠️  Good: Success rate > 95%")
    } else {
      console.log("❌ Poor: Success rate < 95%")
    }

    if (results.errors.length > 0) {
      console.log("\n❌ Errors:")
      const errorCounts = results.errors.reduce(
        (acc, error) => {
          acc[error] = (acc[error] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`  ${error}: ${count} times`)
      })
    }
  }
}

// Configuration
const loadTestConfig: LoadTestConfig = {
  baseUrl: process.env.TEST_BASE_URL || "http://localhost:3099",
  authToken: process.env.TEST_AUTH_TOKEN || "your-test-jwt-token",
  duration: Number.parseInt(process.env.LOAD_TEST_DURATION || "60"), // 60 seconds
  rampUpTime: Number.parseInt(process.env.LOAD_TEST_RAMP_UP || "10"), // 10 seconds
  maxUsers: Number.parseInt(process.env.LOAD_TEST_MAX_USERS || "50"), // 50 concurrent users
  requestsPerSecond: Number.parseInt(process.env.LOAD_TEST_RPS || "100"), // 100 RPS target
}

// Run load test
async function runLoadTest() {
  const tester = new SwipeLoadTester(loadTestConfig)
  await tester.runLoadTest()
}

if (require.main === module) {
  runLoadTest().catch(console.error)
}

export { SwipeLoadTester, type LoadTestConfig, type LoadTestResult }
