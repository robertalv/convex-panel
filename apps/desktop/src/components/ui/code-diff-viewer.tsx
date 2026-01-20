import { useMemo, CSSProperties } from "react";
import { FileDiff, type FileContents } from "@pierre/diffs/react";
import { parseDiffFromFile, type FileDiffMetadata } from "@pierre/diffs";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";
import "./css/code-diff-viewer.css";

export interface CodeDiffViewerProps {
  oldContent: string;
  newContent: string;
  fileName?: string;
  language?:
    | "typescript"
    | "javascript"
    | "python"
    | "rust"
    | "go"
    | "json"
    | "markdown"
    | "html"
    | "css";
  diffStyle?: "unified" | "split";
  showLineNumbers?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  description?: string;
}

const styleVariables: CSSProperties = {
  "--diffs-font-family":
    "var(--font-mono, 'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace)",
  "--diffs-font-size": "13px",
  "--diffs-line-height": "24px",
  "--diffs-tab-size": "2",
  "--diffs-gap-block": "0",
  "--diffs-min-number-column-width": "4ch",
} as CSSProperties;

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

function createUnsafeCSS(isDark: boolean): string {
  const baseBg = isDark ? "rgb(30, 28, 26)" : "rgb(243, 240, 237)";
  const containerBg = isDark ? "rgb(52, 50, 47)" : "rgb(248, 246, 243)";
  const separatorBg = containerBg;
  const fg = isDark ? "#f1ecec" : "#211e1e";
  const fgNumber = isDark ? "rgb(143, 135, 128)" : "rgb(150, 148, 143)";

  const additionColor = isDark ? "#9dde99" : "#318430";
  const deletionColor = isDark ? "#fc533a" : "#ef442a";
  const modifiedColor = isDark ? "#89b5ff" : "#034cff";

  const additionBg = isDark
    ? "rgba(157, 222, 153, 0.15)"
    : "rgba(49, 132, 48, 0.12)";
  const additionNumberBg = isDark
    ? "rgba(157, 222, 153, 0.25)"
    : "rgba(49, 132, 48, 0.2)";
  const additionEmphasis = isDark
    ? "rgba(157, 222, 153, 0.3)"
    : "rgba(49, 132, 48, 0.25)";

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

export function CodeDiffViewer({
  oldContent,
  newContent,
  fileName = "code.ts",
  language = "typescript",
  diffStyle = "unified",
  showLineNumbers = true,
  className,
  style,
  title,
  description,
}: CodeDiffViewerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const oldFile: FileContents = useMemo(
    () => ({
      name: fileName,
      contents: oldContent,
      lang: language,
    }),
    [oldContent, fileName, language],
  );

  const newFile: FileContents = useMemo(
    () => ({
      name: fileName,
      contents: newContent,
      lang: language,
    }),
    [newContent, fileName, language],
  );

  const fileDiff: FileDiffMetadata = useMemo(
    () => parseDiffFromFile(oldFile, newFile),
    [oldFile, newFile],
  );

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

  const combinedStyle: CSSProperties = useMemo(
    () => ({
      ...styleVariables,
      ...style,
    }),
    [style],
  );

  return (
    <div
      data-component="code-diff-viewer"
      data-theme={resolvedTheme}
      className={cn(
        "rounded-lg border border-border-base bg-surface-base overflow-hidden",
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-border-base bg-surface-raised px-4 py-3">
          {title && (
            <h3 className="text-sm font-medium text-text-base">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-xs text-text-muted">{description}</p>
          )}
        </div>
      )}
      <div
        data-diff-content
        className="code-diff-content"
        style={combinedStyle}
      >
        <FileDiff fileDiff={fileDiff} options={options} />
      </div>
    </div>
  );
}

export default CodeDiffViewer;
