import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AuthCta from "@/components/AuthCta";

// Invito finale del blog (indice e articoli): Prova gratis (login, poi la prova) e i prezzi della home. Telefono: pulsanti uno sotto l'altro a tutta larghezza.
export default function EndCta({ locale, title }: { locale: string; title: string }) {
  return (
    <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 22px 72px", textAlign: "center" }}>
      <div className="rounded-[32px] bg-ink px-6 py-12 text-white">
        <h2 className="mx-auto max-w-xl font-display text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-white/70">
          Foto arredate con l&apos;AI, video per i social e il tuo sito con gli immobili. Senza fotografo né web agency.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <AuthCta
            locale={locale}
            href={`/${locale}/accedi?next=/${locale}/prova`}
            dashLabel="Vai alla dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink max-sm:w-full"
          >
            Prova gratis <ArrowRight size={16} />
          </AuthCta>
          <Link href={`/${locale}#prezzi`} className="inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-semibold text-white ring-1 ring-white/30 max-sm:w-full">
            Vedi i prezzi
          </Link>
        </div>
      </div>
    </section>
  );
}
