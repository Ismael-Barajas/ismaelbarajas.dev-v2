export type ReleaseAsset = {
  name: string;
  url: string;
  size: number;
};

export type ReleaseNoteItem = {
  /** Bold lead-in from the bullet, if it had one. */
  title: string | null;
  body: string;
};

export type ReleaseNoteSection = {
  heading: string;
  items: ReleaseNoteItem[];
};

export type Release = {
  version: string;
  publishedAt: string;
  htmlUrl: string;
  /** Parsed from the release body (markdown), grouped by ### heading. */
  notes: ReleaseNoteSection[];
  assets: {
    windows: ReleaseAsset | null;
    macos: ReleaseAsset | null;
    linux: ReleaseAsset | null;
  };
  /** Other installers for the same platform (MSI, Intel DMG, deb, rpm). */
  extras: {
    windows: ReleaseAsset[];
    macos: ReleaseAsset[];
    linux: ReleaseAsset[];
  };
};

const REPO = "Ismael-Barajas/compressions";

export async function getLatestRelease(): Promise<Release | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers },
    );
    if (!res.ok) return null;
    const data = await res.json();

    const toAsset = (a: any): ReleaseAsset => ({
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
    });
    const all: any[] = (data.assets ?? []).filter(
      (x: any) => !/\.(sig|json|tar\.gz)$/i.test(x.name),
    );
    // Primary installer per platform, in order of preference, then the rest.
    const split = (
      order: RegExp[],
    ): { primary: ReleaseAsset | null; extras: ReleaseAsset[] } => {
      const matches = order.flatMap((re) =>
        all.filter((x) => re.test(x.name)).map(toAsset),
      );
      const seen = new Set<string>();
      const unique = matches.filter((m) =>
        seen.has(m.name) ? false : (seen.add(m.name), true),
      );
      return { primary: unique[0] ?? null, extras: unique.slice(1) };
    };

    const windows = split([/setup\.exe$/i, /\.exe$/i, /\.msi$/i]);
    const macos = split([/aarch64\.dmg$/i, /\.dmg$/i]);
    const linux = split([/\.AppImage$/i, /\.deb$/i, /\.rpm$/i]);

    return {
      version: data.tag_name ?? "",
      publishedAt: data.published_at ?? "",
      htmlUrl: data.html_url ?? `https://github.com/${REPO}/releases`,
      notes: parseReleaseNotes(data.body ?? ""),
      assets: {
        windows: windows.primary,
        macos: macos.primary,
        linux: linux.primary,
      },
      extras: {
        windows: windows.extras,
        macos: macos.extras,
        linux: linux.extras,
      },
    };
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function timeAgo(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const mo = Math.floor(day / 30);
  const yr = Math.floor(day / 365);
  if (yr > 0) return `${yr}y ago`;
  if (mo > 0) return `${mo}mo ago`;
  if (day > 0) return `${day}d ago`;
  if (hr > 0) return `${hr}h ago`;
  if (min > 0) return `${min}m ago`;
  return `just now`;
}

/** Strips inline markdown (bold, italics, code, links) to plain text. */
const plain = (md: string): string =>
  md
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Turns a GitHub release body into sections of bullets. Understands the
 * shape the compressions CHANGELOG uses: "### Heading" then "- **Title**: body"
 * or plain "- text" bullets. Anything else is ignored.
 */
export function parseReleaseNotes(body: string): ReleaseNoteSection[] {
  const sections: ReleaseNoteSection[] = [];
  let current: ReleaseNoteSection | null = null;

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      current = { heading: plain(heading[1]), items: [] };
      sections.push(current);
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (!bullet) continue;
    if (!current) {
      current = { heading: "Changes", items: [] };
      sections.push(current);
    }
    const text = bullet[1];
    // "**Title**: body" or "**Title** body"
    const lead = text.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    if (lead) {
      current.items.push({ title: plain(lead[1]), body: plain(lead[2]) });
    } else {
      current.items.push({ title: null, body: plain(text) });
    }
  }

  return sections.filter((s) => s.items.length > 0);
}
