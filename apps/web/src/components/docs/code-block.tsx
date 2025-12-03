import { useMemo, useState } from "react";
import { Check, Copy, FileCode } from "lucide-react";

type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
};

export function CodeBlock({ code, title }: CodeBlockProps) {
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

  const highlightedCode = useMemo(() => {
    return code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /(\/\/.*)/g,
        '<span class="text-[#6a9955] italic">$1</span>',
      )
      .replace(
        /\b(import|export|from|const|function|return|default|class|interface|type|var|let|async|await|use)\b/g,
        '<span class="text-[#c586c0]">$1</span>',
      )
      .replace(
        /\b(npm|install|run|dev|build|add|save-dev)\b/g,
        '<span class="text-[#dcdcaa]">$1</span>',
      )
      .replace(
        /(['"`].*?['"`])/g,
        '<span class="text-[#ce9178]">$1</span>',
      )
      .replace(
        /\b(ConvexPanel|ConvexProvider|ConvexReactClient|React)\b/g,
        '<span class="text-[#4ec9b0]">$1</span>',
      )
      .replace(
        /\b(true|false|null|undefined)\b/g,
        '<span class="text-[#569cd6]">$1</span>',
      );
  }, [code]);

  return (
    <div className="my-6 rounded-xl overflow-hidden bg-[#1e1e1e] border border-border shadow-2xl group">
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-white/5 select-none relative">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>

        {title && (
          <div className="absolute left-1/2 -translate-x-1/2 text-xs font-medium text-[#858585] flex items-center gap-1.5 opacity-80">
            <FileCode className="w-3.5 h-3.5" />
            {title}
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto text-[#858585] hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 flex items-center gap-1.5"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] text-green-400 font-medium">
                Copied
              </span>
            </>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <div className="p-5 overflow-x-auto custom-scrollbar relative">
        <pre className="font-mono text-[13px] leading-6 text-[#d4d4d4]">
          {/* eslint-disable-next-line react/no-danger */}
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    </div>
  );
}


