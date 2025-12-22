import type { Metadata } from "next";
import { Old_Standard_TT, Merriweather } from "next/font/google";
import "./globals.css";

const oldStandard = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-old-standard"
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-merriweather"
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
      <body className={`${merriweather.variable} ${oldStandard.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
