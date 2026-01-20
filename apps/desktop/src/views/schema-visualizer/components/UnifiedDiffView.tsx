/**
 * UnifiedDiffView Component
 * Shows a unified/split diff of schema.ts code between two versions
 * Styled to match the session-review component from opencode
 * Uses @pierre/diffs for beautiful diff rendering
 */

import { useMemo, useState, useCallback } from "react";
import { FileCode2, ChevronsUpDown } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import type { SchemaDiff } from "../types";
import { generateFullSchemaCode } from "../utils/code-generator";
import { PierreDiff } from "./PierreDiff";
import "./UnifiedDiffView.css";

interface UnifiedDiffViewProps {
  diff: SchemaDiff;
  /** Diff display style: unified or split */
  diffStyle?: "unified" | "split";
  /** Callback when diff style changes */
  onDiffStyleChange?: (style: "unified" | "split") => void;
}

/**
 * DiffChanges indicator component - shows +X -Y counts
 */
function DiffChanges({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  if (additions === 0 && deletions === 0) return null;

  return (
    <div data-component="diff-changes">
      {additions > 0 && (
        <span data-slot="diff-changes-additions">+{additions}</span>
      )}
      {deletions > 0 && (
        <span data-slot="diff-changes-deletions">-{deletions}</span>
      )}
    </div>
  );
}

/**
 * RadioGroup-style toggle for diff style selection
 */
function DiffStyleToggle({
  value,
  onChange,
}: {
  value: "unified" | "split";
  onChange: (value: "unified" | "split") => void;
}) {
  return (
    <div
      className="flex items-center rounded-lg p-0.5"
      style={{ backgroundColor: "var(--color-surface-raised)" }}
    >
      <IconButton
        onClick={() => onChange("unified")}
        variant="ghost"
        size="sm"
        className="w-auto h-7 px-2 text-xs font-medium"
        style={{
          backgroundColor:
            value === "unified"
              ? "var(--color-surface-base)"
              : "transparent",
          color:
            value === "unified"
              ? "var(--color-text-base)"
              : "var(--color-text-muted)",
          boxShadow:
            value === "unified" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
        }}
      >
        Unified
      </IconButton>
      <IconButton
        onClick={() => onChange("split")}
        variant="ghost"
        size="sm"
        className="w-auto h-7 px-2 text-xs font-medium"
        style={{
          backgroundColor:
            value === "split" ? "var(--color-surface-base)" : "transparent",
          color:
            value === "split"
              ? "var(--color-text-base)"
              : "var(--color-text-muted)",
          boxShadow:
            value === "split" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
        }}
      >
        Split
      </IconButton>
    </div>
  );
}

/**
 * Count additions and deletions between two code strings
 */
function countChanges(
  fromCode: string,
  toCode: string,
): { additions: number; deletions: number } {
  const fromLines = fromCode.split("\n");
  const toLines = toCode.split("\n");

  // Simple line-based diff counting using Set comparison
  const fromSet = new Set(fromLines);
  const toSet = new Set(toLines);

  let additions = 0;
  let deletions = 0;

  for (const line of toLines) {
    if (!fromSet.has(line)) {
      additions++;
    }
  }

  for (const line of fromLines) {
    if (!toSet.has(line)) {
      deletions++;
    }
  }

  return { additions, deletions };
}

export function UnifiedDiffView({
  diff,
  diffStyle = "unified",
  onDiffStyleChange,
}: UnifiedDiffViewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [internalDiffStyle, setInternalDiffStyle] = useState<
    "unified" | "split"
  >(diffStyle);

  const currentDiffStyle = onDiffStyleChange ? diffStyle : internalDiffStyle;
  const handleDiffStyleChange = useCallback(
    (style: "unified" | "split") => {
      if (onDiffStyleChange) {
        onDiffStyleChange(style);
      } else {
        setInternalDiffStyle(style);
      }
    },
    [onDiffStyleChange],
  );

  // Generate code for both schemas
  const fromCode = useMemo(
    () => generateFullSchemaCode(diff.from.schema),
    [diff.from.schema],
  );
  const toCode = useMemo(
    () => generateFullSchemaCode(diff.to.schema),
    [diff.to.schema],
  );

  // Count changes
  const stats = useMemo(
    () => countChanges(fromCode, toCode),
    [fromCode, toCode],
  );

  const hasChanges = stats.additions > 0 || stats.deletions > 0;

  return (
    <div data-component="unified-diff-view">
      {/* Header */}
      <div data-slot="diff-header">
        <div data-slot="diff-title">Schema Changes</div>
        <div data-slot="diff-actions">
          {onDiffStyleChange && (
            <DiffStyleToggle
              value={currentDiffStyle}
              onChange={handleDiffStyleChange}
            />
          )}
          {/* TODO: Add collapse button when we have multiple file support */}
          {/* <button
            data-slot="collapse-button"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            <ChevronsUpDown size={14} />
            {isExpanded ? "Collapse" : "Expand"}
          </button> */}
        </div>
      </div>

      {/* Container */}
      <div data-slot="diff-container">
        {/* File accordion item */}
        <div
          data-slot="diff-accordion-item"
          data-expanded={isExpanded ? "" : undefined}
        >
          {/* File trigger */}
          <button
            data-slot="diff-trigger"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            <div data-slot="diff-trigger-content">
              <div data-slot="diff-file-info">
                <FileCode2 size={16} data-slot="diff-file-icon" />
                <div data-slot="diff-file-name-container">
                  <span data-slot="diff-directory">convex/&lrm;</span>
                  <span data-slot="diff-filename">schema.ts</span>
                </div>
              </div>
              <div data-slot="diff-trigger-actions">
                <DiffChanges
                  additions={stats.additions}
                  deletions={stats.deletions}
                />
                <ChevronsUpDown size={16} data-slot="diff-chevron" />
              </div>
            </div>
          </button>

          {/* Diff content */}
          <div data-slot="diff-content">
            {!hasChanges ? (
              <div data-slot="diff-empty">No changes detected</div>
            ) : (
              <div data-slot="diff-editor-container">
                <PierreDiff
                  oldContent={fromCode}
                  newContent={toCode}
                  fileName="schema.ts"
                  diffStyle={currentDiffStyle}
                  showLineNumbers={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Version labels footer */}
        <div data-slot="diff-footer">
          <span>
            From: <span data-slot="diff-footer-label">{diff.from.label}</span>
          </span>
          <span>→</span>
          <span>
            To: <span data-slot="diff-footer-label">{diff.to.label}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default UnifiedDiffView;
