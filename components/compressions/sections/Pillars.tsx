import { FiShieldOff, FiLayers, FiMaximize2, FiZap } from "react-icons/fi";

const PILLARS = [
  {
    n: "01",
    title: "Offline & Private",
    body: "Files never leave your machine. No accounts, no uploads, no telemetry — just FFmpeg, Ghostscript, and native Rust codecs running locally.",
    icon: FiShieldOff,
  },
  {
    n: "02",
    title: "Batch + Mixed Media",
    body: "Drop a folder of MP4s, HEICs, FLACs, and PDFs into one queue. Each file is routed to the right codec automatically.",
    icon: FiLayers,
  },
  {
    n: "03",
    title: "Any Size, Any Length",
    body: "No file size cap. No duration cap. A 12-hour 4K capture or a 30,000-image batch — limited only by your disk.",
    icon: FiMaximize2,
  },
  {
    n: "04",
    title: "Hardware Accelerated",
    body: "NVIDIA NVENC on Windows / Linux. Apple VideoToolbox on macOS. Falls back to software when unavailable.",
    icon: FiZap,
  },
];

const Pillars = () => {
  return (
    <section className="c-section" id="why">
      <div className="c-wrap">
        <div className="c-kicker" style={{ marginBottom: "1rem" }}>
          Why it's different
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
            margin: "0 0 3rem",
            maxWidth: "22ch",
          }}
        >
          Built for the moment a cloud uploader would have given up.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1px",
            background: "var(--c-border)",
            border: "1px solid var(--c-border)",
          }}
        >
          {PILLARS.map(({ n, title, body, icon: Icon }) => (
            <div
              key={n}
              className="c-card"
              style={{
                padding: "2rem 1.75rem",
                background: "var(--c-bg)",
                border: "none",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                minHeight: "260px",
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
              <h3 style={{ margin: 0, fontSize: "1.35rem" }}>{title}</h3>
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
