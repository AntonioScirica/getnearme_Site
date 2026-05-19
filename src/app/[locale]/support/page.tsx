import { locales, type Locale } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import { HeadphonesIcon } from "lucide-react";
import type { Metadata } from "next";
import SupportFormClient from "./SupportFormClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Assistenza - GetNearMe",
    description: "Hai bisogno di aiuto? Contattaci e ti risponderemo il prima possibile.",
  };
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <Navbar locale={locale as Locale} />
      <main
        style={{
          minHeight: "100vh",
          background: "#fafafa",
          padding: "120px 16px 60px",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <HeadphonesIcon size={28} color="#2563eb" />
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#1a1a2e",
                marginBottom: 8,
              }}
            >
              Come possiamo aiutarti?
            </h1>
            <p style={{ color: "#71717a", fontSize: 16, margin: 0 }}>
              Compila il form e ti risponderemo il prima possibile.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              padding: 32,
            }}
          >
            <SupportFormClient locale={locale} />
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 13,
              marginTop: 24,
            }}
          >
            Oppure scrivici direttamente a{" "}
            <a href="mailto:info@getnearme.it" style={{ color: "#2563eb" }}>
              info@getnearme.it
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
