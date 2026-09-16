import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_ENTRIES,
  PANEL_FOOTPRINT,
  claimStream,
  clearEntries,
  describeClick,
  describePlayback,
  endPeek,
  fitsBesideContent,
  formatTime,
  getEntries,
  isPeeking,
  log,
  peek,
  resetEntries,
  setView,
  subscribe,
  type PlaybackSample,
} from "lib/navLog";

const HERE = "https://ismaelbarajas.dev/listen";
const HOME = "https://ismaelbarajas.dev/";

describe("describeClick", () => {
  it("logs another origin as host + path, without www or a trailing slash", () => {
    expect(describeClick("https://github.com/ismaelbarajas", HERE)).toEqual({
      kind: "ext",
      text: "OPENING github.com/ismaelbarajas",
    });
    expect(describeClick("https://www.linkedin.com/in/ismaelbarajas/", HERE)).toEqual({
      kind: "ext",
      text: "OPENING linkedin.com/in/ismaelbarajas",
    });
    expect(describeClick("https://example.com/", HERE)).toEqual({
      kind: "ext",
      text: "OPENING example.com",
    });
  });

  it("logs mailto links", () => {
    expect(describeClick("mailto:ismaelbarajas.dev@gmail.com", HERE)).toEqual({
      kind: "ext",
      text: "OPENING mailto:ismaelbarajas.dev@gmail.com",
    });
  });

  it("logs a same-page hash as a jump", () => {
    expect(describeClick("#projects", HOME)).toEqual({
      kind: "jump",
      text: "JUMPING TO #projects",
    });
    expect(describeClick("/#about", HOME)).toEqual({
      kind: "jump",
      text: "JUMPING TO #about",
    });
    expect(describeClick("#playlists", HERE)).toEqual({
      kind: "jump",
      text: "JUMPING TO #playlists",
    });
  });

  it("stays quiet for same-origin navigations, which the router logs", () => {
    expect(describeClick("/listen", HOME)).toBeNull();
    expect(describeClick("/#about", HERE)).toBeNull();
    expect(describeClick("https://ismaelbarajas.dev/compressions", HERE)).toBeNull();
  });

  it("stays quiet for empty, bare-hash and javascript hrefs", () => {
    expect(describeClick("", HERE)).toBeNull();
    expect(describeClick("   ", HERE)).toBeNull();
    expect(describeClick("#", HERE)).toBeNull();
    expect(describeClick("/listen", HERE)).toBeNull();
    expect(describeClick("javascript:void(0)", HERE)).toBeNull();
  });
});

describe("describePlayback", () => {
  const track: PlaybackSample = {
    songUrl: "https://open.spotify.com/track/a",
    isPlaying: true,
    title: "Weightless",
    artist: "Marconi Union",
  };
  const other: PlaybackSample = {
    songUrl: "https://open.spotify.com/track/b",
    isPlaying: true,
    title: "Teardrop",
    artist: "Massive Attack",
  };

  it("announces the first song when something is actually playing", () => {
    expect(describePlayback(null, track)).toBe("NOW PLAYING Marconi Union — Weightless");
  });

  it("announces episodes by title alone", () => {
    expect(
      describePlayback(null, { ...track, type: "episode", title: "Ep. 12" }),
    ).toBe("NOW PLAYING Ep. 12");
  });

  it("announces a song change", () => {
    expect(describePlayback(track, other)).toBe("NOW PLAYING Massive Attack — Teardrop");
  });

  it("reports a pause on the same song and a stop on a different one", () => {
    expect(describePlayback(track, { ...track, isPlaying: false })).toBe(
      "PLAYBACK PAUSED",
    );
    expect(describePlayback(track, { ...other, isPlaying: false })).toBe(
      "PLAYBACK STOPPED",
    );
    expect(describePlayback(track, { isPlaying: false })).toBe("PLAYBACK STOPPED");
  });

  it("says nothing for a last-played fallback on boot", () => {
    expect(describePlayback(null, { ...track, isPlaying: false })).toBeNull();
    expect(describePlayback(null, { isPlaying: false })).toBeNull();
  });

  it("says nothing when the poll repeats the same sample", () => {
    expect(describePlayback(track, { ...track })).toBeNull();
    const paused = { ...track, isPlaying: false };
    expect(describePlayback(paused, { ...paused })).toBeNull();
  });

  it("says nothing while there is no data", () => {
    expect(describePlayback(null, undefined)).toBeNull();
    expect(describePlayback(track, undefined)).toBeNull();
  });

  it("does not re-announce a paused song that stays paused on a new sample", () => {
    const paused = { ...track, isPlaying: false };
    expect(describePlayback(paused, { ...other, isPlaying: false })).toBeNull();
  });
});

describe("the store", () => {
  beforeEach(() => resetEntries());

  it("appends and notifies subscribers", () => {
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls += 1;
    });

    log("nav", "NAVIGATING TO /listen");
    log("done", "NAVIGATION COMPLETE");

    expect(calls).toBe(2);
    expect(getEntries().map((e) => e.text)).toEqual([
      "NAVIGATING TO /listen",
      "NAVIGATION COMPLETE",
    ]);
    expect(getEntries()[0].kind).toBe("nav");

    unsubscribe();
    log("nav", "NAVIGATING TO /");
    expect(calls).toBe(2);
  });

  it("returns the appended entry", () => {
    const entry = log("sys", "warm   swr cache ........  ok");
    expect(entry).toBe(getEntries().at(-1));
    expect(entry.kind).toBe("sys");
  });

  it("gives every entry a distinct id and a timestamp", () => {
    const before = Date.now();
    log("boot", "one");
    log("boot", "two");
    const [a, b] = getEntries();
    expect(a.id).not.toBe(b.id);
    expect(a.time).toBeGreaterThanOrEqual(before);
  });

  it("keeps the newest entries once it is full", () => {
    for (let i = 0; i < MAX_ENTRIES + 20; i += 1) log("nav", `line ${i}`);
    const entries = getEntries();
    expect(entries).toHaveLength(MAX_ENTRIES);
    expect(entries[0].text).toBe("line 20");
    expect(entries[entries.length - 1].text).toBe(`line ${MAX_ENTRIES + 19}`);
  });

  it("returns a new snapshot on append and a stable one otherwise", () => {
    const first = getEntries();
    expect(getEntries()).toBe(first);
    log("nav", "NAVIGATING TO /");
    const second = getEntries();
    expect(second).not.toBe(first);
    expect(getEntries()).toBe(second);
  });
});

describe("clearEntries", () => {
  beforeEach(() => resetEntries());

  it("empties the log and notifies once", () => {
    log("nav", "NAVIGATING TO /listen");
    log("done", "NAVIGATION COMPLETE");
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls += 1;
    });
    clearEntries();
    unsubscribe();
    expect(getEntries()).toEqual([]);
    expect(calls).toBe(1);
  });

  it("keeps ids climbing so keys never repeat", () => {
    const before = log("nav", "one").id;
    clearEntries();
    expect(log("nav", "two").id).toBeGreaterThan(before);
  });

  it("leaves the view and a peek alone", () => {
    setView("collapsed");
    log("nav", "NAVIGATING TO /listen");
    clearEntries();
    expect(isPeeking()).toBe(true);
    setView("expanded");
  });
});

describe("instant lines", () => {
  beforeEach(() => resetEntries());

  it("are marked as already streamed", () => {
    const instant = log("out", "instant", { instant: true });
    expect(claimStream(instant.id)).toBe(false);
  });
});

describe("formatTime", () => {
  it("formats as h:mm:ss AM/PM", () => {
    expect(formatTime(Date.UTC(2026, 8, 12, 23, 44, 44))).toMatch(
      /^\d{1,2}:\d{2}:\d{2}\s(AM|PM)$/,
    );
  });

  it("pads minutes and seconds but not the hour", () => {
    const t = new Date(2026, 8, 12, 9, 5, 3).getTime();
    expect(formatTime(t)).toBe("9:05:03 AM");
  });
});

describe("fitsBesideContent", () => {
  it("is true where the gutter beside the container holds the panel", () => {
    // 2560 wide: a 1536 container leaves 512 a side.
    expect(fitsBesideContent(2560)).toBe(true);
    expect(fitsBesideContent(3440)).toBe(true);
  });

  it("is false on 1080p and laptop widths, where the panel would cover content", () => {
    // 1920 wide: 192 a side, less than the panel's footprint.
    expect(fitsBesideContent(1920)).toBe(false);
    // 1080p at 125% scaling: the container fills the viewport.
    expect(fitsBesideContent(1536)).toBe(false);
    expect(fitsBesideContent(1366)).toBe(false);
    expect(fitsBesideContent(768)).toBe(false);
  });

  it("counts the container's own side padding as free space", () => {
    // Gutter + 24px padding exactly equals the footprint.
    const exact = 1536 + 2 * (PANEL_FOOTPRINT - 24);
    expect(fitsBesideContent(exact)).toBe(true);
    expect(fitsBesideContent(exact - 1)).toBe(false);
  });
});

describe("peeking", () => {
  beforeEach(() => {
    resetEntries();
    setView("collapsed");
  });

  it("starts when a line lands on a collapsed panel", () => {
    expect(isPeeking()).toBe(false);
    log("nav", "NAVIGATING TO /listen");
    expect(isPeeking()).toBe(true);
  });

  it("does not start while the panel is expanded or hidden", () => {
    setView("expanded");
    log("nav", "NAVIGATING TO /listen");
    expect(isPeeking()).toBe(false);
    setView("hidden");
    log("nav", "NAVIGATING TO /");
    expect(isPeeking()).toBe(false);
  });

  it("ends on endPeek and notifies once", () => {
    log("nav", "NAVIGATING TO /listen");
    let calls = 0;
    const unsubscribe = subscribe(() => {
      calls += 1;
    });
    endPeek();
    endPeek();
    unsubscribe();
    expect(isPeeking()).toBe(false);
    expect(calls).toBe(1);
  });

  it("can be started without a line, only while collapsed", () => {
    peek();
    expect(isPeeking()).toBe(true);
    setView("expanded");
    peek();
    expect(isPeeking()).toBe(false);
  });

  it("is cleared by any view change", () => {
    log("nav", "NAVIGATING TO /listen");
    setView("expanded");
    expect(isPeeking()).toBe(false);
  });
});
