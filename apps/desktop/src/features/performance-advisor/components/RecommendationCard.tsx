/**
 * RecommendationCard Component
 * Displays individual health warning with fix action
 */

import { useState, useCallback } from "react";
import {
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  Wand2,
  Copy,
  FileEdit,
  X,
  Check,
} from "lucide-react";
import type {
  HealthWarning,
  WarningAction,
} from "../../schema-visualizer/types";
import { CodePreview } from "./CodePreview";

interface RecommendationCardProps {
  warning: HealthWarning;
  onApplyFix?: (warning: HealthWarning, action: WarningAction) => Promise<void>;
  onDismiss?: (warningId: string) => void;
  onOpenInEditor?: (tableName: string) => void;
  isApplying?: boolean;
}

export function RecommendationCard({
  warning,
  onApplyFix,
  onDismiss,
  onOpenInEditor,
  isApplying = false,
}: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!warning.action?.codeSnippet) return;
    try {
      await navigator.clipboard.writeText(warning.action.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [warning.action?.codeSnippet]);

  const handleApplyFix = useCallback(async () => {
    if (!warning.action || !onApplyFix) return;
    try {
      await onApplyFix(warning, warning.action);
      setApplied(true);
    } catch (err) {
      console.error("Failed to apply fix:", err);
    }
  }, [warning, onApplyFix]);

  const severityConfig = {
    error: {
      icon: XCircle,
      color: "var(--color-error-base)",
      bgColor: "var(--color-error-bg)",
      label: "Error",
    },
    warning: {
      icon: AlertTriangle,
      color: "var(--color-warning-base)",
      bgColor: "var(--color-warning-bg)",
      label: "Warning",
    },
    info: {
      icon: Info,
      color: "var(--color-info-base)",
      bgColor: "var(--color-info-bg)",
      label: "Suggestion",
    },
  };

  const config = severityConfig[warning.severity];
  const Icon = config.icon;

  if (warning.dismissed) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "var(--color-surface-base)",
        borderRadius: "8px",
        border: "1px solid var(--color-border-base)",
        overflow: "hidden",
        opacity: applied ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "14px 16px",
          cursor: warning.action ? "pointer" : "default",
        }}
        onClick={() => warning.action && setIsExpanded(!isExpanded)}
      >
        {/* Severity icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: config.bgColor,
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            {warning.table && (
              <code
                style={{
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "var(--color-surface-secondary)",
                  color: "var(--color-text-base)",
                  fontFamily: "monospace",
                }}
              >
                {warning.table}
              </code>
            )}
            {warning.field && (
              <>
                <span style={{ color: "var(--color-text-muted)" }}>.</span>
                <code
                  style={{
                    fontSize: "12px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "var(--color-surface-secondary)",
                    color: "var(--color-primary-base)",
                    fontFamily: "monospace",
                  }}
                >
                  {warning.field}
                </code>
              </>
            )}
            <span
              style={{
                fontSize: "11px",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: config.bgColor,
                color: config.color,
                fontWeight: 500,
              }}
            >
              {config.label}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-base)",
              lineHeight: 1.4,
            }}
          >
            {warning.message}
          </p>

          {warning.impact && (
            <p
              style={{
                margin: "6px 0 0 0",
                fontSize: "12px",
                color: "var(--color-text-muted)",
                lineHeight: 1.4,
              }}
            >
              {warning.impact}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
          }}
        >
          {applied && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "var(--color-success-base)",
                padding: "4px 8px",
              }}
            >
              <Check size={14} />
              Applied
            </span>
          )}

          {warning.action && !applied && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                border: "none",
                backgroundColor: "transparent",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-secondary)";
                e.currentTarget.style.color = "var(--color-text-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}

          {onDismiss && !applied && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(warning.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                border: "none",
                backgroundColor: "transparent",
                borderRadius: "6px",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "var(--color-surface-secondary)";
                e.currentTarget.style.color = "var(--color-text-base)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
              title="Dismiss this recommendation"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && warning.action && (
        <div
          style={{
            padding: "0 16px 16px 16px",
            borderTop: "1px solid var(--color-border-base)",
            marginTop: "-1px",
          }}
        >
          {/* Description */}
          <p
            style={{
              margin: "12px 0",
              fontSize: "13px",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {warning.action.description}
          </p>

          {/* Code preview */}
          {warning.action.codeSnippet && (
            <div style={{ marginBottom: "12px" }}>
              <CodePreview
                code={warning.action.codeSnippet}
                title="Add to schema.ts"
              />
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {warning.action.canAutoApply && onApplyFix && (
              <button
                onClick={handleApplyFix}
                disabled={isApplying || applied}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "none",
                  borderRadius: "6px",
                  backgroundColor: "var(--color-primary-base)",
                  color: "white",
                  cursor: isApplying || applied ? "not-allowed" : "pointer",
                  opacity: isApplying || applied ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isApplying && !applied) {
                    e.currentTarget.style.backgroundColor =
                      "var(--color-primary-hover)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-primary-base)";
                }}
              >
                <Wand2 size={14} />
                {isApplying ? "Applying..." : "Apply Fix"}
              </button>
            )}

            {warning.action.codeSnippet && (
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "1px solid var(--color-border-base)",
                  borderRadius: "6px",
                  backgroundColor: "var(--color-surface-base)",
                  color: copied
                    ? "var(--color-success-base)"
                    : "var(--color-text-base)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-surface-secondary)";
                  e.currentTarget.style.borderColor =
                    "var(--color-border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-surface-base)";
                  e.currentTarget.style.borderColor =
                    "var(--color-border-base)";
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
            )}

            {warning.table && onOpenInEditor && (
              <button
                onClick={() => onOpenInEditor(warning.table!)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: "1px solid var(--color-border-base)",
                  borderRadius: "6px",
                  backgroundColor: "var(--color-surface-base)",
                  color: "var(--color-text-base)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-surface-secondary)";
                  e.currentTarget.style.borderColor =
                    "var(--color-border-strong)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-surface-base)";
                  e.currentTarget.style.borderColor =
                    "var(--color-border-base)";
                }}
              >
                <FileEdit size={14} />
                Open in Editor
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
