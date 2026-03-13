/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    qualities: [75, 100],
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "opengraph.githubassets.com" },
    ],
  },
};
