import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiDownload, FiGithub, FiShieldOff, FiZap } from "react-icons/fi";
import AppMark from "../atoms/AppMark";
import type { Release } from "../lib/getLatestRelease";
import { timeAgo } from "lib/time";

const BLOB_PUBLIC_HOST =
  "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com";

interface Props {
  release: Release | null;
  /** Render time from getStaticProps; keeps "released 3 hr ago" hydration-safe. */
  generatedAt: number;
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

const Hero = ({ release, generatedAt }: Props) => {
  const platform = useSyncExternalStore(
    subscribePlatform,
    detectPlatform,
    getServerPlatform,
  );

  const downloadAsset = release && platform ? release.assets[platform] : null;
  const downloadHref =
    downloadAsset?.url ??
    release?.htmlUrl ??
    "https://github.com/Ismael-Barajas/compressions/releases";

  return (
    <header className="c-section" style={{ paddingTop: "4.5rem" }}>
      <div className="c-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            alignItems: "center",
            gap: "3rem",
          }}
          className="c-hero-grid"
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <AppMark size={40} />
              <span style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                Compressions
              </span>
              {release?.version && (
                <span className="c-pill c-pill-accent">{release.version}</span>
              )}
            </div>

            <h1
              className="c-display"
              style={{
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
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
                fontSize: "clamp(1.05rem, 1.4vw, 1.2rem)",
                lineHeight: 1.55,
                color: "var(--c-text-muted)",
                maxWidth: "44ch",
                margin: "0 0 2rem",
              }}
            >
              A desktop app that compresses video, images, audio, and PDFs in
              one queue. Everything runs on your machine. Video encodes use your
              GPU when one is available.
            </p>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
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
              {release?.publishedAt && (
                <span>released {timeAgo(release.publishedAt, generatedAt)}</span>
              )}
              <span>Windows · macOS · Linux</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <FiShieldOff aria-hidden /> No network calls
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <FiZap aria-hidden /> NVENC and VideoToolbox
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
              All platforms and installers
            </Link>
          </div>

          <div
            style={{ position: "relative" }}
            className="c-hero-shot"
            aria-hidden="true"
          >
            <div
              style={{
                position: "absolute",
                inset: "-2rem",
                background:
                  "radial-gradient(circle at 50% 60%, var(--c-accent-glow), transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <figure className="c-window">
              <div className="c-window-bar">
                <span />
                <span />
                <span />
              </div>
              <Image
                src={`${BLOB_PUBLIC_HOST}/images/compressions/image-batch.png`}
                alt="Compressions with a mixed queue of files being compressed"
                width={1367}
                height={985}
                priority
                sizes="(max-width: 800px) 100vw, 55vw"
              />
            </figure>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 800px) {
          :global(.c-hero-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Hero;
