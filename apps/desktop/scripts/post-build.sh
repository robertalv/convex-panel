#!/bin/bash

# Post-build script for macOS app bundle
# - Uses Developer ID signing if available, otherwise falls back to ad-hoc signing
# - Ad-hoc signing prevents keychain prompts during development

set -e

APP_BUNDLE="src-tauri/target/release/bundle/macos/Convex Panel.app"
DMG_PATH="src-tauri/target/release/bundle/dmg"

if [ ! -d "$APP_BUNDLE" ]; then
    echo "App bundle not found at: $APP_BUNDLE"
    exit 1
fi

# Check if we have a proper signing identity
if [ -n "$APPLE_SIGNING_IDENTITY" ]; then
    echo "Signing app bundle with Developer ID..."
    codesign --force --deep --options runtime --sign "$APPLE_SIGNING_IDENTITY" "$APP_BUNDLE"
    
    # Sign DMG if it exists
    if [ -d "$DMG_PATH" ]; then
        for dmg in "$DMG_PATH"/*.dmg; do
            if [ -f "$dmg" ]; then
                echo "Signing DMG: $dmg"
                codesign --force --sign "$APPLE_SIGNING_IDENTITY" "$dmg"
            fi
        done
    fi
    
    echo "App bundle signed with Developer ID!"
else
    echo "APPLE_SIGNING_IDENTITY not set, using ad-hoc signing for development..."
    codesign --force --deep --sign - "$APP_BUNDLE"
    echo "App bundle signed with ad-hoc signature (development only)"
fi

echo "Bundle location: $APP_BUNDLE"

# Verify the signature
echo ""
echo "Verifying signature..."
codesign -dv --verbose=2 "$APP_BUNDLE" 2>&1 | head -10
