import type { Metadata } from "next";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";
import DemoFormClient from "./DemoFormClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Prenota una demo | GetNearMe",
    description:
      "Compila il modulo e ti contatteremo per organizzare una demo personalizzata di GetNearMe per la tua agenzia.",
  };
}

export default async function DemoPage({ params }: Props) {
  const { locale } = (await params) as { locale: Locale };
  const t = translations[locale];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const demo = (t as any).landing?.demo ?? {
    pageTitle: "Prenota una demo per la tua agenzia",
    pageSubtitle:
      "Compila il modulo e ti contatteremo per organizzare una demo personalizzata di GetNearMe.",
    fieldName: "Nome e cognome",
    fieldEmail: "Email",
    fieldAgencyName: "Nome agenzia",
    fieldPhone: "Telefono (opzionale)",
    fieldMessage: "Messaggio (opzionale)",
    submit: "Prenota demo",
    submitting: "Invio in corso...",
    successTitle: "Richiesta inviata!",
    successMessage: "Ti contatteremo al più presto per organizzare la demo.",
    errorMessage: "Si è verificato un errore. Riprova più tardi.",
    backToHome: "Torna alla home",
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "#fafaf8", color: "#1a1a2e" }}
    >
      <div className="sticky top-0 z-50">
        <Navbar locale={locale} />
      </div>

      <section
        style={{
          maxWidth: 504,
          margin: "0 auto",
          padding: "54px 22px 72px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 18px",
              background: "#fff",
              border: "1px solid rgba(26,26,46,0.10)",
              borderRadius: 90,
              boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
              fontWeight: 700,
              fontSize: 13,
              marginBottom: 22,
            }}
          >
            📞 Demo personalizzata
          </div>

          <h1
            style={{
              fontSize: "clamp(23px, 4vw, 34px)",
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: 11,
            }}
          >
            {demo.pageTitle}
          </h1>
          <p style={{ color: "#71717a", fontSize: 14, lineHeight: 1.6 }}>
            {demo.pageSubtitle}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(26,26,46,0.10)",
            borderRadius: 18,
            boxShadow: "0 4px 16px rgba(16,24,40,0.08)",
            padding: "29px 25px",
          }}
        >
          <DemoFormClient t={demo} locale={locale} />
        </div>
      </section>
    </div>
  );
}
