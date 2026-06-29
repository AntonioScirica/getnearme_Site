// Fire a conversion event to BOTH Meta Pixel (fbq) and Google Analytics 4 (gtag).
// Safe to call anywhere client-side; no-ops if a tag hasn't loaded.
//
// Events wired in the app:
//   Lead                 → user clicked a "book a demo" CTA (Cal.com)
//   CompleteRegistration → account email confirmed (/confirm)
//   Purchase             → Stripe payment-link success landing (?purchase=success)
//
// The marketing person then sets the campaign optimization goal to these events
// in Meta Ads Manager / GA4.

type FbEvent = "Lead" | "CompleteRegistration" | "Purchase" | "Subscribe";
// GA4 recommended event names paired with each Meta event.
const GA_NAME: Record<FbEvent, string> = {
  Lead: "generate_lead",
  CompleteRegistration: "sign_up",
  Purchase: "purchase",
  Subscribe: "purchase",
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: FbEvent, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", event, params);
  } catch {
    /* pixel not ready */
  }
  try {
    window.gtag?.("event", GA_NAME[event], params);
  } catch {
    /* ga not ready */
  }
}
