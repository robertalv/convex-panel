/**
 * LogOutput Component
 * Displays console log messages with optional wrapping
 * Based on dashboard-common LogOutput implementation
 */

import { cn } from "@/lib/utils";

export type LogLevel = "INFO" | "LOG" | "ERROR" | "WARN" | "DEBUG";

export interface LogOutput {
  isTruncated?: boolean;
  isUnstructured?: boolean;
  messages: string[];
  level?: LogLevel | "FAILURE";
}

interface LogOutputProps {
  output: LogOutput;
  wrap?: boolean;
  secondary?: boolean;
}

/**
 * Converts log messages array to a single display string
 * Handles escape sequences and quote removal
 */
export function messagesToString(output: LogOutput): string {
  return output.messages
    .map((message) => {
      let newMessage: string = message;
      // Remove surrounding quotes and unescape if not unstructured
      if (
        !output.isUnstructured &&
        message.startsWith("'") &&
        message.endsWith("'")
      ) {
        newMessage = slashUnescape(message).slice(1, -1);
      }
      return newMessage;
    })
    .join(" ");
}

const slashReplacements: Record<string, string> = {
  "\\\\": "\\",
  "\\n": "\n",
  "\\'": "'",
};

function slashUnescape(contents: string) {
  return contents.replace(
    /\\(\\|n|')/g,
    (replace) => slashReplacements[replace],
  );
}

/**
 * Renders console log output with optional line wrapping
 */
export function LogOutput({ output, wrap, secondary }: LogOutputProps) {
  const displayText = `${messagesToString(output)}${output.isTruncated ? " (truncated due to length)" : ""}`;

  return (
    <div
      className={cn(
        "text-xs overflow-y-auto font-mono",
        wrap ? "whitespace-pre-wrap break-all" : "truncate",
        secondary && "text-[var(--color-text-secondary)]",
      )}
    >
      {displayText}
    </div>
  );
}

export default LogOutput;
