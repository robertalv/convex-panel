import { useCallback } from "react";

interface AutocompleteFilterOptions {
  /**
   * Case sensitivity for string comparison
   * - "base": ignores case and diacritics
   * - "case": case-sensitive
   * - "variant": case-insensitive
   */
  sensitivity?: "base" | "case" | "variant";
}

/**
 * Hook that provides autocomplete filtering functionality
 */
export function useAutocompleteFilter({
  sensitivity = "base",
}: AutocompleteFilterOptions = {}) {
  const contains = useCallback(
    (haystack: string, needle: string): boolean => {
      if (!needle) return true;
      if (!haystack) return false;

      return (
        haystack.localeCompare(needle, undefined, {
          sensitivity,
          usage: "search",
        }) === 0 || haystack.toLowerCase().includes(needle.toLowerCase())
      );
    },
    [sensitivity],
  );

  return { contains };
}
