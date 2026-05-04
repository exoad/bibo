#!/bin/bash
# Script to fix npm dependency conflict on remote bibo server
# Run this on the remote server where bibo is failing to update

set -e

echo "=== Fixing bibo npm dependency conflict ==="
echo "Error: pi-btw@0.3.8 requires @mariozechner/pi-coding-agent@^0.66.1"
echo "But you have @mariozechner/pi-coding-agent@0.70.6"
echo

# Navigate to bibo directory
if [ -d ~/bibo ]; then
  cd ~/bibo
elif [ -d /home/jack/bibo ]; then
  cd /home/jack/bibo
else
  echo "Error: Could not find bibo directory."
  echo "Please cd to your bibo directory first, then run this script."
  exit 1
fi

echo "Current directory: $(pwd)"

# Check if .pi/npm/package.json exists
if [ ! -f .pi/npm/package.json ]; then
  echo "Error: .pi/npm/package.json not found"
  exit 1
fi

# Backup
cp .pi/npm/package.json .pi/npm/package.json.backup
echo "Backed up package.json to .pi/npm/package.json.backup"

# Remove pi-btw from dependencies
echo "Removing pi-btw from dependencies..."
# Using jq if available
if command -v jq &> /dev/null; then
  jq 'del(.dependencies["pi-btw"])' .pi/npm/package.json > .pi/npm/package.json.tmp
  mv .pi/npm/package.json.tmp .pi/npm/package.json
  echo "Removed pi-btw using jq"
else
  # Fallback to sed
  sed -i '/"pi-btw":/d' .pi/npm/package.json
  echo "Removed pi-btw using sed"
fi

echo "Updated .pi/npm/package.json"
echo "Contents of .pi/npm/package.json:"
head -30 .pi/npm/package.json

echo
echo "=== Installing dependencies with --legacy-peer-deps ==="
cd .pi/npm
npm install --legacy-peer-deps

echo
echo "=== Checking main package.json ==="
cd ../..
if [ -f package.json ]; then
  echo "Main package.json dependencies:"
  grep -A5 '"dependencies"' package.json || echo "No dependencies section"
  
  # Also check if we need to install with --legacy-peer-deps in main dir
  echo
  echo "Running npm install in main directory with --legacy-peer-deps..."
  npm install --legacy-peer-deps
fi

echo
echo "=== Done! ==="
echo "Try running 'bibo update' again."
echo "If it still fails, try: bibo update --legacy-peer-deps"
echo "Or manually run: npm update --legacy-peer-deps"