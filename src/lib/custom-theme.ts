export interface CustomColorSlot {
  id: "primary" | "secondary" | "accent";
  label: string;
  defaultHex: string;
}

export interface CustomThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export const CUSTOM_COLOR_SLOTS: CustomColorSlot[] = [
  { id: "primary", label: "Couleur principale", defaultHex: "#6366f1" },
  {
    id: "secondary",
    label: "Couleur secondaire",
    defaultHex: "#e2e8f0",
  },
  {
    id: "accent",
    label: "Couleur d'accentuation",
    defaultHex: "#f1f5f9",
  },
];

export const CUSTOM_THEME_STORAGE_KEY = "custom-theme-colors";

// Parse "#rrggbb" → { r, g, b } (0–255)
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Compute relative luminance per WCAG 2.1
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Returns "0 0% 100%" (white) or "0 0% 0%" (black) based on luminance threshold
export function contrastForeground(hex: string): string {
  return luminance(hex) > 0.179 ? "0 0% 0%" : "0 0% 100%";
}

// Convert "#rrggbb" → "H S% L%" string (space-separated, no commas)
export function hexToHsl(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const [rn, gn, bn] = [r, g, b].map((c) => c / 255);

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Get hue from hex (for tinting)
function getHue(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rn, gn, bn] = [r, g, b].map((c) => c / 255);
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);

  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }
  return Math.round(h * 360);
}

// Light mode tint: same hue, low saturation, high lightness (~95%)
export function tintLight(hex: string): string {
  const hue = getHue(hex);
  return `${hue} 12% 95%`;
}

// Dark mode tint: same hue, low saturation, low lightness (~16%)
export function tintDark(hex: string): string {
  const hue = getHue(hex);
  return `${hue} 10% 16%`;
}

export function generateCustomThemeCss(colors: CustomThemeColors): string {
  const primaryHsl = hexToHsl(colors.primary);
  const primaryHue = getHue(colors.primary);
  const primaryFg = contrastForeground(colors.primary);

  const secondaryHue = getHue(colors.secondary);
  const secondaryFg = contrastForeground(colors.secondary);

  const accentHue = getHue(colors.accent);
  const accentFg = contrastForeground(colors.accent);

  // Light mode
  const lightCss = `[data-color-theme="custom"]{` +
    `--primary:${primaryHsl};` +
    `--primary-foreground:${primaryFg};` +
    `--secondary:${tintLight(colors.secondary)};` +
    `--secondary-foreground:${secondaryFg};` +
    `--muted:${tintLight(colors.secondary)};` +
    `--muted-foreground:${secondaryHue} 10% 44%;` +
    `--accent:${tintLight(colors.accent)};` +
    `--accent-foreground:${accentFg};` +
    `--border:${primaryHue} 12% 88%;` +
    `--input:${primaryHue} 12% 88%;` +
    `--ring:${primaryHsl};` +
    `}`;

  // Dark mode
  const darkCss = `.dark[data-color-theme="custom"]{` +
    `--primary:${primaryHsl};` +
    `--primary-foreground:${primaryFg};` +
    `--secondary:${tintDark(colors.secondary)};` +
    `--secondary-foreground:0 0% 98%;` +
    `--muted:${tintDark(colors.secondary)};` +
    `--muted-foreground:${secondaryHue} 12% 64%;` +
    `--accent:${tintDark(colors.accent)};` +
    `--accent-foreground:0 0% 98%;` +
    `--border:${primaryHue} 10% 18%;` +
    `--input:${primaryHue} 10% 18%;` +
    `--ring:${primaryHsl};` +
    `}`;

  return lightCss + darkCss;
}

// localStorage helpers
export function loadCustomThemeColors(): CustomThemeColors | null {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomThemeColors;
    if (parsed.primary && parsed.secondary && parsed.accent) {
      return parsed;
    }
  } catch (e) {
    // ignore parse errors
  }
  return null;
}

export function saveCustomThemeColors(colors: CustomThemeColors): void {
  localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(colors));
}

export function getDefaultCustomColors(): CustomThemeColors {
  return {
    primary: CUSTOM_COLOR_SLOTS[0].defaultHex,
    secondary: CUSTOM_COLOR_SLOTS[1].defaultHex,
    accent: CUSTOM_COLOR_SLOTS[2].defaultHex,
  };
}
