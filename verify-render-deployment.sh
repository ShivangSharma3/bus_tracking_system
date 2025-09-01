#!/bin/bash
# verify-render-deployment.sh - Complete deployment verification

set -e  # Exit on any error

echo "🚀 Bus Tracking System - Render Web Service Verification"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check Node.js version
echo ""
print_info "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
    
    # Check if version is 18+
    if [[ "$NODE_VERSION" =~ v1[8-9]\. ]] || [[ "$NODE_VERSION" =~ v[2-9][0-9]\. ]]; then
        print_status "Node.js version is compatible (18+)"
    else
        print_warning "Node.js version might be too old. Recommended: 18+"
    fi
else
    print_error "Node.js is not installed"
    exit 1
fi

# Check npm version
print_info "Checking npm version..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm version: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Verify required files exist
echo ""
print_info "Verifying required files..."

required_files=(
    "package.json"
    "server.js"
    "render.yaml"
    ".nvmrc"
    ".npmrc"
    "Dockerfile"
    ".dockerignore"
    ".env.production"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "$file exists"
    else
        print_error "$file is missing"
        exit 1
    fi
done

# Check package.json configuration
echo ""
print_info "Verifying package.json configuration..."

if grep -q '"start".*"node server.js"' package.json; then
    print_status "Start script configured correctly"
else
    print_error "Start script not configured properly"
    exit 1
fi

if grep -q '"build".*"vite build"' package.json; then
    print_status "Build script configured correctly"
else
    print_error "Build script not configured properly"
    exit 1
fi

if grep -q '"type": "module"' package.json; then
    print_status "ES modules configured"
else
    print_warning "CommonJS modules detected (should work but ES modules recommended)"
fi

# Check if dependencies are installed
echo ""
print_info "Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status "node_modules directory exists"
else
    print_warning "node_modules not found, installing dependencies..."
    npm install
fi

# Verify key dependencies
key_deps=("express" "compression" "helmet" "react" "react-dom" "vite")
for dep in "${key_deps[@]}"; do
    if npm list "$dep" &> /dev/null; then
        print_status "$dep is installed"
    else
        print_error "$dep is not installed"
        exit 1
    fi
done

# Test build process
echo ""
print_info "Testing build process..."
if npm run build; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# Verify dist directory
if [ -d "dist" ]; then
    print_status "dist directory created"
    
    if [ -f "dist/index.html" ]; then
        print_status "index.html exists in dist"
    else
        print_error "index.html not found in dist"
        exit 1
    fi
    
    # Check dist size
    DIST_SIZE=$(du -sh dist | cut -f1)
    print_status "Build size: $DIST_SIZE"
else
    print_error "dist directory not created"
    exit 1
fi

# Test server startup (quick test)
echo ""
print_info "Testing server startup..."
timeout 5s npm start &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null; then
    print_status "Server starts successfully"
    kill $SERVER_PID 2>/dev/null || true
else
    print_error "Server failed to start"
    exit 1
fi

# Check render.yaml configuration
echo ""
print_info "Verifying render.yaml configuration..."

if grep -q "type: web" render.yaml; then
    print_status "Service type set to 'web'"
else
    print_error "Service type not set to 'web'"
    exit 1
fi

if grep -q "env: node" render.yaml; then
    print_status "Environment set to 'node'"
else
    print_error "Environment not set to 'node'"
    exit 1
fi

if grep -q "npm start" render.yaml; then
    print_status "Start command configured"
else
    print_error "Start command not configured"
    exit 1
fi

if grep -q "healthCheckPath: /health" render.yaml; then
    print_status "Health check path configured"
else
    print_warning "Health check path not configured"
fi

# Check Git status
echo ""
print_info "Checking Git status..."
if git status &> /dev/null; then
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "There are uncommitted changes"
        git status --short
    else
        print_status "All changes committed"
    fi
    
    # Check if on main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
        print_status "On main branch: $CURRENT_BRANCH"
    else
        print_warning "Not on main branch. Current: $CURRENT_BRANCH"
    fi
else
    print_warning "Not a Git repository"
fi

# Summary
echo ""
echo "========================================================="
print_status "🎉 All verification checks passed!"
echo ""
print_info "Your Bus Tracking System is ready for Render deployment!"
echo ""
echo "Next steps:"
echo "1. Commit and push any remaining changes to GitHub"
echo "2. Create a new Web Service on Render"
echo "3. Connect your GitHub repository"
echo "4. Use these settings:"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Health Check Path: /health"
echo ""
print_status "🚀 Ready to deploy!"
