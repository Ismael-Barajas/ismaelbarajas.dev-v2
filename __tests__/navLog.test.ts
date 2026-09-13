import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_ENTRIES,
  describeClick,
  describePlayback,
  formatTime,
  getEntries,
  log,
  resetEntries,
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
