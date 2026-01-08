import { useState, useEffect, useCallback } from 'react';

const globalStateStore = new Map<symbol, { value: any; listeners: Set<(value: any) => void> }>();

let globalStateCounter = 0;

/**
 * Creates a global state hook that shares state across all component instances
 * Matches react-use's createGlobalState API
 * SSR-safe implementation that works in all frameworks
 */
export function createGlobalState<T>(initialValue: T) {
  const stateKey = Symbol(`global-state-${++globalStateCounter}`);
  
  globalStateStore.set(stateKey, {
    value: initialValue,
    listeners: new Set(),
  });

  return function useGlobalState(): [T, (value: T | ((prev: T) => T)) => void] {
    const state = globalStateStore.get(stateKey)!;
    
    const [localValue, setLocalValue] = useState<T>(() => state.value);

    useEffect(() => {
      const listener = (newValue: T) => {
        setLocalValue(newValue);
      };
      
      state.listeners.add(listener);
      
      if (localValue !== state.value) {
        setLocalValue(state.value);
      }

      return () => {
        state.listeners.delete(listener);
      };
    }, [state, localValue]);

    const setValue = useCallback(
      (value: T | ((prev: T) => T)) => {
        const newValue = value instanceof Function ? value(state.value) : value;
        
        state.value = newValue;
        
        state.listeners.forEach((listener) => {
          listener(newValue);
        });
        
        setLocalValue(newValue);
      },
      [state]
    );

    return [localValue, setValue];
  };
}
