import SizeTicker from "../atoms/SizeTicker";

interface Block {
  slot: string;
  kicker: string;
  title: string;
  body: string;
  specs: string[];
  caption: string;
}

const BLOCKS: Block[] = [
  {
    slot: "video-controls",
    kicker: "01 / Video",
    title: "Granular control over every encode.",
    body: "CRF or bitrate. Pick a codec, pick a resolution, pick a frame rate. FastStart for web. Hardware acceleration auto-detected.",
    specs: ["H.264 · H.265 · AV1", "NVENC · VideoToolbox", "CRF 0-51", "FastStart"],
    caption: "Screenshot — Video controls panel",
  },
  {
    slot: "image-batch",
    kicker: "02 / Image",
    title: "Modern image codecs without the headache.",
    body: "MozJPEG, oxipng, WebP, AVIF — up to 8 in parallel. Strip metadata, resize on the fly, lock aspect ratio.",
    specs: ["MozJPEG", "oxipng", "WebP", "AVIF (ravif)", "8x parallel"],
    caption: "Screenshot — Image batch with thumbnails",
  },
  {
    slot: "audio-extract",
    kicker: "03 / Audio",
    title: "Audio compression and extraction in one place.",
    body: "Compress MP3, AAC, FLAC, Opus. Right-click any video to pull its audio out as MP3, AAC, FLAC, Opus, or WAV.",
    specs: ["MP3 · AAC · Opus · FLAC", "64-320 kbps", "Extract from video", "Animated waveform"],
    caption: "Screenshot — Audio queue with waveform",
  },
  {
    slot: "pdf-gif",
    kicker: "04 / Bonus",
    title: "PDFs and Video → GIF, included.",
    body: "Ghostscript-powered PDF presets from Screen to Prepress. Two-pass palette GIF encoding for tiny, sharp clips.",
    specs: ["PDF: Screen / Ebook / Printer / Prepress", "GIF: 5-30 fps", "16-256 colors", "Floyd-Steinberg dither"],
    caption: "Screenshot — PDF & GIF settings",
  },
  {
    slot: "history-logs",
    kicker: "05 / Observability",
    title: "Every job is auditable.",
    body: "Searchable history with size savings and duration. A live log viewer filters by ERROR, WARN, INFO, DEBUG, TRACE.",
    specs: ["Compression history", "Per-file ETA", "Log viewer", "Validated parameters"],
    caption: "Screenshot — History + log viewer",
  },
];

const Capabilities = () => {
  return (
    <section className="c-section" id="capabilities">
      <div className="c-wrap">
        <div className="c-kicker" style={{ marginBottom: "1rem" }}>
          Capabilities
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
            margin: "0 0 1rem",
            maxWidth: "24ch",
          }}
        >
          The full toolbox.
        </h2>
        <div
          style={{
            marginBottom: "3.5rem",
            color: "var(--c-text-muted)",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span>One drop of a 412 MB capture later:</span>
          <SizeTicker beforeMB={412} afterMB={38} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5rem",
          }}
        >
          {BLOCKS.map((b, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={b.slot}
                className="c-cap-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "3rem",
                  alignItems: "center",
                }}
              >
                <div style={{ order: reverse ? 2 : 1 }}>
                  <div className="c-kicker" style={{ marginBottom: "1rem" }}>
                    {b.kicker}
                  </div>
                  <h3
                    style={{
                      fontSize: "clamp(1.4rem, 2.6vw, 2rem)",
                      margin: "0 0 1rem",
                      maxWidth: "22ch",
                    }}
                  >
                    {b.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--c-text-muted)",
                      lineHeight: 1.6,
                      margin: "0 0 1.5rem",
                      maxWidth: "44ch",
                    }}
                  >
                    {b.body}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.4rem",
                    }}
                  >
                    {b.specs.map((s) => (
                      <span key={s} className="c-pill">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <figure
                  className="c-shot-slot"
                  data-screenshot-slot={b.slot}
                  style={{ order: reverse ? 1 : 2, margin: 0 }}
                  aria-label={b.caption}
                >
                  <span>{b.caption}</span>
                </figure>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 800px) {
          :global(.c-cap-row) {
            grid-template-columns: 1fr !important;
          }
          :global(.c-cap-row > *) {
            order: initial !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Capabilities;
