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
      className={className}
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        backgroundColor: colors.bg,
        borderRadius: "4px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "28%",
          backgroundColor: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          padding: "6px 4px",
          display: "flex",
          flexDirection: "column",
          gap: "3px",
        }}
      >
        {/* Sidebar items */}
        <div
          style={{
            height: "6px",
            backgroundColor: colors.sidebarItemActive,
            borderRadius: "2px",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            height: "6px",
            backgroundColor: colors.sidebarItem,
            borderRadius: "2px",
            width: "80%",
          }}
        />
        <div
          style={{
            height: "6px",
            backgroundColor: colors.sidebarItem,
            borderRadius: "2px",
            width: "65%",
          }}
        />
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            height: "14px",
            backgroundColor: colors.header,
            borderBottom: `1px solid ${colors.headerBorder}`,
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "4px",
              backgroundColor: colors.textPrimary,
              borderRadius: "1px",
              opacity: 0.8,
            }}
          />
          <div
            style={{
              width: "10px",
              height: "4px",
              backgroundColor: colors.textMuted,
              borderRadius: "1px",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.content,
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Content lines */}
          <div
            style={{
              height: "4px",
              backgroundColor: colors.textPrimary,
              borderRadius: "1px",
              width: "70%",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              height: "4px",
              backgroundColor: colors.textMuted,
              borderRadius: "1px",
              width: "90%",
              opacity: 0.5,
            }}
          />
          <div
            style={{
              height: "4px",
              backgroundColor: colors.textMuted,
              borderRadius: "1px",
              width: "60%",
              opacity: 0.5,
            }}
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
      className={`flex-1 rounded-lg transition-all duration-150 overflow-hidden ${
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
        className="relative"
        style={{
          height: "80px",
          padding: "8px",
          backgroundColor: isSelected
            ? "rgba(99, 168, 248, 0.04)"
            : "var(--color-surface-base)",
        }}
      >
        {theme === "system" ? (
          // Split view for system theme
          <div
            style={{
              display: "flex",
              height: "100%",
              gap: "4px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <MiniPreview variant="light" className="flex-1" />
            <MiniPreview variant="dark" className="flex-1" />
          </div>
        ) : (
          <MiniPreview variant={theme} />
        )}

        {/* Selection checkmark */}
        {isSelected && (
          <div
            className="absolute flex items-center justify-center"
            style={{
              bottom: "4px",
              right: "4px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "var(--color-brand-base)",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            <Check size={10} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          padding: "8px 0",
          borderTop: "1px solid var(--color-border-muted)",
          backgroundColor: isSelected
            ? "rgba(99, 168, 248, 0.04)"
            : "transparent",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: isSelected ? 500 : 400,
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
// Section Container Component (matching profile-settings pattern)
// ============================================================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "var(--color-surface-raised)",
        borderRadius: "12px",
        border: "1px solid var(--color-border-base)",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--color-text-base)",
          margin: 0,
          marginBlockEnd: description ? "4px" : "12px",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--color-text-muted)",
            margin: 0,
            marginBlockEnd: "12px",
          }}
        >
          {description}
        </p>
      )}
      {children}
    </div>
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
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "var(--color-background-base)",
      }}
    >
      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "600px", width: "100%" }}>
          {/* Theme Section */}
          <Section
            title="Theme"
            description="Choose the color scheme for the interface"
          >
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
          </Section>
        </div>
      </div>
    </div>
  );
}
