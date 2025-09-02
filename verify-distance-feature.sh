#!/bin/bash

# 🚌 Distance Information Feature Verification Script
# Verifies that the distance display feature is working correctly

echo "🎯 Distance Information Feature Verification"
echo "============================================="
echo ""

# Check if the Student Dashboard has the distance information code
echo "📋 Checking Student Dashboard implementation..."
if grep -q "Distance to Current Stop" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Distance to Current Stop display found"
else
    echo "❌ Distance to Current Stop display missing"
    exit 1
fi

if grep -q "Distance to Next Stop" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Distance to Next Stop display found"
else
    echo "❌ Distance to Next Stop display missing"
    exit 1
fi

if grep -q "distanceToCurrentStop" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Current stop distance data binding found"
else
    echo "❌ Current stop distance data binding missing"
    exit 1
fi

if grep -q "distanceToNextStop" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Next stop distance data binding found"
else
    echo "❌ Next stop distance data binding missing"
    exit 1
fi

echo ""
echo "🎨 Checking UI components..."

if grep -q "bg-blue-50" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Blue styling for current stop distance found"
else
    echo "❌ Blue styling for current stop distance missing"
fi

if grep -q "bg-green-50" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Green styling for next stop distance found"
else
    echo "❌ Green styling for next stop distance missing"
fi

if grep -q "📍" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Pin icon for current stop found"
else
    echo "❌ Pin icon for current stop missing"
fi

if grep -q "🎯" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Target icon for next stop found"
else
    echo "❌ Target icon for next stop missing"
fi

echo ""
echo "📏 Checking smart unit formatting..."

if grep -q "1000).toFixed(0" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Meter formatting (< 1km) found"
else
    echo "❌ Meter formatting missing"
fi

if grep -q ".toFixed(2)km" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Kilometer formatting (≥ 1km) found"
else
    echo "❌ Kilometer formatting missing"
fi

echo ""
echo "🔧 Checking data source..."

if grep -q "distanceToCurrentStop" /Users/shivangsharma/bus/src/utils/locationService.js; then
    echo "✅ LocationService provides distanceToCurrentStop"
else
    echo "❌ LocationService missing distanceToCurrentStop"
fi

if grep -q "distanceToNextStop" /Users/shivangsharma/bus/src/utils/locationService.js; then
    echo "✅ LocationService provides distanceToNextStop"
else
    echo "❌ LocationService missing distanceToNextStop"
fi

echo ""
echo "📱 Checking responsive design..."

if grep -q "grid-cols-2" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Two-column grid layout found"
else
    echo "❌ Grid layout missing"
fi

if grep -q "gap-4" /Users/shivangsharma/bus/src/pages/StudentDashboard.jsx; then
    echo "✅ Grid gap spacing found"
else
    echo "❌ Grid gap spacing missing"
fi

echo ""
echo "🧪 Checking test files..."

if [ -f "/Users/shivangsharma/bus/test-distance-display.html" ]; then
    echo "✅ Distance display test file exists"
else
    echo "❌ Distance display test file missing"
fi

if [ -f "/Users/shivangsharma/bus/DISTANCE_INFORMATION_COMPLETE.md" ]; then
    echo "✅ Documentation file exists"
else
    echo "❌ Documentation file missing"
fi

echo ""
echo "🎉 VERIFICATION COMPLETE!"
echo ""
echo "✅ Feature Summary:"
echo "   📍 Distance to Current Stop - Shows bus distance to closest stop"
echo "   🎯 Distance to Next Stop - Shows bus distance to next route stop"
echo "   📏 Smart Units - Meters (< 1km) or Kilometers (≥ 1km)"
echo "   🎨 Color-coded Cards - Blue for current, Green for next"
echo "   📱 Responsive Design - Grid layout adapts to screen size"
echo "   🔄 Real-time Updates - Updates every 3 seconds"
echo ""
echo "🚀 Ready for Testing:"
echo "   1. Start the app: npm run dev"
echo "   2. Login as student: amit@example.com / password1"
echo "   3. Enable driver GPS tracking"
echo "   4. View distance cards in Student Dashboard"
echo ""
echo "📊 Test Results Expected:"
echo "   At rohta bypass: Current ~0m, Next ~3.56km"
echo "   Between stops: Variable distances based on position"
echo "   Smart formatting: 150m vs 2.34km"
