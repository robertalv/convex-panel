/**
 * Auto-generated file containing CSS styles for runtime injection.
 * This file is generated from dist/index.css during the build process.
 * DO NOT EDIT MANUALLY - run 'npm run build:styles-ts' to regenerate.
 */

export const panelStyles = `/*! tailwindcss v4.1.17 | MIT License | https://tailwindcss.com */
@layer properties;
.collapse {
  visibility: collapse;
}
.visible {
  visibility: visible;
}
.absolute {
  position: absolute;
}
.fixed {
  position: fixed;
}
.relative {
  position: relative;
}
.static {
  position: static;
}
.sticky {
  position: sticky;
}
.isolate {
  isolation: isolate;
}
.container {
  width: 100%;
}
.mx-auto {
  margin-inline: auto;
}
.block {
  display: block;
}
.contents {
  display: contents;
}
.flex {
  display: flex;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
.inline {
  display: inline;
}
.inline-block {
  display: inline-block;
}
.inline-flex {
  display: inline-flex;
}
.table {
  display: table;
}
.w-full {
  width: 100%;
}
.flex-shrink {
  flex-shrink: 1;
}
.shrink {
  flex-shrink: 1;
}
.border-collapse {
  border-collapse: collapse;
}
.transform {
  transform: var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,);
}
.resize {
  resize: both;
}
.items-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}
.border {
  border-style: var(--tw-border-style);
  border-width: 1px;
}
.text-center {
  text-align: center;
}
.break-all {
  word-break: break-all;
}
.capitalize {
  text-transform: capitalize;
}
.lowercase {
  text-transform: lowercase;
}
.uppercase {
  text-transform: uppercase;
}
.italic {
  font-style: italic;
}
.underline {
  text-decoration-line: underline;
}
.outline {
  outline-style: var(--tw-outline-style);
  outline-width: 1px;
}
.filter {
  filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
}
.transition {
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, backdrop-filter, display, content-visibility, overlay, pointer-events;
  transition-timing-function: var(--tw-ease, ease);
  transition-duration: var(--tw-duration, 0s);
}
.transition-colors {
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, ease);
  transition-duration: var(--tw-duration, 0s);
}
.cp-theme-dark {
  --color-panel-bg: #0F1115;
  --color-panel-bg-secondary: #16181D;
  --color-panel-bg-tertiary: #1C1F26;
  --color-panel-border: #2D313A;
  --color-panel-text: #ffffff;
  --color-panel-text-secondary: #9ca3af;
  --color-panel-text-muted: #6b7280;
  --color-panel-accent: #34D399;
  --color-panel-accent-hover: #26a878;
  --color-panel-success: #10b981;
  --color-panel-warning: #f59e0b;
  --color-panel-error: #ef4444;
  --color-panel-info: #3b82f6;
  --color-panel-httpaction: #8b5cf6;
  --color-panel-hover: rgba(255, 255, 255, 0.05);
  --color-panel-active: rgba(255, 255, 255, 0.1);
  --color-panel-shadow: rgba(0, 0, 0, 0.5);
  --color-panel-code-bg: #1a1d24;
  --color-panel-scrollbar: #3f4451;
  --color-panel-scrollbar-hover: #5c6370;
  --cp-data-header-bg: var(--color-panel-bg-secondary);
  --cp-data-header-text: var(--color-panel-text-secondary);
  --cp-data-header-border: var(--color-panel-border);
  --cp-data-row-border: var(--color-panel-border);
  --cp-data-row-hover-bg: rgba(255, 255, 255, 0.04);
  --cp-data-row-selected-bg: rgba(255, 255, 255, 0.08);
  --cp-data-cell-hover-bg: rgba(255, 255, 255, 0.06);
  --cp-data-highlight-bg: rgba(52, 211, 153, 0.16);
  --cp-data-highlight-border: rgba(52, 211, 153, 0.45);
  --cp-data-menu-bg: var(--color-panel-bg-tertiary);
  --cp-data-menu-border: var(--color-panel-border);
  --cp-data-resize-indicator: var(--color-panel-success);
}
.cp-theme-light {
  --color-panel-bg: #ffffff;
  --color-panel-bg-secondary: #f9fafb;
  --color-panel-bg-tertiary: #f3f4f6;
  --color-panel-border: #e5e7eb;
  --color-panel-text: #111827;
  --color-panel-text-secondary: #6b7280;
  --color-panel-text-muted: #9ca3af;
  --color-panel-accent: #34D399;
  --color-panel-accent-hover: #26a878;
  --color-panel-success: #059669;
  --color-panel-warning: #d97706;
  --color-panel-error: #dc2626;
  --color-panel-info: #2563eb;
  --color-panel-httpaction: #7c3aed;
  --color-panel-hover: rgba(0, 0, 0, 0.05);
  --color-panel-active: rgba(0, 0, 0, 0.1);
  --color-panel-shadow: rgba(0, 0, 0, 0.12);
  --color-panel-code-bg: #f9fafb;
  --color-panel-scrollbar: #d1d5db;
  --color-panel-scrollbar-hover: #9ca3af;
  --cp-data-header-bg: var(--color-panel-bg);
  --cp-data-header-text: var(--color-panel-text-secondary);
  --cp-data-header-border: var(--color-panel-border);
  --cp-data-row-border: var(--color-panel-border);
  --cp-data-row-hover-bg: rgba(15, 23, 42, 0.05);
  --cp-data-row-selected-bg: rgba(15, 23, 42, 0.09);
  --cp-data-cell-hover-bg: rgba(15, 23, 42, 0.08);
  --cp-data-highlight-bg: rgba(34, 197, 94, 0.2);
  --cp-data-highlight-border: rgba(34, 197, 94, 0.45);
  --cp-data-menu-bg: var(--color-panel-bg-tertiary);
  --cp-data-menu-border: var(--color-panel-border);
  --cp-data-resize-indicator: var(--color-panel-success);
}
@layer components {
  .cp-panel-container {
    background-color: var(--color-panel-bg);
    color: var(--color-panel-text);
    font-size: var(--font-size-panel-base);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  .cp-btn {
    padding: var(--spacing-panel-2) var(--spacing-panel-3);
    border-radius: var(--radius-panel-md);
    font-size: var(--font-size-panel-base);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .cp-btn-primary {
    background-color: var(--color-panel-accent);
    color: white;
    border: none;
  }
  .cp-btn-primary:hover {
    background-color: var(--color-panel-accent-hover);
  }
  .cp-btn-secondary {
    background-color: var(--color-panel-bg-tertiary);
    color: var(--color-panel-text);
    border: 1px solid var(--color-panel-border);
  }
  .cp-btn-secondary:hover {
    background-color: var(--color-panel-border);
  }
  .cp-input {
    width: 100%;
    padding: var(--spacing-panel-2) var(--spacing-panel-3);
    background-color: var(--color-panel-bg-secondary);
    border: 1px solid var(--color-panel-border);
    border-radius: var(--radius-panel-sm);
    font-size: var(--font-size-panel-base);
    color: var(--color-panel-text);
    outline: none;
  }
  .cp-input:focus {
    border-color: var(--color-panel-accent);
  }
  .cp-card {
    background-color: var(--color-panel-bg-secondary);
    border: 1px solid var(--color-panel-border);
    border-radius: var(--radius-panel-md);
    padding: var(--spacing-panel-4);
  }
  .cp-sidebar-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-panel-2);
    padding: var(--spacing-panel-2) var(--spacing-panel-3);
    border-radius: var(--radius-panel-sm);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .cp-sidebar-item:hover {
    background-color: var(--color-panel-bg-secondary);
  }
  .cp-sidebar-item-active {
    background-color: var(--color-panel-bg-tertiary);
    border-left: 2px solid var(--color-panel-accent);
  }
  .cp-badge {
    padding: 2px var(--spacing-panel-2);
    border-radius: var(--radius-panel-sm);
    font-size: var(--font-size-panel-xs);
    font-weight: 500;
    text-transform: uppercase;
  }
  .cp-badge-success {
    background-color: var(--color-panel-success);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-success) 20%, transparent);
    }
    color: var(--color-panel-success);
  }
  .cp-badge-warning {
    background-color: var(--color-panel-warning);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-warning) 20%, transparent);
    }
    color: var(--color-panel-warning);
  }
  .cp-badge-error {
    background-color: var(--color-panel-error);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-error) 20%, transparent);
    }
    color: var(--color-panel-error);
  }
  .cp-badge-query {
    font-size: 8px;
    width: -moz-fit-content;
    width: fit-content;
    border-radius: 6px;
    border: 1px solid var(--color-panel-info);
    padding: 2px 6px;
    background-color: var(--color-panel-info);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-info) 20%, transparent);
    }
    color: var(--color-panel-info);
  }
  .cp-badge-mutation {
    font-size: 8px;
    width: -moz-fit-content;
    width: fit-content;
    border-radius: 6px;
    border: 1px solid var(--color-panel-success);
    padding: 2px 6px;
    background-color: var(--color-panel-success);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-success) 20%, transparent);
    }
    color: var(--color-panel-success);
  }
  .cp-badge-action {
    font-size: 8px;
    width: -moz-fit-content;
    width: fit-content;
    border-radius: 6px;
    border: 1px solid var(--color-panel-warning);
    padding: 2px 6px;
    background-color: var(--color-panel-warning);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-warning) 20%, transparent);
    }
    color: var(--color-panel-warning);
  }
  .cp-badge-httpaction {
    font-size: 8px;
    width: -moz-fit-content;
    width: fit-content;
    border-radius: 6px;
    border: 1px solid var(--color-panel-httpaction);
    padding: 2px 6px;
    background-color: var(--color-panel-httpaction);
    @supports (color: color-mix(in lab, red, red)) {
      background-color: color-mix(in srgb, var(--color-panel-httpaction) 20%, transparent);
    }
    color: var(--color-panel-httpaction);
  }
  @keyframes highlight {
    0% {
      background-color: transparent;
    }
    50% {
      background-color: var(--cp-data-highlight-bg);
    }
    100% {
      background-color: transparent;
    }
  }
  @keyframes highlightBorder {
    0% {
      box-shadow: 0 0 0 0 transparent;
    }
    50% {
      box-shadow: 0 0 0 1px var(--cp-data-highlight-border);
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  .cp-data-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    color: var(--color-panel-text);
    font-size: 12px;
    font-family: 'Inter Variable', var(--font-display);
  }
  .cp-data-table__head {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .cp-data-table__header-row {
    border-bottom: 1px solid var(--cp-data-header-border);
    color: var(--cp-data-header-text);
    background-color: var(--cp-data-header-bg);
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cp-data-table__header-cell {
    position: relative;
    padding: 8px 12px;
    border-right: 1px solid var(--cp-data-header-border);
    -webkit-user-select: none;
       -moz-user-select: none;
            user-select: none;
    cursor: default;
    background-color: inherit;
    transition: background-color 0.2s ease;
  }
  .cp-data-table__header-cell--dragging {
    background-color: var(--color-panel-active);
  }
  .cp-data-table__header-cell .cp-data-table__drag-handle {
    position: absolute;
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    cursor: grab;
    width: 18px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
  }
  .cp-data-table__resize-area {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 8px;
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cp-data-table__resize-indicator {
    width: 2px;
    height: 70%;
    border-radius: 999px;
    transition: background-color 0.15s ease, box-shadow 0.15s ease;
  }
  .cp-data-table__resize-indicator.is-active {
    background-color: var(--cp-data-resize-indicator);
    box-shadow: 0 0 8px var(--cp-data-resize-indicator);
    @supports (color: color-mix(in lab, red, red)) {
      box-shadow: 0 0 8px color-mix(in srgb, var(--cp-data-resize-indicator) 70%, transparent);
    }
  }
  .cp-data-table__drag-target {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: 3px;
    border-radius: 999px;
    background: var(--cp-data-highlight-border);
    box-shadow: 0 0 12px var(--cp-data-highlight-border);
    @supports (color: color-mix(in lab, red, red)) {
      box-shadow: 0 0 12px color-mix(in srgb, var(--cp-data-highlight-border) 70%, transparent);
    }
    pointer-events: none;
  }
  .cp-data-table__row {
    border-bottom: 1px solid var(--cp-data-row-border);
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
  }
  .cp-data-table__row:hover {
    background-color: var(--cp-data-row-hover-bg);
  }
  .cp-data-table__row--selected {
    background-color: var(--cp-data-row-selected-bg);
  }
  .cp-data-table__row--new {
    background-color: var(--cp-data-highlight-bg);
    box-shadow: 0 0 0 1px var(--cp-data-highlight-border);
    animation: highlight 1s ease, highlightBorder 1s ease;
  }
  .cp-data-table__selection-cell {
    padding: 0;
    text-align: center;
    width: 40px;
    min-width: 40px;
    max-width: 40px;
    position: sticky;
    left: 0;
    background-color: var(--color-panel-bg);
    z-index: 11;
  }
  .cp-data-table__selection-cell-inner {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 1px solid var(--cp-data-row-border);
  }
  .cp-data-table__cell {
    padding: 0;
    border-right: 1px solid var(--cp-data-row-border);
    transition: background-color 0.3s ease;
  }
  .cp-data-table__cell--hovered {
    background-color: var(--cp-data-cell-hover-bg);
  }
  .cp-data-table__cell--menu-open {
    background-color: var(--color-panel-active);
  }
  .cp-data-table__cell--highlighted {
    background-color: var(--cp-data-highlight-bg);
  }
  .cp-data-table__cell--editing {
    background-color: var(--color-panel-bg-secondary);
  }
  .cp-data-table__cell-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    gap: 8px;
    cursor: pointer;
  }
  .cp-data-table__cell-value {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }
  .cp-data-table__cell-value span {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cp-data-table__cell-menu-trigger {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid var(--cp-data-menu-border);
    background-color: var(--cp-data-menu-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-panel-text);
  }
  .cp-data-table__trailing-cell {
    padding: 8px;
    border-right: 1px solid var(--cp-data-row-border);
  }
  .cp-bottom-sheet,
.cp-bottom-sheet div,
.cp-bottom-sheet section,
.cp-bottom-sheet article,
.cp-bottom-sheet aside,
.cp-bottom-sheet main,
.cp-bottom-sheet ul,
.cp-bottom-sheet ol {
    scrollbar-width: thin;
    scrollbar-color: var(--color-panel-scrollbar) var(--color-panel-bg);
  }
  .cp-bottom-sheet ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .cp-bottom-sheet ::-webkit-scrollbar-track {
    background-color: var(--color-panel-bg);
    border-radius: 4px;
  }
  .cp-bottom-sheet ::-webkit-scrollbar-thumb {
    background-color: var(--color-panel-scrollbar);
    border-radius: 4px;
    border: 2px solid var(--color-panel-bg);
    -webkit-transition: background-color 0.2s ease;
    transition: background-color 0.2s ease;
  }
  .cp-bottom-sheet ::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-panel-scrollbar-hover);
  }
  .cp-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .cp-scrollbar::-webkit-scrollbar-track {
    background-color: var(--color-panel-bg);
    border-radius: 4px;
  }
  .cp-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--color-panel-scrollbar);
    border-radius: 4px;
    border: 2px solid var(--color-panel-bg);
    -webkit-transition: background-color 0.2s ease;
    transition: background-color 0.2s ease;
  }
  .cp-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-panel-scrollbar-hover);
  }
  .cp-theme-dark [data-sonner-toaster],
.cp-theme-light [data-sonner-toaster],
.cp-bottom-sheet [data-sonner-toaster] {
    --normal-bg: var(--color-panel-bg-tertiary);
    --normal-border: var(--color-panel-border);
    --normal-text: var(--color-panel-text);
    --success-bg: var(--color-panel-bg-tertiary);
    --success-border: var(--color-panel-success);
    --success-text: var(--color-panel-text);
    --error-bg: var(--color-panel-bg-tertiary);
    --error-border: var(--color-panel-error);
    --error-text: var(--color-panel-text);
    --warning-bg: var(--color-panel-bg-tertiary);
    --warning-border: var(--color-panel-warning);
    --warning-text: var(--color-panel-text);
    --info-bg: var(--color-panel-bg-tertiary);
    --info-border: var(--color-panel-accent);
    --info-text: var(--color-panel-text);
  }
  .cp-theme-dark [data-sonner-toast],
.cp-theme-light [data-sonner-toast],
.cp-bottom-sheet [data-sonner-toast] {
    background-color: var(--normal-bg) !important;
    border: 1px solid var(--normal-border) !important;
    color: var(--normal-text) !important;
    box-shadow: 0 4px 16px var(--color-panel-shadow) !important;
    border-radius: 8px !important;
  }
  .cp-theme-dark [data-sonner-toast][data-type="success"],
.cp-theme-light [data-sonner-toast][data-type="success"],
.cp-bottom-sheet [data-sonner-toast][data-type="success"] {
    background-color: var(--success-bg) !important;
    border-color: var(--success-border) !important;
    color: var(--success-text) !important;
  }
  .cp-theme-dark [data-sonner-toast][data-type="error"],
.cp-theme-light [data-sonner-toast][data-type="error"],
.cp-bottom-sheet [data-sonner-toast][data-type="error"] {
    background-color: var(--error-bg) !important;
    border-color: var(--error-border) !important;
    color: var(--error-text) !important;
  }
  .cp-theme-dark [data-sonner-toast][data-type="warning"],
.cp-theme-light [data-sonner-toast][data-type="warning"],
.cp-bottom-sheet [data-sonner-toast][data-type="warning"] {
    background-color: var(--warning-bg) !important;
    border-color: var(--warning-border) !important;
    color: var(--warning-text) !important;
  }
  .cp-theme-dark [data-sonner-toast][data-type="info"],
.cp-theme-light [data-sonner-toast][data-type="info"],
.cp-bottom-sheet [data-sonner-toast][data-type="info"] {
    background-color: var(--info-bg) !important;
    border-color: var(--info-border) !important;
    color: var(--info-text) !important;
  }
  .cp-bottom-sheet {
    contain: style layout paint size;
    isolation: isolate;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-panel-text);
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--color-panel-bg);
    border-top: 1px solid var(--color-panel-border);
    display: flex;
    flex-direction: column;
    z-index: 99998;
    box-shadow: 0 -4px 6px -1px var(--color-panel-shadow);
    pointer-events: auto;
    outline: none;
    text-align: left;
    text-decoration: none;
    text-transform: none;
    letter-spacing: normal;
    word-spacing: normal;
    white-space: normal;
    direction: ltr;
  }
  .cp-header {
    height: 40px;
    min-height: 40px;
    border-bottom: 1px solid var(--color-panel-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background-color: var(--color-panel-bg-secondary);
    flex-shrink: 0;
  }
  .cp-header-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cp-icon-btn {
    padding: 4px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--color-panel-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease;
  }
  .cp-icon-btn:hover {
    color: var(--color-panel-text);
  }
  .cp-support-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-panel-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    transition: color 0.15s ease;
  }
  .cp-support-btn:hover {
    color: var(--color-panel-text);
  }
  .cp-run-function-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 8px;
    border: none;
    background: var(--color-panel-accent);
    color: var(--color-panel-bg);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px var(--color-panel-accent);
    @supports (color: color-mix(in lab, red, red)) {
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-panel-accent) 20%, transparent);
    }
  }
  .cp-run-function-btn:hover {
    background: var(--color-panel-accent-hover);
  }
  .cp-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 8px;
    border: none;
    background: var(--color-panel-accent);
    color: var(--color-panel-bg);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px var(--color-panel-accent);
    @supports (color: color-mix(in lab, red, red)) {
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-panel-accent) 20%, transparent);
    }
  }
  .cp-btn:hover {
    background: var(--color-panel-accent-hover);
  }
  .cp-upgrade-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 8px;
    border: none;
    background: var(--color-panel-accent);
    color: var(--color-panel-bg);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px var(--color-panel-accent);
    @supports (color: color-mix(in lab, red, red)) {
      box-shadow: 0 2px 8px color-mix(in srgb, var(--color-panel-accent) 20%, transparent);
    }
  }
  .cp-upgrade-btn:hover {
    background: var(--color-panel-accent-hover);
  }
  .cp-ask-ai-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-panel-text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;
    padding: 0;
  }
  .cp-ask-ai-btn:hover {
    color: var(--color-panel-text);
  }
  .cp-theme-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--color-panel-text-secondary);
    cursor: pointer;
    transition: color 0.15s ease, background-color 0.15s ease;
  }
  .cp-theme-toggle-btn:hover {
    color: var(--color-panel-text);
    background-color: var(--color-panel-hover);
  }
  .cp-connect-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 8px;
    background-color: var(--color-panel-accent);
    border: none;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .cp-connect-btn:hover {
    background-color: var(--color-panel-accent-hover);
  }
  .cp-resize-handle {
    height: 8px;
    cursor: ns-resize;
    background-color: transparent;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }
  .cp-sidebar {
    width: 48px;
    border-right: 1px solid var(--color-panel-border);
    background-color: var(--color-panel-bg-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 0;
    gap: 8px;
    flex-shrink: 0;
  }
  .cp-sidebar-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
  }
  .cp-sidebar-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: auto;
    padding-top: 4px;
  }
  .cp-sidebar-item-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .cp-sidebar-btn {
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
    background-color: transparent;
    color: var(--color-panel-text-secondary);
  }
  .cp-sidebar-btn:hover {
    color: var(--color-panel-text);
    background-color: var(--color-panel-hover);
  }
  .cp-sidebar-btn.active {
    background-color: var(--color-panel-bg-tertiary);
    color: var(--color-panel-text);
  }
  .cp-sidebar-active-indicator {
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    border-radius: 999px;
    background: #34D399;
  }
  .cp-tooltip {
    position: absolute;
    left: 48px;
    padding: 4px 8px;
    background-color: var(--color-panel-bg-tertiary);
    border: 1px solid var(--color-panel-border);
    color: var(--color-panel-text);
    font-size: 12px;
    border-radius: 4px;
    pointer-events: none;
    white-space: nowrap;
    z-index: 50;
    box-shadow: 0 4px 6px -1px var(--color-panel-shadow);
  }
  .cp-separator {
    width: 1px;
    height: 16px;
    background-color: var(--color-panel-border);
  }
  .cp-main-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: var(--color-panel-bg);
  }
  .cp-floating-btn-wrapper {
    position: absolute;
    bottom: 24px;
    right: 24px;
    z-index: 10;
  }
  .cp-floating-btn {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: var(--color-panel-bg-tertiary);
    border: 1px solid var(--color-panel-border);
    color: var(--color-panel-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-family: serif;
    font-style: italic;
    font-weight: bold;
    transition: all 0.2s;
    box-shadow: 0 4px 12px var(--color-panel-shadow);
    opacity: 0.9;
  }
  .cp-floating-btn:hover {
    background-color: var(--color-panel-active);
    opacity: 1;
    transform: scale(1.05);
    color: var(--color-panel-accent);
    border-color: var(--color-panel-accent);
  }
  .cp-function-runner .monaco-editor textarea.ime-text-area {
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    opacity: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: transparent !important;
    color: transparent !important;
    resize: none !important;
    pointer-events: none !important;
  }
  .cp-function-runner .monaco-editor .native-edit-context {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 0 !important;
    height: 0 !important;
    opacity: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: transparent !important;
    color: transparent !important;
    overflow: hidden !important;
    pointer-events: none !important;
  }
}
@layer utilities {
  .cp-flex {
    display: flex;
  }
  .cp-flex-1 {
    flex: 1;
  }
  .cp-flex-col {
    flex-direction: column;
  }
  .cp-flex-row {
    flex-direction: row;
  }
  .cp-items-center {
    align-items: center;
  }
  .cp-justify-center {
    justify-content: center;
  }
  .cp-justify-between {
    justify-content: space-between;
  }
  .cp-gap-1 {
    gap: 4px;
  }
  .cp-gap-2 {
    gap: 8px;
  }
  .cp-gap-3 {
    gap: 12px;
  }
  .cp-gap-4 {
    gap: 16px;
  }
  .cp-shrink-0 {
    flex-shrink: 0;
  }
  .cp-overflow-hidden {
    overflow: hidden;
  }
  .cp-overflow-auto {
    overflow: auto;
  }
  .cp-w-full {
    width: 100%;
  }
  .cp-h-full {
    height: 100%;
  }
  .cp-min-h-0 {
    min-height: 0;
  }
  .cp-p-2 {
    padding: 8px;
  }
  .cp-p-3 {
    padding: 12px;
  }
  .cp-p-4 {
    padding: 16px;
  }
  .cp-px-2 {
    padding-left: 8px;
    padding-right: 8px;
  }
  .cp-px-3 {
    padding-left: 12px;
    padding-right: 12px;
  }
  .cp-px-4 {
    padding-left: 16px;
    padding-right: 16px;
  }
  .cp-py-2 {
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .cp-py-3 {
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .cp-mb-2 {
    margin-bottom: 8px;
  }
  .cp-mb-4 {
    margin-bottom: 16px;
  }
  .cp-text-xs {
    font-size: 10px;
  }
  .cp-text-sm {
    font-size: 11px;
  }
  .cp-text-base {
    font-size: 12px;
  }
  .cp-text-md {
    font-size: 14px;
  }
  .cp-text-lg {
    font-size: 16px;
  }
  .cp-font-medium {
    font-weight: 500;
  }
  .cp-font-semibold {
    font-weight: 600;
  }
  .cp-font-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .cp-uppercase {
    text-transform: uppercase;
  }
  .cp-tracking-wide {
    letter-spacing: 0.05em;
  }
  .cp-text-white {
    color: #fff;
  }
  .cp-text-muted {
    color: var(--color-panel-text-muted);
  }
  .cp-text-secondary {
    color: var(--color-panel-text-secondary);
  }
  .cp-text-success {
    color: var(--color-panel-success);
  }
  .cp-text-error {
    color: var(--color-panel-error);
  }
  .cp-text-warning {
    color: var(--color-panel-warning);
  }
  .cp-bg-primary {
    background-color: var(--color-panel-bg);
  }
  .cp-bg-secondary {
    background-color: var(--color-panel-bg-secondary);
  }
  .cp-bg-tertiary {
    background-color: var(--color-panel-bg-tertiary);
  }
  .cp-bg-accent {
    background-color: var(--color-panel-accent);
  }
  .cp-border {
    border: 1px solid var(--color-panel-border);
  }
  .cp-border-b {
    border-bottom: 1px solid var(--color-panel-border);
  }
  .cp-border-r {
    border-right: 1px solid var(--color-panel-border);
  }
  .cp-rounded {
    border-radius: 4px;
  }
  .cp-rounded-md {
    border-radius: 6px;
  }
  .cp-rounded-lg {
    border-radius: 8px;
  }
  .cp-cursor-pointer {
    cursor: pointer;
  }
  .cp-transition {
    transition: all 0.15s ease;
  }
  .cp-transition-colors {
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
}
.cp-search-wrapper {
  position: relative;
  width: 100%;
}
.cp-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--color-panel-text-muted);
  pointer-events: none;
  z-index: 1;
}
.cp-search-input {
  width: 100%;
  background-color: var(--color-panel-bg-secondary);
  border: 1px solid var(--color-panel-border);
  border-radius: 8px;
  height: 32px;
  padding-left: 32px;
  padding-right: 12px;
  font-size: 12px;
  color: var(--color-panel-text);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.cp-search-input:focus {
  border-color: var(--color-panel-accent);
  background-color: var(--color-panel-bg-tertiary);
}
.cp-functions-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.cp-functions-sidebar {
  width: 300px;
  border-right: 1px solid var(--color-panel-border);
  background-color: var(--color-panel-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.cp-functions-search {
  padding: 12px;
  border-bottom: 1px solid var(--color-panel-border);
}
.cp-functions-search-input {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--color-panel-bg-secondary);
  border: 1px solid var(--color-panel-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-panel-text);
  outline: none;
}
.cp-functions-search-input:focus {
  border-color: var(--color-panel-accent);
}
.cp-functions-list {
  flex: 1;
  overflow: auto;
  padding: 8px;
}
.cp-functions-loading,
.cp-functions-empty {
  padding: 16px;
  color: var(--color-panel-text-secondary);
  font-size: 12px;
}
.cp-functions-group {
  margin-bottom: 8px;
}
.cp-functions-group-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-panel-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background-color 0.15s ease;
}
.cp-functions-group-header:hover {
  background-color: var(--color-panel-bg-secondary);
}
.cp-functions-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--color-panel-text-secondary);
  background-color: transparent;
  border: 1px solid transparent;
  transition: background-color 0.15s ease;
}
.cp-functions-item:hover {
  background-color: var(--color-panel-bg-secondary);
}
.cp-functions-item.selected {
  color: var(--color-panel-text);
  background-color: var(--color-panel-active);
  border: 1px solid var(--color-panel-accent);
}
.cp-functions-item-type {
  font-size: 10px;
  color: var(--color-panel-text-muted);
  margin-top: 2px;
}
.cp-functions-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-panel-bg);
}
.cp-functions-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cp-functions-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-panel-text);
  margin: 0;
  margin-bottom: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.cp-functions-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--color-panel-bg-tertiary);
  color: var(--color-panel-text-secondary);
  text-transform: uppercase;
}
.cp-functions-run-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--color-panel-accent);
  border: none;
  border-radius: 6px;
  color: var(--color-panel-bg);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.cp-functions-run-btn:hover {
  background-color: var(--color-panel-accent-hover);
}
.cp-functions-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
.cp-functions-details-section {
  margin-bottom: 16px;
}
.cp-functions-details-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-panel-text-secondary);
  margin-bottom: 8px;
}
.cp-functions-details-card {
  background-color: var(--color-panel-bg-secondary);
  border: 1px solid var(--color-panel-border);
  border-radius: 6px;
  padding: 12px;
}
.cp-functions-details-text {
  font-size: 12px;
  color: var(--color-panel-text-secondary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.cp-functions-details-row {
  margin-bottom: 8px;
}
.cp-functions-details-label {
  color: var(--color-panel-text-secondary);
}
.cp-functions-code-block {
  margin: 4px 0 0 0;
  padding: 8px;
  background-color: var(--color-panel-bg);
  border-radius: 4px;
  overflow: auto;
}
.cp-functions-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  color: var(--color-panel-text-secondary);
}
.cp-functions-empty-icon {
  opacity: 0.5;
}
.cp-functions-empty-text {
  font-size: 14px;
}
.cp-functions-empty-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: var(--color-panel-bg-tertiary);
  border: 1px solid var(--color-panel-border);
  border-radius: 6px;
  color: var(--color-panel-text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.cp-functions-empty-btn:hover {
  background-color: var(--color-panel-border);
}
.cp-health-container {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-panel-bg);
}
.cp-health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.cp-health-disabled {
  opacity: 0.5;
  pointer-events: none;
  filter: grayscale(100%);
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.cp-health-coming-soon {
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 3px;
}
.cp-health-coming-soon-desc {
  font-size: 11px;
  color: #4b5563;
}
.cp-data-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.cp-data-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-panel-bg);
  min-width: 0;
  overflow: hidden;
}
.cp-logs-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-panel-bg);
}
.cp-logs-header {
  height: 48px;
  border-bottom: 1px solid var(--color-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.cp-logs-header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-panel-text);
}
.cp-logs-header-buttons {
  display: flex;
  gap: 8px;
}
.cp-logs-header-button {
  padding: 6px 12px;
  border: 1px solid var(--color-panel-border);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-panel-text-secondary);
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.cp-logs-header-button:hover {
  background-color: var(--color-panel-bg-tertiary);
}
.cp-logs-search {
  padding: 8px;
  border-bottom: 1px solid var(--color-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-panel-bg);
}
.cp-logs-table {
  flex: 1;
  overflow: auto;
  background-color: var(--color-panel-bg);
  font-family: monospace;
  font-size: 12px;
}
.cp-logs-table-header {
  display: flex;
  border-bottom: 1px solid var(--color-panel-border);
  color: var(--color-panel-text-muted);
  padding: 4px 16px;
  position: sticky;
  top: 0;
  background-color: var(--color-panel-bg);
}
.cp-logs-table-header-cell {
  font-size: 12px;
  font-weight: 500;
}
.cp-logs-pause-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  background-color: var(--color-panel-bg-tertiary);
  border: 1px solid var(--color-panel-border);
  color: var(--color-panel-text-secondary);
  cursor: pointer;
  margin-right: -16px;
}
.cp-logs-pause-btn:hover {
  background-color: var(--color-panel-accent);
  color: #fff;
}
.cp-logs-pause-btn-paused {
  background-color: var(--color-panel-accent);
  color: #fff;
  border: none;
}
.cp-logs-pause-btn-paused:hover {
  background-color: var(--color-panel-accent-hover);
}
.cp-logs-loading,
.cp-logs-error,
.cp-logs-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}
.cp-logs-loading-text {
  color: var(--color-panel-text-muted);
  font-size: 14px;
}
.cp-logs-error-text {
  color: var(--color-panel-error);
  font-size: 14px;
}
.cp-logs-empty-text {
  color: var(--color-panel-text-muted);
  font-size: 14px;
}
.cp-logs-row {
  display: flex;
  padding: 4px 16px;
  cursor: default;
  border-bottom: 1px solid var(--color-panel-border);
}
.cp-logs-row:hover {
  background-color: var(--color-panel-bg-tertiary);
}
.cp-logs-timestamp {
  width: 160px;
  color: var(--color-panel-text-secondary);
}
.cp-logs-id {
  width: 80px;
  color: var(--color-panel-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
.cp-logs-id-badge {
  border: 1px solid var(--color-panel-border);
  border-radius: 2px;
  padding: 0 4px;
  font-size: 10px;
}
.cp-logs-status {
  width: 128px;
  color: var(--color-panel-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.cp-logs-execution-time {
  color: var(--color-panel-text-muted);
}
.cp-logs-function {
  flex: 1;
  color: var(--color-panel-text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.cp-logs-logtype {
  width: 16px;
  text-align: center;
  font-weight: bold;
  font-size: 10px;
}
.cp-logs-function-path {
  color: var(--color-panel-text-muted);
}
.cp-logs-message {
  color: var(--color-panel-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 512px;
}
.cp-schedules-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-panel-bg);
}
.cp-schedules-header {
  height: 48px;
  border-bottom: 1px solid var(--color-panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.cp-schedules-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.cp-schedules-tabs {
  padding: 0 16px;
  border-bottom: 1px solid var(--color-panel-border);
  display: flex;
  gap: 24px;
  font-size: 14px;
}
.cp-schedules-tab {
  padding: 12px 0;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.2s;
  color: var(--color-panel-text-secondary);
  font-weight: 400;
}
.cp-schedules-tab.active {
  color: #fff;
  font-weight: 500;
  border-bottom-color: #fff;
}
.cp-schedules-filters {
  padding: 16px;
  border-bottom: 1px solid var(--color-panel-border);
  display: flex;
  gap: 8px;
}
.cp-schedules-cancel-btn {
  padding: 6px 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #f87171;
  cursor: pointer;
  transition: background-color 0.2s;
}
.cp-schedules-cancel-btn:hover {
  background-color: rgba(239, 68, 68, 0.2);
}
.cp-schedules-table-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-panel-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-panel-text-secondary);
}
.cp-schedules-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.cp-schedules-empty-icon {
  width: 48px;
  height: 48px;
  background-color: rgba(168, 85, 247, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.cp-schedules-empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 8px;
}
.cp-schedules-empty-desc {
  font-size: 14px;
  color: var(--color-panel-text-secondary);
  margin-bottom: 24px;
  max-width: 384px;
}
.cp-schedules-empty-link {
  font-size: 14px;
  color: #60a5fa;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cp-schedules-empty-link:hover {
  text-decoration: underline;
}
.cp-card {
  background-color: var(--color-panel-bg-secondary);
  border: 1px solid var(--color-panel-border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.cp-card-header {
  padding-left: 12px;
  padding-right: 12px;
  border-bottom: 1px solid var(--color-panel-border);
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: default;
}
.cp-card-title {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-panel-text-secondary);
  text-transform: uppercase;
}
.cp-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-panel-text-secondary);
}
.cp-card-content {
  padding: 12px;
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}
.cp-auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  height: 100%;
  background-color: var(--color-panel-bg);
}
.cp-auth-missing {
  text-align: center;
  color: var(--color-panel-text-secondary);
  font-size: 14px;
}
.cp-auth-missing-subtext {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-panel-text-muted);
}
.cp-auth-header {
  text-align: center;
  margin-bottom: 24px;
}
.cp-auth-title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}
.cp-auth-description {
  font-size: 14px;
  color: var(--color-panel-text-secondary);
}
.cp-auth-error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  color: #f87171;
  font-size: 13px;
}
.cp-auth-card {
  background-color: var(--color-panel-bg-secondary);
  border: 1px solid var(--color-panel-border);
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 16px;
}
.cp-auth-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}
.cp-auth-card-list {
  font-size: 13px;
  color: var(--color-panel-text-secondary);
  padding-left: 20px;
  margin: 0;
  line-height: 1.6;
}
.cp-auth-connect-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  margin-top: 16px;
  background-color: var(--color-panel-accent);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.cp-auth-connect-btn:hover:not(:disabled) {
  background-color: var(--color-panel-accent-hover);
}
.cp-auth-connect-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.cp-auth-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: cp-spin 0.8s linear infinite;
}
@keyframes cp-spin {
  to {
    transform: rotate(360deg);
  }
}
.cp-auth-security {
  background-color: var(--color-panel-bg-tertiary);
  border: 1px solid var(--color-panel-border);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  max-width: 400px;
}
.cp-auth-security-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-panel-text-secondary);
  margin-bottom: 8px;
}
.cp-auth-security-list {
  font-size: 12px;
  color: var(--color-panel-text-muted);
  padding-left: 16px;
  margin: 0;
  line-height: 1.5;
}
.cp-deployment-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  background-color: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  font-size: 10px;
  font-weight: 500;
  transition: background-color 0.2s;
}
.cp-deployment-badge.clickable {
  cursor: pointer;
}
.cp-deployment-badge.clickable:hover {
  background-color: rgba(34, 197, 94, 0.2);
}
.cp-deployment-dot {
  color: #16a34a;
}
.cp-project-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  -webkit-user-select: none;
     -moz-user-select: none;
          user-select: none;
}
.cp-project-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-panel-text);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cp-tooltip-wrapper {
  position: relative;
  display: inline-block;
}
.cp-tooltip-content {
  position: absolute;
  padding: 8px 12px;
  background-color: var(--color-panel-bg-tertiary);
  border: 1px solid var(--color-panel-border);
  color: var(--color-panel-text);
  font-size: 12px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 10px 15px -3px var(--color-panel-shadow);
  white-space: nowrap;
  line-height: 1.5;
}
.cp-tooltip-action-btn {
  cursor: pointer;
  color: var(--color-panel-text-secondary);
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s ease;
}
.cp-tooltip-action-btn:hover {
  color: var(--color-panel-text);
}
.cp-tooltip-action-tooltip {
  padding: 8px 12px;
  background-color: var(--color-panel-bg-tertiary);
  border: 1px solid var(--color-panel-border);
  color: var(--color-panel-text);
  font-size: 12px;
  border-radius: 4px;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 99999;
  box-shadow: 0 10px 15px -3px var(--color-panel-shadow);
  min-width: 192px;
  max-width: 300px;
  text-align: center;
  line-height: 1.5;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  transform: translateX(8px);
}
.cp-tooltip-action-arrow {
  position: absolute;
  right: 12px;
  width: 8px;
  height: 8px;
  background-color: var(--color-panel-bg-tertiary);
  border-top: 1px solid var(--color-panel-border);
  border-left: 1px solid var(--color-panel-border);
  transform: rotate(45deg);
}
.cp-tooltip-action-tooltip[data-placement="top"] .cp-tooltip-action-arrow {
  bottom: -4px;
  border-top: none;
  border-bottom: 1px solid var(--color-panel-border);
  border-right: 1px solid var(--color-panel-border);
  border-left: none;
}
.cp-tooltip-action-tooltip[data-placement="bottom"] .cp-tooltip-action-arrow {
  top: -4px;
}
.cp-tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: var(--color-panel-bg-tertiary);
  border-top: 1px solid var(--color-panel-border);
  border-left: 1px solid var(--color-panel-border);
}
.cp-components-view {
  display: flex;
  height: 100%;
  background-color: var(--color-panel-bg);
  overflow: hidden;
}
.cp-components-sidebar {
  width: 240px;
  border-right: 1px solid var(--color-panel-border);
  background-color: var(--color-panel-bg);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
}
.cp-components-categories {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px;
  gap: 8px;
}
.cp-components-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  background-color: var(--color-panel-bg);
}
.cp-components-header {
  margin-bottom: 16px;
}
.cp-components-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-panel-text);
  margin: 0 0 4px 0;
}
.cp-components-subtitle {
  font-size: 12px;
  color: var(--color-panel-text-secondary);
  margin: 0;
}
.cp-components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 300px));
  gap: 12px;
  justify-content: center;
}
.cp-components-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 24px;
  color: var(--color-panel-text-secondary);
}
.cp-theme-light .cp-component-card-icon {
  color: rgba(0, 0, 0, 0.6);
}
.cp-theme-dark .cp-component-card-icon {
  color: rgba(255, 255, 255, 0.9);
}
@property --tw-rotate-x {
  syntax: "*";
  inherits: false;
}
@property --tw-rotate-y {
  syntax: "*";
  inherits: false;
}
@property --tw-rotate-z {
  syntax: "*";
  inherits: false;
}
@property --tw-skew-x {
  syntax: "*";
  inherits: false;
}
@property --tw-skew-y {
  syntax: "*";
  inherits: false;
}
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-outline-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-blur {
  syntax: "*";
  inherits: false;
}
@property --tw-brightness {
  syntax: "*";
  inherits: false;
}
@property --tw-contrast {
  syntax: "*";
  inherits: false;
}
@property --tw-grayscale {
  syntax: "*";
  inherits: false;
}
@property --tw-hue-rotate {
  syntax: "*";
  inherits: false;
}
@property --tw-invert {
  syntax: "*";
  inherits: false;
}
@property --tw-opacity {
  syntax: "*";
  inherits: false;
}
@property --tw-saturate {
  syntax: "*";
  inherits: false;
}
@property --tw-sepia {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-drop-shadow-size {
  syntax: "*";
  inherits: false;
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    *, ::before, ::after, ::backdrop {
      --tw-rotate-x: initial;
      --tw-rotate-y: initial;
      --tw-rotate-z: initial;
      --tw-skew-x: initial;
      --tw-skew-y: initial;
      --tw-border-style: solid;
      --tw-outline-style: solid;
      --tw-blur: initial;
      --tw-brightness: initial;
      --tw-contrast: initial;
      --tw-grayscale: initial;
      --tw-hue-rotate: initial;
      --tw-invert: initial;
      --tw-opacity: initial;
      --tw-saturate: initial;
      --tw-sepia: initial;
      --tw-drop-shadow: initial;
      --tw-drop-shadow-color: initial;
      --tw-drop-shadow-alpha: 100%;
      --tw-drop-shadow-size: initial;
    }
  }
}


/*# sourceMappingURL=index.css.map */`;

