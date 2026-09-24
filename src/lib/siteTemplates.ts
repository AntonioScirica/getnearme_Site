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
    address: '', legal: '', instagram: '', facebook: '', topBar: true, whatsappButton: true,
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
