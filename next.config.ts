import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core", "ffmpeg-static"],
  // Ship the @sparticuz/chromium binary (brotli files in bin/) into the social
  // cron function. It's read at runtime via chromium.executablePath(), so Next's
  // file tracer doesn't include it on its own → the reel story render crashed on
  // Vercel with "/var/task/node_modules/@sparticuz/chromium/bin does not exist".
  // NB: glob key — "[action]" would be parsed as a char-class, so use "**".
  outputFileTracingIncludes: {
    "/api/social/cron/**": ["./node_modules/@sparticuz/chromium/**"],
    // video della chat: il binario di ffmpeg-static (montaggio del video Veo)
    "/api/platform/video": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  async redirects() {
    return [
      { source: "/:locale/home", destination: "/:locale", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
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
