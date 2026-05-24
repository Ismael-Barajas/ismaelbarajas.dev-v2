import Image from "next/image";
import SizeTicker from "../atoms/SizeTicker";

const BLOB_PUBLIC_HOST =
  "https://vsgkt473qeluf9ed.public.blob.vercel-storage.com";

interface Block {
  slot: string;
  kicker: string;
  title: string;
  body: string;
  specs: string[];
  caption: string;
  image: string;
  width: number;
  height: number;
}

const BLOCKS: Block[] = [
  {
    slot: "video-controls",
    kicker: "01 / Video",
    title: "Granular control over every encode.",
    body: "CRF or bitrate. Pick a codec, pick a resolution, pick a frame rate. FastStart for web. Hardware acceleration auto-detected.",
    specs: ["H.264 · H.265 · AV1", "NVENC · VideoToolbox", "CRF 0-51", "FastStart"],
    caption: "Compress tab — video codec, quality, and resolution controls",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/video-controls.png`,
    width: 905,
    height: 988,
  },
  {
    slot: "image-batch",
    kicker: "02 / Image",
    title: "Modern image codecs without the headache.",
    body: "MozJPEG, oxipng, WebP, AVIF — up to 8 in parallel. Strip metadata, resize on the fly, lock aspect ratio.",
    specs: ["MozJPEG", "oxipng", "WebP", "AVIF (ravif)", "8x parallel"],
    caption: "Mixed-media queue with image format and quality settings",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/image-batch.png`,
    width: 1367,
    height: 985,
  },
  {
    slot: "audio-extract",
    kicker: "03 / Audio",
    title: "Audio compression and extraction in one place.",
    body: "Compress MP3, AAC, FLAC, Opus. Right-click any video to pull its audio out as MP3, AAC, FLAC, Opus, or WAV.",
    specs: ["MP3 · AAC · Opus · FLAC", "64-320 kbps", "Extract from video", "Animated waveform"],
    caption: "Tools tab — extract audio from any video in 5 formats",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/audio-extract.png`,
    width: 311,
    height: 466,
  },
  {
    slot: "gif-conversion",
    kicker: "04 / Bonus",
    title: "PDFs and Video → GIF, included.",
    body: "Ghostscript-powered PDF presets from Screen to Prepress. Two-pass palette GIF encoding for tiny, sharp clips.",
    specs: ["PDF: Screen / Ebook / Printer / Prepress", "GIF: 5-30 fps", "16-256 colors", "Floyd-Steinberg dither"],
    caption: "GIF conversion controls — frame rate, max width, palette, dither",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/gif-conversion.png`,
    width: 301,
    height: 407,
  },
  {
    slot: "history",
    kicker: "05 / Observability",
    title: "Every job is auditable.",
    body: "Searchable history with size savings and duration. A live log viewer filters by ERROR, WARN, INFO, DEBUG, TRACE.",
    specs: ["Compression history", "Per-file ETA", "Log viewer", "Validated parameters"],
    caption: "Compression history with per-file size deltas",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/history.png`,
    width: 672,
    height: 633,
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
                  className="c-shot"
                  data-screenshot-slot={b.slot}
                  style={{ order: reverse ? 1 : 2 }}
                >
                  <Image
                    src={b.image}
                    alt={b.caption}
                    width={b.width}
                    height={b.height}
                    sizes="(max-width: 800px) 100vw, 50vw"
                  />
                  <figcaption className="c-shot-cap">{b.caption}</figcaption>
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
