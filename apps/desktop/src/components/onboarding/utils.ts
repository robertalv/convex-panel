export type OnboardingStep = "welcome" | "folder" | "github" | "deploy-key" | "done";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "folder",
  "github",
  "deploy-key",
  "done",
];

export function getDashboardUrl(
  teamSlug: string | null | undefined,
  projectSlug: string | null | undefined,
  deploymentName: string | undefined,
): string {
  if (teamSlug && projectSlug && deploymentName) {
    return `https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/${deploymentName}/settings`;
  }
  return "https://dashboard.convex.dev";
}

export async function openExternalLink(url: string): Promise<void> {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } else {
    window.open(url, "_blank");
  }
}
