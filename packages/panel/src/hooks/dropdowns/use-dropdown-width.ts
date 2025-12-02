import { useEffect, useState, useRef, useMemo } from 'react';

export interface WidthMeasurementConfig {
  fontSize?: string;
  fontFamily?: string;
  paddingLeft?: number;
  paddingRight?: number;
  checkboxWidth?: number;
  iconWidth?: number;
  gap?: number;
  searchPlaceholder?: string;
  minWidth?: number;
  viewportPadding?: number;
}

const DEFAULT_CONFIG: Required<WidthMeasurementConfig> = {
  fontSize: '12px',
  fontFamily: 'inherit',
  paddingLeft: 12,
  paddingRight: 12,
  checkboxWidth: 16,
  iconWidth: 14,
  gap: 8,
  searchPlaceholder: 'Search...',
  minWidth: 200,
  viewportPadding: 16,
};

export function useDropdownWidth<T>(
  triggerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  options: T[],
  getText: (option: T) => string,
  config?: WidthMeasurementConfig
): number | undefined {
  const [width, setWidth] = useState<number | undefined>(undefined);
  const cacheRef = useRef<Map<number, number>>(new Map());
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || options.length === 0) {
      setWidth(undefined);
      return;
    }

    // Check cache first
    const cacheKey = options.length;
    const cachedWidth = cacheRef.current.get(cacheKey);
    if (cachedWidth !== undefined) {
      setWidth(cachedWidth);
      return;
    }

    // Get trigger dimensions
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const triggerWidth = triggerRect.width;
    const triggerLeft = triggerRect.left;
    const viewportWidth = window.innerWidth;
    const availableWidth = viewportWidth - triggerLeft - mergedConfig.viewportPadding;

    // Create temporary element for measurement
    const tempElement = document.createElement('span');
    tempElement.style.visibility = 'hidden';
    tempElement.style.position = 'absolute';
    tempElement.style.fontSize = mergedConfig.fontSize;
    tempElement.style.fontFamily = mergedConfig.fontFamily;
    tempElement.style.whiteSpace = 'nowrap';
    document.body.appendChild(tempElement);

    let maxContentWidth = 0;

    // Measure all option texts
    options.forEach((option) => {
      const text = getText(option);
      tempElement.textContent = text;
      const textWidth = tempElement.getBoundingClientRect().width;
      // Calculate total width: text + padding + checkbox + icon + gaps
      const totalWidth =
        textWidth +
        mergedConfig.paddingLeft +
        mergedConfig.paddingRight +
        mergedConfig.checkboxWidth +
        mergedConfig.iconWidth +
        mergedConfig.gap * 2;
      maxContentWidth = Math.max(maxContentWidth, totalWidth);
    });

    // Measure search placeholder
    tempElement.textContent = mergedConfig.searchPlaceholder;
    const searchWidth =
      tempElement.getBoundingClientRect().width + 28 + mergedConfig.gap * 2; // 28px for icon + padding
    maxContentWidth = Math.max(maxContentWidth, searchWidth);

    document.body.removeChild(tempElement);

    // Calculate desired width
    const desiredWidth = Math.max(triggerWidth, maxContentWidth, mergedConfig.minWidth);
    const constrainedWidth = Math.min(desiredWidth, availableWidth);

    // Cache the result
    cacheRef.current.set(cacheKey, constrainedWidth);
    setWidth(constrainedWidth);
  }, [isOpen, triggerRef, options.length, getText, mergedConfig]);

  return width;
}

