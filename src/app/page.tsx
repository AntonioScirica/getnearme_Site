import Link from "next/link";
import {
  Menu,
  ChevronRight,
  Layers,
  Box,
  Building2,
  BedDouble,
  Bath,
  CheckCircle2,
  MapPin,
  TrendingUp,
  LayoutDashboard,
  ShoppingCart
} from "lucide-react";
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

      <main className="pt-32 pb-20 relative bg-white">
        {/* Gray Background Header Effect */}
        <div className="absolute top-0 left-0 w-full h-[90vh] bg-[#F5F5F5] z-0"></div>

        {/* --- Hero Section --- */}
        <section className="relative px-4 max-w-7xl mx-auto text-center mb-32 z-10">

          <HeroFloatingIcons />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6 pt-16 pb-10">
            <h1 className="text-4xl md:text-6xl font-serif text-slate-900 leading-[1.05] tracking-tight">
              Confronta immobili,<br />
              con più <span className="italic font-light">consapevolezza</span>.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              GetNearMe è uno strumento di supporto decisionale che analizza immobili e quartieri,
              confronta i dati disponibili e fornisce stime indicative per aiutarti a valutare più opzioni in modo strutturato.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 text-sm font-medium">
              <Link
                href="#"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-[8px] hover:bg-blue-600 transition-all font-bold text-lg"
              >
                Scarica l'estensione
              </Link>
              <Link
                href="#"
                className="w-full sm:w-auto px-6 py-3.5 text-slate-900 hover:text-black transition-all flex items-center justify-center gap-1 font-semibold group"
              >
                Vedi come funziona <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              <div className="aspect-[16/9] bg-white relative">
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

          <p className="mt-24 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light px-4">
            GetNearMe è uno strumento di supporto decisionale che analizza immobili e quartieri,
            confronta i dati disponibili e fornisce stime indicative per aiutarti a valutare più opzioni in modo strutturato.
          </p>

        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Feature Split Section --- */}
        <section className="px-4 max-w-7xl mx-auto py-24 bg-white">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left Column: Text Content */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-serif text-slate-900 leading-tight">
                Tutto in un unico <br />
                <span className="italic">strumento</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed font-light max-w-md">
                GetNearMe organizza e confronta i dati disponibili su immobili e quartieri,
                includendo stime indicative dei costi.
              </p>
              <button className="bg-blue-500 text-white px-6 py-2.5 rounded-[8px] font-semibold hover:bg-blue-600 transition-colors shadow-sm">
                Riscatta crediti!
              </button>
            </div>

            {/* Right Column: Bento Grid Layout */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Top Left Box */}
              <div className="h-56 bg-[#F5F5F5] rounded-xl"></div>

              {/* Top Right Box */}
              <div className="h-56 bg-[#F5F5F5] rounded-xl"></div>

              {/* Bottom Wide Box */}
              <div className="col-span-2 h-56 bg-[#F5F5F5] rounded-xl"></div>
            </div>
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Grid Section --- */}
        <section className="px-4 max-w-7xl mx-auto py-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 max-w-md leading-tight">
              L'immobile, nei<br />
              suoi dati <span className="italic">essenziali</span>.
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-light leading-relaxed md:text-right max-w-sm">
              Informazioni organizzate per aiutarti a confrontare immobili e contesto in modo strutturato.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                title: "L'immobile, nei suoi dati essenziali",
                description: "Prezzo, superficie, €/m², tipologia, caratteristiche principali e costi ricorrenti, organizzati a partire dai dati dell'annuncio."
              },
              {
                title: "Il contesto intorno all'immobile",
                description: "Servizi, trasporti, scuole, aree verdi e altri punti di interesse, con distanze calcolate e visualizzazione su mappa."
              },
              {
                title: "Prezzi a confronto con le medie di zona",
                description: "Confronto tra il prezzo dell'annuncio e i valori medi di riferimento, con indicatori visivi basati sui dati disponibili."
              },
              {
                title: "Più opzioni, una vista comparativa",
                description: "Affianca più immobili per confrontare caratteristiche, contesto e stime indicative in un'unica vista."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-2">
                  <div className="aspect-[4/3] bg-[#F5F5F5] rounded-lg"></div>
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


        {/* --- FAQ Section (Text Grid) --- */}
        <section className="px-6 max-w-7xl mx-auto py-24 border-t border-slate-100">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4 leading-tight">
              L'immobile, nei<br />
              suoi dati <span className="italic">essenziali</span>.
            </h2>
            <p className="text-slate-500 max-w-md font-light">
              Informazioni organizzate per aiutarti a confrontare immobili e quartieri in modo strutturato.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <h4 className="font-serif text-lg font-medium text-slate-900">
                  Informazioni organizzate per aiutarti a confrontare immobili?
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-light">
                  Informazioni organizzate per aiutarti a confrontare immobili e quartieri in modo strutturato.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Pricing Section --- */}
        <section className="px-4 max-w-7xl mx-auto py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4 leading-tight">
              Scegli il piano <span className="italic">giusto</span> per te
            </h2>
            <p className="text-lg text-slate-600 font-light max-w-2xl mx-auto">
              Accedi a GetNearMe con crediti flessibili per analizzare immobili quando ne hai bisogno.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: "Starter",
                price: "4,99",
                credits: "10 crediti",
                features: [
                  "Analisi di base immobili",
                  "Contesto quartiere",
                  "Confronto prezzi zona",
                  "Supporto email"
                ]
              },
              {
                name: "Professional",
                price: "19,99",
                credits: "50 crediti",
                popular: true,
                features: [
                  "Tutto in Starter",
                  "Analisi approfondite",
                  "Vista comparativa",
                  "Stime indicative costi",
                  "Supporto prioritario"
                ]
              },
              {
                name: "Expert",
                price: "49,99",
                credits: "150 crediti",
                features: [
                  "Tutto in Professional",
                  "Crediti bonus inclusi",
                  "Report personalizzati",
                  "Consulenza dedicata",
                  "Accesso anticipato features"
                ]
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl border-2 p-8 hover:shadow-xl transition-all ${plan.popular ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Più popolare
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-serif text-slate-900 mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-slate-900">€{plan.price}</span>
                  </div>
                  <p className="text-slate-600 font-light">{plan.credits}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-600 text-sm font-light">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${plan.popular
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}>
                  Acquista ora
                </button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="bg-blue-500 text-white px-8 py-3 rounded-[4px] font-semibold hover:bg-blue-600 transition-colors">
              Riscatta crediti
            </button>
          </div>
        </section>

        {/* Full width divider */}
        <div className="w-full h-4 bg-[#F5F5F5]"></div>


        {/* --- Final CTA Section --- */}
        <section className="px-4 max-w-7xl mx-auto py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-serif text-slate-900 leading-tight">
              Pronto a trovare la tua <span className="italic">casa ideale</span>?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 font-light max-w-2xl mx-auto leading-relaxed">
              Inizia oggi a confrontare immobili con maggiore consapevolezza.
              Scarica l'estensione e accedi a tutti gli strumenti di analisi di GetNearMe.
            </p>
            <div className="pt-6">
              <button className="bg-blue-500 text-white px-10 py-4 rounded-[8px] font-bold text-lg hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl">
                Scarica l'estensione gratis
              </button>
            </div>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              {/* Brand Column */}
              <div className="md:col-span-1">
                <h3 className="text-2xl font-serif mb-4">GetNearMe</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  Strumento di supporto decisionale per analizzare immobili e quartieri.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold mb-4">Prodotto</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Funzionalità</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Prezzi</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Estensione Browser</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">FAQ</a></li>
                </ul>
              </div>

              {/* Company Links */}
              <div>
                <h4 className="font-semibold mb-4">Azienda</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Chi siamo</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Blog</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Contatti</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Carriere</a></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h4 className="font-semibold mb-4">Legale</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Termini di Servizio</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Cookie Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-light">Disclaimer</a></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm font-light">
                © 2025 GetNearMe. Tutti i diritti riservati.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
