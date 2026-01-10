/**
 * PierreDiff Component
 * A React wrapper around @pierre/diffs for beautiful diff rendering
 * Styled to match OpenCode's session-review component
 */

import { useMemo, CSSProperties } from "react";
import { FileDiff, type FileContents } from "@pierre/diffs/react";
import { parseDiffFromFile, type FileDiffMetadata } from "@pierre/diffs";
import { useTheme } from "@/contexts/ThemeContext";
import "./PierreDiff.css";

export interface PierreDiffProps {
  /** Old file content */
  oldContent: string;
  /** New file content */
  newContent: string;
  /** File name for syntax highlighting */
  fileName?: string;
  /** Diff display style */
  diffStyle?: "unified" | "split";
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/**
 * CSS style variables for the Pierre diffs component
 * These map to OpenCode's design system
 */
const styleVariables: CSSProperties = {
  "--diffs-font-family":
    "var(--font-mono, 'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace)",
  "--diffs-font-size": "13px",
  "--diffs-line-height": "24px",
  "--diffs-tab-size": "2",
  "--diffs-gap-block": "0",
  "--diffs-min-number-column-width": "4ch",
} as CSSProperties;

/**
 * Create default options for Pierre diffs that match OpenCode's styling
 */
function createDefaultOptions(diffStyle: "unified" | "split" = "unified") {
  return {
    theme: "dark-plus" as const,
    themeType: "system" as const,
    disableLineNumbers: false,
    overflow: "wrap" as const,
    diffStyle,
    diffIndicators: "bars" as const,
    disableBackground: false,
    expansionLineCount: 20,
    lineDiffType:
      diffStyle === "split" ? ("word-alt" as const) : ("none" as const),
    maxLineDiffLength: 1000,
    disableFileHeader: true,
    hunkSeparators: "line-info" as const,
  };
}

/**
 * Create unsafe CSS for the diff component with theme-specific colors
 * We need to hardcode colors because Shadow DOM doesn't inherit CSS variables
 */
function createUnsafeCSS(isDark: boolean): string {
  // Colors based on theme
  // - baseBg: for empty/context lines (background-base)
  // - containerBg: for the overall container (surface-raised)
  const baseBg = isDark ? "rgb(30, 28, 26)" : "rgb(243, 240, 237)";
  const containerBg = isDark ? "rgb(52, 50, 47)" : "rgb(248, 246, 243)";
  const separatorBg = containerBg;
  const fg = isDark ? "#f1ecec" : "#211e1e";
  const fgNumber = isDark ? "rgb(143, 135, 128)" : "rgb(150, 148, 143)";

  // Mint/ember colors
  const additionColor = isDark ? "#9dde99" : "#318430";
  const deletionColor = isDark ? "#fc533a" : "#ef442a";
  const modifiedColor = isDark ? "#89b5ff" : "#034cff";

  // Addition backgrounds
  const additionBg = isDark
    ? "rgba(157, 222, 153, 0.15)"
    : "rgba(49, 132, 48, 0.12)";
  const additionNumberBg = isDark
    ? "rgba(157, 222, 153, 0.25)"
    : "rgba(49, 132, 48, 0.2)";
  const additionEmphasis = isDark
    ? "rgba(157, 222, 153, 0.3)"
    : "rgba(49, 132, 48, 0.25)";

  // Deletion backgrounds
  const deletionBg = isDark
    ? "rgba(252, 83, 58, 0.15)"
    : "rgba(239, 68, 42, 0.12)";
  const deletionNumberBg = isDark
    ? "rgba(252, 83, 58, 0.25)"
    : "rgba(239, 68, 42, 0.2)";
  const deletionEmphasis = isDark
    ? "rgba(252, 83, 58, 0.3)"
    : "rgba(239, 68, 42, 0.25)";

  return `
[data-diffs] {
  --diffs-bg: ${baseBg};
  --diffs-bg-buffer: ${baseBg};
  --diffs-bg-hover: ${baseBg};
  --diffs-bg-context: ${baseBg};
  --diffs-bg-context-number: ${containerBg};
  --diffs-bg-separator: ${separatorBg};
  --diffs-fg: ${fg};
  --diffs-fg-number: ${fgNumber};
  
  --diffs-deletion-base: ${deletionColor};
  --diffs-addition-base: ${additionColor};
  --diffs-modified-base: ${modifiedColor};
  
  --diffs-bg-addition: ${additionBg};
  --diffs-bg-addition-number: ${additionNumberBg};
  --diffs-bg-addition-hover: ${additionBg};
  --diffs-bg-addition-emphasis: ${additionEmphasis};
  
  --diffs-bg-deletion: ${deletionBg};
  --diffs-bg-deletion-number: ${deletionNumberBg};
  --diffs-bg-deletion-hover: ${deletionBg};
  --diffs-bg-deletion-emphasis: ${deletionEmphasis};
  
  --diffs-selection-base: ${modifiedColor};
  --diffs-bg-selection: ${baseBg};
  --diffs-bg-selection-number: ${containerBg};
  
  background-color: ${containerBg} !important;
}

[data-diffs-header],
[data-diffs] {
  [data-separator-wrapper] {
    margin: 0 !important;
    border-radius: 0 !important;
    background-color: ${separatorBg} !important;
  }
  [data-expand-button] {
    width: 6.5ch !important;
    height: 24px !important;
    justify-content: end !important;
    padding-left: 3ch !important;
    padding-inline: 1ch !important;
  }
  [data-separator-multi-button] {
    grid-template-rows: 10px 10px !important;
    [data-expand-button] {
      height: 12px !important;
    }
  }
  [data-separator-content] {
    height: 24px !important;
    background-color: ${separatorBg} !important;
  }
  [data-code] {
    overflow-x: auto !important;
  }
  /* Override context/unchanged line backgrounds */
  [data-line][data-line-type="context"],
  [data-line]:not([data-line-type]) {
    background: ${baseBg} !important;
    background-image: none !important;
  }
  /* Line number column uses container/surface-raised background */
  [data-line-number],
  [data-gutter],
  [data-column-number],
  [data-numbers] {
    background: ${baseBg} !important;
    background-image: none !important;
  }
}
`;
}

export function PierreDiff({
  oldContent,
  newContent,
  fileName = "schema.ts",
  diffStyle = "unified",
  showLineNumbers = true,
  className,
  style,
}: PierreDiffProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Create FileContents objects
  const oldFile: FileContents = useMemo(
    () => ({
      name: fileName,
      contents: oldContent,
      lang: "typescript",
    }),
    [oldContent, fileName],
  );

  const newFile: FileContents = useMemo(
    () => ({
      name: fileName,
      contents: newContent,
      lang: "typescript",
    }),
    [newContent, fileName],
  );

  // Parse the diff to create FileDiffMetadata
  const fileDiff: FileDiffMetadata = useMemo(
    () => parseDiffFromFile(oldFile, newFile),
    [oldFile, newFile],
  );

  // Create options based on theme and diff style
  const options = useMemo(() => {
    const baseOptions = createDefaultOptions(diffStyle);
    return {
      ...baseOptions,
      theme:
        resolvedTheme === "light"
          ? ("light-plus" as const)
          : ("dark-plus" as const),
      themeType: (resolvedTheme === "light" ? "light" : "dark") as
        | "light"
        | "dark",
      disableLineNumbers: !showLineNumbers,
      unsafeCSS: createUnsafeCSS(isDark),
    };
  }, [diffStyle, resolvedTheme, showLineNumbers, isDark]);

  // Combine styles
  const combinedStyle: CSSProperties = useMemo(
    () => ({
      ...styleVariables,
      ...style,
    }),
    [style],
  );

  return (
    <div
      data-component="pierre-diff"
      data-theme={resolvedTheme}
      className={className}
      style={combinedStyle}
    >
      <FileDiff fileDiff={fileDiff} options={options} />
    </div>
  );
}

export default PierreDiff;
