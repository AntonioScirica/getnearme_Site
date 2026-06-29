"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

// Site-wide conversion-event wiring:
//  - Lead: any click on a "book a demo" CTA (Cal.com uses [data-cal-link]).
// Purchase/Subscribe fire on the Stripe success pages themselves
// (/checkout/success, /checkout/video-success) — no Stripe config change needed.
export default function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-cal-link]");
      if (el) track("Lead", { content_name: "demo_booking" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
