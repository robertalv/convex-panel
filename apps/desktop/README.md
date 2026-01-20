# Convex Desktop (Tauri)

A desktop companion for Convex dashboard patterns with secure storage, command palette, and sectioned navigation.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22.0.0
- [pnpm](https://pnpm.io/) >= 9.x
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)

### Platform notes

- macOS: `xcode-select --install`
- Linux: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev`

## Getting started

```bash
# from repo root
pnpm install               # pulls react-router-dom + Tauri deps
pnpm dev:desktop           # vite + tauri dev

# or inside the app
cd apps/desktop
pnpm tauri:dev
```

Build a release bundle:

```bash
pnpm tauri:build
```

## Auth + storage

- **Device auth** uses the same OIDC/device flow as `dashboard-common`, exchanging tokens via `api.convex.dev/api/authorize`.
- **Deploy key** mode stays available for direct admin access.
- Tokens and deploy keys are stored via the native keychain using a lightweight secure-store plugin (`src-tauri/src/secure_store.rs`, built on `keyring`).
- UI + helpers live in `src/lib/convex/dashboardCommonAdapter.ts` and `src/lib/secureStorage.ts`.

## Layout & navigation

- Left rail with sections: Health, Data, Functions, Runner, Files, Schedules, Logs.
- Top bar project switcher (teams → projects → deployments) populated from Big Brain APIs.
- Command palette (`⌘/Ctrl + K`) and numeric shortcuts (`⌘/Ctrl + 1..7`) to jump between sections.
- Right inspector drawer for job/status cards (toggle from the rail footer).
- Theme tokens + grid background in `src/index.css`.

## Feature stubs

- Sections render production-ready shells with mock adapters so the UI stays interactive while endpoints are wired.
- Wire real endpoints inside `src/lib/convex/dashboardCommonAdapter.ts` and the per-section components under `src/features/*`.
- Manual deploy key mode keeps working; project data loading relies on device-auth access tokens.

## Notes

- If `pnpm tsc --noEmit` complains about missing `react-router-dom`, run `pnpm install` from the repo root or `pnpm install --filter @convex-panel/desktop`.
- Secure storage plugin commands are registered under `plugin:secure-store|*` (`set_secret`, `get_secret`, `delete_secret`).

## License

MIT
