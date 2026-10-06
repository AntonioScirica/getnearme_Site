import type { NextConfig } from "next";

const OG_FILES = ["./src/fonts/og/**", "./public/immo/logo-mark.svg", "./public/immo/home/staging-before.webp", "./public/immo/home/staging-after.webp"];

const nextConfig: NextConfig = {
  // solo sviluppo: aprire il dev server dal telefono sulla stessa rete (IP del Mac)
  allowedDevOrigins: ["192.168.1.*"],
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
    // Video dell'annuncio e Venduto: solo montaggio (le lettere sono in src/lib/reel/glyphs.json, importato)
    "/api/platform/video-reel": ["./node_modules/ffmpeg-static/ffmpeg"],
    // anteprime dei link (next/og): caratteri e immagini letti da disco a runtime
    "/api/og": OG_FILES,
    "/api/og/**": OG_FILES,
  },
  // login con un indirizzo da login (la pagina e' quella del checkout, che senza piano scelto fa solo l'accesso)
  async rewrites() {
    return [{ source: "/:locale/accedi", destination: "/:locale/checkout/agency" }];
  },
  async redirects() {
    return [
      { source: "/:locale/home", destination: "/:locale", permanent: true },
      { source: "/home", destination: "/", permanent: true },
      { source: "/:locale/agente-immo", destination: "/:locale", permanent: true },
      { source: "/:locale/blog/getnearme-vs-canva-strumenti-agenti-immobiliari", destination: "/it/blog/agente-immo-vs-canva-strumenti-agenti-immobiliari", permanent: true },
      // pagine di GetNearMe (estensione, vecchi piani, guida acquisto casa): non esistono piu', si va alla home
      { source: "/:locale/ambassador/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/demo/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/download/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/pricing_ext/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/reference/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/tutorial/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/update/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/guida-acquisto-casa/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/bonus-result/:path*", destination: "/:locale", permanent: true },
      { source: "/:locale/checkout/success", destination: "/:locale/dashboard#/piano", permanent: true },
      { source: "/:locale/checkout/video-success", destination: "/:locale/dashboard", permanent: true },
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
