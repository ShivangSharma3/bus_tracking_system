#!/bin/bash
# Render Static Site Build Script
echo "Starting static site build..."
npm install
echo "Dependencies installed successfully"
npm run build
echo "Build completed successfully"
echo "Static site ready for deployment"
