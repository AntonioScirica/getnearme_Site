import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "GetNearMe — App",
  robots: { index: false, follow: false },
};

// Route top-level fuori da [locale]: come /metrics, deve fornire html/body
// (il root layout non li rende, li rende il layout di [locale]).
export default function ImmoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Font del design Agente Immo: il @import dentro styles.css viene
            strippato dal bundler, vanno caricati come link diretti. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
