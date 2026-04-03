import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetNearMe Metrics",
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
