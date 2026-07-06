import { ArrowRight } from "lucide-react";

// Compact mid-article CTA — light card, real site button classes
// (neo-cta-blue / neo-cta-outline), same ones used on the homepage.
// "Prenota una demo" opens the real Cal.com booking widget (data-cal-link),
// same pattern as the homepage — not an internal /demo page.
export default function InlineCta() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(26,26,46,0.10)",
        borderRadius: 16,
        boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
        padding: "24px 28px",
        margin: "32px 0",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>
          Provalo sulla tua prossima proprietà
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#71717a" }}>
          Staging AI, video e report in pochi minuti.
        </p>
      </div>
      <a
        data-cal-link="getnearme/30min"
        data-cal-config='{"layout":"month_view"}'
        className="neo-shadow neo-cta-blue"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 15,
          fontWeight: 700,
          padding: "12px 24px",
          borderRadius: 10,
          textDecoration: "none",
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        Prenota una demo <ArrowRight size={16} strokeWidth={2.5} />
      </a>
    </div>
  );
}
