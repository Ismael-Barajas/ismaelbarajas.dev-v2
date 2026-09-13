import { describe, expect, it } from "vitest";
import {
  PROGRESS_CELLS,
  SPINNER_FRAMES,
  STATUS_WIDTH,
  buildBootScript,
  progressParts,
  progressValue,
  renderProgress,
  shouldPlayIntro,
  type BootContext,
} from "lib/intro";

const ok = {
  alreadyPlayed: false,
  reducedMotion: false,
  perfTier: "full" as const,
  pathname: "/",
};

describe("shouldPlayIntro", () => {
  it("plays on a fresh session at full or reduced effects", () => {
    expect(shouldPlayIntro(ok)).toBe(true);
    expect(shouldPlayIntro({ ...ok, perfTier: "reduced" })).toBe(true);
    expect(shouldPlayIntro({ ...ok, pathname: "/listen" })).toBe(true);
  });

  it("skips once played, for reduced motion, on the low tier, and on admin pages", () => {
    expect(shouldPlayIntro({ ...ok, alreadyPlayed: true })).toBe(false);
    expect(shouldPlayIntro({ ...ok, reducedMotion: true })).toBe(false);
    expect(shouldPlayIntro({ ...ok, perfTier: "low" })).toBe(false);
    expect(shouldPlayIntro({ ...ok, pathname: "/admin" })).toBe(false);
    expect(shouldPlayIntro({ ...ok, pathname: "/admin/login" })).toBe(false);
  });
});

describe("buildBootScript", () => {
  const ctx: BootContext = {
    theme: "dark",
    perf: "full",
    pathname: "/listen",
    accent: "#d4a053",
    now: new Date(2026, 8, 13, 10, 0, 0),
  };

  it("classic is the docked panel's four boot lines", () => {
    const lines = buildBootScript(ctx, "classic");
    expect(lines.map((l) => l.kind)).toEqual(["boot", "boot", "boot", "boot"]);
    expect(lines.map((l) => l.text)).toEqual([
      "Loading ismaelbarajas.dev v2.0",
      "Setting preferences... theme=dark effects=full",
      `Current date: ${ctx.now.toLocaleDateString()}`,
      "READY AT /listen",
    ]);
  });

  it("full opens like classic, embeds the context, and ends on READY", () => {
    const lines = buildBootScript(ctx, "full");
    expect(lines[0].text).toBe("Loading ismaelbarajas.dev v2.0");
    expect(lines[1].text).toBe("Setting preferences... theme=dark effects=full");
    expect(lines[2].text).toBe(`Current date: ${ctx.now.toLocaleDateString()}`);
    expect(lines.length).toBeGreaterThan(8);

    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("#d4a053");
    expect(lines.filter((l) => l.kind === "sys").length).toBeGreaterThan(3);

    expect(lines.at(-1)).toEqual({ kind: "done", text: "READY AT /listen" });
  });

  it("gives every loading line a status label that fits the bar", () => {
    const lines = buildBootScript(ctx, "full");
    const loading = lines.filter((l) => l.kind !== "done");
    loading.forEach((l) => {
      expect(l.status).toBeTruthy();
      expect(l.status!.length).toBeLessThanOrEqual(STATUS_WIDTH);
    });
    expect(lines.at(-1)?.status).toBeUndefined();
    expect(loading[0].status).toBe("init");
    expect(loading.find((l) => l.text.includes("three.webgl"))?.status).toBe("three.webgl");
  });

  it("reflects a light theme and a reduced tier", () => {
    const [, prefs] = buildBootScript({ ...ctx, theme: "light", perf: "reduced" }, "full");
    expect(prefs.text).toBe("Setting preferences... theme=light effects=reduced");
  });
});

describe("progressValue", () => {
  const line = { done: 3, total: 10, label: "gsap", startedAt: 1000, expectedMs: 600 };

  it("counts finished lines whole and the current line by its typing time", () => {
    expect(progressValue(line, 1000)).toBeCloseTo(0.3);
    expect(progressValue(line, 1300)).toBeCloseTo(0.35);
    expect(progressValue(line, 1600)).toBeCloseTo(0.4);
    expect(progressValue(line, 5000)).toBeCloseTo(0.4);
  });

  it("rises monotonically through a line, easing in and out", () => {
    let last = 0;
    const steps: number[] = [];
    for (let t = 1000; t <= 1600; t += 50) {
      const v = progressValue(line, t);
      expect(v).toBeGreaterThanOrEqual(last);
      steps.push(v - last);
      last = v;
    }
    const mid = steps[Math.floor(steps.length / 2)];
    expect(mid).toBeGreaterThan(steps[1]);
    expect(mid).toBeGreaterThan(steps[steps.length - 1]);
  });

  it("stays put with no timing, and is full once every line is done", () => {
    expect(progressValue({ done: 3, total: 10, label: "gsap" }, 99999)).toBeCloseTo(0.3);
    expect(progressValue({ done: 10, total: 10, label: "clock", startedAt: 0, expectedMs: 600 }, 1)).toBe(1);
    expect(progressValue({ done: 0, total: 0, label: "init" })).toBe(1);
  });
});

describe("renderProgress", () => {
  const empty = ".".repeat(PROGRESS_CELLS);
  const full = "#".repeat(PROGRESS_CELLS);
  const pad = (l: string) => l.padEnd(STATUS_WIDTH, " ");

  it("runs from a spinning empty bar to a ticked full one", () => {
    expect(renderProgress({ done: 0, total: 10, label: "init" })).toBe(
      `⠋ ${pad("init")} [${empty}]   0%`,
    );
    expect(renderProgress({ done: 10, total: 10, label: "clock" })).toBe(
      `✔ ${pad("done")} [${full}] 100%`,
    );
  });

  it("rounds the fill to whole hashes", () => {
    // 8 cells: 0.3 of the way is 2.4 cells, so two hashes.
    const p = progressParts({ done: 3, total: 10, label: "gsap" }, { cells: 8 });
    expect(p.filled).toBe("##");
    expect(p.empty).toBe("......");
    expect(p.percent).toBe(" 30");
    const half = progressParts({ done: 1, total: 2, label: "gsap" }, { cells: 7 });
    expect(half.filled).toBe("####");
    expect(half.filled.length + half.empty.length).toBe(7);
  });

  it("shows the current label and completes at the end", () => {
    const at = (done: number) => progressParts({ done, total: 10, label: "three.webgl" });
    expect(at(3).stage.trim()).toBe("three.webgl");
    expect(at(3).complete).toBe(false);
    expect(at(10).complete).toBe(true);
    expect(at(10).stage.trim()).toBe("done");
    expect(at(10).filled).toBe("#".repeat(PROGRESS_CELLS));
  });

  it("cycles the spinner by frame while loading", () => {
    const state = { done: 2, total: 10, label: "gsap" };
    const frames = SPINNER_FRAMES.map((_, i) => progressParts(state, { frame: i }).spinner);
    expect(new Set(frames).size).toBe(SPINNER_FRAMES.length);
    expect(progressParts(state, { frame: SPINNER_FRAMES.length }).spinner).toBe(frames[0]);
  });

  it("keeps a constant width whatever the label, fill or fraction", () => {
    const width = renderProgress({ done: 0, total: 10, label: "init" }).length;
    const line = { done: 2, total: 10, label: "components/library", startedAt: 0, expectedMs: 600 };
    for (let t = 0; t <= 600; t += 37) {
      expect(renderProgress(line, { now: t })).toHaveLength(width);
    }
    expect(renderProgress({ done: 10, total: 10, label: "clock" })).toHaveLength(width);
  });

  it("clamps out-of-range and empty totals", () => {
    expect(renderProgress({ done: -3, total: 10, label: "init" }, { cells: 4 })).toBe(
      `⠋ ${pad("init")} [....]   0%`,
    );
    expect(renderProgress({ done: 14, total: 10, label: "init" }, { cells: 4 })).toBe(
      `✔ ${pad("done")} [####] 100%`,
    );
    expect(progressParts({ done: 0, total: 0, label: "init" }).complete).toBe(true);
  });
});
