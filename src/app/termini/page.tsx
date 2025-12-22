import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function TerminiServizio() {
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
            <span className="text-3xl">📄</span>
            <h1 className="text-4xl font-serif font-bold text-slate-900 m-0">Termini di Servizio</h1>
          </div>
          
          <p className="text-slate-500 text-sm mb-8">Ultimo aggiornamento: 22/12/2025</p>

          <p className="text-slate-600 leading-relaxed">
            I presenti Termini disciplinano l&apos;utilizzo del sito web getnearme.it e dell&apos;estensione browser GetNearMe.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">1. Natura del Servizio</h2>
          <p className="text-slate-600 leading-relaxed">
            GetNearMe è uno strumento di supporto decisionale che organizza e confronta dati disponibili su immobili e quartieri.<br />
            GetNearMe non è un&apos;agenzia immobiliare e non fornisce consulenza professionale, legale, fiscale o immobiliare.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">2. Origine dei dati</h2>
          <p className="text-slate-600 leading-relaxed">
            Le informazioni visualizzate derivano da annunci immobiliari di terze parti e da fonti pubbliche disponibili.<br />
            GetNearMe non ha alcun controllo sui contenuti degli annunci e non è responsabile per eventuali errori, omissioni o variazioni successive.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">3. Analisi e stime</h2>
          <p className="text-slate-600 leading-relaxed">
            Le analisi e le stime fornite sono puramente indicative, basate su valori medi e dati disponibili, e non costituiscono una valutazione immobiliare ufficiale.<br />
            Ogni decisione presa dall&apos;utente resta sotto la sua esclusiva responsabilità.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">4. Account e crediti</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Alcune funzionalità del Servizio richiedono la creazione di un account.<br />
            I crediti:
          </p>
          <ul className="text-slate-600 space-y-2 list-disc pl-6">
            <li>sono associati all&apos;account dell&apos;utente;</li>
            <li>non hanno scadenza;</li>
            <li>non sono rimborsabili.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">5. Uso consentito</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            È vietato:
          </p>
          <ul className="text-slate-600 space-y-2 list-disc pl-6">
            <li>utilizzare il Servizio per finalità illecite o non autorizzate;</li>
            <li>tentare di aggirare i sistemi di sicurezza o il sistema di crediti;</li>
            <li>effettuare scraping massivo o uso commerciale non autorizzato dei contenuti.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">6. Disponibilità del Servizio</h2>
          <p className="text-slate-600 leading-relaxed">
            Alcune funzionalità possono variare in base alla disponibilità delle fonti, al sito analizzato o al browser utilizzato.<br />
            GetNearMe si riserva il diritto di modificare, sospendere o interrompere il Servizio, in tutto o in parte, in qualsiasi momento.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">7. Limitazione di responsabilità</h2>
          <p className="text-slate-600 leading-relaxed">
            Nei limiti consentiti dalla legge, GetNearMe non è responsabile per eventuali danni derivanti dall&apos;uso o dall&apos;impossibilità di utilizzo del Servizio.
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

