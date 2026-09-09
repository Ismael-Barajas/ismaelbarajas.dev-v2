// Builds the favicon set from one source image.
// Usage: node scripts/make-favicon.mjs <path-to-image>
//
// Writes to public/:
//   favicon.ico          16 / 32 / 48 px (PNG-in-ICO, all modern browsers)
//   favicon-32.png       tab icon for browsers that prefer PNG
//   apple-touch-icon.png 180 px, iOS home screen (opaque, rounded by iOS)
//   icon-192.png         Android / PWA
//   icon-512.png         Android / PWA
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node scripts/make-favicon.mjs <image>");
  process.exit(1);
}

const out = path.resolve("public");
await mkdir(out, { recursive: true });

// Square-crop from the centre so a rectangular source keeps its subject.
const base = sharp(src).rotate();
const { width = 0, height = 0 } = await base.metadata();
const side = Math.min(width, height);
const square = base.extract({
  left: Math.floor((width - side) / 2),
  top: Math.floor((height - side) / 2),
  width: side,
  height: side,
});

const png = (size, opts = {}) =>
  square
    .clone()
    .resize(size, size, { kernel: "lanczos3", ...opts })
    .png({ compressionLevel: 9 })
    .toBuffer();

/** ICO container holding PNG-encoded images. */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dirSize = 16 * entries.length;
  let offset = 6 + dirSize;
  const dir = [];
  const blobs = [];
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    dir.push(e);
    blobs.push(buf);
  }
  return Buffer.concat([header, ...dir, ...blobs]);
}

const sizes = [16, 32, 48];
const icoEntries = [];
for (const size of sizes) {
  icoEntries.push({ size, buf: await png(size) });
}
await writeFile(path.join(out, "favicon.ico"), ico(icoEntries));
await writeFile(path.join(out, "favicon-32.png"), icoEntries[1].buf);
await writeFile(path.join(out, "icon-192.png"), await png(192));
await writeFile(path.join(out, "icon-512.png"), await png(512));
// iOS composites onto black if there is transparency; flatten to the site bg.
await writeFile(
  path.join(out, "apple-touch-icon.png"),
  await square
    .clone()
    .resize(180, 180, { kernel: "lanczos3" })
    .flatten({ background: "#121212" })
    .png({ compressionLevel: 9 })
    .toBuffer(),
);

console.log(`Wrote favicon set to ${out} from ${path.basename(src)} (${side}px square)`);
