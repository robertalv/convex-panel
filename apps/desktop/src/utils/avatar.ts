/**
 * Avatar utility functions
 * Helper functions for generating deterministic avatar colors and patterns
 */

// Color schemes matching dashboard Avatar component
export const colorSchemes = [
  ["hsl(255, 60%, 36%)", "hsl(37, 35.7%, 55.5%)", "hsl(346, 100%, 85%)", "hsl(42, 97%, 54%)"],
  ["hsl(3, 100%, 32%)", "hsl(42, 100%, 80%)", "hsl(29, 89%, 54%)", "hsl(0, 0%, 36%)"],
  ["hsl(270, 13%, 27%)", "hsl(220, 56%, 78%)", "hsl(316, 59%, 77%)", "hsl(260, 60%, 51%)"],
  ["hsl(220, 14%, 45%)", "hsl(120, 22%, 62%)", "hsl(6, 100%, 74%)", "hsl(312, 33%, 71%)"],
  ["hsl(220, 14%, 45%)", "hsl(262, 87%, 74%)", "hsl(240, 70%, 42%)", "hsl(210, 66%, 84%)"],
  ["hsl(6, 100%, 74%)", "hsl(40, 80%, 75%)", "hsl(316, 59%, 65%)", "hsl(42, 100%, 80%)"],
];

// Helper to hash a string (matching dashboard implementation)
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Helper to convert HSL to RGB for web
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Parse HSL string and convert to RGB hex
export function parseHslToRgb(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!match) return "#000000";
  const h = parseInt(match[1], 10);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  const [r, g, b] = hslToRgb(h, s, l);
  return `rgb(${r}, ${g}, ${b})`;
}
