import { useState, useCallback } from "react";

export interface UseCopyToClipboardOptions {
  /**
   * Duration in milliseconds to show the "copied" state
   * @default 2000
   */
  resetDelay?: number;
  /**
   * Callback function to execute on successful copy
   */
  onSuccess?: () => void;
  /**
   * Callback function to execute on copy error
   */
  onError?: (error: Error) => void;
}

export interface UseCopyToClipboardReturn {
  /**
   * Whether the text was recently copied (within resetDelay duration)
   */
  copied: boolean;
  /**
   * Function to copy text to clipboard
   */
  copy: (text: string) => Promise<boolean>;
  /**
   * Function to manually reset the copied state
   */
  reset: () => void;
}

/**
 * Hook to copy text to clipboard with state management
 *
 * @example
 * ```tsx
 * const { copied, copy } = useCopyToClipboard();
 *
 * return (
 *   <button onClick={() => copy('Hello World')}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 * ```
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardReturn {
  const { resetDelay = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onSuccess?.();

        // Auto-reset after delay
        setTimeout(() => {
          setCopied(false);
        }, resetDelay);

        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to copy to clipboard");
        console.error("Failed to copy:", error);
        onError?.(error);
        return false;
      }
    },
    [resetDelay, onSuccess, onError],
  );

  return { copied, copy, reset };
}
