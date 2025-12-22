import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            ← Torna alla home
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🍪</span>
            <h1 className="text-4xl font-serif font-bold text-slate-900 m-0">Cookie Policy</h1>
          </div>
          
          <p className="text-slate-500 text-sm mb-8">Ultimo aggiornamento: 22/12/2025</p>

          <p className="text-slate-600 leading-relaxed">
            La presente Cookie Policy si applica esclusivamente al sito web getnearme.it.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">1. Cosa sono i cookie</h2>
          <p className="text-slate-600 leading-relaxed">
            I cookie sono piccoli file di testo che il sito invia al dispositivo dell&apos;utente per migliorare l&apos;esperienza di navigazione e il corretto funzionamento del sito.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">2. Tipologie di cookie utilizzate</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Il sito utilizza:
          </p>
          <ul className="text-slate-600 space-y-2 list-disc pl-6">
            <li>cookie tecnici, necessari al funzionamento del sito e alla gestione delle preferenze dell&apos;utente;</li>
            <li>eventuali cookie di terze parti collegati a servizi tecnici o di pagamento.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">3. Gestione dei cookie</h2>
          <p className="text-slate-600 leading-relaxed">
            L&apos;utente può gestire o disabilitare i cookie tramite le impostazioni del proprio browser.<br />
            La disabilitazione dei cookie tecnici può compromettere il corretto funzionamento del sito.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">4. Consenso</h2>
          <p className="text-slate-600 leading-relaxed">
            I cookie tecnici non richiedono il consenso dell&apos;utente.<br />
            Per eventuali cookie non tecnici viene richiesto il consenso tramite apposito banner.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2025 GetNearMe. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

