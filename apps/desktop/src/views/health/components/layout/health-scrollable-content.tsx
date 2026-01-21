import type { ReactNode } from "react";

interface HealthScrollableContentProps {
  children: ReactNode;
}

/**
 * Layout component for the main scrollable content area of the health view.
 * Provides consistent padding, max-width, and vertical spacing.
 */
export function HealthScrollableContent({
  children,
}: HealthScrollableContentProps) {
  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

