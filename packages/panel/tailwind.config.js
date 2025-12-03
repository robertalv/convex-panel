/** @type {import('tailwindcss').Config} */
module.exports = {
  // Prefix all classes with 'cp-' to prevent conflicts with parent apps
  prefix: 'cp-',
  
  // Only scan panel source files to prevent processing parent app code
  content: [
    './src/**/*.{ts,tsx}',
  ],
  
  // Disable base/reset styles to prevent global style leakage
  // We'll use our own scoped styles instead
  corePlugins: {
    preflight: false, // Disable Tailwind's base/reset styles
  },
  
  // Use important selector strategy to scope utilities to .cp-bottom-sheet
  // This ensures Tailwind utilities only apply within the panel container
  important: '.cp-bottom-sheet',
  
  theme: {
    extend: {
      // Map Tailwind colors to our CSS custom properties
      colors: {
        'panel-bg': 'var(--color-panel-bg)',
        'panel-bg-secondary': 'var(--color-panel-bg-secondary)',
        'panel-bg-tertiary': 'var(--color-panel-bg-tertiary)',
        'panel-border': 'var(--color-panel-border)',
        'panel-text': 'var(--color-panel-text)',
        'panel-text-secondary': 'var(--color-panel-text-secondary)',
        'panel-text-muted': 'var(--color-panel-text-muted)',
        'panel-accent': 'var(--color-panel-accent)',
        'panel-accent-hover': 'var(--color-panel-accent-hover)',
        'panel-success': 'var(--color-panel-success)',
        'panel-warning': 'var(--color-panel-warning)',
        'panel-error': 'var(--color-panel-error)',
        'panel-info': 'var(--color-panel-info)',
        'panel-httpaction': 'var(--color-panel-httpaction)',
        'panel-hover': 'var(--color-panel-hover)',
        'panel-active': 'var(--color-panel-active)',
        'panel-shadow': 'var(--color-panel-shadow)',
        'panel-code-bg': 'var(--color-panel-code-bg)',
        'panel-scrollbar': 'var(--color-panel-scrollbar)',
        'panel-scrollbar-hover': 'var(--color-panel-scrollbar-hover)',
      },
      
      // Spacing scale matching existing manual utilities
      spacing: {
        'panel-2': '8px',
        'panel-3': '12px',
        'panel-4': '16px',
      },
      
      // Border radius matching existing values
      borderRadius: {
        'panel-sm': '4px',
        'panel-md': '6px',
        'panel-lg': '8px',
      },
      
      // Font sizes matching existing manual utilities
      fontSize: {
        'panel-xs': '10px',
        'panel-sm': '11px',
        'panel-base': '12px',
        'panel-md': '14px',
        'panel-lg': '16px',
      },
      
      // Font families
      fontFamily: {
        'panel': ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Roboto', "'Helvetica Neue'", 'Arial', 'sans-serif'],
        'panel-mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  
  plugins: [],
  
  // Safelist for any dynamically generated classes that might not be detected
  safelist: [],
};

