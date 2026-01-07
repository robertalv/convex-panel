// vite.config.ts
import { defineConfig } from "file:///Users/robertalvarez/Desktop/convex-panel/node_modules/.pnpm/vite@5.4.21_@types+node@24.10.1_lightningcss@1.30.2_terser@5.44.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/robertalvarez/Desktop/convex-panel/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@24.10.1_lightningcss@1.30.2_terser@5.44.1_/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///Users/robertalvarez/Desktop/convex-panel/node_modules/.pnpm/@tailwindcss+vite@4.1.17_vite@5.4.21_@types+node@24.10.1_lightningcss@1.30.2_terser@5.44.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import { execSync } from "child_process";
var __vite_injected_original_dirname = "/Users/robertalvarez/Desktop/convex-panel/apps/desktop";
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
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
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
  // Inject git commit info at build time
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __GIT_REPO_URL__: JSON.stringify(getGitRepoUrl())
  },
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari14",
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    rollupOptions: {
      // Tauri plugins are resolved at runtime by Tauri, not bundled
      external: [
        "@tauri-apps/plugin-shell",
        "@tauri-apps/plugin-fs",
        "@tauri-apps/plugin-dialog",
        "@tauri-apps/plugin-http"
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "convex-panel": path.resolve(
        __vite_injected_original_dirname,
        "../../packages/panel/src/index.ts"
      )
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcm9iZXJ0YWx2YXJlei9EZXNrdG9wL2NvbnZleC1wYW5lbC9hcHBzL2Rlc2t0b3BcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yb2JlcnRhbHZhcmV6L0Rlc2t0b3AvY29udmV4LXBhbmVsL2FwcHMvZGVza3RvcC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcm9iZXJ0YWx2YXJlei9EZXNrdG9wL2NvbnZleC1wYW5lbC9hcHBzL2Rlc2t0b3Avdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLy8gR2V0IGdpdCBjb21taXQgaGFzaCBhbmQgcmVwb3NpdG9yeSBVUkwgYXQgYnVpbGQgdGltZVxuZnVuY3Rpb24gZ2V0R2l0Q29tbWl0SGFzaCgpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiBleGVjU3luYyhcImdpdCByZXYtcGFyc2UgSEVBRFwiLCB7IGVuY29kaW5nOiBcInV0Zi04XCIgfSkudHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gXCJ1bmtub3duXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0R2l0UmVwb1VybCgpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIGNvbnN0IHJlbW90ZVVybCA9IGV4ZWNTeW5jKFwiZ2l0IHJlbW90ZSBnZXQtdXJsIG9yaWdpblwiLCB7XG4gICAgICBlbmNvZGluZzogXCJ1dGYtOFwiLFxuICAgIH0pLnRyaW0oKTtcbiAgICAvLyBDb252ZXJ0IGdpdEBnaXRodWIuY29tOnVzZXIvcmVwby5naXQgdG8gaHR0cHM6Ly9naXRodWIuY29tL3VzZXIvcmVwb1xuICAgIC8vIG9yIGtlZXAgaHR0cHM6Ly9naXRodWIuY29tL3VzZXIvcmVwby5naXQgYXMgaXNcbiAgICBjb25zdCBodHRwc1VybCA9IHJlbW90ZVVybFxuICAgICAgLnJlcGxhY2UoL15naXRAZ2l0aHViXFwuY29tOi8sIFwiaHR0cHM6Ly9naXRodWIuY29tL1wiKVxuICAgICAgLnJlcGxhY2UoL1xcLmdpdCQvLCBcIlwiKTtcbiAgICByZXR1cm4gaHR0cHNVcmw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXG5cbiAgLy8gUHJldmVudCB2aXRlIGZyb20gb2JzY3VyaW5nIHJ1c3QgZXJyb3JzXG4gIGNsZWFyU2NyZWVuOiBmYWxzZSxcblxuICAvLyBUYXVyaSBleHBlY3RzIGEgZml4ZWQgcG9ydCwgZmFpbCBpZiB0aGF0IHBvcnQgaXMgbm90IGF2YWlsYWJsZVxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiAxNDIwLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgd2F0Y2g6IHtcbiAgICAgIC8vIFRlbGwgdml0ZSB0byBpZ25vcmUgd2F0Y2hpbmcgc3JjLXRhdXJpXG4gICAgICBpZ25vcmVkOiBbXCIqKi9zcmMtdGF1cmkvKipcIl0sXG4gICAgfSxcbiAgfSxcblxuICAvLyBUbyBhY2Nlc3MgdGhlIFRhdXJpIGVudmlyb25tZW50IHZhcmlhYmxlcyBzZXQgYnkgdGhlIENMSSB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHRhcmdldFxuICBlbnZQcmVmaXg6IFtcIlZJVEVfXCIsIFwiVEFVUklfRU5WXypcIl0sXG5cbiAgLy8gSW5qZWN0IGdpdCBjb21taXQgaW5mbyBhdCBidWlsZCB0aW1lXG4gIGRlZmluZToge1xuICAgIF9fR0lUX0NPTU1JVF9IQVNIX186IEpTT04uc3RyaW5naWZ5KGdldEdpdENvbW1pdEhhc2goKSksXG4gICAgX19HSVRfUkVQT19VUkxfXzogSlNPTi5zdHJpbmdpZnkoZ2V0R2l0UmVwb1VybCgpKSxcbiAgfSxcblxuICBidWlsZDoge1xuICAgIC8vIFRhdXJpIHVzZXMgQ2hyb21pdW0gb24gV2luZG93cyBhbmQgV2ViS2l0IG9uIG1hY09TIGFuZCBMaW51eFxuICAgIHRhcmdldDpcbiAgICAgIHByb2Nlc3MuZW52LlRBVVJJX0VOVl9QTEFURk9STSA9PT0gXCJ3aW5kb3dzXCIgPyBcImNocm9tZTEwNVwiIDogXCJzYWZhcmkxNFwiLFxuICAgIC8vIERvbid0IG1pbmlmeSBmb3IgZGVidWcgYnVpbGRzXG4gICAgbWluaWZ5OiAhcHJvY2Vzcy5lbnYuVEFVUklfRU5WX0RFQlVHID8gXCJlc2J1aWxkXCIgOiBmYWxzZSxcbiAgICAvLyBQcm9kdWNlIHNvdXJjZW1hcHMgZm9yIGRlYnVnIGJ1aWxkc1xuICAgIHNvdXJjZW1hcDogISFwcm9jZXNzLmVudi5UQVVSSV9FTlZfREVCVUcsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLy8gVGF1cmkgcGx1Z2lucyBhcmUgcmVzb2x2ZWQgYXQgcnVudGltZSBieSBUYXVyaSwgbm90IGJ1bmRsZWRcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgIFwiQHRhdXJpLWFwcHMvcGx1Z2luLXNoZWxsXCIsXG4gICAgICAgIFwiQHRhdXJpLWFwcHMvcGx1Z2luLWZzXCIsXG4gICAgICAgIFwiQHRhdXJpLWFwcHMvcGx1Z2luLWRpYWxvZ1wiLFxuICAgICAgICBcIkB0YXVyaS1hcHBzL3BsdWdpbi1odHRwXCIsXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG5cbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIFwiY29udmV4LXBhbmVsXCI6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICBcIi4uLy4uL3BhY2thZ2VzL3BhbmVsL3NyYy9pbmRleC50c1wiLFxuICAgICAgKSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9WLFNBQVMsb0JBQW9CO0FBQ2pYLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFDakIsU0FBUyxnQkFBZ0I7QUFKekIsSUFBTSxtQ0FBbUM7QUFPekMsU0FBUyxtQkFBMkI7QUFDbEMsTUFBSTtBQUNGLFdBQU8sU0FBUyxzQkFBc0IsRUFBRSxVQUFVLFFBQVEsQ0FBQyxFQUFFLEtBQUs7QUFBQSxFQUNwRSxRQUFRO0FBQ04sV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLFNBQVMsZ0JBQXdCO0FBQy9CLE1BQUk7QUFDRixVQUFNLFlBQVksU0FBUyw2QkFBNkI7QUFBQSxNQUN0RCxVQUFVO0FBQUEsSUFDWixDQUFDLEVBQUUsS0FBSztBQUdSLFVBQU0sV0FBVyxVQUNkLFFBQVEscUJBQXFCLHFCQUFxQixFQUNsRCxRQUFRLFVBQVUsRUFBRTtBQUN2QixXQUFPO0FBQUEsRUFDVCxRQUFRO0FBQ04sV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUE7QUFBQSxFQUdoQyxhQUFhO0FBQUE7QUFBQSxFQUdiLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLE9BQU87QUFBQTtBQUFBLE1BRUwsU0FBUyxDQUFDLGlCQUFpQjtBQUFBLElBQzdCO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFHQSxXQUFXLENBQUMsU0FBUyxhQUFhO0FBQUE7QUFBQSxFQUdsQyxRQUFRO0FBQUEsSUFDTixxQkFBcUIsS0FBSyxVQUFVLGlCQUFpQixDQUFDO0FBQUEsSUFDdEQsa0JBQWtCLEtBQUssVUFBVSxjQUFjLENBQUM7QUFBQSxFQUNsRDtBQUFBLEVBRUEsT0FBTztBQUFBO0FBQUEsSUFFTCxRQUNFLFFBQVEsSUFBSSx1QkFBdUIsWUFBWSxjQUFjO0FBQUE7QUFBQSxJQUUvRCxRQUFRLENBQUMsUUFBUSxJQUFJLGtCQUFrQixZQUFZO0FBQUE7QUFBQSxJQUVuRCxXQUFXLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFBQSxJQUN6QixlQUFlO0FBQUE7QUFBQSxNQUViLFVBQVU7QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDcEMsZ0JBQWdCLEtBQUs7QUFBQSxRQUNuQjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
