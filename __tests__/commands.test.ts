import { describe, expect, it } from "vitest";
import {
  HELP_LINES,
  HELP_PAD,
  complete,
  formatLocation,
  formatPrompt,
  formatUptime,
  listDir,
  parseLine,
  parseLocation,
  resolvePath,
  run,
  scrollSections,
  type CommandContext,
  type Location,
} from "lib/commands";

const HOME: Location = { pathname: "/", hash: "" };
const ABOUT: Location = { pathname: "/", hash: "about" };
const LISTEN: Location = { pathname: "/listen", hash: "" };
const PLAYLISTS: Location = { pathname: "/listen", hash: "playlists" };
const COMPRESSIONS: Location = { pathname: "/compressions", hash: "" };

const ctx = (over: Partial<CommandContext> = {}): CommandContext => ({
  location: HOME,
  theme: "dark",
  effects: { preference: "auto", tier: "full" },
  nowPlaying: null,
  accent: "#d4a053",
  uptimeMs: 192_000,
  now: new Date(2026, 8, 15, 9, 5, 3),
  versions: { next: "16.3.5", react: "19.2.6" },
  ...over,
});

describe("parseLine", () => {
  it("trims, collapses whitespace and lowercases the name only", () => {
    expect(parseLine("  CD   Listen/Playlists ")).toEqual({
      name: "cd",
      args: ["Listen/Playlists"],
    });
    expect(parseLine("")).toEqual({ name: "", args: [] });
    expect(parseLine("   ")).toEqual({ name: "", args: [] });
  });
});

describe("resolvePath", () => {
  it("goes home for an empty target, ~ and /", () => {
    for (const t of ["", "~", "/", "~/", "//"]) {
      expect(resolvePath(t, PLAYLISTS)).toEqual(HOME);
    }
  });

  it("stays put for .", () => {
    expect(resolvePath(".", PLAYLISTS)).toEqual(PLAYLISTS);
    expect(resolvePath("./", COMPRESSIONS)).toEqual(COMPRESSIONS);
  });

  it("reaches a home section by every spelling", () => {
    for (const t of ["about", "#about", "./about", "About/", "/about", "/#about", "~/about"]) {
      expect(resolvePath(t, HOME)).toEqual(ABOUT);
    }
  });

  it("enters a page", () => {
    for (const t of ["listen", "/listen", "listen/", "/listen/"]) {
      expect(resolvePath(t, HOME)).toEqual(LISTEN);
    }
  });

  it("reaches a page section, case-insensitively", () => {
    for (const t of [
      "listen/playlists",
      "/listen#playlists",
      "LISTEN/Playlists",
      "/listen/playlists/",
    ]) {
      expect(resolvePath(t, HOME)).toEqual(PLAYLISTS);
    }
    expect(resolvePath("compressions/whats-new", HOME)).toEqual({
      pathname: "/compressions",
      hash: "whats-new",
    });
  });

  it("treats the listen 'top' tab as the page itself", () => {
    expect(resolvePath("listen/top", HOME)).toEqual(LISTEN);
    expect(resolvePath("top", PLAYLISTS)).toEqual(LISTEN);
  });

  it("returns null for anything off the map", () => {
    for (const t of ["foo", "about/foo", "listen/foo", "/listen/../foo", "/admin"]) {
      expect(resolvePath(t, HOME)).toBeNull();
    }
    expect(resolvePath("about/experience", HOME)).toBeNull();
    expect(resolvePath("experience/about", ABOUT)).toBeNull();
  });

  it("reaches a page from a home section, and a sibling section", () => {
    expect(resolvePath("listen", ABOUT)).toEqual(LISTEN);
    expect(resolvePath("listen/liked", ABOUT)).toEqual({ pathname: "/listen", hash: "liked" });
    expect(resolvePath("contact", ABOUT)).toEqual({ pathname: "/", hash: "contact" });
  });

  it("resolves relative to a section", () => {
    expect(resolvePath("..", ABOUT)).toEqual(HOME);
    expect(resolvePath("../listen", ABOUT)).toEqual(LISTEN);
    expect(resolvePath("experience", ABOUT)).toEqual({ pathname: "/", hash: "experience" });
    expect(resolvePath("#experience", ABOUT)).toEqual({ pathname: "/", hash: "experience" });
  });

  it("resolves relative to a page section", () => {
    expect(resolvePath("..", PLAYLISTS)).toEqual(LISTEN);
    expect(resolvePath("../liked", PLAYLISTS)).toEqual({ pathname: "/listen", hash: "liked" });
    expect(resolvePath("liked", PLAYLISTS)).toEqual({ pathname: "/listen", hash: "liked" });
    expect(resolvePath("#liked", PLAYLISTS)).toEqual({ pathname: "/listen", hash: "liked" });
    expect(resolvePath("../../compressions/why", PLAYLISTS)).toEqual({
      pathname: "/compressions",
      hash: "why",
    });
  });

  it("climbs out of a page to home and no further", () => {
    expect(resolvePath("..", COMPRESSIONS)).toEqual(HOME);
    expect(resolvePath("../..", COMPRESSIONS)).toEqual(HOME);
    expect(resolvePath("../about", COMPRESSIONS)).toEqual(ABOUT);
  });
});

describe("locations", () => {
  it("formats and parses round trip", () => {
    expect(formatLocation(HOME)).toBe("/");
    expect(formatLocation(PLAYLISTS)).toBe("/listen#playlists");
    expect(parseLocation("/listen", "#playlists")).toEqual(PLAYLISTS);
    expect(parseLocation("/listen/", "")).toEqual(LISTEN);
    expect(parseLocation("/", "#About")).toEqual(ABOUT);
  });

  it("clamps an unknown pathname to home", () => {
    expect(parseLocation("/admin/login", "")).toEqual(HOME);
  });

  it("formats the prompt as a path under ~", () => {
    expect(formatPrompt(HOME)).toBe("~ $");
    expect(formatPrompt(ABOUT)).toBe("~/about $");
    expect(formatPrompt(LISTEN)).toBe("~/listen $");
    expect(formatPrompt(PLAYLISTS)).toBe("~/listen/playlists $");
  });
});

describe("scrollSections", () => {
  it("names the sections a scroll position can be in", () => {
    expect(scrollSections("/")).toEqual(["about", "experience", "projects", "contact"]);
    expect(scrollSections("/compressions")).toHaveLength(6);
    expect(scrollSections("/listen")).toEqual([]);
  });
});

describe("listDir", () => {
  it("lists dirs with a slash, then sections", () => {
    expect(listDir(HOME)).toEqual([
      "listen/",
      "compressions/",
      "about",
      "experience",
      "projects",
      "contact",
    ]);
    expect(listDir(LISTEN)).toEqual(["top", "playlists", "liked"]);
    expect(listDir({ pathname: "/compressions", hash: "why" })).toEqual([
      "why",
      "capabilities",
      "formats",
      "workflow",
      "whats-new",
      "download",
    ]);
  });
});

describe("complete", () => {
  it("completes a lone command name", () => {
    expect(complete("he", HOME)).toEqual({ completed: "help ", matches: ["help"] });
    expect(complete("c", HOME)).toEqual({ completed: "c", matches: ["cd", "clear"] });
    expect(complete("", HOME).matches).toHaveLength(12);
    expect(complete("zz", HOME)).toEqual({ matches: [] });
  });

  it("does not complete easter eggs", () => {
    expect(complete("su", HOME)).toEqual({ matches: [] });
    expect(complete("neo", HOME)).toEqual({ matches: [] });
  });

  it("completes cd targets, keeping a dir open and closing a section", () => {
    expect(complete("cd li", HOME)).toEqual({ completed: "cd listen/", matches: ["listen/"] });
    expect(complete("cd listen/p", HOME)).toEqual({
      completed: "cd listen/playlists ",
      matches: ["playlists"],
    });
    expect(complete("cd a", HOME)).toEqual({ completed: "cd about ", matches: ["about"] });
    expect(complete("cd x", HOME)).toEqual({ matches: [] });
    expect(complete("cd ", HOME).matches).toEqual(listDir(HOME));
    expect(complete("ls Comp", HOME)).toEqual({
      completed: "ls compressions/",
      matches: ["compressions/"],
    });
  });

  it("completes from inside a section as from its page", () => {
    expect(complete("cd li", ABOUT)).toEqual({ completed: "cd listen/", matches: ["listen/"] });
    expect(complete("cd li", PLAYLISTS)).toEqual({ completed: "cd liked ", matches: ["liked"] });
    expect(complete("cd about/", HOME)).toEqual({ matches: [] });
  });

  it("fills the shared prefix of several cd matches", () => {
    expect(complete("cd /compressions/wh", HOME)).toEqual({
      completed: "cd /compressions/wh",
      matches: ["why", "whats-new"],
    });
    expect(complete("cd /compressions/w", HOME).matches).toEqual(["why", "workflow", "whats-new"]);
  });

  it("completes the arguments of open, theme and effects", () => {
    expect(complete("open g", HOME)).toEqual({ completed: "open github ", matches: ["github"] });
    expect(complete("effects r", HOME)).toEqual({
      completed: "effects reduced ",
      matches: ["reduced"],
    });
    expect(complete("theme ", HOME).matches).toEqual(["dark", "light"]);
  });

  it("has nothing for commands without arguments", () => {
    expect(complete("help x", HOME)).toEqual({ matches: [] });
  });
});

describe("help", () => {
  it("aligns every description at HELP_PAD", () => {
    for (const line of HELP_LINES) {
      expect(line.slice(HELP_PAD - 2, HELP_PAD)).toBe("  ");
      expect(line.length).toBeGreaterThan(HELP_PAD);
    }
    expect(HELP_LINES.some((l) => l.startsWith("cd [target]"))).toBe(true);
    expect(HELP_LINES.some((l) => l.includes("sudo"))).toBe(false);
  });

  it("prints the list under a heading", () => {
    const { lines, effect } = run("help", ctx());
    expect(effect).toBeUndefined();
    expect(lines[0]).toEqual({ kind: "out", text: "Available commands:" });
    expect(lines.slice(1).map((l) => l.text)).toEqual(HELP_LINES);
  });
});

describe("run", () => {
  it("does nothing for an empty line", () => {
    expect(run("", ctx())).toEqual({ lines: [] });
    expect(run("   ", ctx())).toEqual({ lines: [] });
  });

  it("cd navigates, goes back, or complains", () => {
    expect(run("cd listen/playlists", ctx())).toEqual({
      lines: [],
      effect: { type: "navigate", to: PLAYLISTS },
    });
    expect(run("cd", ctx({ location: PLAYLISTS }))).toEqual({
      lines: [],
      effect: { type: "navigate", to: HOME },
    });
    expect(run("cd -", ctx())).toEqual({ lines: [], effect: { type: "back" } });
    expect(run("cd nope", ctx())).toEqual({
      lines: [{ kind: "err", text: "cd: no such directory: nope" }],
    });
  });

  it("ls lists here or a target", () => {
    expect(run("ls", ctx({ location: PLAYLISTS })).lines).toEqual([
      { kind: "out", text: "top  playlists  liked" },
    ]);
    expect(run("ls compressions", ctx()).lines[0].text).toBe(
      "why  capabilities  formats  workflow  whats-new  download",
    );
    expect(run("ls nope", ctx()).lines).toEqual([
      { kind: "err", text: "ls: no such directory: nope" },
    ]);
  });

  it("pwd prints the location", () => {
    expect(run("pwd", ctx({ location: PLAYLISTS })).lines).toEqual([
      { kind: "out", text: "/listen#playlists" },
    ]);
  });

  it("theme toggles, sets, notices a no-op and rejects junk", () => {
    expect(run("theme", ctx({ theme: "dark" })).effect).toEqual({ type: "theme", value: "light" });
    expect(run("theme", ctx({ theme: "light" })).effect).toEqual({ type: "theme", value: "dark" });
    expect(run("theme LIGHT", ctx()).effect).toEqual({ type: "theme", value: "light" });
    expect(run("theme dark", ctx({ theme: "dark" }))).toEqual({
      lines: [{ kind: "out", text: "theme is already dark" }],
    });
    expect(run("theme blue", ctx())).toEqual({
      lines: [{ kind: "err", text: "usage: theme [dark|light]" }],
    });
  });

  it("effects prints the current level or sets one", () => {
    expect(run("effects", ctx()).lines).toEqual([
      { kind: "out", text: "effects: auto (running full)" },
    ]);
    expect(run("effects low", ctx())).toEqual({
      lines: [],
      effect: { type: "effects", value: "low" },
    });
    expect(run("effects turbo", ctx()).lines[0]).toEqual({
      kind: "err",
      text: "effects: unknown level: turbo (auto | full | reduced | low)",
    });
  });

  it("open resolves a contact link", () => {
    expect(run("open github", ctx())).toEqual({
      lines: [],
      effect: { type: "open", url: "https://github.com/Ismael-Barajas" },
    });
    expect(run("open email", ctx()).effect).toEqual({
      type: "open",
      url: "mailto:ismaelbarajas.dev@gmail.com",
    });
    expect(run("open x", ctx()).lines).toEqual([
      { kind: "err", text: "open: unknown link: x" },
      { kind: "out", text: "linkedin | github | email | instagram" },
    ]);
    expect(run("open", ctx()).lines[0].text).toBe("usage: open <link>");
  });

  it("np reports playback", () => {
    const track = {
      songUrl: "https://open.spotify.com/track/a",
      isPlaying: true,
      title: "Weightless",
      artist: "Marconi Union",
    };
    expect(run("np", ctx({ nowPlaying: track })).lines[0].text).toBe(
      "NOW PLAYING Marconi Union — Weightless",
    );
    expect(run("np", ctx({ nowPlaying: { ...track, isPlaying: false } })).lines[0].text).toBe(
      "nothing playing",
    );
    expect(run("np", ctx()).lines[0].text).toBe("nothing playing");
  });

  it("date prints the local date and time", () => {
    expect(run("date", ctx()).lines[0].text).toBe("Tue Sep 15 2026 9:05:03 AM");
  });

  it("whoami is one line", () => {
    const { lines } = run("whoami", ctx());
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toContain("ismael");
  });

  it("clear and exit are effects without output", () => {
    expect(run("clear", ctx())).toEqual({ lines: [], effect: { type: "clear" } });
    expect(run("exit", ctx())).toEqual({ lines: [], effect: { type: "exit" } });
  });

  it("has easter eggs", () => {
    expect(run("sudo rm -rf /", ctx()).lines).toEqual([{ kind: "err", text: "nice try." }]);
    expect(run("rm -rf /", ctx()).lines[0].kind).toBe("err");
    const fetch = run("neofetch", ctx())
      .lines.map((l) => l.text)
      .join("\n");
    expect(fetch).toContain("next 16.3.5 / react 19.2.6");
    expect(fetch).toContain("theme      dark");
    expect(fetch).toContain("effects    full (auto)");
    expect(fetch).toContain("uptime     3m 12s");
    expect(fetch).toContain("#d4a053");
  });

  it("points an unknown command at help", () => {
    expect(run("XYZ now", ctx()).lines).toEqual([
      { kind: "err", text: "command not found: xyz" },
      { kind: "out", text: "type help for a list of commands" },
    ]);
  });
});

describe("formatUptime", () => {
  it("shows minutes and seconds, or hours and minutes", () => {
    expect(formatUptime(0)).toBe("0m 0s");
    expect(formatUptime(192_000)).toBe("3m 12s");
    expect(formatUptime(3_725_000)).toBe("1h 2m");
  });
});
