import { FetchFn } from "@convex-panel/shared/api";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export const isTauri = () => typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);

export const desktopFetch: FetchFn = (input, init) => tauriFetch(input, init);