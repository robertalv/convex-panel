import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileScriptIcon, Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

interface CodeBlockProps {
  code: string;
  title?: string;
  language?: string;
}

export function CodeBlock({ code, title, language = "typescript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-border bg-[#1e1e1e] shadow-2xl group">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-2 py-4 bg-[#252526] border-b border-white/5 select-none relative">
          <div className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-[#858585] flex items-center gap-1.5 opacity-80">
            <HugeiconsIcon icon={FileScriptIcon} className="w-3.5 h-3.5" />
            {title}
          </div>
        </div>
      )}

      {/* Code */}
      <div className="relative">
        {/* Copy button shown on hover in top right of code area */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#2a2d2e] hover:bg-[#37373d] transition-all text-[#cccccc] hover:text-white z-10 opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4 text-green-400" />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
          )}
        </button>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            background: "#1e1e1e",
            fontSize: "0.8125rem",
            lineHeight: "1.5",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
