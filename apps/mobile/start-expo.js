#!/usr/bin/env node
// Load metro-resolve-patch before any modules are loaded
// This ensures proper module resolution for metro packages in pnpm workspaces
require("./metro-resolve-patch");

// Start Expo CLI directly
require("expo/bin/cli");
