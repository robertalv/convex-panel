/**
 * Unified Storage Utilities
 * Consolidated localStorage functionality for all apps
 */

import { useCallback, useEffect, useState } from "react";

// ============================================================================
// Basic localStorage functions
// ============================================================================

/**
 * Get a value from localStorage
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set a value in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
}

/**
 * Remove a value from localStorage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
}

// ============================================================================
// Convex Panel specific storage utilities
// ============================================================================

const STORAGE_PREFIX = "convex-panel";

/**
 * Save active table to storage
 */
export function saveActiveTable(tableName: string): void {
  setStorageItem(`${STORAGE_PREFIX}:active-table`, tableName);
}

/**
 * Get active table from storage
 */
export function getActiveTable(): string {
  return getStorageItem<string>(`${STORAGE_PREFIX}:active-table`, "");
}

// ============================================================================
// React hooks for localStorage
// ============================================================================

const IS_SERVER = typeof window === "undefined";

declare global {
  interface WindowEventMap {
    "local-storage": CustomEvent;
  }
}

type UseLocalStorageOptions<T> = {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  initializeWithValue?: boolean;
};

/**
 * localStorage hook with cross-tab sync support
 * Matches react-use API with enhanced functionality
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (IS_SERVER) {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (IS_SERVER) {
      return;
    }

    const handleStorageChange = (e: StorageEvent | Event) => {
      if ("key" in e && e.key !== null && e.key !== key) {
        return;
      }

      if (
        "detail" in e &&
        (e as CustomEvent).detail?.key &&
        (e as CustomEvent).detail.key !== key
      ) {
        return;
      }

      try {
        const item = window.localStorage.getItem(key);
        if (item === null) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(JSON.parse(item) as T);
        }
      } catch (error) {
        console.warn(
          `Error reading localStorage key "${key}" on storage change:`,
          error,
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "local-storage",
      handleStorageChange as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "local-storage",
        handleStorageChange as EventListener,
      );
    };
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (IS_SERVER) {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`,
        );
        return;
      }

      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        setStoredValue(valueToStore);

        window.dispatchEvent(
          new CustomEvent("local-storage", { detail: { key } }),
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  return [storedValue, setValue];
}

/**
 * Enhanced localStorage hook with more options and cross-tab support
 */
export function useGlobalLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { initializeWithValue = true } = options;

  const serializer = useCallback<(value: T) => string>(
    (value) => {
      if (options.serializer) {
        return options.serializer(value);
      }
      return JSON.stringify(value);
    },
    [options],
  );

  const deserializer = useCallback<(value: string) => T>(
    (value) => {
      if (options.deserializer) {
        return options.deserializer(value);
      }
      // Support 'undefined' as a value
      if (value === "undefined") {
        return undefined as unknown as T;
      }

      const defaultValue =
        initialValue instanceof Function ? initialValue() : initialValue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return defaultValue;
      }

      return parsed as T;
    },
    [options, initialValue],
  );

  const readValue = useCallback((): T => {
    const initialValueToUse =
      initialValue instanceof Function ? initialValue() : initialValue;

    if (IS_SERVER) {
      return initialValueToUse;
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? deserializer(raw) : initialValueToUse;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValueToUse;
    }
  }, [initialValue, key, deserializer]);

  const [storedValue, setStoredValue] = useState(() => {
    if (initializeWithValue) {
      return readValue();
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (IS_SERVER) {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`,
        );
        return;
      }

      try {
        const newValue = value instanceof Function ? value(readValue()) : value;
        window.localStorage.setItem(key, serializer(newValue));
        setStoredValue(newValue);
        window.dispatchEvent(new StorageEvent("local-storage", { key }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, readValue],
  );

  const removeValue = useCallback(() => {
    if (IS_SERVER) {
      console.warn(
        `Tried removing localStorage key "${key}" even though environment is not a client`,
      );
      return;
    }

    const defaultValue =
      initialValue instanceof Function ? initialValue() : initialValue;

    window.localStorage.removeItem(key);
    setStoredValue(defaultValue);
    window.dispatchEvent(new StorageEvent("local-storage", { key }));
  }, [key, initialValue]);

  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  const handleStorageChange = useCallback(
    (event: StorageEvent | CustomEvent) => {
      if ((event as StorageEvent).key && (event as StorageEvent).key !== key) {
        return;
      }
      setStoredValue(readValue());
    },
    [key, readValue],
  );

  useEffect(() => {
    const listener = (e: StorageEvent) => handleStorageChange(e);
    const customListener = (e: CustomEvent) => handleStorageChange(e);

    window.addEventListener("storage", listener);
    window.addEventListener("local-storage", customListener);

    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener("local-storage", customListener);
    };
  }, [handleStorageChange]);

  return [storedValue, setValue, removeValue];
}
