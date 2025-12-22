'use client';

import { LanguageProvider } from "@/context/LanguageContext";

export default function LanguageWrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

