import { useState, useEffect, useCallback } from 'react';

const IS_SERVER = typeof window === 'undefined';

/**
 * Custom useLocalStorage hook that matches react-use API
 * SSR-safe implementation that works in all frameworks
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
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
      if ('key' in e && e.key !== null && e.key !== key) {
        return;
      }
      
      if ('detail' in e && (e as CustomEvent).detail?.key && (e as CustomEvent).detail.key !== key) {
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
        console.warn(`Error reading localStorage key "${key}" on storage change:`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange as EventListener);
    };
  }, [key, initialValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (IS_SERVER) {
        console.warn(
          `Tried setting localStorage key "${key}" even though environment is not a client`
        );
        return;
      }

      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        setStoredValue(valueToStore);
        
        window.dispatchEvent(new CustomEvent('local-storage', { detail: { key } }));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
