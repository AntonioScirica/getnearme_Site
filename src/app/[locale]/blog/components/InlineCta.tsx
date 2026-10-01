import { ArrowRight } from "lucide-react";
import AuthCta from "@/components/AuthCta";

// Invito a meta' articolo: carta chiara, Prova gratis come nella home (login, poi la prova). Su telefono il pulsante va a tutta larghezza.
export default function InlineCta({ locale }: { locale: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(26,26,46,0.10)",
        borderRadius: 16,
        boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
        padding: "22px 25px",
        margin: "29px 0",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1d1d1f" }}>
          Provalo sulla tua prossima casa
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#71717a" }}>
          Carica una foto e la vedi arredata. Gratis.
        </p>
      </div>
      <AuthCta
        locale={locale}
        href={`/${locale}/accedi?next=/${locale}/prova`}
        dashLabel="Vai alla dashboard"
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-5 text-sm font-semibold text-white max-sm:w-full"
      >
        Prova gratis <ArrowRight size={16} />
      </AuthCta>
    </div>
  );
}
