"use client";

import { useEffect } from "react";
import { flush, track } from "@/lib/analytics";

// Su ogni pagina: clic su "prenota una demo" (Lead) e invio degli eventi rimasti in coda (lib/analytics), riprovando
// per 30 s mentre Pixel e GA4 si caricano (lazyOnload) o appena arriva il consenso ai cookie.
export default function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-cal-link]");
      if (el) track("Lead", { content_name: "demo_booking" });
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("agenteimmo:consent", flush);
    let n = 0;
    const t = setInterval(() => { flush(); if (++n >= 30) clearInterval(t); }, 1000);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("agenteimmo:consent", flush); clearInterval(t); };
  }, []);

  return null;
}
