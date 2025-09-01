#!/bin/bash

echo "🚀 Bus Tracking System - Deployment Verification"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

echo "✅ Project directory confirmed"

# Check required files
echo "📁 Checking deployment files..."

files=("render.yaml" "public/_redirects" "package.json" "vite.config.js" "public/health.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

# Check dependencies
echo "📦 Checking dependencies..."
if npm list --depth=0 >/dev/null 2>&1; then
    echo "  ✅ Dependencies installed"
else
    echo "  ❌ Dependencies missing - run 'npm install'"
fi

# Test build
echo "🔨 Testing build process..."
if npm run build >/dev/null 2>&1; then
    echo "  ✅ Build successful"
    
    # Check dist folder
    if [ -d "dist" ]; then
        echo "  ✅ dist folder created"
        
        # Check key files in dist
        if [ -f "dist/index.html" ]; then
            echo "  ✅ index.html generated"
        fi
        
        if [ -f "dist/_redirects" ]; then
            echo "  ✅ _redirects file copied"
        fi
        
        # Count assets
        asset_count=$(find dist/assets -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
        echo "  ✅ Generated $asset_count asset files"
    else
        echo "  ❌ dist folder not created"
    fi
else
    echo "  ❌ Build failed"
fi

echo ""
echo "🎯 Deployment Summary:"
echo "Repository: https://github.com/ShivangSharma3/bus_tracking_system"
echo "Branch: attendance"
echo "Build Command: npm install && npm run build"
echo "Publish Directory: dist"
echo ""
echo "Ready to deploy to Render! 🚀"
