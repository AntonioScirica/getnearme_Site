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
  // Dominio vetrina degli agenti: robots.txt e sitemap.xml propri (il proxy non vede i percorsi con estensione)
  async rewrites() {
    const host = process.env.NEXT_PUBLIC_PORTFOLIO_HOST;
    if (!host) return [];
    const has = [{ type: "host" as const, value: `(www\\.)?${host.replace(/\./g, "\\.")}` }];
    return {
      beforeFiles: [
        { source: "/robots.txt", has, destination: "/api/site/robots" },
        { source: "/sitemap.xml", has, destination: "/api/site/sitemap" },
      ],
      afterFiles: [],
      fallback: [],
    };
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
