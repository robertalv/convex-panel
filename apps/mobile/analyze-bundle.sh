#!/bin/bash
# Bundle Size Analysis Script for Convex Panel Mobile

set -e

echo "📦 Bundle Size Analysis for Convex Panel Mobile"
echo "================================================"
echo ""

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create output directory
OUTPUT_DIR="./bundle-analysis"
mkdir -p "$OUTPUT_DIR"

echo "🔨 Building production bundle..."
echo ""

# Build iOS bundle
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output "$OUTPUT_DIR/bundle.ios.js" \
  --sourcemap-output "$OUTPUT_DIR/bundle.ios.map" \
  --assets-dest "$OUTPUT_DIR/assets"

# Build Android bundle
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output "$OUTPUT_DIR/bundle.android.js" \
  --sourcemap-output "$OUTPUT_DIR/bundle.android.map" \
  --assets-dest "$OUTPUT_DIR/assets"

echo ""
echo "✅ Bundles built successfully!"
echo ""

# Analyze sizes
echo "📊 Bundle Size Analysis:"
echo "------------------------"

IOS_SIZE=$(du -h "$OUTPUT_DIR/bundle.ios.js" | cut -f1)
ANDROID_SIZE=$(du -h "$OUTPUT_DIR/bundle.android.js" | cut -f1)
IOS_SIZE_KB=$(du -k "$OUTPUT_DIR/bundle.ios.js" | cut -f1)
ANDROID_SIZE_KB=$(du -k "$OUTPUT_DIR/bundle.android.js" | cut -f1)

echo ""
echo "iOS Bundle:     ${GREEN}$IOS_SIZE${NC} ($IOS_SIZE_KB KB)"
echo "Android Bundle: ${GREEN}$ANDROID_SIZE${NC} ($ANDROID_SIZE_KB KB)"
echo ""

# Budget check
BUDGET_KB=3072  # 3MB
if [ $IOS_SIZE_KB -gt $BUDGET_KB ]; then
  echo "${RED}⚠️  iOS bundle exceeds 3MB budget!${NC}"
else
  echo "${GREEN}✅ iOS bundle within budget${NC}"
fi

if [ $ANDROID_SIZE_KB -gt $BUDGET_KB ]; then
  echo "${RED}⚠️  Android bundle exceeds 3MB budget!${NC}"
else
  echo "${GREEN}✅ Android bundle within budget${NC}"
fi

echo ""

# Count assets
ASSET_COUNT=$(find "$OUTPUT_DIR/assets" -type f | wc -l | tr -d ' ')
echo "📁 Assets: $ASSET_COUNT files"

# Show top-level breakdown
echo ""
echo "📈 Analyzing bundle composition..."
echo ""

# Install source-map-explorer if not already installed
if ! command -v source-map-explorer &> /dev/null; then
  echo "${YELLOW}Installing source-map-explorer...${NC}"
  npm install -g source-map-explorer || pnpm add -g source-map-explorer
fi

# Generate HTML reports
echo "Generating interactive HTML reports..."
source-map-explorer "$OUTPUT_DIR/bundle.ios.js" "$OUTPUT_DIR/bundle.ios.map" \
  --html "$OUTPUT_DIR/ios-bundle-analysis.html" \
  --no-border-checks || echo "${YELLOW}Could not generate iOS report${NC}"

source-map-explorer "$OUTPUT_DIR/bundle.android.js" "$OUTPUT_DIR/bundle.android.map" \
  --html "$OUTPUT_DIR/android-bundle-analysis.html" \
  --no-border-checks || echo "${YELLOW}Could not generate Android report${NC}"

echo ""
echo "✅ Analysis complete!"
echo ""
echo "📄 Reports generated:"
echo "  - $OUTPUT_DIR/ios-bundle-analysis.html"
echo "  - $OUTPUT_DIR/android-bundle-analysis.html"
echo ""
echo "💡 Open these files in a browser to explore bundle composition"
echo ""

# Show recommendations
echo "🔍 Optimization Recommendations:"
echo "--------------------------------"

if [ $IOS_SIZE_KB -gt 2048 ]; then
  echo "• Consider code splitting for large features"
  echo "• Review and remove unused dependencies"
  echo "• Enable Hermes engine for smaller bundle"
fi

if [ $ASSET_COUNT -gt 100 ]; then
  echo "• Optimize image assets (use WebP format)"
  echo "• Remove unused assets"
  echo "• Consider lazy loading assets"
fi

echo ""
echo "Done! 🎉"
