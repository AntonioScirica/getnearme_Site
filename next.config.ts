import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer/Chromium must not be bundled (native binaries, runtime paths)
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
