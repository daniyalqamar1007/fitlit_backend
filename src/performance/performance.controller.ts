import { Controller, Get } from "@nestjs/common"
import type { PerformanceService } from "./performance.service"

@Controller("performance")
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get("metrics")
  getMetrics(endpoint?: string) {
    return this.performanceService.getMetrics(endpoint)
  }

  @Get("stats")
  getStats() {
    return this.performanceService.getPerformanceStats()
  }

  @Get("health")
  getHealthCheck() {
    return this.performanceService.getHealthCheck()
  }

  @Get("cache-stats")
  getCacheStats() {
    return this.performanceService.getCacheStats()
  }

  @Get("swipe-performance")
  getSwipePerformance() {
    return this.performanceService.getSwipePerformanceStats()
  }
}
