/**
 * UnifiedDiffView Component
 * Shows a unified text-based diff of schema.ts code between two versions
 */

import { useMemo } from "react";
import { ArrowRight, Plus, Minus, Equal } from "lucide-react";
import type { SchemaDiff } from "../types";
import { generateFullSchemaCode } from "../utils/code-generator";

interface UnifiedDiffViewProps {
  diff: SchemaDiff;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged" | "header";
  content: string;
  lineNumber?: { from?: number; to?: number };
}

/**
 * Simple diff algorithm to compare two code strings line by line
 */
function computeLineDiff(fromCode: string, toCode: string): DiffLine[] {
  const fromLines = fromCode.split("\n");
  const toLines = toCode.split("\n");
  const result: DiffLine[] = [];

  // Use LCS (Longest Common Subsequence) based diff
  const lcs = computeLCS(fromLines, toLines);

  let fromIdx = 0;
  let toIdx = 0;
  let fromLineNum = 1;
  let toLineNum = 1;

  for (const common of lcs) {
    // Add removed lines (from "from" that aren't in common)
    while (fromIdx < fromLines.length && fromLines[fromIdx] !== common) {
      result.push({
        type: "removed",
        content: fromLines[fromIdx],
        lineNumber: { from: fromLineNum },
      });
      fromIdx++;
      fromLineNum++;
    }

    // Add added lines (from "to" that aren't in common)
    while (toIdx < toLines.length && toLines[toIdx] !== common) {
      result.push({
        type: "added",
        content: toLines[toIdx],
        lineNumber: { to: toLineNum },
      });
      toIdx++;
      toLineNum++;
    }

    // Add the common line
    if (fromIdx < fromLines.length && toIdx < toLines.length) {
      result.push({
        type: "unchanged",
        content: common,
        lineNumber: { from: fromLineNum, to: toLineNum },
      });
      fromIdx++;
      toIdx++;
      fromLineNum++;
      toLineNum++;
    }
  }

  // Add remaining removed lines
  while (fromIdx < fromLines.length) {
    result.push({
      type: "removed",
      content: fromLines[fromIdx],
      lineNumber: { from: fromLineNum },
    });
    fromIdx++;
    fromLineNum++;
  }

  // Add remaining added lines
  while (toIdx < toLines.length) {
    result.push({
      type: "added",
      content: toLines[toIdx],
      lineNumber: { to: toLineNum },
    });
    toIdx++;
    toLineNum++;
  }

  return result;
}

/**
 * Compute Longest Common Subsequence of two string arrays
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

export function UnifiedDiffView({ diff }: UnifiedDiffViewProps) {
  // Generate code for both schemas
  const fromCode = useMemo(
    () => generateFullSchemaCode(diff.from.schema),
    [diff.from.schema],
  );
  const toCode = useMemo(
    () => generateFullSchemaCode(diff.to.schema),
    [diff.to.schema],
  );

  // Compute line-by-line diff
  const diffLines = useMemo(
    () => computeLineDiff(fromCode, toCode),
    [fromCode, toCode],
  );

  // Count changes
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === "added") added++;
      if (line.type === "removed") removed++;
    }
    return { added, removed };
  }, [diffLines]);

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "var(--color-background-base)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: "1px solid var(--color-border-base)",
          backgroundColor: "var(--color-surface-base)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              color: "var(--color-text-base)",
            }}
          >
            {diff.from.label}
          </span>
          <ArrowRight size={16} style={{ color: "var(--color-text-muted)" }} />
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{
              backgroundColor: "var(--color-surface-raised)",
              color: "var(--color-text-base)",
            }}
          >
            {diff.to.label}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {stats.added > 0 && (
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "#22c55e" }}
            >
              <Plus size={12} />
              {stats.added} added
            </span>
          )}
          {stats.removed > 0 && (
            <span
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "#ef4444" }}
            >
              <Minus size={12} />
              {stats.removed} removed
            </span>
          )}
          {stats.added === 0 && stats.removed === 0 && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Equal size={12} />
              No changes
            </span>
          )}
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        <pre
          className="text-xs font-mono p-0 m-0"
          style={{ minWidth: "max-content" }}
        >
          {diffLines.map((line, idx) => (
            <DiffLineRow key={idx} line={line} />
          ))}
        </pre>
      </div>
    </div>
  );
}

function DiffLineRow({ line }: { line: DiffLine }) {
  const bgColor =
    line.type === "added"
      ? "rgba(34, 197, 94, 0.15)"
      : line.type === "removed"
        ? "rgba(239, 68, 68, 0.15)"
        : "transparent";

  const borderColor =
    line.type === "added"
      ? "rgba(34, 197, 94, 0.5)"
      : line.type === "removed"
        ? "rgba(239, 68, 68, 0.5)"
        : "transparent";

  const icon =
    line.type === "added" ? (
      <Plus size={12} style={{ color: "#22c55e" }} />
    ) : line.type === "removed" ? (
      <Minus size={12} style={{ color: "#ef4444" }} />
    ) : (
      <span style={{ width: 12 }} />
    );

  return (
    <div
      className="flex items-stretch"
      style={{
        backgroundColor: bgColor,
        borderLeft: `3px solid ${borderColor}`,
        minHeight: "20px",
      }}
    >
      {/* Line numbers */}
      <div
        className="flex items-center justify-end gap-1 px-2 select-none"
        style={{
          minWidth: "80px",
          color: "var(--color-text-subtle)",
          backgroundColor: "var(--color-surface-base)",
          borderRight: "1px solid var(--color-border-base)",
        }}
      >
        <span style={{ width: "28px", textAlign: "right" }}>
          {line.lineNumber?.from || ""}
        </span>
        <span style={{ width: "28px", textAlign: "right" }}>
          {line.lineNumber?.to || ""}
        </span>
      </div>

      {/* Icon */}
      <div
        className="flex items-center justify-center px-1"
        style={{ width: "24px" }}
      >
        {icon}
      </div>

      {/* Content */}
      <div
        className="flex-1 px-2 py-0.5"
        style={{
          color:
            line.type === "removed"
              ? "#ef4444"
              : line.type === "added"
                ? "#22c55e"
                : "var(--color-text-base)",
          whiteSpace: "pre",
        }}
      >
        {line.content}
      </div>
    </div>
  );
}

export default UnifiedDiffView;
