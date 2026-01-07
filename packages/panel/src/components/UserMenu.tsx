import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, Sun, Moon, User, Settings, ExternalLink } from "lucide-react";
import { usePortalTarget } from "../contexts/portal-context";
import { useThemeSafe } from "../hooks/useTheme";

export interface UserMenuProps {
  user: { name?: string; email?: string; profilePictureUrl?: string } | null;
  teamSlug?: string;
  projectSlug?: string;
  onLogout: () => void;
  onThemeToggle?: () => void;
  theme?: "light" | "dark";
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  external?: boolean;
  destructive?: boolean;
}

export function UserMenu({
  user,
  teamSlug,
  projectSlug,
  onLogout,
  onThemeToggle,
  theme,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalTarget = usePortalTarget();
  const { theme: panelTheme } = useThemeSafe();

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const menuItems: MenuItem[] = [
    {
      icon: <User size={14} />,
      label: "Profile Settings",
      onClick: () => openExternal("https://dashboard.convex.dev/profile"),
      external: true,
    },
    ...(teamSlug
      ? [
          {
            icon: <Settings size={14} />,
            label: "Team Settings",
            onClick: () =>
              openExternal(
                `https://dashboard.convex.dev/t/${teamSlug}/settings`,
              ),
            external: true,
          },
        ]
      : []),
    ...(teamSlug && projectSlug
      ? [
          {
            icon: <Settings size={14} />,
            label: "Project Settings",
            onClick: () =>
              openExternal(
                `https://dashboard.convex.dev/t/${teamSlug}/${projectSlug}/settings`,
              ),
            external: true,
          },
        ]
      : []),
    ...(onThemeToggle
      ? [
          {
            icon: theme === "dark" ? <Sun size={14} /> : <Moon size={14} />,
            label: theme === "dark" ? "Light Mode" : "Dark Mode",
            onClick: () => {
              onThemeToggle();
              setIsOpen(false);
            },
          },
        ]
      : []),
    {
      icon: <LogOut size={14} />,
      label: "Log Out",
      onClick: onLogout,
      destructive: true,
    },
  ];

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
          });
        }
      };

      requestAnimationFrame(() => {
        updatePosition();
      });

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Reset highlighted index when menu opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev < menuItems.length - 1 ? prev + 1 : prev,
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault();
        menuItems[highlightedIndex].onClick();
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, menuItems, highlightedIndex]);

  const initials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : user?.email
      ? user.email.substring(0, 2).toUpperCase()
      : "U";

  return (
    <div
      style={
        {
          position: "relative",
          marginLeft: "12px",
          WebkitAppRegion: "no-drag",
        } as React.CSSProperties
      }
    >
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        title={user?.name || user?.email || "User Menu"}
        data-tauri-drag-region="false"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "none",
          padding: 0,
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          overflow: "hidden",
          outline: "none",
          boxShadow: isOpen
            ? "0 0 0 2px var(--color-panel-bg-tertiary)"
            : "none",
          transform: isOpen ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 0 0 2px var(--color-panel-bg-tertiary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      >
        {user?.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt="Profile"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "var(--color-panel-bg-tertiary)",
              color: "var(--color-panel-text-secondary)",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "50%",
            }}
          >
            {initials}
          </div>
        )}
      </button>

      {isOpen &&
        dropdownPosition &&
        portalTarget &&
        createPortal(
          <div
            ref={menuRef}
            className={`cp-theme-${panelTheme}`}
            style={{
              position: "fixed",
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              width: "220px",
              backgroundColor: "var(--color-panel-bg)",
              border: "1px solid var(--color-panel-border)",
              borderRadius: "12px",
              boxShadow: "0 4px 16px var(--color-panel-shadow)",
              padding: "4px",
              zIndex: 100000,
              overflow: "hidden",
              pointerEvents: "auto",
              animation: "userMenuFadeUp 0.15s ease",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* User Info Section */}
            {user && (
              <>
                <div style={{ padding: "12px" }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      color: "var(--color-panel-text)",
                      marginBottom: "2px",
                    }}
                  >
                    {user.name || "User"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-panel-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "var(--color-panel-border)",
                    margin: "4px 0",
                  }}
                />
              </>
            )}

            {/* Menu Items */}
            {menuItems.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              // Add divider before theme toggle or logout if it's right after external links
              const needsDivider =
                (item.destructive && index > 0) ||
                (item.label.includes("Mode") &&
                  index > 0 &&
                  menuItems[index - 1].external);

              return (
                <div key={item.label}>
                  {needsDivider && (
                    <div
                      style={{
                        height: "1px",
                        backgroundColor: "var(--color-panel-border)",
                        margin: "4px 0",
                      }}
                    />
                  )}
                  <button
                    data-index={index}
                    onClick={item.onClick}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "8px 10px",
                      border: "none",
                      backgroundColor: isHighlighted
                        ? item.destructive
                          ? "rgba(239, 68, 68, 0.1)"
                          : "var(--color-panel-bg-tertiary)"
                        : "transparent",
                      color: item.destructive
                        ? "var(--color-panel-error)"
                        : "var(--color-panel-text)",
                      fontSize: "13px",
                      cursor: "pointer",
                      borderRadius: "10px",
                      textAlign: "left",
                      transition: "background-color 0.1s ease",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: item.destructive
                          ? "var(--color-panel-error)"
                          : "var(--color-panel-text-muted)",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.external && (
                      <ExternalLink
                        size={12}
                        style={{
                          color: "var(--color-panel-text-muted)",
                          opacity: 0.5,
                        }}
                      />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Keyframe animation styles */}
            <style>{`
              @keyframes userMenuFadeUp {
                from {
                  opacity: 0;
                  transform: translateY(-4px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </div>,
          portalTarget,
        )}
    </div>
  );
}
