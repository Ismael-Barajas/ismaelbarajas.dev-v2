/** Blends a hex color toward white. weight 0 = unchanged, 1 = white. */
export const mixWithWhite = (hex: string, weight: number): string => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((n >> 16) & 0xff) * (1 - weight) + 255 * weight);
  const g = Math.round(((n >> 8) & 0xff) * (1 - weight) + 255 * weight);
  const b = Math.round((n & 0xff) * (1 - weight) + 255 * weight);
  return `rgb(${r},${g},${b})`;
};

/** Linear blend between two hex colors. t 0 = a, 1 = b. */
export const mixHex = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.replace("#", ""), 16);
  const pb = parseInt(b.replace("#", ""), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 0xff) * (1 - t) + ((pb >> shift) & 0xff) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
