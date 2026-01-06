import { LogOut, User } from "lucide-react";

export interface ProfileSettingsProps {
  user: {
    name: string;
    email: string;
    profilePictureUrl?: string | null;
  } | null;
  onLogout: () => void;
}

export function ProfileSettings({ user, onLogout }: ProfileSettingsProps) {
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
          Profile
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
          {/* User Info */}
          {user && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                backgroundColor: "var(--color-panel-bg-secondary)",
                borderRadius: "12px",
                border: "1px solid var(--color-panel-border)",
                marginBottom: "24px",
              }}
            >
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-panel-bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User
                    size={24}
                    style={{ color: "var(--color-panel-text-muted)" }}
                  />
                </div>
              )}
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-panel-text)",
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-panel-text-secondary)",
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Account Actions */}
          <div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--color-panel-text)",
                marginBottom: "12px",
              }}
            >
              Account
            </h3>
            <button
              onClick={onLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                backgroundColor: "transparent",
                color: "#ef4444",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              }}
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
