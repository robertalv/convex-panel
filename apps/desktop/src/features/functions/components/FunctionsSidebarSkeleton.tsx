/**
 * FunctionsSidebarSkeleton Component
 * Skeleton loading state that matches the tree content area of FunctionsSidebar
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Zap, CodeXml } from "lucide-react";
import type { OrganizationMode } from "./FunctionsSidebar";

interface FunctionsSidebarSkeletonProps {
  /** Organization mode to match the expected layout */
  organizationMode?: OrganizationMode;
}

/**
 * Skeleton for a single function group header
 */
function FunctionGroupSkeleton({
  delay = 0,
  organizationMode = "byModule",
}: {
  delay?: number;
  organizationMode?: OrganizationMode;
}) {
  const Icon = organizationMode === "byModule" ? CodeXml : Zap;

  return (
    <div>
      {/* Group header */}
      <div
        className="flex items-center h-8 px-3"
        style={{
          color: "var(--color-text-base)",
          animationDelay: `${delay}s`,
        }}
      >
        <div className="w-3 h-3 mr-2 flex items-center justify-center">
          <Icon
            size={14}
            style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
          />
        </div>
        <Skeleton
          className="h-3 rounded flex-1"
          style={{
            width: "80px",
            maxWidth: "60%",
            animationDelay: `${delay}s`,
          }}
        />
        <Skeleton
          className="h-3 w-4 rounded ml-auto"
          style={{
            animationDelay: `${delay + 0.02}s`,
          }}
        />
      </div>

      {/* Function items under this group (3-5 items) */}
      {Array.from({ length: Math.floor(Math.random() * 3) + 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center h-7 px-3"
          style={{
            paddingLeft: "32px",
            animationDelay: `${delay + (i + 1) * 0.03}s`,
          }}
        >
          {/* Function icon skeleton */}
          <Skeleton
            className="w-3 h-3 rounded-full mr-2 shrink-0"
            style={{
              animationDelay: `${delay + (i + 1) * 0.03}s`,
            }}
          />
          {/* Function name skeleton with varying widths */}
          <Skeleton
            className="h-3 rounded flex-1"
            style={{
              width: `${60 + (i % 4) * 20}px`,
              maxWidth: "75%",
              animationDelay: `${delay + (i + 1) * 0.03 + 0.01}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for the tree content area matching FunctionsSidebar layout
 */
export function FunctionsSidebarSkeleton({
  organizationMode = "byModule",
}: FunctionsSidebarSkeletonProps) {
  return (
    <div className="py-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <FunctionGroupSkeleton
          key={i}
          delay={i * 0.08}
          organizationMode={organizationMode}
        />
      ))}
    </div>
  );
}

export default FunctionsSidebarSkeleton;
