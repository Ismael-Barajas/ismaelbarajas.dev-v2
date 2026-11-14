import { FiShieldOff, FiLayers, FiCpu, FiZap } from "react-icons/fi";

const PILLARS = [
  {
    n: "01",
    title: "Runs offline",
    body: "Files stay on your machine, so there is no upload and no file size limit. The app has no accounts or telemetry, and its only network call is the check for its own updates.",
    icon: FiShieldOff,
  },
  {
    n: "02",
    title: "One queue for everything",
    body: "Drop a folder with MP4s, HEICs, FLACs, and PDFs together. Each file goes to the right encoder: FFmpeg, native Rust image codecs, or Ghostscript.",
    icon: FiLayers,
  },
  {
    n: "03",
    title: "Parallel where it helps",
    body: "Images run one per CPU core, or eight at a time when AVIF or HEIC is involved. Audio runs up to 16 files at once and PDFs up to 12, depending on your core count. Video and GIF run one at a time on the CPU, and two videos run at once on an NVIDIA GPU.",
    icon: FiCpu,
  },
  {
    n: "04",
    title: "GPU encoding, checked first",
    body: "NVIDIA NVENC on Windows and Linux, Apple VideoToolbox on macOS. Each encoder is verified with a test encode at startup, and one that fails is not used. If a GPU encode fails later, that file is retried on the CPU.",
    icon: FiZap,
  },
];

const Pillars = () => {
  return (
    <section className="c-section" id="why">
      <div className="c-wrap">
        <div className="c-kicker" style={{ marginBottom: "1rem" }}>
          How it works
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
            margin: "0 0 2.5rem",
            maxWidth: "24ch",
          }}
        >
          Local encoders and one queue.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {PILLARS.map(({ n, title, body, icon: Icon }) => (
            <div
              key={n}
              className="c-card"
              style={{
                padding: "1.75rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
              }}
            >
              <div
                className="c-mono"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  color: "var(--c-text-muted)",
                  textTransform: "uppercase",
                }}
              >
                <span>{n} / 04</span>
                <Icon
                  aria-hidden
                  style={{ color: "var(--c-accent)", width: 18, height: 18 }}
                />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{title}</h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--c-text-muted)",
                  lineHeight: 1.55,
                  fontSize: "0.95rem",
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pillars;
