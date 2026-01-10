#!/bin/bash

# Post-build script for macOS app bundle
# - Ad-hoc code signing to prevent keychain prompts during development

set -e

APP_BUNDLE="src-tauri/target/release/bundle/macos/Convex Panel.app"

if [ ! -d "$APP_BUNDLE" ]; then
    echo "❌ App bundle not found at: $APP_BUNDLE"
    exit 1
fi

echo "🔏 Ad-hoc signing app bundle to prevent keychain prompts..."
codesign --force --deep --sign - "$APP_BUNDLE"

echo "✅ App bundle signed successfully!"
echo "📦 Bundle location: $APP_BUNDLE"
