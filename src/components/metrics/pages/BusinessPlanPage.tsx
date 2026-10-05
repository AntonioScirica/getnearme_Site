"use client";

import type { CSSProperties } from "react";
import BusinessPlanView from "@/components/platform/BusinessPlanView";

// Business plan dinamico con i dati reali (bp-actuals accetta la chiave del dashboard).
// BusinessPlanView usa i colori del tema (Tailwind v4, variabili --color-*): qui le si ridefinisce scure come il dashboard.
const DARK = {
  "--color-white": "#161920", // card
  "--color-canvas": "#222631", // campi, pulsanti secondari
  "--color-ink": "#e6e7ea",
  "--color-muted": "#8b8f99",
  "--color-line": "rgba(255,255,255,.1)",
  "--color-black": "#ffffff", // ring-black/5 diventa un bordo chiaro leggero
} as CSSProperties;

export default function BusinessPlanPage({ authKey }: { authKey: string }) {
  return (
    <div style={DARK} className="font-sans text-ink">
      <BusinessPlanView userKey="metrics-dashboard" actualsHeaders={{ "x-metrics-key": authKey }} />
    </div>
  );
}
