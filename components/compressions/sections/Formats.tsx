import FormatPill from "../atoms/FormatPill";

const COLUMNS: {
  letter: string;
  title: string;
  inputs: string[];
  outputs: string[];
  note?: string;
}[] = [
  {
    letter: "V",
    title: "Video",
    inputs: ["mp4", "mkv", "avi", "mov", "webm", "flv", "wmv", "m4v", "ts"],
    outputs: ["H.264", "H.265", "AV1"],
    note: "FFmpeg · NVENC · VideoToolbox",
  },
  {
    letter: "I",
    title: "Image",
    inputs: ["jpg", "png", "webp", "avif", "bmp", "tiff", "gif", "heic", "heif"],
    outputs: ["jpeg", "png", "webp", "avif", "gif"],
    note: "MozJPEG · oxipng · ravif",
  },
  {
    letter: "A",
    title: "Audio",
    inputs: ["mp3", "aac", "m4a", "flac", "wav", "ogg", "opus", "wma", "aiff", "alac"],
    outputs: ["mp3", "aac", "opus", "flac", "wav"],
    note: "Extract from video · custom bitrate / sample rate",
  },
  {
    letter: "P",
    title: "PDF",
    inputs: ["pdf"],
    outputs: ["screen", "ebook", "printer", "prepress"],
    note: "Ghostscript · 72 / 150 / 300 DPI",
  },
];

const Formats = () => {
  return (
    <section className="c-section" id="formats">
      <div className="c-wrap">
        <div className="c-kicker" style={{ marginBottom: "1rem" }}>
          Supported formats
        </div>
        <h2
          style={{
            fontSize: "clamp(1.75rem, 3.6vw, 2.75rem)",
            margin: "0 0 3rem",
            maxWidth: "26ch",
          }}
        >
          Four media families. Dozens of formats. One queue.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
          }}
        >
          {COLUMNS.map(({ letter, title, inputs, outputs, note }) => (
            <div
              key={title}
              style={{
                borderTop: "1px solid var(--c-border)",
                paddingTop: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}
              >
                <span
                  className="c-display"
                  style={{
                    fontSize: "4.5rem",
                    color: "var(--c-accent)",
                    lineHeight: 0.85,
                  }}
                >
                  {letter}
                </span>
                <span
                  className="c-mono"
                  style={{
                    fontSize: "0.75rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--c-text-muted)",
                  }}
                >
                  {title}
                </span>
              </div>

              <div
                className="c-mono"
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--c-text-soft)",
                  marginBottom: "0.5rem",
                }}
              >
                In
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  marginBottom: "1rem",
                }}
              >
                {inputs.map((f) => (
                  <FormatPill key={f} label={`.${f}`} />
                ))}
              </div>

              <div
                className="c-mono"
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--c-text-soft)",
                  marginBottom: "0.5rem",
                }}
              >
                Out
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  marginBottom: "1rem",
                }}
              >
                {outputs.map((f) => (
                  <FormatPill key={f} label={f} accent />
                ))}
              </div>

              {note && (
                <div
                  className="c-mono"
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--c-text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Formats;
