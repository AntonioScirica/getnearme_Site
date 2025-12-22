import Link from "next/link";
import { MapPin } from "lucide-react";
import HeroFloatingIcons from "@/components/HeroFloatingIcons";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">

      {/* --- Background Split --- */}
      {/* Background #F5F5F5 ending a bit more than half screen (e.g. 75vh) */}
      <div className="absolute top-0 left-0 w-full h-[75vh] bg-[#F5F5F5] -z-10" />

      {/* --- Navbar --- */}
      <Navbar />

      <main className="pt-32 pb-0 relative bg-white">
        {/* Gray Background Header Effect */}
        <div className="absolute top-0 left-0 w-full h-[90vh] bg-[#F5F5F5] z-0"></div>

        {/* --- Hero Section --- */}
        <section className="relative px-4 max-w-7xl mx-auto text-center mb-32 z-10">

          <HeroFloatingIcons />

          <div className="relative z-10 max-w-4xl mx-auto space-y-4 pt-16 pb-10">
            <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-[1.05] tracking-tight">
              <span className="font-old-standard font-bold">Scegli casa tua con</span>
              <br />
              <span className="font-old-standard font-bold">più</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">consapevolezza</span>.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              GetNearMe è uno strumento di supporto decisionale che analizza immobili e quartieri,
              confronta i dati disponibili e fornisce stime indicative dei costi per aiutarti a valutare più opzioni in modo strutturato.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-medium mt-8">
              <Link
                href="#"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg font-sans"
              >
                Aggiungi Estensione
              </Link>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          {/* White card with browser-like header */}
          <div className="mt-20 relative mx-auto w-full max-w-full shadow-2xl rounded-t-2xl bg-white border border-[#E4E4E4] p-1 pb-0">
            <div className="w-full bg-slate-50 rounded-t-xl overflow-hidden shadow-inner border-b border-slate-100">
              {/* Browser Header */}
              <div className="h-8 bg-[#F5F5F5] flex items-center px-4 gap-2 border-b border-[#E4E4E4]">
                <div className="flex gap-1.5 opacity-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                </div>
              </div>

              {/* Content Placeholder */}
              <div className="aspect-video bg-white relative">
                {/* Split View Mockup */}
                <div className="absolute inset-0 flex">
                  {/* Map side */}
                  <div className="w-1/2 bg-blue-50/50 border-r border-[#E4E4E4] p-4">
                    <div className="w-full h-full rounded-lg bg-blue-100/30 border border-blue-100 relative overflow-hidden">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <MapPin className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                  </div>
                  {/* Data side */}
                  <div className="w-1/2 p-6 flex flex-col gap-4">
                    <div className="h-6 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-4 w-1/2 bg-slate-50 rounded"></div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="h-20 bg-slate-50 rounded border border-slate-100"></div>
                      <div className="h-20 bg-slate-50 rounded border border-slate-100"></div>
                    </div>
                    <div className="mt-auto h-12 bg-blue-500/10 rounded border border-blue-500/20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text below mockup */}
          <div className="mt-20 max-w-4xl mx-auto text-center">
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-light">
              GetNearMe è un’estensione per Google Chrome che ti aiuta a prendere decisioni migliori quando cerchi casa.
              Non vedi solo le informazioni di base: organizza i dati dell’annuncio, confronta più immobili, analizza i servizi attorno e confronta prezzi reali della zona… tutto in automatico mentre navighi sui portali immobiliari che già usi.
            </p>
          </div>

        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Grid Section --- */}
        <section id="funzionalita" className="px-4 max-w-7xl mx-auto py-24">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 max-w-md leading-tight text-center md:text-left">
              <span className="font-old-standard">L&apos;immobile, nei suoi dati</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">essenziali</span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light leading-relaxed text-center md:text-right max-w-sm">
              GetNearMe organizza le informazioni in passaggi chiari, per aiutarti a confrontare immobili e contesto in modo strutturato.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {[
              {
                title: "I dati dell'immobile",
                description: "Prezzo, superficie, €/m², tipologia e caratteristiche principali vengono raccolti e organizzati a partire dai dati dell'annuncio."
              },
              {
                title: "Il contesto intorno all'immobile",
                description: "Servizi, trasporti, scuole, aree verdi e punti di interesse vengono analizzati in base alla posizione e alle distanze."
              },
              {
                title: "Prezzi in relazione alla zona",
                description: "Il prezzo dell'annuncio viene confrontato con i valori medi di riferimento disponibili per la zona."
              },
              {
                title: "Una vista comparativa",
                description: "Le informazioni vengono affiancate per evidenziare differenze rilevanti tra più opzioni analizzate."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-2">
                  <div className="aspect-4/3 bg-[#F5F5F5] rounded-lg"></div>
                </div>
                <div className="px-3 py-6">
                  <h3 className="font-serif text-lg mb-2 text-slate-900 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 font-light">
            Le analisi e le stime mostrate sono indicative e non costituiscono una valutazione immobiliare.
          </p>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- FAQ Section --- */}
        <section id="faq" className="px-6 max-w-7xl mx-auto py-24 border-t border-slate-100">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4 leading-tight text-center md:text-left">
              <span className="font-old-standard">Domande</span> <span className="font-merriweather italic font-light text-3xl md:text-4xl">frequenti</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Che tipo di informazioni mostra GetNearMe?",
                description: "GetNearMe mostra dati organizzati provenienti da annunci immobiliari e fonti pubbliche, relativi all'immobile, al quartiere e a indicatori di prezzo e costo."
              },
              {
                title: "GetNearMe è un portale immobiliare o un'agenzia?",
                description: "No. GetNearMe non pubblica annunci e non svolge attività di intermediazione immobiliare. È uno strumento di analisi e confronto dei dati disponibili."
              },
              {
                title: "Le analisi fornite sono valutazioni ufficiali?",
                description: "No. Le analisi e le stime mostrate sono indicative e non costituiscono una valutazione immobiliare né una consulenza professionale."
              },
              {
                title: "Da dove provengono i dati?",
                description: "I dati derivano dagli annunci immobiliari analizzati e da fonti pubbliche disponibili. Le informazioni vengono elaborate per facilitarne la lettura e il confronto."
              },
              {
                title: "Le stime dei costi sono precise?",
                description: "No. Le stime dei costi sono proiezioni indicative basate su valori medi e possono variare in base alle caratteristiche specifiche dell'immobile e dell'operazione."
              },
              {
                title: "Posso confrontare più immobili tra loro?",
                description: "Sì. GetNearMe consente di affiancare più immobili per confrontare dati, contesto e indicatori in una vista comparativa."
              }
            ].map((item, i) => (
              <div key={i} className="space-y-3 text-center md:text-left">
                <h4 className="font-serif text-xl font-medium text-slate-900">
                  {item.title}
                </h4>
                <p className="text-base text-slate-500 leading-relaxed font-light max-w-md mx-auto md:mx-0">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Pricing Section --- */}
        <section id="prezzi" className="px-4 max-w-7xl mx-auto py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-2 leading-tight">
              <span className="font-old-standard">Accesso alle</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">analisi</span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
              Scegli il livello di accesso più adatto al numero di analisi che desideri effettuare.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-3 mb-12">
            {[
              {
                name: "500 crediti",
                subtitle: "Per iniziare",
                price: "Free",
                description: "Consente di effettuare alcune analisi complete per confrontare immobili e contesto in modo strutturato.",
                buttonText: "Registrati ora",
                isFree: true
              },
              {
                name: "500 crediti",
                subtitle: "Per iniziare",
                price: "4,99",
                description: "Consente di effettuare alcune analisi complete per confrontare immobili e contesto in modo strutturato.",
                buttonText: "Acquista ora"
              },
              {
                name: "1.500 crediti",
                subtitle: "Confronti approfonditi",
                price: "9,99",
                popular: true,
                description: "Adatto a confrontare più opzioni e approfondire le differenze tra immobili, quartieri e costi stimati.",
                buttonText: "Acquista ora"
              },
              {
                name: "5.000 crediti",
                subtitle: "Analisi estese",
                price: "24,99",
                description: "Pensato per chi analizza molte opzioni e desidera confronti più approfonditi nel tempo.",
                buttonText: "Acquista ora"
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl border-2 p-6 hover:shadow-xl transition-all flex flex-col ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Più scelto
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-serif text-slate-900 mb-1">{plan.name}</h3>
                  {plan.subtitle && (
                    <p className="text-sm text-slate-500 font-light mb-4">{plan.subtitle}</p>
                  )}
                  {plan.price && (
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-slate-900">{plan.price === "Free" ? "Free" : `€${plan.price}`}</span>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 font-light leading-relaxed">{plan.description}</p>
                </div>

                <button className={`w-full px-6 py-2.5 rounded-[8px] transition-all text-lg font-sans mt-auto ${plan.isFree
                  ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 font-medium'
                  : 'bg-blue-500 text-white hover:bg-blue-600 font-bold'
                  }`}>
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center space-y-2 text-sm text-slate-500 font-light">
            <p>Pagamento sicuro con carta, PayPal e principali provider.</p>
            <p>Crediti disponibili immediatamente dopo l&apos;acquisto.</p>
            <p>Nessun abbonamento. Nessuna scadenza.</p>
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Final CTA Section --- */}
        <section id="estensione" className="px-4 max-w-7xl mx-auto py-32">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight mb-2">
              <span className="font-old-standard">Confronta immobili</span><br />
              <span className="font-old-standard">in modo</span> <span className="font-merriweather italic font-light text-4xl md:text-5xl">strutturato</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              GetNearMe ti aiuta a organizzare e confrontare i dati disponibili per valutare più opzioni con maggiore chiarezza.
            </p>
            <div className="pt-2">
              <button className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg font-sans">
                Aggiungi estensione
              </button>
            </div>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
            <div className="grid md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
              {/* Brand Column */}
              <div className="md:col-span-1">
                <h3 className="text-2xl font-serif mb-4">GetNearMe</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  Strumento di supporto decisionale per l&apos;analisi comparativa di immobili e quartieri.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold mb-4">Prodotto</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#funzionalita" className="text-slate-400 hover:text-white transition-colors font-light">Funzionalità</a></li>
                  <li><a href="#prezzi" className="text-slate-400 hover:text-white transition-colors font-light">Prezzi</a></li>
                  <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors font-light">FAQ</a></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-semibold mb-4">Legale</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/privacy" className="text-slate-400 hover:text-white transition-colors font-light">Privacy Policy</a></li>
                  <li><a href="/cookie" className="text-slate-400 hover:text-white transition-colors font-light">Cookie Policy</a></li>
                  <li><a href="/termini" className="text-slate-400 hover:text-white transition-colors font-light">Termini di Servizio</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-800">
              <p className="text-slate-400 text-sm font-light text-center">
                © 2025 GetNearMe. Tutti i diritti riservati.
              </p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
