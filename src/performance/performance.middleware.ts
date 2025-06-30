import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"

interface PerformanceMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: number
  userAgent?: string
  cacheHit?: boolean
}

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private metrics: PerformanceMetrics[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now()
    const originalSend = res.send

    // Override res.send to capture response time
    res.send = function (body: any) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Determine if response was cached
      const cacheHit =
        responseTime < 100 ||
        res.getHeader("x-cache-hit") === "true" ||
        (typeof body === "string" && body.includes('"cacheHit":true'))

      // Store metrics
      const metric: PerformanceMetrics = {
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        timestamp: startTime,
        userAgent: req.get("User-Agent"),
        cacheHit,
      }

      // Add to metrics array (keep only recent metrics)
      if (req.app.locals.performanceMetrics) {
        req.app.locals.performanceMetrics.push(metric)
        if (req.app.locals.performanceMetrics.length > 1000) {
          req.app.locals.performanceMetrics = req.app.locals.performanceMetrics.slice(-1000)
        }
      } else {
        req.app.locals.performanceMetrics = [metric]
      }

      // Log slow requests
      if (responseTime > 1000) {
        console.log(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`)
      }

      // Add performance headers
      res.setHeader("X-Response-Time", `${responseTime}ms`)
      res.setHeader("X-Cache-Hit", cacheHit ? "true" : "false")

      return originalSend.call(this, body)
    }

    next()
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint ? this.metrics.filter((m) => m.endpoint === endpoint) : this.metrics

    if (filteredMetrics.length === 0) return 0

    return filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0) / filteredMetrics.length
  }

  getCacheHitRate(endpoint?: string): number {
    const filteredMetrics = endpoint ? this.metrics.filter((m) => m.endpoint === endpoint) : this.metrics

    if (filteredMetrics.length === 0) return 0

    const cacheHits = filteredMetrics.filter((m) => m.cacheHit).length
    return (cacheHits / filteredMetrics.length) * 100
  }
}
