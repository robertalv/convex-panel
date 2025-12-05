#!/usr/bin/env node

/**
 * Convex Panel CLI
 * Entry point for convex-panel command
 */

const { spawn } = require('child_process');
const path = require('path');

const command = process.argv[2];

// Get the package root directory
const packageRoot = path.resolve(__dirname, '..');
const setupEnvPath = path.join(packageRoot, 'scripts', 'setup-env.js');
const setupOAuthPath = path.join(packageRoot, 'scripts', 'setup-oauth.js');

if (command === 'setup') {
  // Run setup-oauth first, then setup-env
  const setupOAuth = spawn('node', [setupOAuthPath], { stdio: 'inherit', cwd: process.cwd() });
  
  setupOAuth.on('close', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
    const setupEnv = spawn('node', [setupEnvPath], { stdio: 'inherit', cwd: process.cwd() });
    setupEnv.on('close', (code) => {
      process.exit(code);
    });
  });
} else if (!command) {
  // No command provided, show help
  console.log(`
Convex Panel CLI

Usage:
  convex-panel setup    Run interactive setup (OAuth + environment variables)
`);
  process.exit(1);
} else {
  console.log(`
Unknown command: ${command}

Usage:
  convex-panel setup    Run interactive setup (OAuth + environment variables)
`);
  process.exit(1);
}
