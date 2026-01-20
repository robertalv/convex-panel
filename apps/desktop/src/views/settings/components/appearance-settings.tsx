import { Check } from "lucide-react";

type Theme = "light" | "dark" | "system";

interface ThemeCardProps {
  theme: Theme;
  currentTheme: Theme;
  onSelect: (theme: Theme) => void;
}

// Mini UI preview component that mimics the app layout
interface MiniPreviewProps {
  variant: "light" | "dark";
  className?: string;
}

function MiniPreview({ variant, className = "" }: MiniPreviewProps) {
  const colors =
    variant === "light"
      ? {
          bg: "#ffffff",
          sidebar: "#f5f5f4",
          sidebarItem: "#e7e5e4",
          sidebarItemActive: "#3b82f6",
          header: "#fafaf9",
          headerBorder: "#e7e5e4",
          content: "#ffffff",
          textPrimary: "#1c1917",
          textMuted: "#a8a29e",
          border: "#e7e5e4",
        }
      : {
          bg: "#1e1c1a",
          sidebar: "#2a2825",
          sidebarItem: "#3c3a37",
          sidebarItemActive: "#63a8f8",
          header: "#2a2825",
          headerBorder: "rgba(163, 156, 148, 0.3)",
          content: "#1e1c1a",
          textPrimary: "#ffffff",
          textMuted: "#8f8780",
          border: "rgba(163, 156, 148, 0.3)",
        };

  return (
    <div
      className={`flex h-full w-full overflow-hidden rounded ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Sidebar */}
      <div
        className="flex w-[28%] flex-col gap-0.5 p-1"
        style={{
          backgroundColor: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        {/* Sidebar items */}
        <div
          className="h-1.5 rounded-sm opacity-90"
          style={{ backgroundColor: colors.sidebarItemActive }}
        />
        <div
          className="h-1.5 w-4/5 rounded-sm"
          style={{ backgroundColor: colors.sidebarItem }}
        />
        <div
          className="h-1.5 w-[65%] rounded-sm"
          style={{ backgroundColor: colors.sidebarItem }}
        />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div
          className="flex h-3.5 items-center gap-1 px-1.5"
          style={{
            backgroundColor: colors.header,
            borderBottom: `1px solid ${colors.headerBorder}`,
          }}
        >
          <div
            className="h-1 w-4 rounded-[1px] opacity-80"
            style={{ backgroundColor: colors.textPrimary }}
          />
          <div
            className="h-1 w-2.5 rounded-[1px]"
            style={{ backgroundColor: colors.textMuted }}
          />
        </div>

        {/* Content */}
        <div
          className="flex flex-1 flex-col gap-1 p-1.5"
          style={{ backgroundColor: colors.content }}
        >
          {/* Content lines */}
          <div
            className="h-1 w-[70%] rounded-[1px] opacity-70"
            style={{ backgroundColor: colors.textPrimary }}
          />
          <div
            className="h-1 w-[90%] rounded-[1px] opacity-50"
            style={{ backgroundColor: colors.textMuted }}
          />
          <div
            className="h-1 w-[60%] rounded-[1px] opacity-50"
            style={{ backgroundColor: colors.textMuted }}
          />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme, currentTheme, onSelect }: ThemeCardProps) {
  const isSelected = theme === currentTheme;
  const labels: Record<Theme, string> = {
    system: "System",
    light: "Light",
    dark: "Dark",
  };

  return (
    <button
      onClick={() => onSelect(theme)}
      className={`flex-1 overflow-hidden rounded-lg transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-brand-base ring-offset-1 ring-offset-background-base"
          : "hover:bg-surface-raised"
      }`}
      style={{
        backgroundColor: isSelected
          ? "rgba(99, 168, 248, 0.08)"
          : "transparent",
        border: isSelected
          ? "1px solid var(--color-brand-base)"
          : "1px solid var(--color-border-base)",
      }}
    >
      {/* Theme preview */}
      <div
        className="relative h-20 p-2"
        style={{
          backgroundColor: isSelected
            ? "rgba(99, 168, 248, 0.04)"
            : "var(--color-surface-base)",
        }}
      >
        {theme === "system" ? (
          // Split view for system theme
          <div className="flex h-full gap-1 overflow-hidden rounded">
            <MiniPreview variant="light" className="flex-1" />
            <MiniPreview variant="dark" className="flex-1" />
          </div>
        ) : (
          <MiniPreview variant={theme} />
        )}

        {/* Selection checkmark */}
        {isSelected && (
          <div className="absolute bottom-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand-base shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            <Check size={10} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label */}
      <div
        className="border-t border-border-muted py-2"
        style={{
          backgroundColor: isSelected
            ? "rgba(99, 168, 248, 0.04)"
            : "transparent",
        }}
      >
        <span
          className={`text-xs ${isSelected ? "font-medium" : "font-normal"}`}
          style={{
            color: isSelected
              ? "var(--color-brand-base)"
              : "var(--color-text-muted)",
          }}
        >
          {labels[theme]}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// Main AppearanceSettings Component
// ============================================================================

export interface AppearanceSettingsProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function AppearanceSettings({
  theme,
  onThemeChange,
}: AppearanceSettingsProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background-base">
      <div className="flex flex-1 justify-center overflow-y-auto p-4">
        <div className="w-full max-w-xl space-y-8">
          {/* Theme Section */}
          <section>
            <div className="mb-6 rounded-xl border border-border-base bg-surface-raised p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-text-base">
                  Theme
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  Choose the color scheme for the interface
                </p>
              </div>

              <div className="flex gap-4">
                <ThemeCard
                  theme="light"
                  currentTheme={theme}
                  onSelect={onThemeChange}
                />
                <ThemeCard
                  theme="dark"
                  currentTheme={theme}
                  onSelect={onThemeChange}
                />
                <ThemeCard
                  theme="system"
                  currentTheme={theme}
                  onSelect={onThemeChange}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
