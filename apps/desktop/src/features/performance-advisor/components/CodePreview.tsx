/**
 * CodePreview Component
 * Displays code snippets with syntax highlighting and copy functionality
 */

import { useState, useCallback } from "react";
import { Copy, Check, FileCode } from "lucide-react";

interface CodePreviewProps {
  code: string;
  language?: string;
  title?: string;
  onCopy?: () => void;
}

export function CodePreview({
  code,
  language = "typescript",
  title,
  onCopy,
}: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [code, onCopy]);

  return (
    <div
      style={{
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--color-border-base)",
        backgroundColor: "var(--color-surface-base)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: "var(--color-surface-secondary)",
          borderBottom: "1px solid var(--color-border-base)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--color-text-muted)",
          }}
        >
          <FileCode size={14} />
          <span>{title || language}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            border: "1px solid var(--color-border-base)",
            borderRadius: "4px",
            backgroundColor: copied
              ? "var(--color-success-bg)"
              : "var(--color-surface-base)",
            color: copied
              ? "var(--color-success-base)"
              : "var(--color-text-muted)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-overlay)";
              e.currentTarget.style.borderColor = "var(--color-border-strong)";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor =
                "var(--color-surface-base)";
              e.currentTarget.style.borderColor = "var(--color-border-base)";
            }
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code content */}
      <div
        style={{
          padding: "12px 16px",
          overflowX: "auto",
        }}
      >
        <pre
          style={{
            margin: 0,
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            fontSize: "12px",
            lineHeight: "1.6",
            color: "var(--color-text-base)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <code>{highlightSyntax(code)}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Simple syntax highlighting for TypeScript/Convex code
 */
function highlightSyntax(code: string): React.ReactNode {
  // Simple token-based highlighting
  const tokens: { type: string; value: string }[] = [];
  let remaining = code;

  const patterns: { type: string; regex: RegExp }[] = [
    // Comments
    { type: "comment", regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
    // Strings
    {
      type: "string",
      regex:
        /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/,
    },
    // Keywords
    {
      type: "keyword",
      regex:
        /^(const|let|var|function|return|if|else|for|while|import|export|from|type|interface|class|extends|implements|new|async|await|true|false|null|undefined)\b/,
    },
    // Convex-specific
    {
      type: "convex",
      regex: /^(defineTable|defineSchema|v|index|searchIndex|vectorIndex)\b/,
    },
    // Numbers
    { type: "number", regex: /^(\d+\.?\d*|\.\d+)/ },
    // Punctuation
    { type: "punctuation", regex: /^([{}[\]().,;:])/ },
    // Operators
    { type: "operator", regex: /^(=>|[=+\-*/<>!&|?]+)/ },
    // Identifiers
    { type: "identifier", regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*/ },
    // Whitespace
    { type: "whitespace", regex: /^(\s+)/ },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match) {
        tokens.push({ type: pattern.type, value: match[0] });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Unknown character, just add it
      tokens.push({ type: "unknown", value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  // Convert tokens to styled spans
  return tokens.map((token, i) => {
    const style = getTokenStyle(token.type);
    if (!style) {
      return token.value;
    }
    return (
      <span key={i} style={style}>
        {token.value}
      </span>
    );
  });
}

function getTokenStyle(type: string): React.CSSProperties | null {
  switch (type) {
    case "keyword":
      return { color: "var(--color-primary-base)" };
    case "convex":
      return { color: "#ff6b35", fontWeight: 500 };
    case "string":
      return { color: "var(--color-success-base)" };
    case "number":
      return { color: "var(--color-warning-base)" };
    case "comment":
      return { color: "var(--color-text-subtle)", fontStyle: "italic" };
    case "punctuation":
      return { color: "var(--color-text-muted)" };
    case "operator":
      return { color: "var(--color-info-base)" };
    default:
      return null;
  }
}
