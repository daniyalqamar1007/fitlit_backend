import axios from "axios"
import * as fs from "fs"
import * as path from "path"

interface PerformanceMetric {
  timestamp: number
  endpoint: string
  responseTime: number
  statusCode: number
  cacheHit: boolean
  errorMessage?: string
}

interface PerformanceReport {
  startTime: number
  endTime: number
  duration: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  cacheHitRate: number
  endpointStats: Record<
    string,
    {
      count: number
      avgResponseTime: number
      successRate: number
      cacheHitRate: number
    }
  >
  alerts: string[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private config: {
    baseUrl: string
    authToken: string
    interval: number
    alertThresholds: {
      responseTime: number
      errorRate: number
      cacheHitRate: number
    }
  }

  constructor(config: any) {
    this.config = {
      baseUrl: config.baseUrl || "http://localhost:3099",
      authToken: config.authToken || "test-token",
      interval: config.interval || 5000, // 5 seconds
      alertThresholds: {
        responseTime: config.alertThresholds?.responseTime || 1000, // 1 second
        errorRate: config.alertThresholds?.errorRate || 5, // 5%
        cacheHitRate: config.alertThresholds?.cacheHitRate || 80, // 80%
      },
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log("⚠️  Monitoring is already running")
      return
    }

    console.log("🔍 Starting Performance Monitoring...")
    console.log(`Monitoring interval: ${this.config.interval}ms`)
    console.log(`Base URL: ${this.config.baseUrl}`)
    console.log()

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, this.config.interval)

    // Also collect initial metrics
    this.collectMetrics()
  }

  stopMonitoring(): PerformanceReport {
    if (!this.isMonitoring) {
      console.log("⚠️  Monitoring is not running")
      return this.generateReport()
    }

    console.log("🛑 Stopping Performance Monitoring...")
    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    return this.generateReport()
  }

  private async collectMetrics(): Promise<void> {
    const endpoints = [
      {
        method: "POST",
        path: "/avatar/swipe-outfit",
        data: { direction: "right", category: "shirt", itemId: "507f1f77bcf86cd799439011" },
      },
      { method: "GET", path: "/avatar/swipe-state", data: null },
      {
        method: "POST",
        path: "/wardrobe-items/swipe",
        data: { swipeCategory: "shirt", direction: "right", itemId: "507f1f77bcf86cd799439011" },
      },
      { method: "GET", path: "/wardrobe-items/swipe/next/shirt", data: null },
      {
        method: "POST",
        path: "/avatar/outfit",
        data: {
          shirt_id: "507f1f77bcf86cd799439011",
          accessories_id: "507f1f77bcf86cd799439012",
          pant_id: "507f1f77bcf86cd799439013",
          shoe_id: "507f1f77bcf86cd799439014",
          profile_picture: "https://example.com/profile.jpg",
        },
      },
      { method: "GET", path: "/avatar/user-avatars", data: null },
      {
        method: "POST",
        path: "/image-processing/remove-background",
        data: { imageUrl: "https://example.com/test.jpg" },
      },
      { method: "GET", path: "/image-processing/cache/stats", data: null },
    ]

    const promises = endpoints.map((endpoint) => this.measureEndpoint(endpoint))
    await Promise.all(promises)
  }

  private async measureEndpoint(endpoint: { method: string; path: string; data: any }): Promise<void> {
    const startTime = Date.now()

    try {
      const headers = {
        Authorization: `Bearer ${this.config.authToken}`,
        "Content-Type": "application/json",
      }

      let response
      if (endpoint.method === "GET") {
        response = await axios.get(`${this.config.baseUrl}${endpoint.path}`, {
          headers,
          timeout: 10000,
        })
      } else {
        response = await axios.post(`${this.config.baseUrl}${endpoint.path}`, endpoint.data, {
          headers,
          timeout: 10000,
        })
      }

      const responseTime = Date.now() - startTime
      const cacheHit =
        response.headers["x-cache-hit"] === "true" || response.data?.cacheHit === true || responseTime < 100 // Assume very fast responses are cached

      this.metrics.push({
        timestamp: startTime,
        endpoint: `${endpoint.method} ${endpoint.path}`,
        responseTime,
        statusCode: response.status,
        cacheHit,
      })

      // Real-time alerting
      this.checkAlerts(endpoint.path, responseTime, response.status, cacheHit)
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      this.metrics.push({
        timestamp: startTime,
        endpoint: `${endpoint.method} ${endpoint.path}`,
        responseTime,
        statusCode: error.response?.status || 0,
        cacheHit: false,
        errorMessage: error.message,
      })

      this.checkAlerts(endpoint.path, responseTime, error.response?.status || 0, false)
    }
  }

  private checkAlerts(endpoint: string, responseTime: number, statusCode: number, cacheHit: boolean): void {
    const now = new Date().toISOString()

    // Response time alert
    if (responseTime > this.config.alertThresholds.responseTime) {
      console.log(`🚨 [${now}] ALERT: Slow response on ${endpoint}: ${responseTime}ms`)
    }

    // Error alert
    if (statusCode >= 400) {
      console.log(`🚨 [${now}] ALERT: Error on ${endpoint}: HTTP ${statusCode}`)
    }

    // Cache performance alert (check recent cache hit rate)
    const recentMetrics = this.metrics.filter(
      (m) => m.endpoint.includes(endpoint) && m.timestamp > Date.now() - 60000, // Last minute
    )

    if (recentMetrics.length >= 5) {
      const recentCacheHitRate = (recentMetrics.filter((m) => m.cacheHit).length / recentMetrics.length) * 100
      if (recentCacheHitRate < this.config.alertThresholds.cacheHitRate) {
        console.log(`🚨 [${now}] ALERT: Low cache hit rate on ${endpoint}: ${recentCacheHitRate.toFixed(1)}%`)
      }
    }
  }

  private generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        endpointStats: {},
        alerts: [],
      }
    }

    const startTime = Math.min(...this.metrics.map((m) => m.timestamp))
    const endTime = Math.max(...this.metrics.map((m) => m.timestamp))
    const duration = endTime - startTime

    const totalRequests = this.metrics.length
    const successfulRequests = this.metrics.filter((m) => m.statusCode >= 200 && m.statusCode < 400).length
    const failedRequests = totalRequests - successfulRequests

    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
    const cacheHitRate = (this.metrics.filter((m) => m.cacheHit).length / totalRequests) * 100

    // Calculate endpoint statistics
    const endpointStats: Record<string, any> = {}
    const endpointGroups = this.groupMetricsByEndpoint()

    Object.entries(endpointGroups).forEach(([endpoint, metrics]) => {
      const successful = metrics.filter((m) => m.statusCode >= 200 && m.statusCode < 400)
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      const successRate = (successful.length / metrics.length) * 100
      const cacheHitRate = (metrics.filter((m) => m.cacheHit).length / metrics.length) * 100

      endpointStats[endpoint] = {
        count: metrics.length,
        avgResponseTime,
        successRate,
        cacheHitRate,
      }
    })

    // Generate alerts summary
    const alerts = this.generateAlertsSummary()

    const report: PerformanceReport = {
      startTime,
      endTime,
      duration,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      cacheHitRate,
      endpointStats,
      alerts,
    }

    this.printReport(report)
    this.saveReport(report)

    return report
  }

  private groupMetricsByEndpoint(): Record<string, PerformanceMetric[]> {
    const groups: Record<string, PerformanceMetric[]> = {}

    this.metrics.forEach((metric) => {
      if (!groups[metric.endpoint]) {
        groups[metric.endpoint] = []
      }
      groups[metric.endpoint].push(metric)
    })

    return groups
  }

  private generateAlertsSummary(): string[] {
    const alerts: string[] = []
    const endpointGroups = this.groupMetricsByEndpoint()

    Object.entries(endpointGroups).forEach(([endpoint, metrics]) => {
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      const errorRate =
        ((metrics.length - metrics.filter((m) => m.statusCode >= 200 && m.statusCode < 400).length) / metrics.length) *
        100
      const cacheHitRate = (metrics.filter((m) => m.cacheHit).length / metrics.length) * 100

      if (avgResponseTime > this.config.alertThresholds.responseTime) {
        alerts.push(`${endpoint}: Average response time ${avgResponseTime.toFixed(0)}ms exceeds threshold`)
      }

      if (errorRate > this.config.alertThresholds.errorRate) {
        alerts.push(`${endpoint}: Error rate ${errorRate.toFixed(1)}% exceeds threshold`)
      }

      if (cacheHitRate < this.config.alertThresholds.cacheHitRate) {
        alerts.push(`${endpoint}: Cache hit rate ${cacheHitRate.toFixed(1)}% below threshold`)
      }
    })

    return alerts
  }

  private printReport(report: PerformanceReport): void {
    console.log("\n📊 PERFORMANCE MONITORING REPORT")
    console.log("=".repeat(50))
    console.log(`Monitoring Duration: ${(report.duration / 1000).toFixed(1)}s`)
    console.log(`Total Requests: ${report.totalRequests}`)
    console.log(`Success Rate: ${((report.successfulRequests / report.totalRequests) * 100).toFixed(1)}%`)
    console.log(`Average Response Time: ${report.averageResponseTime.toFixed(2)}ms`)
    console.log(`Cache Hit Rate: ${report.cacheHitRate.toFixed(1)}%`)
    console.log()

    console.log("📈 Endpoint Performance:")
    Object.entries(report.endpointStats).forEach(([endpoint, stats]) => {
      const status = stats.avgResponseTime < 500 ? "✅" : stats.avgResponseTime < 1000 ? "⚠️" : "❌"

      console.log(`${status} ${endpoint}:`)
      console.log(`   Requests: ${stats.count}`)
      console.log(`   Avg Response: ${stats.avgResponseTime.toFixed(2)}ms`)
      console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`)
      console.log(`   Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%`)
      console.log()
    })

    if (report.alerts.length > 0) {
      console.log("🚨 Performance Alerts:")
      report.alerts.forEach((alert) => {
        console.log(`   ⚠️  ${alert}`)
      })
      console.log()
    }

    // Performance grade
    let grade = "F"
    let score = 0

    if (report.averageResponseTime < 300) score += 30
    else if (report.averageResponseTime < 500) score += 25
    else if (report.averageResponseTime < 1000) score += 20
    else score += 10

    if (report.cacheHitRate > 90) score += 25
    else if (report.cacheHitRate > 80) score += 20
    else if (report.cacheHitRate > 70) score += 15
    else score += 10

    const successRate = (report.successfulRequests / report.totalRequests) * 100
    if (successRate > 99) score += 25
    else if (successRate > 95) score += 20
    else if (successRate > 90) score += 15
    else score += 10

    if (report.alerts.length === 0) score += 20
    else if (report.alerts.length < 3) score += 15
    else if (report.alerts.length < 5) score += 10
    else score += 5

    if (score >= 90) grade = "A+"
    else if (score >= 85) grade = "A"
    else if (score >= 80) grade = "B+"
    else if (score >= 75) grade = "B"
    else if (score >= 70) grade = "C+"
    else if (score >= 65) grade = "C"
    else if (score >= 60) grade = "D"

    console.log(`🎯 Performance Grade: ${grade} (${score}/100)`)
  }

  private saveReport(report: PerformanceReport): void {
    const reportPath = path.join(process.cwd(), "performance-reports", `monitoring-report-${Date.now()}.json`)

    const dir = path.dirname(reportPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n💾 Performance report saved to: ${reportPath}`)
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  clearMetrics(): void {
    this.metrics = []
  }
}

// CLI interface for performance monitoring
async function runPerformanceMonitoring() {
  const config = {
    baseUrl: process.env.TEST_BASE_URL || "http://localhost:3099",
    authToken: process.env.TEST_AUTH_TOKEN || "test-token",
    interval: Number.parseInt(process.env.MONITOR_INTERVAL || "5000"),
    alertThresholds: {
      responseTime: Number.parseInt(process.env.ALERT_RESPONSE_TIME || "1000"),
      errorRate: Number.parseInt(process.env.ALERT_ERROR_RATE || "5"),
      cacheHitRate: Number.parseInt(process.env.ALERT_CACHE_HIT_RATE || "80"),
    },
  }

  const monitor = new PerformanceMonitor(config)

  console.log("🔍 FitLit Performance Monitor")
  console.log("=".repeat(40))
  console.log("Press Ctrl+C to stop monitoring and generate report")
  console.log()

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n🛑 Stopping monitoring...")
    const report = monitor.stopMonitoring()
    process.exit(0)
  })

  monitor.startMonitoring()
}

if (require.main === module) {
  runPerformanceMonitoring().catch(console.error)
}

export { PerformanceMonitor, type PerformanceMetric, type PerformanceReport }
