import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Tutorial — GetNearMe",
    description:
      "Scopri come funziona GetNearMe e come può potenziare il lavoro della tua agenzia immobiliare.",
    alternates: {
      canonical: `https://getnearme.it/${locale}/tutorial`,
    },
  };
}

const videos = [
  { id: "I7kcgpiGQH8", title: "Come scaricare GetNearMe!", duration: "0:46" },
  { id: "mMpozP8SM48", title: "La sezione Immobile di GetNearMe", duration: "0:46" },
  { id: "jY4_33HrD0E", title: "Analizza il quartiere intorno a te con GetNearMe!", duration: "0:47" },
  { id: "bNnjbHegtjg", title: "Calcolare il prezzo medio al m2 di una zona con GetNearMe", duration: "0:42" },
  { id: "klTtrvPqMlI", title: "Comparare i vari immobili con GetNearMe!", duration: "0:45" },
  { id: "-AxXOzMCzLQ", title: "Report Personalizzabili per le Agenzie Immobiliari", duration: "0:46" },
  { id: "VfLpWoesIrU", title: "Get AI per arredare gli immobili!", duration: "0:37" },
  { id: "C_pkjIiW68o", title: "A cosa servono i crediti in GetNearMe?", duration: "1:45" },
  { id: "BXCkVZp6nik", title: "Ottenere crediti con la newsletter!", duration: "0:44" },
  // { id: "YW2k6azRNcY", title: "Ho trovato un problema nell'estensione!", duration: "0:39" },
];

export default async function Tutorial({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <Navbar locale={locale as Locale} />

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16">
          <h1
            className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4"
            style={{
              fontFamily: 'var(--font-old-standard), "Old Standard TT", serif',
            }}
          >
            Tutorial
          </h1>
          <p className="text-lg text-slate-600 font-light leading-relaxed">
            Scopri come sfruttare al meglio GetNearMe nella tua agenzia con le nostre guide video.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl border border-slate-300 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-video bg-slate-100">
                <Image
                  src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-slate-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-4 pt-4 pb-3">
                <h3 className="font-semibold text-base text-slate-900 leading-snug group-hover:text-blue-500 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-400 mt-2 font-light">{video.duration}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href={`/${locale}`}
            className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            {t.nav.backToHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
