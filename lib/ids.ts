/**
 * Parses a route id. Accepts only a full string of digits >= 1, so "1abc"
 * (which parseInt would read as 1) and "abc" are both rejected.
 */
export function parseId(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || !/^\d{1,15}$/.test(value)) return null;
  const id = Number(value);
  return id >= 1 ? id : null;
}
