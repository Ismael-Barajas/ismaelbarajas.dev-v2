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
    title: "Video: codec, quality, size, and frame rate.",
    body: "H.264, H.265, or AV1. Quality by CRF from 0 to 51, or a bitrate. Downscale to 4K, 1080p, 720p, or 480p with the aspect ratio kept. Set the frame rate, choose an audio track codec, and turn on FastStart for web playback.",
    specs: [
      "H.264 · H.265 · AV1",
      "NVENC · VideoToolbox",
      "CRF 0 to 51",
      "FastStart",
      "AAC · Opus audio",
    ],
    caption: "Compress tab: video codec, quality, and resolution controls",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/video-controls.png`,
    width: 905,
    height: 988,
  },
  {
    slot: "image-batch",
    kicker: "02 / Image",
    title: "Images: JPEG, PNG, WebP, AVIF, and animated GIF.",
    body: "MozJPEG, oxipng, WebP, and AVIF encoders run in Rust, up to eight files at a time. Resize by one dimension or both, strip or keep EXIF. Animated GIFs are re-quantized frame by frame and stay animated.",
    specs: [
      "MozJPEG",
      "oxipng",
      "WebP",
      "AVIF (ravif)",
      "Animated GIF",
      "8 in parallel",
    ],
    caption: "Mixed-media queue with image format and quality settings",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/image-batch.png`,
    width: 1367,
    height: 985,
  },
  {
    slot: "audio-extract",
    kicker: "03 / Audio",
    title: "Audio: compress, or pull it out of a video.",
    body: "Output MP3, AAC, Opus, FLAC, or WAV, or keep the source format. Bitrate presets from 64k to 320k or a custom value, and a sample rate of your choice. Right-click any video to extract its audio in the same formats.",
    specs: [
      "MP3 · AAC · Opus · FLAC · WAV",
      "64k to 320k",
      "Extract from video",
      "Parallel batches",
    ],
    caption: "Tools tab: extract audio from any video in five formats",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/audio-extract.png`,
    width: 311,
    height: 466,
  },
  {
    slot: "gif-conversion",
    kicker: "04 / Bonus",
    title: "PDFs, and video to GIF.",
    body: "PDF presets Screen, Ebook, Printer, and Prepress through Ghostscript, with an image DPI override. GIF conversion builds the palette and encodes in a single FFmpeg pass, with controls for frame rate, width, color count, and dither.",
    specs: [
      "Screen · Ebook · Printer · Prepress",
      "GIF 5 to 30 fps",
      "16 to 256 colors",
      "Floyd-Steinberg · Bayer · None",
    ],
    caption: "GIF conversion: frame rate, max width, palette, dither",
    image: `${BLOB_PUBLIC_HOST}/images/compressions/gif-conversion.png`,
    width: 301,
    height: 407,
  },
  {
    slot: "history",
    kicker: "05 / Observability",
    title: "History and logs.",
    body: "A searchable history of the last 1000 compressions with size savings and duration. A log viewer that filters by level and keeps seven days of daily logs. Every parameter is validated before a job starts.",
    specs: ["Last 1000 jobs", "Per-file ETA", "Log viewer", "7 days of logs"],
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
          What it can do.
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
          <span>A 412 MB screen recording after the Web Optimized preset:</span>
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
