import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://getnearme.it"),
  other: {
    "facebook-domain-verification": "3el76s85o30orscaoxt1ceryo0tbki",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
