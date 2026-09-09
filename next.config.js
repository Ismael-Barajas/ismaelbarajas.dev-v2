/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// sha256 of the inline theme bootstrap script in pages/_document.tsx. Update
// it if that script changes (node -e with crypto.createHash("sha256")).
const THEME_SCRIPT_HASH = "'sha256-baNOSqnRIReJmt4+zJCYlN8xrF88G3C2wYenYtBG6Jc='";

/**
 * Content-Security-Policy, shipped as Report-Only first. Violations show in
 * the browser console (no report-uri is configured). Once a deploy runs clean,
 * rename the header key to "Content-Security-Policy" to enforce it.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${THEME_SCRIPT_HASH} https://va.vercel-scripts.com${
    isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""
  }`,
  // GSAP/motion write inline style attributes; fonts come from two hosts.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.fontshare.com",
  "img-src 'self' data: blob: https://i.scdn.co https://mosaic.scdn.co https://*.spotifycdn.com https://opengraph.githubassets.com https://*.public.blob.vercel-storage.com",
  // Blob client uploads PUT straight to Vercel Blob; Analytics posts vitals.
  "connect-src 'self' https://*.blob.vercel-storage.com https://blob.vercel-storage.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

module.exports = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  transpilePackages: ["three", "@react-three/fiber", "@react-three/postprocessing", "its-fine"],
  turbopack: {},
  images: {
    qualities: [75, 100],
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      // Playlist covers: auto-generated mosaics and custom uploads.
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "*.spotifycdn.com" },
      { protocol: "https", hostname: "opengraph.githubassets.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
};
