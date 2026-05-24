import { useSyncExternalStore } from "react";
import Link from "next/link";
import { FiDownload, FiGithub, FiShieldOff, FiZap } from "react-icons/fi";
import BarsMark from "../atoms/BarsMark";
import type { Release } from "../lib/getLatestRelease";
import { timeAgo } from "../lib/getLatestRelease";

interface Props {
  release: Release | null;
}

type Platform = "windows" | "macos" | "linux" | null;

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return null;
};

const platformLabel: Record<Exclude<Platform, null>, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

const subscribePlatform = () => () => {};
const getServerPlatform = (): Platform => null;

const Hero = ({ release }: Props) => {
  const platform = useSyncExternalStore(
    subscribePlatform,
    detectPlatform,
    getServerPlatform,
  );

  const downloadAsset =
    release && platform ? release.assets[platform] : null;
  const downloadHref =
    downloadAsset?.url ??
    release?.htmlUrl ??
    "https://github.com/Ismael-Barajas/compressions/releases";

  return (
    <header className="c-section" style={{ paddingTop: "5rem" }}>
      <div className="c-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: "3rem",
          }}
          className="c-hero-grid"
        >
          <div>
            <div className="c-kicker" style={{ marginBottom: "1.5rem" }}>
              Local · Batch · Open source
            </div>
            <h1
              className="c-display"
              style={{
                fontSize: "clamp(3rem, 8vw, 6.25rem)",
                margin: 0,
                marginBottom: "1.25rem",
              }}
            >
              Compress<span style={{ color: "var(--c-accent)" }}>.</span>
              <br />
              Locally<span style={{ color: "var(--c-accent)" }}>.</span>
              <br />
              In bulk<span style={{ color: "var(--c-accent)" }}>.</span>
            </h1>
            <p
              style={{
                fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
                lineHeight: 1.5,
                color: "var(--c-text-muted)",
                maxWidth: "44ch",
                margin: "0 0 2.25rem",
              }}
            >
              A desktop app for compressing video, images, audio, and PDFs —
              fully offline, mixed media in one queue, any size, any length.
              Hardware-accelerated where it counts.
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.85rem",
                flexWrap: "wrap",
                marginBottom: "1.75rem",
              }}
            >
              <a className="c-btn-primary" href={downloadHref} rel="noopener">
                <FiDownload aria-hidden />
                {downloadAsset
                  ? `Download for ${platform ? platformLabel[platform] : ""}`
                  : "Download from GitHub"}
              </a>
              <a
                className="c-btn-secondary"
                href="https://github.com/Ismael-Barajas/compressions"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FiGithub aria-hidden />
                View on GitHub
              </a>
            </div>

            <div
              className="c-mono c-tnum"
              style={{
                display: "flex",
                gap: "1.25rem",
                flexWrap: "wrap",
                fontSize: "0.78rem",
                color: "var(--c-text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {release?.version && (
                <span>
                  <span style={{ color: "var(--c-accent)" }}>●</span>{" "}
                  {release.version}
                </span>
              )}
              {release?.publishedAt && (
                <span>released {timeAgo(release.publishedAt)}</span>
              )}
              <span>Windows · macOS · Linux</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <FiShieldOff aria-hidden /> No network calls
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <FiZap aria-hidden /> Hardware accelerated
              </span>
            </div>

            <Link
              href="#download"
              style={{
                display: "inline-block",
                marginTop: "1.5rem",
                fontSize: "0.85rem",
                color: "var(--c-accent)",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              See all platforms ↓
            </Link>
          </div>

          <div
            style={{ position: "relative", display: "grid", placeItems: "center" }}
            aria-hidden="true"
          >
            <div
              style={{
                position: "absolute",
                inset: "-2.5rem",
                background:
                  "radial-gradient(circle at center, var(--c-accent-glow), transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "relative",
                padding: "2rem",
                background: "color-mix(in srgb, var(--c-bg-elevated) 50%, transparent)",
                border: "1px solid var(--c-border)",
                backdropFilter: "blur(10px)",
              }}
              className="c-hero-mark"
            >
              <BarsMark size={260} />
              <div
                className="c-mono"
                style={{
                  marginTop: "1rem",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--c-text-muted)",
                  textAlign: "center",
                }}
              >
                ▮▮▮ COMPRESSIONS
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.c-hero-grid) {
            grid-template-columns: 1fr !important;
          }
          :global(.c-hero-mark) {
            justify-self: center;
          }
        }
      `}</style>
    </header>
  );
};

export default Hero;
