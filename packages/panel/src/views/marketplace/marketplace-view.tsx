import React, { useState } from "react";
import { Search, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useSheetActionsSafe } from "../../contexts/sheet-context";
import { MarketplaceDetailSheet } from "./components/marketplace-detail-sheet";
import {
  useMarketplaceComponents,
  CATEGORY_LABELS,
  type MarketplaceCategory,
  type MarketplaceComponent,
} from "../components/hooks/useMarketplaceComponents";
import type {
  PackageManager,
  InstallStep,
} from "../components/components/install-modal";

export interface MarketplaceViewProps {
  /** Project path for installation (desktop only) */
  projectPath?: string | null;
  /** Detected package manager from lock files */
  detectedPackageManager?: PackageManager | null;
  /** Function to run the installation - provided by desktop app */
  onInstall?: (options: {
    packageName: string;
    componentId: string;
    projectPath: string;
    packageManager: PackageManager;
    autoConfigureConfig: boolean;
    onStepUpdate: (steps: InstallStep[]) => void;
  }) => Promise<{ success: boolean; error?: string }>;
}

const CATEGORIES: Array<MarketplaceCategory | "all"> = [
  "all",
  "ai",
  "backend",
  "database",
  "durable-functions",
  "integrations",
  "payments",
];

const CATEGORY_DISPLAY: Record<MarketplaceCategory | "all", string> = {
  all: "All",
  ...CATEGORY_LABELS,
};

// Category colors for card headers
const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  ai: { from: "#8B5CF6", to: "#6366F1" },
  backend: { from: "#06B6D4", to: "#3B82F6" },
  database: { from: "#10B981", to: "#059669" },
  "durable-functions": { from: "#F59E0B", to: "#EF4444" },
  integrations: { from: "#EC4899", to: "#8B5CF6" },
  payments: { from: "#22C55E", to: "#14B8A6" },
};

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  projectPath,
  detectedPackageManager,
  onInstall,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    MarketplaceCategory | "all"
  >("all");
  const { openSheet } = useSheetActionsSafe();

  const {
    filteredComponents,
    isLoading,
    error,
    source,
    refetch,
    clearCacheAndRefetch,
  } = useMarketplaceComponents({
    enabled: true,
    category: selectedCategory,
    searchQuery,
  });

  const handleComponentClick = (component: MarketplaceComponent) => {
    openSheet({
      title: component.title,
      width: "600px",
      content: (
        <MarketplaceDetailSheet
          component={component}
          projectPath={projectPath}
          detectedPackageManager={detectedPackageManager}
          onInstall={onInstall}
        />
      ),
    });
  };

  const formatDownloads = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="cp-components-view">
      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          borderRight: "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            padding: "8px",
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
          }}
        >
          <div className="cp-search-wrapper">
            <Search size={14} className="cp-search-icon" />
            <input
              type="text"
              placeholder="Search marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cp-search-input"
            />
          </div>
        </div>

        {/* Categories */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 0",
          }}
        >
          <div
            style={{
              gap: "4px",
              display: "flex",
              flexDirection: "column",
              color: "var(--color-panel-text-secondary)",
              fontSize: "12px",
            }}
          >
            {CATEGORIES.map((category) => (
              <div
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: "6px 12px",
                  margin: "0 8px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor:
                    selectedCategory === category
                      ? "var(--color-panel-bg-tertiary)"
                      : "transparent",
                  color:
                    selectedCategory === category
                      ? "var(--color-panel-text)"
                      : "var(--color-panel-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-panel-hover)";
                    e.currentTarget.style.opacity = "0.5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                <span style={{ fontSize: "12px" }}>
                  {CATEGORY_DISPLAY[category]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Footer */}
        <div
          style={{
            padding: "8px 12px",
            borderTop: "1px solid var(--color-panel-border)",
            fontSize: "11px",
            color: "var(--color-panel-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            {source === "remote" && "Live data"}
            {source === "cache" && "Cached data"}
            {source === "static" && "Offline data"}
          </span>
          <button
            onClick={() => clearCacheAndRefetch()}
            disabled={isLoading}
            style={{
              background: "none",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: "4px",
              color: "var(--color-panel-text-muted)",
              opacity: isLoading ? 0.5 : 1,
            }}
            title="Refresh data"
          >
            <RefreshCw
              size={12}
              style={{
                animation: isLoading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="cp-components-main"
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
        }}
      >
        {isLoading && filteredComponents.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "var(--color-panel-text-muted)",
            }}
          >
            <Loader2
              size={24}
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : error && filteredComponents.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "var(--color-panel-text-muted)",
              gap: "12px",
            }}
          >
            <AlertCircle size={32} />
            <p style={{ margin: 0 }}>{error}</p>
            <button
              onClick={() => refetch()}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                backgroundColor: "var(--color-panel-bg-tertiary)",
                border: "1px solid var(--color-panel-border)",
                borderRadius: "6px",
                color: "var(--color-panel-text)",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        ) : filteredComponents.length === 0 ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "var(--color-panel-text-secondary)",
            }}
          >
            <p>No components found matching your search.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredComponents.map((component) => {
              const gradient = CATEGORY_GRADIENTS[component.category] || {
                from: "#6366F1",
                to: "#8B5CF6",
              };
              return (
                <div
                  key={component.id}
                  onClick={() => handleComponentClick(component)}
                  style={{
                    backgroundColor: "var(--color-panel-bg-secondary)",
                    border: "1px solid var(--color-panel-border)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px var(--color-panel-shadow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      height: "80px",
                      background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {component.image?.src ? (
                      <img
                        src={component.image.src}
                        alt={component.title}
                        style={{
                          maxWidth: "60%",
                          maxHeight: "50px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "28px",
                          fontWeight: 700,
                          color: "rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        {component.title.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          margin: 0,
                          color: "var(--color-panel-text)",
                        }}
                      >
                        {component.title}
                      </h3>
                      {component.weeklyDownloads > 0 && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--color-panel-text-muted)",
                          }}
                        >
                          {formatDownloads(component.weeklyDownloads)}/wk
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: "12px",
                        lineHeight: "1.5",
                        color: "var(--color-panel-text-secondary)",
                        margin: "0 0 12px 0",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {component.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          color: "var(--color-panel-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {CATEGORY_LABELS[component.category] ||
                          component.category}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {component.author.avatar && (
                          <img
                            src={component.author.avatar}
                            alt={component.author.username}
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--color-panel-text-muted)",
                          }}
                        >
                          {component.author.username}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
