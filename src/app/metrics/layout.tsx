import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

// file nel repo (src/fonts): niente Google Fonts alla build
const inter = localFont({ src: "../../fonts/Inter-normal.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
const jetbrains = localFont({ src: "../../fonts/JetBrainsMono-normal.woff2", weight: "100 800", variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Agente Immo Metrics",
  robots: { index: false, follow: false },
};

export default function MetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrains.variable} ${inter.className} antialiased bg-[#0d0f14] text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
