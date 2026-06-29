"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Site-wide conversion-event wiring:
//  - Lead: any click on a "book a demo" CTA (Cal.com uses [data-cal-link]).
//  - Purchase: landing with ?purchase=success (set this as the Stripe payment-link
//    success URL, e.g. https://getnearme.it/it?purchase=success&value=99).
export default function AnalyticsEvents() {
  useEffect(() => {
    // Lead — demo CTA clicks (event delegation, covers every [data-cal-link]).
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-cal-link]");
      if (el) track("Lead", { content_name: "demo_booking" });
    };
    document.addEventListener("click", onClick, true);

    // Purchase — Stripe payment-link success redirect.
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("purchase") === "success") {
      const value = Number(sp.get("value")) || undefined;
      track("Purchase", { currency: "EUR", ...(value ? { value } : {}) });
    }

    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
