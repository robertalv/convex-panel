#!/usr/bin/env node
/**
 * Sequential build script for Windows CI
 *
 * This script runs tsup builds one at a time to avoid the esbuild Go runtime
 * deadlock that occurs when running multiple parallel builds on Windows.
 *
 * Usage: node scripts/build-sequential.js
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootDir = path.resolve(__dirname, "..");

// Define individual tsup configs for each entry
const configs = [
  {
    name: "main",
    entry: "src/index.ts",
    outDir: "dist",
    splitting: true,
  },
  {
    name: "vite",
    entry: "src/vite/index.ts",
    outDir: "dist/.vite-temp", // Build to temp dir to avoid overwriting main
    splitting: false,
    extraExternal: ["vite"],
    // After build, move and rename to dist/vite.*
    moveAndRename: {
      from: "dist/.vite-temp",
      files: {
        "index.js": "dist/vite.js",
        "index.js.map": "dist/vite.js.map",
        "index.mjs": "dist/vite.esm.js",
        "index.mjs.map": "dist/vite.esm.js.map",
        "index.d.ts": "dist/vite.d.ts",
        "index.d.mts": "dist/vite.d.mts",
      },
    },
  },
  {
    name: "nextjs",
    entry: "src/nextjs/index.tsx",
    outDir: "dist/nextjs",
    splitting: true,
    extraExternal: ["next", "next/*"],
  },
  {
    name: "react",
    entry: "src/react/index.tsx",
    outDir: "dist/react",
    splitting: true,
  },
];

function run(cmd, desc, options = {}) {
  console.log(`\n>>> ${desc}`);
  console.log(`$ ${cmd}\n`);
  const result = spawnSync(cmd, {
    shell: true,
    stdio: "inherit",
    cwd: rootDir,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed with exit code ${result.status}`);
  }
}

function buildEntry(config) {
  const { name, entry, outDir, splitting, extraExternal, moveAndRename } =
    config;

  // Build tsup CLI args - use --no-config to prevent loading the array config
  const args = [
    entry,
    "--no-config",
    "--format",
    "cjs,esm",
    "--dts",
    "--treeshake",
    "--sourcemap",
    "--minify",
    "--target",
    "es2020",
    "--out-dir",
    outDir,
  ];

  if (splitting) {
    args.push("--splitting");
  }

  // External packages
  const external = [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "convex",
    "convex/react",
    "convex/browser",
    "monaco-editor",
    "@monaco-editor/react",
    "lucide-react",
    "framer-motion",
    "sonner",
    "react-window",
    "react-hotkeys-hook",
    "date-fns",
    "classnames",
    "lodash",
    "swr",
    "debounce",
    "vite",
    "next",
    "next/*",
    ...(extraExternal || []),
  ];

  for (const ext of external) {
    args.push("--external", ext);
  }

  const cmd = `npx tsup ${args.join(" ")}`;
  run(cmd, `Building ${name} (${entry})`);

  // Handle file move and rename if specified (for vite which needs special output names)
  if (moveAndRename) {
    console.log(`\n>>> Moving and renaming output files for ${name}`);
    const { from, files } = moveAndRename;
    for (const [fromFile, toFile] of Object.entries(files)) {
      const fromPath = path.join(rootDir, from, fromFile);
      const toPath = path.join(rootDir, toFile);
      if (fs.existsSync(fromPath)) {
        // Ensure target directory exists
        const toDir = path.dirname(toPath);
        if (!fs.existsSync(toDir)) {
          fs.mkdirSync(toDir, { recursive: true });
        }
        fs.renameSync(fromPath, toPath);
        console.log(`  ${from}/${fromFile} -> ${toFile}`);
      }
    }
    // Clean up temp directory
    const tempDir = path.join(rootDir, from);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
      console.log(`  Cleaned up ${from}`);
    }
  }
}

async function main() {
  try {
    console.log("=".repeat(60));
    console.log("Sequential Build for Windows CI");
    console.log("=".repeat(60));

    // Clean
    run("npm run clean", "Cleaning dist folder");

    // Copy source
    run("npm run copy-src", "Copying source files");

    // Build each entry sequentially (separate process for each)
    for (const config of configs) {
      buildEntry(config);
    }

    // Post-processing
    run("npm run build:css", "Building CSS");
    run("npm run build:styles-ts", "Generating styles TypeScript");
    run("node scripts/print-build-size.cjs", "Printing build size");

    console.log("\n" + "=".repeat(60));
    console.log("Sequential build complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\nBuild failed:", error.message);
    process.exit(1);
  }
}

main();
