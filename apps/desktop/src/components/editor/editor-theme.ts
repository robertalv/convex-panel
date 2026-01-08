export const getThemeColor = (varName: string, fallback: string = '#0F1115'): string => {
  const themeElement = document.querySelector('.cp-theme-dark, .cp-theme-light') || document.documentElement;
  const color = getComputedStyle(themeElement).getPropertyValue(varName).trim();
  return color || fallback;
};

export const toConvexPanelColor = (hex: string): string => hex.replace('#', '');

export const setupConvexPanelThemes = (): void => {};

export const getConvexPanelTheme = (theme: 'light' | 'dark'): string => {
  return theme === 'light' ? 'convex-light' : 'convex-dark';
};

