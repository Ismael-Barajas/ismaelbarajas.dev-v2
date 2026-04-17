export type ReleaseAsset = {
  name: string;
  url: string;
  size: number;
};

export type Release = {
  version: string;
  publishedAt: string;
  htmlUrl: string;
  assets: {
    windows: ReleaseAsset | null;
    macos: ReleaseAsset | null;
    linux: ReleaseAsset | null;
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

    const pick = (re: RegExp): ReleaseAsset | null => {
      const a = (data.assets ?? []).find((x: any) => re.test(x.name));
      if (!a) return null;
      return { name: a.name, url: a.browser_download_url, size: a.size };
    };

    return {
      version: data.tag_name ?? "",
      publishedAt: data.published_at ?? "",
      htmlUrl: data.html_url ?? `https://github.com/${REPO}/releases`,
      assets: {
        windows: pick(/\.(exe|msi)$/i),
        macos: pick(/\.dmg$/i),
        linux: pick(/\.(AppImage|deb)$/i),
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
