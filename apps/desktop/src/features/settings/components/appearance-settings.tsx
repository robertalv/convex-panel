import { Check } from "lucide-react";

type Theme = "light" | "dark" | "system";

interface ThemeCardProps {
  theme: Theme;
  currentTheme: Theme;
  onSelect: (theme: Theme) => void;
}

function ThemeCard({ theme, currentTheme, onSelect }: ThemeCardProps) {
  const isSelected = theme === currentTheme;
  const labels: Record<Theme, string> = {
    system: "System",
    light: "Light",
    dark: "Dark",
  };

  // Visual representation of the theme
  const bgColor =
    theme === "light"
      ? "bg-white"
      : theme === "dark"
        ? "bg-[#1a1a1a]"
        : "bg-gradient-to-r from-white to-[#1a1a1a]";
  const textColor = theme === "light" ? "text-gray-800" : "text-gray-200";
  const barColor = theme === "light" ? "bg-gray-300" : "bg-gray-600";

  return (
    <button
      onClick={() => onSelect(theme)}
      className={`flex-1 rounded-xl border-2 transition-all overflow-hidden ${
        isSelected
          ? "border-brand-base ring-2 ring-brand-base/20"
          : "border-border-base hover:border-border-hover"
      }`}
    >
      {/* Theme preview */}
      <div className={`${bgColor} p-4 h-24 relative`}>
        <div className={`${textColor} text-2xl font-medium`}>Aa</div>
        <div className="absolute bottom-3 left-4 right-4 space-y-1.5">
          <div className={`h-2 ${barColor} rounded-full w-3/4`} />
          <div className={`h-2 ${barColor} rounded-full w-1/2`} />
        </div>
        {isSelected && (
          <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-brand-base flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>
      {/* Label */}
      <div className="py-2 text-center">
        <span
          className={`text-sm ${isSelected ? "text-brand-base font-medium" : "text-text-muted"}`}
        >
          {labels[theme]}
        </span>
      </div>
    </button>
  );
}

export interface AppearanceSettingsProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function AppearanceSettings({
  theme,
  onThemeChange,
}: AppearanceSettingsProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-panel-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: "49px",
          borderBottom: "1px solid var(--color-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          backgroundColor: "var(--color-panel-bg)",
        }}
      >
        <h2
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-panel-text)",
            margin: 0,
          }}
        >
          Appearance
        </h2>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          {/* Theme Section */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "8px",
              }}
            >
              Theme
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--color-panel-text-secondary)",
                marginBottom: "16px",
              }}
            >
              Choose the color scheme for the interface
            </p>
            <div className="flex gap-4">
              <ThemeCard
                theme="system"
                currentTheme={theme}
                onSelect={onThemeChange}
              />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
