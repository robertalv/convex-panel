/**
 * Runtime CSS injection utility for Convex Panel
 * 
 * This utility ensures CSS is injected only once per page load,
 * preventing CSS from being bundled into the parent app.
 */

const STYLE_ID = 'convex-panel-styles';

/**
 * Injects CSS styles into the document head if not already present
 * @param css - CSS string to inject
 */
export function injectPanelStyles(css: string): void {
  // Only run in browser environment
  if (typeof document === 'undefined') {
    return;
  }

  // Check if styles are already injected
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  // Create style element
  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = css;

  // Append to head
  document.head.appendChild(styleElement);
}

/**
 * Removes injected CSS styles from the document
 */
export function removePanelStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const styleElement = document.getElementById(STYLE_ID);
  if (styleElement) {
    styleElement.remove();
  }
}

