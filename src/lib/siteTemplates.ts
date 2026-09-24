// Vetrina dell'agente: 5 template di sito (lista immobili + presentazione + contatti), tutto
// modificabile dall'agente. La configurazione sta in user_metadata.vetrina_site (niente tabelle
// nuove) e viene sempre ripulita con cleanSite prima di usarla: l'utente puo' scriverla anche da solo.

export type TemplateId = 'prato' | 'bosco' | 'cielo' | 'citta' | 'nord' | 'riviera' | 'atelier' | 'oro' | 'orizzonte' | 'vista'
export type Service = { title: string; text: string }
export type ZonePage = { name: string; text: string }
export type Review = { text: string; name: string; zone: string }

export type SiteConfig = {
  template: TemplateId
  primary: string
  font: 'serif' | 'sans'
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  aboutTitle: string
  aboutText: string
  aboutImage: string
  agentRole: string
  areas: string
  years: string
  sold: string
  clients: string
  reviews: Review[]
  services: Service[]
  zones: ZonePage[]
  highlights: string[]
  method: string
  address: string
  legal: string
  instagram: string
  facebook: string
  topBar: boolean
  whatsappButton: boolean
  texts: Record<string, string>
  hidden: string[]
  ctaLabel: string
  phone: string
  whatsapp: string
  email: string
  city: string
  showPrices: boolean
  showStats: boolean
  showAbout: boolean
  showContact: boolean
}

export type SiteProperty = {
  id: string
  titolo: string
  addr: string
  prezzo: number
  mq: number
  camere?: number | null
  bagni?: number | null
  tipologia?: string | null
  cover: string
  photos?: string[]
  descrizione?: string
  locali?: number | null
  contratto?: string
  zona?: string[]
  riferimento?: string
  createdAt?: string
  details?: Record<string, unknown>
}

export const TEMPLATES: { id: TemplateId; name: string; desc: string; primary: string; font: SiteConfig['font'] }[] = [
  { id: 'prato', name: 'Prato', desc: 'Classico da agenzia: ricerca a sinistra, foto a destra', primary: '#1d5b3c', font: 'sans' },
  { id: 'bosco', name: 'Bosco', desc: 'Foto a tutto schermo, ricerca che la accavalla', primary: '#4d7a2c', font: 'serif' },
  { id: 'cielo', name: 'Cielo', desc: 'Foto in una card arrotondata, toni morbidi', primary: '#2a2b7c', font: 'sans' },
  { id: 'citta', name: 'Città', desc: 'Bianco e nero, titolo al centro della foto', primary: '#111111', font: 'sans' },
  { id: 'nord', name: 'Nord', desc: 'Moderno, modulo di ricerca dentro la foto', primary: '#ff6a2b', font: 'serif' },
  { id: 'atelier', name: 'Atelier', desc: 'Editoriale, serif con corsivo e fondo verde scuro', primary: '#1d2b24', font: 'serif' },
  { id: 'oro', name: 'Oro', desc: 'Oro e crema, ricerca a schede e categorie con icone', primary: '#b8923a', font: 'serif' },
  { id: 'orizzonte', name: 'Orizzonte', desc: 'Leggero e azzurro, ricerca a pillola e filtri rapidi', primary: '#3b5bdb', font: 'sans' },
  { id: 'vista', name: 'Vista', desc: 'Pulito e deciso, riquadri con numeri e mappa', primary: '#111111', font: 'sans' },
  { id: 'riviera', name: 'Riviera', desc: 'Agenzia di zona: barra contatti, ricerca avanzata, pagine per località', primary: '#5fc9bd', font: 'sans' },
]

export function defaultSite(name: string, email = ''): SiteConfig {
  return {
    template: 'prato', primary: '#1d5b3c', font: 'sans',
    heroTitle: 'Trova la casa giusta per te',
    heroSubtitle: 'Immobili selezionati e un agente che ti segue dalla prima visita al rogito.',
    heroImage: '', aboutTitle: 'Chi sono',
    aboutText: 'Seguo ogni immobile come se fosse mio: valutazione, foto, visite e trattativa. Ti accompagno fino al rogito, senza sorprese.',
    aboutImage: '', agentRole: 'Agente immobiliare', areas: '', years: '10', sold: '', clients: '', ctaLabel: 'Contattami', phone: '', whatsapp: '', email, city: '',
    showPrices: true, showStats: true, showAbout: true, showContact: true,
    services: [
      { title: 'Valutazione gratuita', text: 'Mandami foto e documenti anche su WhatsApp: sopralluogo, valutazione onesta e, se decidi di vendere, penso io a tutte le pratiche.' },
      { title: 'Consulenza tecnica, legale e finanziaria', text: 'Lavoro con geometri, architetti, notai e consulenti del credito: ogni aspetto della compravendita è seguito da chi lo conosce.' },
      { title: 'Foto, video e home staging', text: 'Servizio fotografico, video e home staging per presentare la casa al meglio e ridurre i tempi di vendita.' },
      { title: 'Ricerca su misura', text: 'Cerchi casa da fuori zona o dall’estero? Seleziono per te solo gli immobili giusti e ti mando tutto prima della visita.' },
    ],
    zones: [],
    method: 'La trattativa non si improvvisa alla fine: si costruisce all’inizio. Studio l’immobile con il proprietario, definisco il prezzo corretto e preparo tutti i documenti prima di metterlo sul mercato. Pubblico solo quando è davvero pronto: meno trattativa, nessuna sorpresa.',
    highlights: ['Esperienza sul territorio', 'Clienti italiani e stranieri', 'Dalla prima visita al rogito'],
    address: '', legal: '', instagram: '', facebook: '', topBar: true, whatsappButton: true, texts: {}, hidden: [],
    reviews: [
      { text: 'Ci ha seguiti in tutto, dalla prima visita al notaio. Sempre disponibile e chiaro su ogni passaggio.', name: 'Giulia e Marco', zone: '' },
      { text: 'Venduto in poche settimane al prezzo giusto. Foto e annuncio fatti benissimo.', name: 'Roberto', zone: '' },
      { text: 'Professionale e onesto: ci ha sconsigliato una casa che non faceva per noi. Raro.', name: 'Elena', zone: '' },
    ],
  }
}

const str = (v: unknown, max: number, fallback: string) => (typeof v === 'string' ? v.slice(0, max) : fallback)
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)
// solo immagini https (niente javascript:, data: enormi, http)
const img = (v: unknown) => (typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(v) && v.length < 2000 ? v : '')
const url = (v: unknown) => (typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(v) && v.length < 300 ? v : '')
const phone = (v: unknown) => (typeof v === 'string' ? v.replace(/[^\d+ ]/g, '').slice(0, 20) : '')

export function cleanSite(raw: unknown, name: string, email = ''): SiteConfig {
  const d = defaultSite(name, email)
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const template = TEMPLATES.some(t => t.id === r.template) ? (r.template as TemplateId) : d.template
  return {
    template,
    primary: typeof r.primary === 'string' && /^#[0-9a-f]{6}$/i.test(r.primary) ? r.primary : TEMPLATES.find(t => t.id === template)!.primary,
    font: r.font === 'serif' || r.font === 'sans' ? r.font : d.font,
    heroTitle: str(r.heroTitle, 90, d.heroTitle),
    heroSubtitle: str(r.heroSubtitle, 200, d.heroSubtitle),
    heroImage: img(r.heroImage),
    aboutTitle: str(r.aboutTitle, 60, d.aboutTitle),
    aboutText: str(r.aboutText, 900, d.aboutText),
    aboutImage: img(r.aboutImage),
    agentRole: str(r.agentRole, 60, d.agentRole),
    areas: str(r.areas, 160, ''),
    years: str(r.years, 4, d.years).replace(/\D/g, ''),
    sold: str(r.sold, 6, '').replace(/\D/g, ''),
    clients: str(r.clients, 6, '').replace(/\D/g, ''),
    services: Array.isArray(r.services)
      ? r.services.slice(0, 8).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { title: str(o.title, 70, ''), text: str(o.text, 600, '') } }).filter(x => x.title)
      : d.services,
    zones: Array.isArray(r.zones)
      ? r.zones.slice(0, 8).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { name: str(o.name, 40, '').trim(), text: str(o.text, 4000, '') } }).filter(x => x.name)
      : d.zones,
    method: str(r.method, 1500, d.method),
    highlights: Array.isArray(r.highlights) ? r.highlights.slice(0, 6).map(x => str(x, 50, '')).filter(Boolean) : d.highlights,
    address: str(r.address, 120, ''),
    legal: str(r.legal, 160, ''),
    instagram: url(r.instagram),
    facebook: url(r.facebook),
    topBar: bool(r.topBar, d.topBar),
    // solo chiavi conosciute, testi corti
    texts: r.texts && typeof r.texts === 'object' ? Object.fromEntries(Object.entries(r.texts as Record<string, unknown>).filter(([k, v]) => k in TEXTS && typeof v === 'string').map(([k, v]) => [k, (v as string).slice(0, 600)])) : {},
    hidden: Array.isArray(r.hidden) ? r.hidden.filter((x): x is string => typeof x === 'string' && HIDEABLE.has(x)) : [],
    whatsappButton: bool(r.whatsappButton, d.whatsappButton),
    reviews: Array.isArray(r.reviews)
      ? r.reviews.slice(0, 3).map(x => { const o = (x ?? {}) as Record<string, unknown>; return { text: str(o.text, 300, ''), name: str(o.name, 60, ''), zone: str(o.zone, 60, '') } }).filter(x => x.text)
      : d.reviews,
    ctaLabel: str(r.ctaLabel, 30, d.ctaLabel) || d.ctaLabel,
    phone: phone(r.phone),
    whatsapp: phone(r.whatsapp),
    email: typeof r.email === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(r.email) ? r.email.slice(0, 120) : email,
    city: str(r.city, 60, ''),
    showPrices: bool(r.showPrices, true),
    showStats: bool(r.showStats, true),
    showAbout: bool(r.showAbout, true),
    showContact: bool(r.showContact, true),
  }
}

// "casa-a-sirolo" <-> "Sirolo": indirizzo delle pagine zona
export const zoneSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---------- Testi modificabili e sezioni per pagina ----------
// Ogni testo del sito ha una chiave e un valore di partenza; l'agente salva solo quelli che cambia
// (cfg.texts). Le sezioni si possono nascondere (cfg.hidden). L'editor mostra le sezioni della pagina aperta.
export const TEXTS: Record<string, string> = {
  'hero.eyebrow': 'Immobili selezionati', 'hero.cta': 'Guarda gli immobili', 'hero.cta2': 'Richiedi una consulenza',
  'search.button': 'Cerca', 'search.more': 'Altri filtri',
  'intro.title': 'Case scelte una per una, come le vorresti tu', 'intro.button': 'Esplora',
  'feature.1.title': 'Affidabilità', 'feature.1.text': 'Ogni immobile verificato, documenti in ordine prima della visita.',
  'feature.2.title': 'Consulenza vera', 'feature.2.text': 'Un agente che ti segue di persona, non un call center.',
  'feature.3.title': 'Scelta selezionata', 'feature.3.text': 'Poche case, quelle giuste: niente annunci fantasma.',
  'feature.4.title': 'Fino al rogito', 'feature.4.text': 'Trattativa, mutuo e notaio: ti accompagno in ogni passo.',
  'featured.eyebrow': 'I nostri immobili', 'featured.title': 'In evidenza', 'featured.sub': 'Le case disponibili adesso.', 'featured.link': 'Vedi tutti',
  'about.check.1': 'Valutazione gratuita del tuo immobile', 'about.check.2': 'Foto e annunci curati', 'about.check.3': 'Assistenza fino al rogito', 'about.cta': 'Conoscimi meglio',
  'reviews.eyebrow': 'Recensioni', 'reviews.title': 'Cosa dicono i clienti',
  'zones.eyebrow': 'Dove lavoro', 'zones.title': 'Scopri le zone',
  'cta.title': 'Pronto a trovare casa?', 'cta.text': 'Scrivimi o chiamami: rispondo di persona, senza impegno.',
  'listings.eyebrow': 'Immobili', 'listings.title': 'Tutti gli immobili', 'listings.empty': 'Nessun immobile con questi filtri.',
  'property.details': 'Dettagli', 'property.features': 'Caratteristiche', 'property.zone': 'Nella zona', 'property.map': 'Posizione', 'property.desc': 'Descrizione',
  'property.form': 'Oppure scrivimi qui', 'property.similar': 'Potrebbero interessarti', 'property.tour': 'Tour 3D', 'property.tourText': 'Guarda la casa dall’alto o cammina dentro le stanze. La pianta è ricostruita dai dati dell’annuncio.',
  'agent.listingsEyebrow': 'I miei immobili', 'agent.listingsTitle': 'Cosa sto seguendo',
  'services.eyebrow': 'Servizi', 'services.title': 'Cosa faccio per te', 'services.sub': 'Un percorso chiaro dalla valutazione al rogito, senza sorprese.',
  'services.methodLabel': 'Il mio metodo di vendita', 'services.formTitle': 'Scrivimi per una consulenza gratuita', 'services.formText': 'Raccontami cosa cerchi o cosa vuoi vendere: ti rispondo io, di persona.',
  'contact.eyebrow': 'Contatti', 'contact.title': 'Scrivimi o chiamami', 'contact.sub': 'Rispondo di persona, di solito entro la giornata.', 'contact.formTitle': 'Richiedi informazioni',
  'form.button': 'Invia richiesta', 'form.done': 'Richiesta inviata',
  'zone.eyebrow': 'Zona',
}

export type SectionDef = { id: string; label: string; texts?: string[]; hideable?: boolean; cfg?: (keyof SiteConfig)[]; note?: string }
export type PageId = 'home' | 'immobili' | 'immobile' | 'agente' | 'servizi' | 'contatti' | 'zona'

export const PAGE_SECTIONS: Record<PageId, SectionDef[]> = {
  home: [
    { id: 'header', label: 'Barra in alto', cfg: ['ctaLabel', 'topBar'] },
    { id: 'home.hero', label: 'Apertura', texts: ['hero.eyebrow', 'hero.cta', 'hero.cta2', 'search.button', 'search.more'], cfg: ['heroTitle', 'heroSubtitle', 'city', 'heroImage'] },
    { id: 'home.intro', label: 'Dopo l’apertura', hideable: true, texts: ['intro.title', 'intro.button', 'feature.1.title', 'feature.1.text', 'feature.2.title', 'feature.2.text', 'feature.3.title', 'feature.3.text', 'feature.4.title', 'feature.4.text'] },
    { id: 'home.featured', label: 'Immobili in evidenza', hideable: true, texts: ['featured.eyebrow', 'featured.title', 'featured.sub', 'featured.link'], cfg: ['showPrices'] },
    { id: 'home.about', label: 'Chi sono', hideable: true, texts: ['about.check.1', 'about.check.2', 'about.check.3', 'about.cta'], cfg: ['aboutTitle', 'aboutText', 'aboutImage', 'years', 'sold', 'clients', 'showStats'] },
    { id: 'home.reviews', label: 'Recensioni', hideable: true, texts: ['reviews.eyebrow', 'reviews.title'], cfg: ['reviews'] },
    { id: 'home.zones', label: 'Zone', hideable: true, texts: ['zones.eyebrow', 'zones.title'], cfg: ['zones'] },
    { id: 'cta', label: 'Fascia contatti', hideable: true, texts: ['cta.title', 'cta.text'], cfg: ['phone', 'whatsapp', 'email'] },
    { id: 'footer', label: 'Piè di pagina', cfg: ['address', 'legal', 'instagram', 'facebook'] },
  ],
  immobili: [
    { id: 'header', label: 'Barra in alto', cfg: ['ctaLabel', 'topBar'] },
    { id: 'listings.head', label: 'Titolo della pagina', texts: ['listings.eyebrow', 'listings.title', 'listings.empty'] },
    { id: 'cta', label: 'Fascia contatti', hideable: true, texts: ['cta.title', 'cta.text'] },
    { id: 'footer', label: 'Piè di pagina', cfg: ['address', 'legal'] },
  ],
  immobile: [
    { id: 'property.desc', label: 'Descrizione', hideable: true, texts: ['property.desc'], note: 'Il testo lo prendi dall’immobile.' },
    { id: 'property.tour', label: 'Tour 3D', hideable: true, texts: ['property.tour', 'property.tourText'] },
    { id: 'property.details', label: 'Dettagli', hideable: true, texts: ['property.details'] },
    { id: 'property.features', label: 'Caratteristiche', hideable: true, texts: ['property.features'] },
    { id: 'property.zone', label: 'Nella zona', hideable: true, texts: ['property.zone'] },
    { id: 'property.map', label: 'Mappa', hideable: true, texts: ['property.map'] },
    { id: 'property.agent', label: 'Scheda agente e modulo', texts: ['property.form', 'form.button', 'form.done'], cfg: ['phone', 'whatsapp', 'email'] },
    { id: 'property.similar', label: 'Immobili simili', hideable: true, texts: ['property.similar'] },
  ],
  agente: [
    { id: 'agent.top', label: 'Il tuo profilo', cfg: ['aboutImage', 'agentRole', 'aboutTitle', 'aboutText', 'areas', 'highlights', 'years', 'sold', 'clients', 'showStats'] },
    { id: 'agent.listings', label: 'I tuoi immobili', hideable: true, texts: ['agent.listingsEyebrow', 'agent.listingsTitle'] },
    { id: 'home.reviews', label: 'Recensioni', hideable: true, texts: ['reviews.eyebrow', 'reviews.title'], cfg: ['reviews'] },
    { id: 'cta', label: 'Fascia contatti', hideable: true, texts: ['cta.title', 'cta.text'] },
  ],
  servizi: [
    { id: 'services.head', label: 'Titolo della pagina', texts: ['services.eyebrow', 'services.title', 'services.sub'] },
    { id: 'services.list', label: 'Servizi', cfg: ['services'] },
    { id: 'services.method', label: 'Il tuo metodo', hideable: true, texts: ['services.methodLabel'], cfg: ['method'] },
    { id: 'services.form', label: 'Consulenza gratuita', hideable: true, texts: ['services.formTitle', 'services.formText', 'form.button'], cfg: ['highlights'] },
  ],
  contatti: [
    { id: 'contact.head', label: 'Titolo della pagina', texts: ['contact.eyebrow', 'contact.title', 'contact.sub'] },
    { id: 'contact.info', label: 'I tuoi recapiti', cfg: ['phone', 'whatsapp', 'email', 'address'] },
    { id: 'contact.form', label: 'Modulo', texts: ['contact.formTitle', 'form.button', 'form.done'] },
  ],
  zona: [
    { id: 'zone.page', label: 'Pagine zona', texts: ['zone.eyebrow'], cfg: ['zones'] },
    { id: 'cta', label: 'Fascia contatti', hideable: true, texts: ['cta.title', 'cta.text'] },
  ],
}
export const HIDEABLE = new Set(Object.values(PAGE_SECTIONS).flat().filter(s => s.hideable).map(s => s.id))

// Nomi leggibili dei campi nell'editor
export const FIELD_LABELS: Record<string, string> = {
  'hero.eyebrow': 'Scritta sopra il titolo', 'hero.cta': 'Pulsante principale', 'hero.cta2': 'Pulsante secondario', 'search.button': 'Pulsante di ricerca', 'search.more': 'Link “altri filtri”',
  'intro.title': 'Titolo', 'intro.button': 'Pulsante',
  'feature.1.title': 'Punto 1', 'feature.1.text': 'Punto 1, testo', 'feature.2.title': 'Punto 2', 'feature.2.text': 'Punto 2, testo',
  'feature.3.title': 'Punto 3', 'feature.3.text': 'Punto 3, testo', 'feature.4.title': 'Punto 4', 'feature.4.text': 'Punto 4, testo',
  'featured.eyebrow': 'Scritta sopra il titolo', 'featured.title': 'Titolo', 'featured.sub': 'Sottotitolo', 'featured.link': 'Link “vedi tutti”',
  'about.check.1': 'Punto elenco 1', 'about.check.2': 'Punto elenco 2', 'about.check.3': 'Punto elenco 3', 'about.cta': 'Pulsante',
  'reviews.eyebrow': 'Scritta sopra il titolo', 'reviews.title': 'Titolo', 'zones.eyebrow': 'Scritta sopra il titolo', 'zones.title': 'Titolo',
  'cta.title': 'Titolo', 'cta.text': 'Testo',
  'listings.eyebrow': 'Scritta sopra il titolo', 'listings.title': 'Titolo', 'listings.empty': 'Messaggio senza risultati',
  'property.details': 'Titolo', 'property.features': 'Titolo', 'property.zone': 'Titolo', 'property.map': 'Titolo', 'property.desc': 'Titolo',
  'property.form': 'Titolo del modulo', 'property.similar': 'Titolo', 'property.tour': 'Titolo', 'property.tourText': 'Testo',
  'agent.listingsEyebrow': 'Scritta sopra il titolo', 'agent.listingsTitle': 'Titolo',
  'services.eyebrow': 'Scritta sopra il titolo', 'services.title': 'Titolo', 'services.sub': 'Sottotitolo', 'services.methodLabel': 'Etichetta',
  'services.formTitle': 'Titolo', 'services.formText': 'Testo',
  'contact.eyebrow': 'Scritta sopra il titolo', 'contact.title': 'Titolo', 'contact.sub': 'Sottotitolo', 'contact.formTitle': 'Titolo del modulo',
  'form.button': 'Pulsante del modulo', 'form.done': 'Messaggio dopo l’invio', 'zone.eyebrow': 'Scritta sopra il titolo',
  heroTitle: 'Titolo', heroSubtitle: 'Sottotitolo', city: 'Città o zona', heroImage: 'Foto di copertina', ctaLabel: 'Pulsante contatti', topBar: 'Barra con telefono ed email',
  aboutTitle: 'Nome della sezione', aboutText: 'Chi sei', aboutImage: 'La tua foto', agentRole: 'Ruolo', areas: 'Zone in cui lavori', highlights: 'Punti in evidenza',
  years: 'Anni di esperienza', sold: 'Immobili venduti', clients: 'Clienti seguiti', showStats: 'Mostra i numeri', showPrices: 'Mostra i prezzi',
  reviews: 'Recensioni', zones: 'Pagine zona', services: 'Servizi', method: 'Il tuo metodo',
  phone: 'Telefono', whatsapp: 'WhatsApp', email: 'Email', address: 'Indirizzo dell’ufficio', legal: 'P.IVA, REA', instagram: 'Instagram (link)', facebook: 'Facebook (link)',
}
