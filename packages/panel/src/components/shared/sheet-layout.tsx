import React from "react";
import type { ReactNode, FormEvent } from "react";
import { X } from "lucide-react";
import { IconButton } from "./icon-button";

export interface SheetLayoutProps {
  /** Title displayed in the header */
  title: string;

  /** Optional subtitle displayed next to title (e.g., "for tableName") */
  subtitle?: ReactNode;

  /** Close handler - if provided, shows close button */
  onClose?: () => void;

  /** Optional content to render on the left side of the header (e.g., navigation arrows) */
  headerLeft?: ReactNode;

  /** Optional content to render on the right side of the header, before close button */
  headerRight?: ReactNode;

  /** Optional sub-header content (e.g., tabs) rendered below the main header */
  subHeader?: ReactNode;

  /** Main content - will be scrollable */
  children: ReactNode;

  /** Optional footer content */
  footer?: ReactNode;

  /** Whether to wrap in a form element (for submit handling) */
  asForm?: boolean;

  /** Form submit handler (only used when asForm=true) */
  onSubmit?: (e: FormEvent) => void;

  /** Background color for the layout. Defaults to 'var(--color-panel-bg-secondary)' */
  backgroundColor?: string;

  /** Custom data attribute for the content area (e.g., for scroll targeting) */
  contentDataAttribute?: string;

  /** Remove padding from content area (useful for full-bleed content like editors) */
  contentNoPadding?: boolean;

  /** Content area style overrides */
  contentStyle?: React.CSSProperties;
}

export const SheetLayout: React.FC<SheetLayoutProps> = ({
  title,
  subtitle,
  onClose,
  headerLeft,
  headerRight,
  subHeader,
  children,
  footer,
  asForm = false,
  onSubmit,
  backgroundColor = "var(--color-panel-bg-secondary)",
  contentDataAttribute,
  contentNoPadding = false,
  contentStyle,
}) => {
  const content = (
    <>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 12px",
          borderBottom: subHeader
            ? "none"
            : "1px solid var(--color-panel-border)",
          backgroundColor: "var(--color-panel-bg)",
          height: "40px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
          }}
        >
          {headerLeft}
          <div
            style={{
              display: "flex",
              alignItems: "end",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--color-panel-text)",
              }}
            >
              {title}
            </span>
            {subtitle && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "var(--color-panel-text-muted)",
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {headerRight}
          {onClose && (
            <IconButton icon={X} onClick={onClose} aria-label="Close" />
          )}
        </div>
      </div>

      {/* Sub-header (e.g., tabs) */}
      {subHeader && (
        <div
          style={{
            borderBottom: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg)",
            flexShrink: 0,
          }}
        >
          {subHeader}
        </div>
      )}

      {/* Content */}
      <div
        {...(contentDataAttribute ? { [contentDataAttribute]: true } : {})}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: contentNoPadding ? 0 : "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: contentNoPadding ? 0 : "16px",
          minHeight: 0,
          ...contentStyle,
        }}
      >
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div
          style={{
            padding: "6.5px 16px",
            borderTop: "1px solid var(--color-panel-border)",
            backgroundColor: "var(--color-panel-bg-secondary)",
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      )}
    </>
  );

  const wrapperStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    backgroundColor,
  };

  if (asForm) {
    return (
      <form onSubmit={onSubmit} style={wrapperStyle}>
        {content}
      </form>
    );
  }

  return <div style={wrapperStyle}>{content}</div>;
};
