#!/bin/bash

echo "🔍 FitLit Backend - Full Code Audit"
echo "==================================="
echo ""

# Create audit reports directory
mkdir -p audit-reports

echo "1️⃣  Running Code Pattern Audit..."
echo "--------------------------------"
npm run audit:code || node -r ts-node/register scripts/code-audit.ts
echo ""

echo "2️⃣  Running API Migration Verification..."
echo "---------------------------------------"
npm run audit:migration || node -r ts-node/register scripts/verify-api-migration.ts
echo ""

echo "3️⃣  Running Dependency Check..."
echo "-----------------------------"
npm audit --audit-level=moderate
echo ""

echo "4️⃣  Running TypeScript Compilation Check..."
echo "------------------------------------------"
npm run build
echo ""

echo "5️⃣  Running Linting Check..."
echo "---------------------------"
npm run lint
echo ""

echo "6️⃣  Running Tests..."
echo "------------------"
npm test
echo ""

echo "7️⃣  Generating Final Audit Summary..."
echo "-----------------------------------"

# Generate comprehensive audit summary
node -e "
const fs = require('fs');
const path = require('path');

console.log('📊 COMPREHENSIVE AUDIT SUMMARY');
console.log('==============================');

const auditDir = path.join(process.cwd(), 'audit-reports');
if (!fs.existsSync(auditDir)) {
  console.log('❌ No audit reports found');
  process.exit(1);
}

const files = fs.readdirSync(auditDir)
  .filter(f => f.endsWith('.json'))
  .sort();

let totalIssues = 0;
let totalWarnings = 0;
let migrationComplete = false;

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(auditDir, file)));
    
    if (file.includes('code-audit')) {
      console.log(\`\n📋 Code Audit Results:\`);
      console.log(\`  Files Audited: \${data.totalFiles}\`);
      console.log(\`  ✅ Passed: \${data.passedFiles}\`);
      console.log(\`  ⚠️  Warnings: \${data.warningFiles}\`);
      console.log(\`  ❌ Failed: \${data.failedFiles}\`);
      
      totalIssues += data.failedFiles;
      totalWarnings += data.warningFiles;
      
      if (data.summary.openaiReferences.length === 0) {
        console.log('  ✅ No OpenAI references found');
      } else {
        console.log(\`  ❌ OpenAI references: \${data.summary.openaiReferences.length}\`);
        totalIssues += data.summary.openaiReferences.length;
      }
    }
    
    if (file.includes('migration-report')) {
      console.log(\`\n🔄 Migration Status:\`);
      console.log(\`  Files Checked: \${data.totalFiles}\`);
      console.log(\`  ✅ Complete: \${data.completelyMigrated}\`);
      console.log(\`  ⚠️  Partial: \${data.partiallyMigrated}\`);
      console.log(\`  ❌ Not Started: \${data.notMigrated}\`);
      
      const migrationPercentage = (data.completelyMigrated / data.totalFiles) * 100;
      console.log(\`  Progress: \${migrationPercentage.toFixed(1)}%\`);
      
      migrationComplete = migrationPercentage === 100 && data.summary.openaiUsage === 0;
      
      if (!migrationComplete) {
        totalIssues += data.notMigrated;
        totalWarnings += data.partiallyMigrated;
      }
    }
  } catch (error) {
    console.log(\`❌ Error reading \${file}: \${error.message}\`);
  }
});

console.log(\`\n🎯 FINAL AUDIT RESULTS:\`);
console.log(\`Total Issues: \${totalIssues}\`);
console.log(\`Total Warnings: \${totalWarnings}\`);

if (totalIssues === 0 && migrationComplete) {
  console.log('🏆 AUDIT PASSED - Code is ready for production!');
  console.log('✅ All OpenAI/ChatGPT APIs successfully replaced');
  console.log('✅ Code patterns and structure maintained');
  console.log('✅ No critical issues found');
} else if (totalIssues === 0) {
  console.log('⚠️  AUDIT PASSED WITH WARNINGS');
  console.log('✅ No critical issues, but some warnings to address');
} else {
  console.log('❌ AUDIT FAILED - Critical issues found');
  console.log('🚨 Please address the issues before proceeding');
  process.exit(1);
}
"

echo ""
echo "✅ Full audit completed!"
echo "📁 Detailed reports available in: ./audit-reports/"
