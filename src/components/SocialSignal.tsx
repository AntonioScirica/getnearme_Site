"use client";

// Pagina /social-connected (ritorno da Meta o TikTok): avvisa la piattaforma aperta nell'altra scheda che un social e'
// stato collegato (il Profilo e il popup "Condividi sui social" ricaricano). Aperta come finestra dalla piattaforma: si chiude.
import { useEffect } from "react";
import { signalConnected } from "@/components/platform/socialApi";

export default function SocialSignal() {
  useEffect(() => {
    signalConnected();
    if (window.opener && !window.opener.closed) setTimeout(() => window.close(), 1800);
  }, []);
  return null;
}
