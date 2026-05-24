import { FaWindows, FaApple, FaLinux } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import type { Release, ReleaseAsset } from "../lib/getLatestRelease";
import { formatBytes, timeAgo } from "../lib/getLatestRelease";

interface Props {
  release: Release | null;
}

const PLATFORMS: {
  key: keyof Release["assets"];
  label: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  fallbackNote: string;
}[] = [
  { key: "windows", label: "Windows", icon: FaWindows, fallbackNote: "NSIS installer" },
  { key: "macos", label: "macOS", icon: FaApple, fallbackNote: "Apple Silicon" },
  { key: "linux", label: "Linux", icon: FaLinux, fallbackNote: "AppImage / .deb" },
];

const Card = ({
  label,
  Icon,
  asset,
  releasesUrl,
  fallbackNote,
}: {
  label: string;
  Icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  asset: ReleaseAsset | null;
  releasesUrl: string;
  fallbackNote: string;
}) => {
  return (
    <div
      className="c-card"
      style={{
        padding: "2rem 1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        minHeight: "240px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Icon size={28} aria-hidden />
        <span
          className="c-mono"
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            color: "var(--c-text-muted)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        {asset ? (
          <>
            <div
              className="c-mono"
              style={{
                fontSize: "0.85rem",
                color: "var(--c-text)",
                wordBreak: "break-all",
                lineHeight: 1.4,
              }}
            >
              {asset.name}
            </div>
            <div
              className="c-mono"
              style={{
                marginTop: "0.4rem",
                fontSize: "0.72rem",
                color: "var(--c-text-muted)",
              }}
            >
              {formatBytes(asset.size)}
            </div>
          </>
        ) : (
          <div
            className="c-mono"
            style={{ fontSize: "0.78rem", color: "var(--c-text-muted)" }}
          >
            {fallbackNote} — see all releases on GitHub.
          </div>
        )}
      </div>

      <a
        className={asset ? "c-btn-primary" : "c-btn-secondary"}
        href={asset?.url ?? releasesUrl}
        target={asset ? undefined : "_blank"}
        rel={asset ? "noopener" : "noopener noreferrer"}
        style={{ justifyContent: "center", width: "100%" }}
      >
        {asset ? "Download" : "Browse releases"}
      </a>
    </div>
  );
};

const Download = ({ release }: Props) => {
  const releasesUrl =
    release?.htmlUrl ?? "https://github.com/Ismael-Barajas/compressions/releases";

  return (
    <section
      className="c-section"
      id="download"
      style={{ position: "relative" }}
    >
      <div className="c-wrap">
        <div className="c-kicker" style={{ marginBottom: "1rem" }}>
          Download
          {release?.version && (
            <>
              <span style={{ color: "var(--c-text-muted)" }}>·</span>
              <span style={{ color: "var(--c-text-muted)" }}>
                {release.version}
              </span>
              {release.publishedAt && (
                <>
                  <span style={{ color: "var(--c-text-muted)" }}>·</span>
                  <span style={{ color: "var(--c-text-muted)" }}>
                    {timeAgo(release.publishedAt)}
                  </span>
                </>
              )}
            </>
          )}
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
            margin: "0 0 1rem",
            maxWidth: "22ch",
          }}
        >
          Pick your platform.
        </h2>
        <p
          style={{
            color: "var(--c-text-muted)",
            margin: "0 0 3rem",
            maxWidth: "50ch",
            lineHeight: 1.55,
          }}
        >
          Free and open source. Distributed exclusively through GitHub Releases.
          The auto-updater takes care of the rest.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {PLATFORMS.map(({ key, label, icon: Icon, fallbackNote }) => (
            <Card
              key={key}
              label={label}
              Icon={Icon}
              asset={release?.assets[key] ?? null}
              releasesUrl={releasesUrl}
              fallbackNote={fallbackNote}
            />
          ))}
        </div>

        <div style={{ marginTop: "2rem" }}>
          <a
            href={releasesUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--c-accent)",
              fontSize: "0.9rem",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            View all releases <FiExternalLink aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Download;
