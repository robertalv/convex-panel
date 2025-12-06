import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to find and track a container element in the DOM.
 * Handles Shadow DOM, regular DOM, and parent traversal with retry logic.
 * 
 * @param selector - CSS selector for the container element (default: '.cp-main-content')
 * @returns A tuple of [refCallback, containerElement]
 */
export function useContainerRef(selector: string = '.cp-main-content'): [
  (node: HTMLDivElement | null) => void,
  HTMLElement | null
] {
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const timeoutRefs = useRef<number[]>([]);

  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    // Clear any existing timeouts
    timeoutRefs.current.forEach(id => clearTimeout(id));
    timeoutRefs.current = [];
    
    if (!node) {
      setContainerRef(null);
      return;
    }
    
    const rootNode = node.getRootNode();
    
    const findAndSetContainer = () => {
      // Try ShadowRoot first
      if (rootNode instanceof ShadowRoot) {
        try {
          const mainContent = rootNode.querySelector(selector) as HTMLElement;
          if (mainContent) {
            setContainerRef(mainContent);
            return true;
          }
        } catch (e) {
          // querySelector might fail in some contexts
        }
      }
      
      // Try Document
      if (rootNode instanceof Document) {
        try {
          const mainContent = rootNode.querySelector(selector) as HTMLElement;
          if (mainContent) {
            setContainerRef(mainContent);
            return true;
          }
        } catch (e) {
          // querySelector might fail in some contexts
        }
      }
      
      // Traverse up the DOM tree
      let element: HTMLElement | null = node;
      let depth = 0;
      const maxDepth = 20;
      
      while (element && depth < maxDepth) {
        if (element.classList?.contains(selector.replace('.', ''))) {
          setContainerRef(element);
          return true;
        }
        element = element.parentElement;
        depth++;
      }
      
      return false;
    };
    
    // Try immediately
    if (findAndSetContainer()) {
      return;
    }
    
    // If not found, retry with delays to handle async DOM updates
    timeoutRefs.current.push(
      window.setTimeout(findAndSetContainer, 50),
      window.setTimeout(findAndSetContainer, 200),
      window.setTimeout(findAndSetContainer, 500)
    );
  }, [selector]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(id => clearTimeout(id));
      timeoutRefs.current = [];
    };
  }, []);

  return [containerRefCallback, containerRef];
}
