import type { BeforeMount } from '@monaco-editor/react';

export const getThemeColor = (varName: string, fallback: string = '#0F1115'): string => {
  const themeElement = document.querySelector('.cp-theme-dark, .cp-theme-light') || document.documentElement;
  const color = getComputedStyle(themeElement).getPropertyValue(varName).trim();
  return color || fallback;
};

export const toMonacoColor = (hex: string): string => hex.replace('#', '');

export const setupMonacoThemes = (monacoInstance: Parameters<BeforeMount>[0]): void => {
  try {
    monacoInstance.editor.defineTheme('convex-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: toMonacoColor(getThemeColor('--color-panel-text-muted', '#6b7280')), fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: 'fbbf24' },
        { token: 'number', foreground: 'fb923c' },
      ],
      colors: {
        'editor.background': getThemeColor('--color-panel-bg-secondary', '#16181D'),
        'editor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editor.lineHighlightBackground': getThemeColor('--color-panel-bg-secondary', '#16181D'),
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(255, 255, 255, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#d1d5db'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#2D313A'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#6b7280'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#2D313A'),
      },
    });
  } catch {
    // Theme already defined
  }

  try {
    monacoInstance.editor.defineTheme('convex-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: toMonacoColor(getThemeColor('--color-panel-text-muted', '#9ca3af')), fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: 'd97706' },
        { token: 'number', foreground: 'ea580c' },
      ],
      colors: {
        'editor.background': getThemeColor('--color-panel-bg-secondary', '#f9fafb'),
        'editor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editor.lineHighlightBackground': getThemeColor('--color-panel-bg-secondary', '#f9fafb'),
        'editor.selectionBackground': getThemeColor('--color-panel-active', 'rgba(0, 0, 0, 0.1)'),
        'editorCursor.foreground': getThemeColor('--color-panel-text', '#111827'),
        'editorLineNumber.foreground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorLineNumber.activeForeground': getThemeColor('--color-panel-text', '#111827'),
        'editorIndentGuide.background': getThemeColor('--color-panel-border', '#e5e7eb'),
        'editorIndentGuide.activeBackground': getThemeColor('--color-panel-text-muted', '#9ca3af'),
        'editorWhitespace.foreground': getThemeColor('--color-panel-border', '#e5e7eb'),
      },
    });
  } catch {
    // Theme already defined
  }
};

export const getMonacoTheme = (theme: 'light' | 'dark'): string => {
  return theme === 'light' ? 'convex-light' : 'convex-dark';
};

