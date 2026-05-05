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
          maxWidth: 560,
          margin: "0 auto",
          padding: "60px 24px 80px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 20px",
              background: "#fff",
              border: "3px solid #1a1a2e",
              borderRadius: 100,
              boxShadow: "4px 4px 0px #1a1a2e",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            📞 Demo personalizzata
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            {demo.pageTitle}
          </h1>
          <p style={{ color: "#71717a", fontSize: 16, lineHeight: 1.6 }}>
            {demo.pageSubtitle}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            border: "3px solid #1a1a2e",
            borderRadius: 20,
            boxShadow: "6px 6px 0px #1a1a2e",
            padding: "32px 28px",
          }}
        >
          <DemoFormClient t={demo} locale={locale} />
        </div>
      </section>
    </div>
  );
}
