#!/bin/bash

echo "🚀 FitLit Swipe Performance Test Suite"
echo "======================================"

# Set environment variables for testing
export TEST_BASE_URL="http://localhost:3099"
export TEST_AUTH_TOKEN="your-test-jwt-token"
export TEST_USER_ID="test-user-id"
export TEST_ITERATIONS="20"
export TEST_CONCURRENT_USERS="10"

# Load test configuration
export LOAD_TEST_DURATION="120"
export LOAD_TEST_MAX_USERS="50"
export LOAD_TEST_RPS="100"

# Monitoring configuration
export MONITOR_INTERVAL="3000"
export ALERT_RESPONSE_TIME="500"
export ALERT_ERROR_RATE="5"
export ALERT_CACHE_HIT_RATE="80"

echo "📊 Running Performance Tests..."
echo ""

# 1. Basic Performance Tests
echo "1️⃣  Running Basic Performance Tests..."
npm run test:performance
echo ""

# 2. Benchmark Comparison
echo "2️⃣  Running Benchmark Comparison..."
npm run test:benchmark
echo ""

# 3. Load Testing
echo "3️⃣  Running Load Tests..."
npm run test:load
echo ""

# 4. Generate Summary Report
echo "4️⃣  Generating Summary Report..."
node -e "
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(process.cwd(), 'performance-reports');
if (!fs.existsSync(reportsDir)) {
  console.log('No performance reports found');
  process.exit(0);
}

const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .slice(-3); // Get last 3 reports

console.log('📈 Performance Test Summary');
console.log('==========================');

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(reportsDir, file)));
  console.log(\`\nReport: \${file}\`);
  
  if (data.summary) {
    console.log(\`  Average Response Time: \${data.summary.averageResponseTime?.toFixed(2) || 'N/A'}ms\`);
    console.log(\`  Success Rate: \${((data.summary.successfulRequests / data.summary.totalRequests) * 100)?.toFixed(1) || 'N/A'}%\`);
    console.log(\`  Cache Hit Rate: \${data.summary.cacheHitRate?.toFixed(1) || 'N/A'}%\`);
  }
  
  if (data.results) {
    const avgImprovement = data.results.reduce((sum, r) => sum + (r.improvementPercentage || 0), 0) / data.results.length;
    console.log(\`  Average Improvement: \${avgImprovement.toFixed(1)}%\`);
  }
});

console.log('\\n✅ Performance testing completed!');
"

echo ""
echo "🎉 All performance tests completed!"
echo "📁 Reports saved in: ./performance-reports/"
echo ""
echo "🔍 To monitor real-time performance:"
echo "   npm run monitor:performance"
echo ""
echo "📊 Key Metrics to Watch:"
echo "   • Swipe Response Time: < 500ms"
echo "   • Cache Hit Rate: > 80%"
echo "   • Success Rate: > 95%"
echo "   • Avatar Generation: < 7s"
