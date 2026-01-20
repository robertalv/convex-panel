import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";
import { readFileSync, copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get git commit hash and repository URL at build time
function getGitCommitHash(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function getGitRepoUrl(): string {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8",
    }).trim();
    // Convert git@github.com:user/repo.git to https://github.com/user/repo
    // or keep https://github.com/user/repo.git as is
    const httpsUrl = remoteUrl
      .replace(/^git@github\.com:/, "https://github.com/")
      .replace(/\.git$/, "");
    return httpsUrl;
  } catch {
    return "";
  }
}

// Get package version from package.json
function getPackageVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
    );
    return packageJson.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// Copy registry public assets to desktop public folder
function copyRegistryAssets() {
  const registryPublicDir = path.resolve(__dirname, "../../packages/registry/public");
  const desktopPublicDir = path.resolve(__dirname, "./public");
  
  if (existsSync(registryPublicDir)) {
    const files = readdirSync(registryPublicDir);
    files.forEach((file) => {
      if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".svg") || file.endsWith(".webp")) {
        const src = path.join(registryPublicDir, file);
        const dest = path.join(desktopPublicDir, file);
        if (existsSync(src)) {
          copyFileSync(src, dest);
        }
      }
    });
  }
}

// Copy assets on config load
copyRegistryAssets();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-registry-assets",
      buildStart() {
        copyRegistryAssets();
      },
    },
  ],

  // Always use relative paths for Tauri builds (needed for tauri:// protocol in production)
  base: "./",

  // Prevent vite from obscuring rust errors
  clearScreen: false,

  // Tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Tell vite to ignore watching src-tauri
      ignored: ["**/src-tauri/**"],
    },
  },

  // To access the Tauri environment variables set by the CLI with information about the current target
  envPrefix: ["VITE_", "TAURI_ENV_*"],

  // Inject git commit info and package version at build time
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __GIT_REPO_URL__: JSON.stringify(getGitRepoUrl()),
    __APP_VERSION__: JSON.stringify(getPackageVersion()),
  },

  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari14",
    // Production builds: minify and no sourcemaps, debug builds: no minify and sourcemaps
    minify:
      process.env.NODE_ENV === "production"
        ? "esbuild"
        : !process.env.TAURI_ENV_DEBUG
          ? "esbuild"
          : false,
    // Produce sourcemaps for debug builds, but not for production
    sourcemap:
      process.env.NODE_ENV === "production"
        ? false
        : !!process.env.TAURI_ENV_DEBUG,
    // Production optimizations
    ...(process.env.NODE_ENV === "production" && {
      chunkSizeWarningLimit: 1000,
    }),
    rollupOptions: {
      // Production chunk splitting for better caching
      ...(process.env.NODE_ENV === "production" && {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "convex-vendor": ["convex", "convex/react"],
            "ui-vendor": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-popover",
              "@radix-ui/react-select",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
            ],
          },
        },
      }),
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "convex-panel": path.resolve(
        __dirname,
        "../../packages/panel/src/index.ts",
      ),
    },
  },
});
