/**
 * The terminal's commands (components/library/TerminalInput.tsx), kept pure:
 * `run` takes a line and a snapshot of the site's state and returns lines to
 * print plus, at most, one declarative effect. The panel applies the effect
 * (router, theme, window.open); nothing here touches the browser, so every
 * branch is unit tested in __tests__/commands.test.ts.
 *
 * `cd` treats the site as a tiny filesystem:
 *
 *   /               about experience projects contact   listen/ compressions/
 *   /listen         top playlists liked      ("top" is the hashless default)
 *   /compressions   why capabilities formats workflow whats-new download
 */
import { describePlayback, formatTime, type PlaybackSample } from "./navLog";
import {
  PERF_PREFERENCES,
  isPerfPreference,
  type PerfPreference,
  type PerfTier,
} from "./perf";
import { COMPRESSIONS_SECTIONS, CONTACT_LINKS, LISTEN_TABS, PAGES, SECTIONS } from "./site";

export type Pathname = "/" | "/listen" | "/compressions";

/** Where the visitor is; `hash` without its "#", "" for the top of a page. */
export interface Location {
  pathname: Pathname;
  hash: string;
}

const HOME: Location = { pathname: "/", hash: "" };

const TREE: Record<Pathname, { dirs: readonly string[]; sections: readonly string[] }> = {
  "/": { dirs: PAGES.map((p) => p.pathname.slice(1)), sections: SECTIONS.map((s) => s.hash) },
  "/listen": { dirs: [], sections: LISTEN_TABS.map((t) => t.key) },
  "/compressions": { dirs: [], sections: COMPRESSIONS_SECTIONS },
};

/** Sections that are the page's own top, so they carry no hash. */
const HASHLESS: Partial<Record<Pathname, string>> = { "/listen": "top" };

const isPathname = (v: string): v is Pathname => v in TREE;

export const formatLocation = (loc: Location): string =>
  loc.hash ? `${loc.pathname}#${loc.hash}` : loc.pathname;

/** The prompt for a location: `~ $` at home, `~/listen/playlists $` deeper. */
export function formatPrompt(loc: Location): string {
  const page = loc.pathname === "/" ? "" : loc.pathname;
  const section = loc.hash ? `/${loc.hash}` : "";
  return `~${page}${section} $`;
}

/** From window.location; anything off the map reads as home. */
export function parseLocation(pathname: string, hash: string): Location {
  const path = pathname.replace(/\/+$/, "") || "/";
  return {
    pathname: isPathname(path) ? path : "/",
    hash: hash.replace(/^#/, "").toLowerCase(),
  };
}

export function parseLine(input: string): { name: string; args: string[] } {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  return { name: (parts[0] ?? "").toLowerCase(), args: parts.slice(1) };
}

/**
 * POSIX-ish resolution over the tree. `~` and an empty target are home, a
 * leading `#` is a section of the current page, `..` climbs out of a section
 * and then to home. A section is a leaf: from one, a sibling's name reaches
 * the sibling (the page is the working directory), but a path can't
 * continue below a section it has just entered.
 */
export function resolvePath(target: string, from: Location): Location | null {
  let t = target.trim().toLowerCase();
  if (t === "" || t === "~") return HOME;
  if (t.startsWith("~/")) t = t.slice(1);
  if (t.startsWith("#")) t = t.slice(1);
  t = t.replace(/#/g, "/");

  let cur: Location = t.startsWith("/") ? HOME : from;
  let entered = false;
  for (const seg of t.split("/").filter(Boolean)) {
    if (seg === ".") continue;
    if (seg === "..") {
      cur = cur.hash ? { pathname: cur.pathname, hash: "" } : HOME;
      entered = false;
      continue;
    }
    if (entered) return null;
    const node = TREE[cur.pathname];
    if (node.dirs.includes(seg)) {
      cur = { pathname: `/${seg}` as Pathname, hash: "" };
    } else if (node.sections.includes(seg)) {
      cur = { pathname: cur.pathname, hash: HASHLESS[cur.pathname] === seg ? "" : seg };
      entered = true;
    } else {
      return null;
    }
  }
  return cur;
}

/**
 * The sections of a page that are places on it rather than states of it:
 * the visitor is "in" whichever one they have scrolled to. The /listen tabs
 * are the exception; they swap content and live in the hash.
 */
export function scrollSections(pathname: Pathname): readonly string[] {
  return pathname in HASHLESS ? [] : TREE[pathname].sections;
}

/** What `cd` can reach from a page: its dirs (with a slash) then its sections. */
export function listDir(loc: Location): string[] {
  const node = TREE[loc.pathname];
  return [...node.dirs.map((d) => `${d}/`), ...node.sections];
}

// --- Commands ---

interface Command {
  name: string;
  usage: string;
  description: string;
  /** Easter eggs: not in help, not completed. */
  hidden?: boolean;
}

/** The usage column's width in help; the longest usage plus two spaces. */
export const HELP_PAD = 20;

export const COMMANDS: readonly Command[] = [
  { name: "help", usage: "help", description: "list commands" },
  { name: "cd", usage: "cd [target]", description: "navigate to a page or section" },
  { name: "ls", usage: "ls [target]", description: "list what cd can reach" },
  { name: "pwd", usage: "pwd", description: "print the current location" },
  { name: "theme", usage: "theme [dark|light]", description: "switch the theme, or toggle it" },
  { name: "effects", usage: "effects [level]", description: "auto | full | reduced | low" },
  { name: "open", usage: "open <link>", description: CONTACT_LINKS.map((l) => l.key).join(" | ") },
  { name: "np", usage: "np", description: "what spotify is playing" },
  { name: "whoami", usage: "whoami", description: "who runs this place" },
  { name: "date", usage: "date", description: "local date and time" },
  { name: "clear", usage: "clear", description: "clear the log (also ctrl+l)" },
  { name: "exit", usage: "exit", description: "hide the terminal (` brings it back)" },
  { name: "sudo", usage: "sudo", description: "", hidden: true },
  { name: "rm", usage: "rm", description: "", hidden: true },
  { name: "neofetch", usage: "neofetch", description: "", hidden: true },
];

const VISIBLE = COMMANDS.filter((c) => !c.hidden);

export const HELP_LINES: readonly string[] = VISIBLE.map(
  (c) => `${c.usage.padEnd(HELP_PAD)}${c.description}`,
);

export interface CommandContext {
  location: Location;
  theme: "dark" | "light";
  effects: { preference: PerfPreference; tier: PerfTier };
  nowPlaying: PlaybackSample | null;
  /** The prompt color, as hex. */
  accent: string;
  /** Since the page loaded. */
  uptimeMs: number;
  now: Date;
  versions: { next: string; react: string };
}

export interface OutputLine {
  kind: "out" | "err";
  text: string;
}

export type Effect =
  | { type: "navigate"; to: Location }
  | { type: "back" }
  | { type: "clear" }
  | { type: "theme"; value: "dark" | "light" }
  | { type: "effects"; value: PerfPreference }
  | { type: "open"; url: string }
  | { type: "exit" };

export interface CommandResult {
  lines: OutputLine[];
  effect?: Effect;
}

const out = (text: string): OutputLine => ({ kind: "out", text });
const err = (text: string): OutputLine => ({ kind: "err", text });
const say = (...lines: OutputLine[]): CommandResult => ({ lines });

export function formatUptime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

const NEOFETCH_ART = [
  " ▄▄▄▄▄▄▄▄ ",
  " █ >_   █ ",
  " █      █ ",
  " ▀▀▀▀▀▀▀▀ ",
];

function neofetch(ctx: CommandContext): CommandResult {
  const host = "ismael@ismaelbarajas.dev";
  const info = [
    host,
    "-".repeat(host.length),
    `framework  next ${ctx.versions.next} / react ${ctx.versions.react}`,
    `theme      ${ctx.theme}`,
    `effects    ${ctx.effects.tier} (${ctx.effects.preference})`,
    `uptime     ${formatUptime(ctx.uptimeMs)}`,
    `accent     ${ctx.accent}`,
  ];
  const rows = Math.max(NEOFETCH_ART.length, info.length);
  const blank = " ".repeat(NEOFETCH_ART[0].length);
  const lines: OutputLine[] = [];
  for (let i = 0; i < rows; i += 1) {
    lines.push(out(`${NEOFETCH_ART[i] ?? blank}   ${info[i] ?? ""}`.trimEnd()));
  }
  return { lines };
}

export function run(line: string, ctx: CommandContext): CommandResult {
  const { name, args } = parseLine(line);
  const arg = args[0] ?? "";
  if (!name) return say();

  switch (name) {
    case "help":
      return say(out("Available commands:"), ...HELP_LINES.map(out));

    case "clear":
      return { lines: [], effect: { type: "clear" } };

    case "cd": {
      if (arg === "-") return { lines: [], effect: { type: "back" } };
      const to = resolvePath(arg, ctx.location);
      if (!to) return say(err(`cd: no such directory: ${arg}`));
      return { lines: [], effect: { type: "navigate", to } };
    }

    case "ls": {
      const at = arg ? resolvePath(arg, ctx.location) : ctx.location;
      if (!at) return say(err(`ls: no such directory: ${arg}`));
      return say(out(listDir(at).join("  ")));
    }

    case "pwd":
      return say(out(formatLocation(ctx.location)));

    case "theme": {
      const value = arg ? arg.toLowerCase() : ctx.theme === "dark" ? "light" : "dark";
      if (value !== "dark" && value !== "light") return say(err("usage: theme [dark|light]"));
      if (value === ctx.theme) return say(out(`theme is already ${value}`));
      return { lines: [], effect: { type: "theme", value } };
    }

    case "effects": {
      if (!arg) {
        return say(out(`effects: ${ctx.effects.preference} (running ${ctx.effects.tier})`));
      }
      const value = arg.toLowerCase();
      if (!isPerfPreference(value)) {
        return say(err(`effects: unknown level: ${arg} (${PERF_PREFERENCES.join(" | ")})`));
      }
      return { lines: [], effect: { type: "effects", value } };
    }

    case "open": {
      const link = CONTACT_LINKS.find((l) => l.key === arg.toLowerCase());
      if (!link) {
        return say(
          err(arg ? `open: unknown link: ${arg}` : "usage: open <link>"),
          out(CONTACT_LINKS.map((l) => l.key).join(" | ")),
        );
      }
      return { lines: [], effect: { type: "open", url: link.url } };
    }

    case "np":
      return say(out(describePlayback(null, ctx.nowPlaying) ?? "nothing playing"));

    case "whoami":
      return say(out("ismael barajas, software engineer in austin, texas. this is his site."));

    case "date":
      return say(out(`${ctx.now.toDateString()} ${formatTime(ctx.now.getTime())}`));

    case "exit":
      return { lines: [], effect: { type: "exit" } };

    case "sudo":
      return say(err("nice try."));

    case "rm":
      return say(err("rm: refusing to delete the portfolio. it took ages."));

    case "neofetch":
      return neofetch(ctx);

    default:
      return say(err(`command not found: ${name}`), out("type help for a list of commands"));
  }
}

// --- Tab completion ---

export interface Completion {
  /** The input with the match (or the longest shared prefix) filled in. */
  completed?: string;
  matches: string[];
}

const commonPrefix = (words: string[]): string => {
  let prefix = words[0] ?? "";
  for (const w of words) {
    while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
};

/** Candidates for a command's argument: `base` is the part of it already settled. */
function argumentCandidates(
  name: string,
  partial: string,
  loc: Location,
): { base: string; words: string[] } | null {
  if (name === "cd" || name === "ls") {
    const cut = partial.lastIndexOf("/") + 1;
    const dirPart = partial.slice(0, cut);
    // From a section, the page is the working directory (as in resolvePath).
    const at = dirPart ? resolvePath(dirPart, loc) : { pathname: loc.pathname, hash: "" };
    if (!at || at.hash) return null;
    return { base: dirPart, words: listDir(at) };
  }
  if (name === "open") return { base: "", words: CONTACT_LINKS.map((l) => l.key) };
  if (name === "theme") return { base: "", words: ["dark", "light"] };
  if (name === "effects") return { base: "", words: [...PERF_PREFERENCES] };
  return null;
}

/** A dir completes with its slash so the next Tab descends; a word gets a space. */
export function complete(input: string, loc: Location): Completion {
  const trailingSpace = /\s$/.test(input);
  const { name, args } = parseLine(input);
  const inArgument = /\s/.test(input.trimStart());

  let base = "";
  let words: string[];
  let partial: string;
  if (!inArgument) {
    partial = input.trimStart();
    words = VISIBLE.map((c) => c.name);
  } else {
    partial = trailingSpace ? "" : (args.at(-1) ?? "");
    const found = argumentCandidates(name, partial.toLowerCase(), loc);
    if (!found) return { matches: [] };
    base = found.base;
    words = found.words;
  }

  const stem = partial.slice(base.length).toLowerCase();
  const matches = words.filter((w) => w.toLowerCase().startsWith(stem));
  if (!matches.length) return { matches: [] };

  const head = input.slice(0, input.length - partial.length);
  const fill =
    matches.length === 1
      ? `${matches[0]}${matches[0].endsWith("/") ? "" : " "}`
      : commonPrefix(matches);
  return { completed: `${head}${base}${fill}`, matches };
}
