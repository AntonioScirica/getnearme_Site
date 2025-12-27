import Link from "next/link";
import { defaultLocale } from "@/lib/i18n";

export default function NotFound() {
  return (
    <html lang={defaultLocale}>
      <body className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-6">
          <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-6">
            Pagina non trovata
          </h2>
          <p className="text-slate-500 mb-8 max-w-md">
            La pagina che stai cercando non esiste o è stata spostata.
          </p>
          <Link
            href={`/${defaultLocale}`}
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Torna alla Home
          </Link>
        </div>
      </body>
    </html>
  );
}


