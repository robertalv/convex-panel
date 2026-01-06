import { useCallback, useState } from "react";
import { ExternalLink, Code2, Loader2 } from "lucide-react";
import { useMcpOptional } from "../contexts/McpContext";
import { cn } from "@/lib/utils";

interface OpenInEditorProps {
  /** The file path relative to the project root */
  filePath: string;
  /** Optional line number to jump to */
  line?: number;
  /** Whether to show the icon only (compact mode) */
  iconOnly?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Button to open a file in Cursor or VS Code
 */
export function OpenInEditorButton({
  filePath,
  line,
  iconOnly = false,
  label = "Open in Editor",
  className,
  size = "sm",
}: OpenInEditorProps) {
  const mcp = useMcpOptional();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (!mcp) return;

    setIsLoading(true);
    try {
      // Construct full path if project path is set
      let fullPath = filePath;
      if (mcp.projectPath && !filePath.startsWith("/")) {
        fullPath = `${mcp.projectPath}/${filePath}`;
      }

      await mcp.openInCursor(fullPath, line);
    } catch (error) {
      console.error("Failed to open in editor:", error);
    } finally {
      setIsLoading(false);
    }
  }, [mcp, filePath, line]);

  // Don't render if MCP is not available or no project path
  if (!mcp || !mcp.projectPath) {
    return null;
  }

  const sizeClasses = {
    sm: "p-1 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-sm",
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "rounded transition-colors",
          "text-text-muted hover:text-brand-base",
          "hover:bg-brand-base/10",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          className,
        )}
        title={`${label} (${filePath}${line ? `:${line}` : ""})`}
      >
        {isLoading ? (
          <Loader2 size={iconSize[size]} className="animate-spin" />
        ) : (
          <ExternalLink size={iconSize[size]} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded transition-colors",
        "text-text-muted hover:text-brand-base",
        "hover:bg-brand-base/10 border border-transparent",
        "hover:border-brand-base/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className,
      )}
      title={`Open ${filePath}${line ? ` at line ${line}` : ""}`}
    >
      {isLoading ? (
        <Loader2 size={iconSize[size]} className="animate-spin" />
      ) : (
        <Code2 size={iconSize[size]} />
      )}
      <span>{label}</span>
    </button>
  );
}

/**
 * Link-style component to open a file path in editor
 */
export function OpenInEditorLink({
  filePath,
  line,
  className,
}: {
  filePath: string;
  line?: number;
  className?: string;
}) {
  const mcp = useMcpOptional();

  const handleClick = useCallback(async () => {
    if (!mcp) return;

    try {
      let fullPath = filePath;
      if (mcp.projectPath && !filePath.startsWith("/")) {
        fullPath = `${mcp.projectPath}/${filePath}`;
      }
      await mcp.openInCursor(fullPath, line);
    } catch (error) {
      console.error("Failed to open in editor:", error);
    }
  }, [mcp, filePath, line]);

  // If MCP is not available, just show the path as text
  if (!mcp || !mcp.projectPath) {
    return (
      <span className={cn("font-mono text-xs text-text-muted", className)}>
        {filePath}
        {line ? `:${line}` : ""}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "font-mono text-xs text-brand-base hover:text-brand-hover",
        "hover:underline cursor-pointer transition-colors",
        className,
      )}
      title={`Open in editor: ${filePath}${line ? `:${line}` : ""}`}
    >
      {filePath}
      {line ? `:${line}` : ""}
    </button>
  );
}

export default OpenInEditorButton;
