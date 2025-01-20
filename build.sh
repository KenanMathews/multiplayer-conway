#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🧹 Cleaning up..."
rm -rf node_modules client/node_modules server/node_modules client/dist server/public

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building client..."
cd client
npm install
npm run build

echo "📋 Setting up server..."
cd ../server
mkdir -p public
cp -r ../client/dist/* public/
npm ci --production

echo "✨ Build completed!"
cd ..

# Verify the build
echo "🔍 Verifying build..."
if [ -d "server/public" ]; then
    echo "✅ Server public directory exists"
    ls -la server/public/
else
    echo "❌ Server public directory is missing"
    exit 1
fi