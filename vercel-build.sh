#!/bin/bash
set -e

echo "Installing dependencies..."
pnpm install --no-frozen-lockfile

echo "Building frontend..."
pnpm --filter @workspace/BetterCapitalInvestment run build

echo "Building API server..."
pnpm --filter @workspace/api-server run build

echo "Checking output directory..."
ls -la
if [ -d "public" ]; then
  echo "✓ public directory found"
  ls -la public | head -20
else
  echo "✗ public directory NOT found"
  echo "Searching for public directories..."
  find . -name "public" -type d
fi
