"use client";

import dynamic from "next/dynamic";
import "@/immo/styles.css";

// ssr:false obbligatorio: lo store del prototipo legge window.matchMedia e
// localStorage negli initializer degli useState.
const ImmoApp = dynamic(() => import("@/immo/Root.jsx"), { ssr: false });

export default function ImmoClient() {
  return (
    <div className="immo-root">
      <ImmoApp />
    </div>
  );
}
