import ImmoClient from "./ImmoClient";

// Nuova faccia di GetNearMe (design "Agente Immo"): app client-only, il suo
// store usa window/localStorage all'init quindi niente SSR.
export const metadata = { title: "GetNearMe — App", robots: { index: false } };

export default function ImmoAppPage() {
  return <ImmoClient />;
}
