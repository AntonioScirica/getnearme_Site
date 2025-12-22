import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicy() {
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
            <span className="text-3xl">🔒</span>
            <h1 className="text-4xl font-serif font-bold text-slate-900 m-0">Privacy Policy</h1>
          </div>
          
          <p className="text-slate-500 text-sm mb-8">Ultimo aggiornamento: 22/12/2025</p>

          <p className="text-slate-600 leading-relaxed">
            La presente Privacy Policy descrive le modalità di trattamento dei dati personali degli utenti che utilizzano il sito web getnearme.it e l&apos;estensione browser GetNearMe (di seguito, il &quot;Servizio&quot;).
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">1. Titolare del trattamento</h2>
          <p className="text-slate-600 leading-relaxed">
            Il titolare del trattamento è persona fisica, identificata come GetNearMe.<br />
            Per qualsiasi richiesta relativa al trattamento dei dati personali è possibile contattare:<br />
            📧 <a href="mailto:info@getnearme.it" className="text-blue-500 hover:text-blue-600">info@getnearme.it</a>
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">2. Tipologie di dati trattati</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Nel corso dell&apos;utilizzo del Servizio possono essere trattate le seguenti categorie di dati:
          </p>
          <ul className="text-slate-600 space-y-2 list-disc pl-6">
            <li>dati forniti volontariamente dall&apos;utente (ad esempio indirizzo email in fase di registrazione);</li>
            <li>dati tecnici e di navigazione (indirizzo IP, tipo di browser, sistema operativo, data e ora di accesso);</li>
            <li>dati relativi all&apos;utilizzo del Servizio (analisi effettuate, crediti utilizzati, preferenze di utilizzo).</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-4">
            Non vengono trattati dati personali sensibili.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">3. Finalità del trattamento</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            I dati personali sono trattati per le seguenti finalità:
          </p>
          <ul className="text-slate-600 space-y-2 list-disc pl-6">
            <li>consentire la registrazione e la gestione dell&apos;account utente;</li>
            <li>fornire le funzionalità di analisi e confronto offerte dal Servizio;</li>
            <li>gestire il sistema di crediti e l&apos;accesso alle funzionalità;</li>
            <li>inviare comunicazioni di servizio necessarie al funzionamento del Servizio;</li>
            <li>inviare comunicazioni informative solo previo consenso esplicito dell&apos;utente;</li>
            <li>migliorare il funzionamento e la sicurezza del Servizio.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">4. Base giuridica del trattamento</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Il trattamento dei dati si basa su:
          </p>
          <ul className="text-slate-600 space-y-2 list-disc pl-6">
            <li>esecuzione di un contratto o di misure precontrattuali;</li>
            <li>consenso dell&apos;utente, ove richiesto;</li>
            <li>legittimo interesse del titolare al corretto funzionamento e miglioramento del Servizio.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">5. Modalità di trattamento</h2>
          <p className="text-slate-600 leading-relaxed">
            Il trattamento dei dati avviene mediante strumenti informatici, adottando misure di sicurezza adeguate a garantire riservatezza, integrità e disponibilità delle informazioni.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">6. Conservazione dei dati</h2>
          <p className="text-slate-600 leading-relaxed">
            I dati personali sono conservati per il tempo necessario alle finalità per cui sono stati raccolti o fino alla cancellazione dell&apos;account da parte dell&apos;utente, salvo obblighi di legge.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">7. Condivisione dei dati</h2>
          <p className="text-slate-600 leading-relaxed">
            I dati possono essere condivisi con fornitori di servizi tecnici e operativi (ad esempio servizi di hosting, pagamento o invio email), esclusivamente per finalità connesse all&apos;erogazione del Servizio.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">8. Diritti dell&apos;utente</h2>
          <p className="text-slate-600 leading-relaxed">
            L&apos;utente può esercitare i diritti previsti dal Regolamento UE 2016/679 (GDPR), inclusi accesso, rettifica, cancellazione e opposizione, scrivendo a <a href="mailto:info@getnearme.it" className="text-blue-500 hover:text-blue-600">info@getnearme.it</a>.
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

