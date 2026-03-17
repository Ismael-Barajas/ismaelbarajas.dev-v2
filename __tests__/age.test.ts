import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateAge } from "lib/age";

describe("calculateAge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a string", () => {
    expect(typeof calculateAge()).toBe("string");
  });

  it("returns age with integer and decimal parts", () => {
    const age = calculateAge();
    expect(age).toMatch(/^\d+\.\d{8}$/);
  });

  it("returns correct integer age for a known date", () => {
    // Mock Date.now to March 15, 2026
    vi.spyOn(Date, "now").mockReturnValue(
      new Date(2026, 2, 15).getTime()
    );

    const age = calculateAge();
    const integerPart = parseInt(age, 10);
    expect(integerPart).toBe(29);
  });

  it("returns correct integer age just before birthday", () => {
    // Jan 29, 2026 — one day before 29th birthday (Jan 30)
    vi.spyOn(Date, "now").mockReturnValue(
      new Date(2026, 0, 29).getTime()
    );

    const age = calculateAge();
    const integerPart = parseInt(age, 10);
    expect(integerPart).toBe(28);
  });

  it("returns correct integer age on birthday", () => {
    // Jan 31, 2026 — day after 29th birthday (accounts for leap year averaging)
    vi.spyOn(Date, "now").mockReturnValue(
      new Date(2026, 0, 31).getTime()
    );

    const age = calculateAge();
    const integerPart = parseInt(age, 10);
    expect(integerPart).toBe(29);
  });

  it("decimal part is between 0 and 1", () => {
    const age = calculateAge();
    const decimalStr = age.split(".")[1];
    const decimal = parseFloat(`0.${decimalStr}`);
    expect(decimal).toBeGreaterThanOrEqual(0);
    expect(decimal).toBeLessThan(1);
  });
});
