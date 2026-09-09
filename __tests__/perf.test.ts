import { describe, it, expect } from "vitest";
import {
  FRAME_MS_LOW,
  FRAME_MS_REDUCED,
  REDUCED_MOTION_TIER,
  classifyStaticSignals,
  dprForTier,
  fpsForTier,
  isSoftwareRendererString,
  lowerTier,
  resolveTier,
  tierFromFrameTimes,
  tierFromStaticSignals,
  type StaticSignals,
} from "lib/perf";

const capable: StaticSignals = {
  renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  webglAvailable: true,
  prefersReducedMotion: false,
  saveData: false,
  hardwareConcurrency: 12,
  deviceMemory: 8,
};

describe("isSoftwareRendererString", () => {
  it("flags CPU renderers", () => {
    expect(isSoftwareRendererString("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))")).toBe(true);
    expect(isSoftwareRendererString("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe(true);
    expect(isSoftwareRendererString("Microsoft Basic Render Driver")).toBe(true);
  });

  it("passes real GPUs and unknowns", () => {
    expect(isSoftwareRendererString(capable.renderer)).toBe(false);
    expect(isSoftwareRendererString("Apple M2")).toBe(false);
    expect(isSoftwareRendererString(null)).toBe(false);
    expect(isSoftwareRendererString("")).toBe(false);
  });
});

describe("tierFromStaticSignals", () => {
  it("is full for a capable machine", () => {
    expect(tierFromStaticSignals(capable)).toBe("full");
  });

  it("is low without hardware acceleration", () => {
    expect(
      tierFromStaticSignals({ ...capable, renderer: "Google SwiftShader" }),
    ).toBe("low");
    expect(tierFromStaticSignals({ ...capable, webglAvailable: false, renderer: null })).toBe("low");
  });

  it("honors prefers-reduced-motion and says so", () => {
    const r = classifyStaticSignals({ ...capable, prefersReducedMotion: true });
    expect(r).toEqual({ tier: REDUCED_MOTION_TIER, reason: "reduced-motion" });
  });

  it("reports a reason for every verdict", () => {
    expect(classifyStaticSignals(capable).reason).toBe("capable");
    expect(classifyStaticSignals({ ...capable, renderer: "SwiftShader" }).reason).toBe(
      "software-renderer",
    );
    expect(classifyStaticSignals({ ...capable, webglAvailable: false }).reason).toBe(
      "webgl-unavailable",
    );
    expect(classifyStaticSignals({ ...capable, saveData: true }).reason).toBe("save-data");
    expect(classifyStaticSignals({ ...capable, deviceMemory: 1 }).reason).toBe("weak-device");
  });

  it("is reduced for save-data or a very weak device", () => {
    expect(tierFromStaticSignals({ ...capable, saveData: true })).toBe("reduced");
    expect(tierFromStaticSignals({ ...capable, hardwareConcurrency: 2 })).toBe("reduced");
    expect(tierFromStaticSignals({ ...capable, deviceMemory: 2 })).toBe("reduced");
  });

  it("does not penalize browsers that hide the signals", () => {
    expect(
      tierFromStaticSignals({
        ...capable,
        renderer: null,
        hardwareConcurrency: null,
        deviceMemory: null,
      }),
    ).toBe("full");
  });
});

describe("tierFromFrameTimes", () => {
  const frames = (ms: number, n = 60) => Array.from({ length: n }, () => ms);

  it("needs enough samples", () => {
    expect(tierFromFrameTimes([])).toBeNull();
    expect(tierFromFrameTimes(frames(16, 10))).toBeNull();
  });

  it("classifies steady frame rates", () => {
    expect(tierFromFrameTimes(frames(16.7))).toBe("full");
    expect(tierFromFrameTimes(frames(8.3))).toBe("full");
    expect(tierFromFrameTimes(frames(FRAME_MS_REDUCED + 5))).toBe("reduced");
    expect(tierFromFrameTimes(frames(FRAME_MS_LOW + 20))).toBe("low");
  });

  it("ignores warm-up frames and a few hitches", () => {
    const warm = [200, 150, 120, 90, 80, 70, 60, 50];
    const steady = frames(16.7, 50);
    const hitches = [120, 90, 110];
    expect(tierFromFrameTimes([...warm, ...steady, ...hitches])).toBe("full");
  });

  it("drops junk samples", () => {
    expect(tierFromFrameTimes([...frames(16.7), 0, -5, NaN, 5000])).toBe("full");
  });
});

describe("tier helpers", () => {
  it("toggle cycle lets a visitor force full effects", async () => {
    const { PERF_PREFERENCES } = await import("lib/perf");
    expect(PERF_PREFERENCES).toContain("full");
    expect(PERF_PREFERENCES[0]).toBe("auto");
  });

  it("resolveTier prefers an explicit choice", () => {
    expect(resolveTier("auto", "reduced")).toBe("reduced");
    expect(resolveTier("full", "low")).toBe("full");
    expect(resolveTier("low", "full")).toBe("low");
  });

  it("lowerTier picks the slower tier", () => {
    expect(lowerTier("full", "reduced")).toBe("reduced");
    expect(lowerTier("low", "reduced")).toBe("low");
    expect(lowerTier("full", "full")).toBe("full");
  });

  it("dpr and fps scale down per tier", () => {
    expect(dprForTier("full", 2)).toBe(2);
    expect(dprForTier("full", 3)).toBe(2);
    expect(dprForTier("reduced", 2)).toBeLessThan(1);
    expect(dprForTier("reduced", 2)).toBeGreaterThanOrEqual(0.5);
    expect(dprForTier("low", 2)).toBe(0.5);
    expect(fpsForTier("full")).toBe(60);
    expect(fpsForTier("reduced")).toBe(30);
    expect(fpsForTier("low")).toBe(0);
  });
});
