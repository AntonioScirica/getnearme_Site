import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // Ship the @sparticuz/chromium binary (brotli files in bin/) into the social
  // cron function. It's read at runtime via chromium.executablePath(), so Next's
  // file tracer doesn't include it on its own → the reel story render crashed on
  // Vercel with "/var/task/node_modules/@sparticuz/chromium/bin does not exist".
  outputFileTracingIncludes: {
    "/api/social/cron/[action]": ["./node_modules/@sparticuz/chromium/bin/**"],
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
