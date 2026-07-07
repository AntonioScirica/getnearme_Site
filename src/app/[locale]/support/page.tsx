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
          padding: "108px 14px 54px",
        }}
      >
        <div
          style={{
            maxWidth: 504,
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <HeadphonesIcon size={28} color="#2563eb" />
            </div>
            <h1
              style={{
                fontSize: 29,
                fontWeight: 900,
                color: "#1a1a2e",
                marginBottom: 7,
              }}
            >
              Come possiamo aiutarti?
            </h1>
            <p style={{ color: "#71717a", fontSize: 14, margin: 0 }}>
              Compila il form e ti risponderemo il prima possibile.
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              padding: 29,
            }}
          >
            <SupportFormClient locale={locale} />
          </div>

          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: 12,
              marginTop: 22,
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
