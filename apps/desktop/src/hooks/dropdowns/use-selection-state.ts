import { useMemo, useCallback } from 'react';

export interface SelectionStateOptions<T> {
  items: T[];
  selected: T[];
  getKey: (item: T) => string | number;
  isEqual?: (a: T, b: T) => boolean;
}

export function useSelectionState<T>({
  items,
  selected,
  getKey,
  isEqual,
}: SelectionStateOptions<T>) {
  const allSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) =>
      selected.some((sel) =>
        isEqual ? isEqual(item, sel) : getKey(item) === getKey(sel)
      )
    );
  }, [items, selected, getKey, isEqual]);

  const someSelected = useMemo(() => {
    return (
      selected.length > 0 &&
      items.some((item) =>
        selected.some((sel) =>
          isEqual ? isEqual(item, sel) : getKey(item) === getKey(sel)
        )
      ) &&
      !allSelected
    );
  }, [items, selected, getKey, isEqual, allSelected]);

  const toggle = useCallback(
    (item: T): T[] => {
      const isSelected = selected.some((sel) =>
        isEqual ? isEqual(item, sel) : getKey(item) === getKey(sel)
      );
      return isSelected
        ? selected.filter((sel) =>
            isEqual ? !isEqual(item, sel) : getKey(item) !== getKey(sel)
          )
        : [...selected, item];
    },
    [selected, getKey, isEqual]
  );

  const selectAll = useCallback((): T[] => {
    return [...items];
  }, [items]);

  const selectOnly = useCallback(
    (item: T): T[] => {
      return [item];
    },
    []
  );

  const deselectAll = useCallback((): T[] => {
    return [];
  }, []);

  return {
    allSelected,
    someSelected,
    toggle,
    selectAll,
    selectOnly,
    deselectAll,
  };
}

