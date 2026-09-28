/**
 * WCAG 2 contrast, computed from the token values themselves, so the
 * foundations page can show the ratio of every pair the contrast contract
 * holds — in both themes, at build time, with no browser involved.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
  /** 0–1; 1 when the colour is opaque. */
  a: number;
}

/** Parses `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(…)` and `rgba(…)`. */
export function parseColour(value: string): Rgb | undefined {
  const text = value.trim();
  const hex = text.match(/^#([0-9a-f]{3,8})$/i)?.[1];
  if (hex) {
    const digits =
      hex.length <= 4 ? [...hex].map((digit) => digit + digit).join("") : hex;
    if (digits.length !== 6 && digits.length !== 8) return undefined;
    const channel = (index: number) =>
      parseInt(digits.slice(index, index + 2), 16);
    return {
      r: channel(0),
      g: channel(2),
      b: channel(4),
      a: digits.length === 8 ? channel(6) / 255 : 1,
    };
  }
  const rgb = text.match(/^rgba?\(\s*([^)]+)\)$/i)?.[1];
  if (rgb) {
    const parts = rgb
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN))
      return undefined;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
  }
  return undefined;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** A translucent colour composited over an opaque one. */
export function composite(top: Rgb, under: Rgb): Rgb {
  const a = top.a;
  return {
    r: Math.round(top.r * a + under.r * (1 - a)),
    g: Math.round(top.g * a + under.g * (1 - a)),
    b: Math.round(top.b * a + under.b * (1 - a)),
    a: 1,
  };
}

/** The contrast ratio of a foreground on a background, 1 to 21. */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const under =
    background.a < 1
      ? composite(background, { r: 255, g: 255, b: 255, a: 1 })
      : background;
  const over = foreground.a < 1 ? composite(foreground, under) : foreground;
  const l1 = relativeLuminance(over);
  const l2 = relativeLuminance(under);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Rounds the way the WCAG reports do: two decimals, never up past a threshold. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}
