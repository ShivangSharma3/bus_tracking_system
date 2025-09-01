#!/bin/bash
# startup-verification.sh - Verify deployment is working

echo "🔍 Starting deployment verification..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist folder not found"
    exit 1
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed: index.html not found in dist"
    exit 1
fi

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ Server file not found"
    exit 1
fi

# Check if package.json has required scripts
if ! grep -q '"start".*"node server.js"' package.json; then
    echo "❌ Start script not configured properly"
    exit 1
fi

echo "✅ All verification checks passed!"
echo "🚀 Ready for deployment on Render"

# Optional: Test build locally
echo "🔨 Testing build process..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Deployment verification complete!"
