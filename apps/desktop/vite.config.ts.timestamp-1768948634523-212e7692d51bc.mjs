// vite.config.ts
import { defineConfig } from "file:///Users/robertalvarez/Desktop/convex-panel/node_modules/.pnpm/vite@5.4.21_@types+node@25.0.3_lightningcss@1.30.2_terser@5.44.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/robertalvarez/Desktop/convex-panel/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@25.0.3_lightningcss@1.30.2_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///Users/robertalvarez/Desktop/convex-panel/node_modules/.pnpm/@tailwindcss+vite@4.1.18_vite@5.4.21_@types+node@25.0.3_lightningcss@1.30.2_terser@5.44.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import { execSync } from "child_process";
import { readFileSync, copyFileSync, existsSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/robertalvarez/Desktop/convex-panel/apps/desktop/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
function getGitCommitHash() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}
function getGitRepoUrl() {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8"
    }).trim();
    const httpsUrl = remoteUrl.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
    return httpsUrl;
  } catch {
    return "";
  }
}
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.resolve(__dirname, "package.json"), "utf-8")
    );
    return packageJson.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
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
copyRegistryAssets();
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-registry-assets",
      buildStart() {
        copyRegistryAssets();
      }
    }
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
      ignored: ["**/src-tauri/**"]
    }
  },
  // To access the Tauri environment variables set by the CLI with information about the current target
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  // Inject git commit info and package version at build time
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __GIT_REPO_URL__: JSON.stringify(getGitRepoUrl()),
    __APP_VERSION__: JSON.stringify(getPackageVersion())
  },
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari14",
    // Production builds: minify and no sourcemaps, debug builds: no minify and sourcemaps
    minify: process.env.NODE_ENV === "production" ? "esbuild" : !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    // Produce sourcemaps for debug builds, but not for production
    sourcemap: process.env.NODE_ENV === "production" ? false : !!process.env.TAURI_ENV_DEBUG,
    // Production optimizations
    ...process.env.NODE_ENV === "production" && {
      chunkSizeWarningLimit: 1e3
    },
    rollupOptions: {
      // Production chunk splitting for better caching
      ...process.env.NODE_ENV === "production" && {
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
              "@radix-ui/react-tooltip"
            ]
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "convex-panel": path.resolve(
        __dirname,
        "../../packages/panel/src/index.ts"
      )
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcm9iZXJ0YWx2YXJlei9EZXNrdG9wL2NvbnZleC1wYW5lbC9hcHBzL2Rlc2t0b3BcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yb2JlcnRhbHZhcmV6L0Rlc2t0b3AvY29udmV4LXBhbmVsL2FwcHMvZGVza3RvcC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcm9iZXJ0YWx2YXJlei9EZXNrdG9wL2NvbnZleC1wYW5lbC9hcHBzL2Rlc2t0b3Avdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRGaWxlU3luYywgY29weUZpbGVTeW5jLCBleGlzdHNTeW5jLCBta2RpclN5bmMsIHJlYWRkaXJTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcInVybFwiO1xuXG4vLyBHZXQgX19kaXJuYW1lIGVxdWl2YWxlbnQgZm9yIEVTTVxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShfX2ZpbGVuYW1lKTtcblxuLy8gR2V0IGdpdCBjb21taXQgaGFzaCBhbmQgcmVwb3NpdG9yeSBVUkwgYXQgYnVpbGQgdGltZVxuZnVuY3Rpb24gZ2V0R2l0Q29tbWl0SGFzaCgpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiBleGVjU3luYyhcImdpdCByZXYtcGFyc2UgSEVBRFwiLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSkudHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gXCJ1bmtub3duXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0R2l0UmVwb1VybCgpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIGNvbnN0IHJlbW90ZVVybCA9IGV4ZWNTeW5jKFwiZ2l0IHJlbW90ZSBnZXQtdXJsIG9yaWdpblwiLCB7XG4gICAgICBlbmNvZGluZzogXCJ1dGYtOFwiLFxuICAgIH0pLnRyaW0oKTtcbiAgICAvLyBDb252ZXJ0IGdpdEBnaXRodWIuY29tOnVzZXIvcmVwby5naXQgdG8gaHR0cHM6Ly9naXRodWIuY29tL3VzZXIvcmVwb1xuICAgIC8vIG9yIGtlZXAgaHR0cHM6Ly9naXRodWIuY29tL3VzZXIvcmVwby5naXQgYXMgaXNcbiAgICBjb25zdCBodHRwc1VybCA9IHJlbW90ZVVybFxuICAgICAgLnJlcGxhY2UoL15naXRAZ2l0aHViXFwuY29tOi8sIFwiaHR0cHM6Ly9naXRodWIuY29tL1wiKVxuICAgICAgLnJlcGxhY2UoL1xcLmdpdCQvLCBcIlwiKTtcbiAgICByZXR1cm4gaHR0cHNVcmw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbi8vIEdldCBwYWNrYWdlIHZlcnNpb24gZnJvbSBwYWNrYWdlLmpzb25cbmZ1bmN0aW9uIGdldFBhY2thZ2VWZXJzaW9uKCk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFja2FnZUpzb24gPSBKU09OLnBhcnNlKFxuICAgICAgcmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwicGFja2FnZS5qc29uXCIpLCBcInV0Zi04XCIpXG4gICAgKTtcbiAgICByZXR1cm4gcGFja2FnZUpzb24udmVyc2lvbiB8fCBcIjAuMC4wXCI7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIjAuMC4wXCI7XG4gIH1cbn1cblxuLy8gQ29weSByZWdpc3RyeSBwdWJsaWMgYXNzZXRzIHRvIGRlc2t0b3AgcHVibGljIGZvbGRlclxuZnVuY3Rpb24gY29weVJlZ2lzdHJ5QXNzZXRzKCkge1xuICBjb25zdCByZWdpc3RyeVB1YmxpY0RpciA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vLi4vcGFja2FnZXMvcmVnaXN0cnkvcHVibGljXCIpO1xuICBjb25zdCBkZXNrdG9wUHVibGljRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3B1YmxpY1wiKTtcbiAgXG4gIGlmIChleGlzdHNTeW5jKHJlZ2lzdHJ5UHVibGljRGlyKSkge1xuICAgIGNvbnN0IGZpbGVzID0gcmVhZGRpclN5bmMocmVnaXN0cnlQdWJsaWNEaXIpO1xuICAgIGZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgIGlmIChmaWxlLmVuZHNXaXRoKFwiLnBuZ1wiKSB8fCBmaWxlLmVuZHNXaXRoKFwiLmpwZ1wiKSB8fCBmaWxlLmVuZHNXaXRoKFwiLmpwZWdcIikgfHwgZmlsZS5lbmRzV2l0aChcIi5zdmdcIikgfHwgZmlsZS5lbmRzV2l0aChcIi53ZWJwXCIpKSB7XG4gICAgICAgIGNvbnN0IHNyYyA9IHBhdGguam9pbihyZWdpc3RyeVB1YmxpY0RpciwgZmlsZSk7XG4gICAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oZGVza3RvcFB1YmxpY0RpciwgZmlsZSk7XG4gICAgICAgIGlmIChleGlzdHNTeW5jKHNyYykpIHtcbiAgICAgICAgICBjb3B5RmlsZVN5bmMoc3JjLCBkZXN0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbi8vIENvcHkgYXNzZXRzIG9uIGNvbmZpZyBsb2FkXG5jb3B5UmVnaXN0cnlBc3NldHMoKTtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gICAge1xuICAgICAgbmFtZTogXCJjb3B5LXJlZ2lzdHJ5LWFzc2V0c1wiLFxuICAgICAgYnVpbGRTdGFydCgpIHtcbiAgICAgICAgY29weVJlZ2lzdHJ5QXNzZXRzKCk7XG4gICAgICB9LFxuICAgIH0sXG4gIF0sXG5cbiAgLy8gQWx3YXlzIHVzZSByZWxhdGl2ZSBwYXRocyBmb3IgVGF1cmkgYnVpbGRzIChuZWVkZWQgZm9yIHRhdXJpOi8vIHByb3RvY29sIGluIHByb2R1Y3Rpb24pXG4gIGJhc2U6IFwiLi9cIixcblxuICAvLyBQcmV2ZW50IHZpdGUgZnJvbSBvYnNjdXJpbmcgcnVzdCBlcnJvcnNcbiAgY2xlYXJTY3JlZW46IGZhbHNlLFxuXG4gIC8vIFRhdXJpIGV4cGVjdHMgYSBmaXhlZCBwb3J0LCBmYWlsIGlmIHRoYXQgcG9ydCBpcyBub3QgYXZhaWxhYmxlXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDE0MjAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICB3YXRjaDoge1xuICAgICAgLy8gVGVsbCB2aXRlIHRvIGlnbm9yZSB3YXRjaGluZyBzcmMtdGF1cmlcbiAgICAgIGlnbm9yZWQ6IFtcIioqL3NyYy10YXVyaS8qKlwiXSxcbiAgICB9LFxuICB9LFxuXG4gIC8vIFRvIGFjY2VzcyB0aGUgVGF1cmkgZW52aXJvbm1lbnQgdmFyaWFibGVzIHNldCBieSB0aGUgQ0xJIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdGFyZ2V0XG4gIGVudlByZWZpeDogW1wiVklURV9cIiwgXCJUQVVSSV9FTlZfKlwiXSxcblxuICAvLyBJbmplY3QgZ2l0IGNvbW1pdCBpbmZvIGFuZCBwYWNrYWdlIHZlcnNpb24gYXQgYnVpbGQgdGltZVxuICBkZWZpbmU6IHtcbiAgICBfX0dJVF9DT01NSVRfSEFTSF9fOiBKU09OLnN0cmluZ2lmeShnZXRHaXRDb21taXRIYXNoKCkpLFxuICAgIF9fR0lUX1JFUE9fVVJMX186IEpTT04uc3RyaW5naWZ5KGdldEdpdFJlcG9VcmwoKSksXG4gICAgX19BUFBfVkVSU0lPTl9fOiBKU09OLnN0cmluZ2lmeShnZXRQYWNrYWdlVmVyc2lvbigpKSxcbiAgfSxcblxuICBidWlsZDoge1xuICAgIC8vIFRhdXJpIHVzZXMgQ2hyb21pdW0gb24gV2luZG93cyBhbmQgV2ViS2l0IG9uIG1hY09TIGFuZCBMaW51eFxuICAgIHRhcmdldDpcbiAgICAgIHByb2Nlc3MuZW52LlRBVVJJX0VOVl9QTEFURk9STSA9PT0gXCJ3aW5kb3dzXCIgPyBcImNocm9tZTEwNVwiIDogXCJzYWZhcmkxNFwiLFxuICAgIC8vIFByb2R1Y3Rpb24gYnVpbGRzOiBtaW5pZnkgYW5kIG5vIHNvdXJjZW1hcHMsIGRlYnVnIGJ1aWxkczogbm8gbWluaWZ5IGFuZCBzb3VyY2VtYXBzXG4gICAgbWluaWZ5OlxuICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiXG4gICAgICAgID8gXCJlc2J1aWxkXCJcbiAgICAgICAgOiAhcHJvY2Vzcy5lbnYuVEFVUklfRU5WX0RFQlVHXG4gICAgICAgICAgPyBcImVzYnVpbGRcIlxuICAgICAgICAgIDogZmFsc2UsXG4gICAgLy8gUHJvZHVjZSBzb3VyY2VtYXBzIGZvciBkZWJ1ZyBidWlsZHMsIGJ1dCBub3QgZm9yIHByb2R1Y3Rpb25cbiAgICBzb3VyY2VtYXA6XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJwcm9kdWN0aW9uXCJcbiAgICAgICAgPyBmYWxzZVxuICAgICAgICA6ICEhcHJvY2Vzcy5lbnYuVEFVUklfRU5WX0RFQlVHLFxuICAgIC8vIFByb2R1Y3Rpb24gb3B0aW1pemF0aW9uc1xuICAgIC4uLihwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJwcm9kdWN0aW9uXCIgJiYge1xuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIH0pLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIC8vIFByb2R1Y3Rpb24gY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgLi4uKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIiAmJiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgXCJyZWFjdC12ZW5kb3JcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgICAgXCJjb252ZXgtdmVuZG9yXCI6IFtcImNvbnZleFwiLCBcImNvbnZleC9yZWFjdFwiXSxcbiAgICAgICAgICAgIFwidWktdmVuZG9yXCI6IFtcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXG4gICAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtcG9wb3ZlclwiLFxuICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcbiAgICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxuICAgICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICB9LFxuICB9LFxuXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICBcImNvbnZleC1wYW5lbFwiOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgXCIuLi8uLi9wYWNrYWdlcy9wYW5lbC9zcmMvaW5kZXgu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
