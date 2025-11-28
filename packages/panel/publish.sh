#!/bin/bash

# Exit on error
set -e

# Clean and build
npm run clean
npm run build

# Check if version argument is provided
if [ -z "$1" ]; then
  echo "Please provide a version argument (patch, minor, major, or specific version)"
  exit 1
fi

# Update version
if [ "$1" == "patch" ] || [ "$1" == "minor" ] || [ "$1" == "major" ]; then
  npm version $1
else
  npm version $1
fi

# Publish to npm
npm publish

echo "Published successfully!" 