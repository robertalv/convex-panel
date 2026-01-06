import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { NpmMaintainer } from "../utils/npm";
import { getGravatarUrl } from "../utils/gravatar";
import { useSheetActionsSafe } from "../../../contexts/sheet-context";
import { IconButton } from "../../../components/shared";

export interface MaintainersSheetProps {
  maintainers: NpmMaintainer[];
}

export const MaintainersSheet: React.FC<MaintainersSheetProps> = ({
  maintainers,
}) => {
  const [avatarUrls, setAvatarUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const { closeSheet } = useSheetActionsSafe();

  useEffect(() => {
    if (maintainers.length === 0) {
      setLoading(false);
      return;
    }

    const loadAvatars = async () => {
      try {
        setLoading(true);

        const finalUrls = new Map<string, string>();

        maintainers.forEach((maintainer) => {
          if (!maintainer.email) return;

          const gravatarUrl = getGravatarUrl(maintainer.email, 64);
          if (gravatarUrl) {
            finalUrls.set(maintainer.email, gravatarUrl);
          }
        });

        setAvatarUrls(finalUrls);
      } catch (error) {
        console.error("[MaintainersSheet] Failed to load avatars:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAvatars();
  }, [maintainers]);

  return (
    <div
      style={{
        padding: "0",
        display: "flex",
        flexDirection: "column",
        color: "var(--color-panel-text)",
        height: "100%",
        backgroundColor: "var(--color-panel-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 12px",
          borderBottom: "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg-secondary)",
          height: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--color-panel-text)",
            }}
          >
            <span>
              {maintainers.length}{" "}
              {maintainers.length === 1 ? "maintainer" : "maintainers"}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <IconButton icon={X} onClick={closeSheet} aria-label="Close sheet" />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
            gap: "16px",
            justifyContent: "start",
          }}
        >
          {maintainers.map((maintainer, idx) => {
            const maintainerAvatarUrl = maintainer.email
              ? avatarUrls.get(maintainer.email)
              : null;
            const npmProfileUrl = `https://www.npmjs.com/~${maintainer.name}`;

            return (
              <a
                key={`${maintainer.name}-${idx}`}
                href={npmProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={maintainer.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid var(--color-panel-border)",
                    flexShrink: 0,
                    backgroundColor: "var(--color-panel-bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-panel-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-panel-border)";
                  }}
                >
                  {loading ? (
                    <div
                      style={{
                        width: "60%",
                        height: "60%",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-panel-border)",
                      }}
                    />
                  ) : maintainerAvatarUrl ? (
                    <img
                      src={maintainerAvatarUrl}
                      alt={maintainer.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = "";
                          const avatar = document.createElement("div");
                          avatar.style.cssText = `
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background-color: var(--color-panel-bg-tertiary);
                            font-size: 24px;
                            font-weight: 500;
                            color: var(--color-panel-text);
                          `;
                          avatar.textContent = maintainer.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                          parent.appendChild(avatar);
                        }
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: 500,
                        color: "var(--color-panel-text)",
                      }}
                    >
                      {maintainer.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
