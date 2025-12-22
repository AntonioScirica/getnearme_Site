import type { Metadata } from "next";
import { Inter, Old_Standard_TT } from "next/font/google";
import "./globals.css";
import LanguageWrapper from "@/components/LanguageWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter"
});

const oldStandard = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard"
});

export const metadata: Metadata = {
  title: "GetNearMe - Daily Bonus",
  description: "Riscatta il tuo bonus giornaliero!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oldStandard.variable} ${inter.className} antialiased`}>
        <LanguageWrapper>
          {children}
        </LanguageWrapper>
      </body>
    </html>
  );
}
