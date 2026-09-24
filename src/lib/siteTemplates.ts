// Vetrina dell'agente: 5 template di sito (lista immobili + presentazione + contatti), tutto
// modificabile dall'agente. La configurazione sta in user_metadata.vetrina_site (niente tabelle
// nuove) e viene sempre ripulita con cleanSite prima di usarla: l'utente puo' scriverla anche da solo.

export type TemplateId = 'maison' | 'chiaro' | 'agente' | 'notte' | 'rivista'

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
}

export const TEMPLATES: { id: TemplateId; name: string; desc: string; primary: string; font: SiteConfig['font'] }[] = [
  { id: 'maison', name: 'Maison', desc: 'Editoriale, foto a tutto schermo e nome in grande', primary: '#8a6a4f', font: 'serif' },
  { id: 'chiaro', name: 'Chiaro', desc: 'Pulito e luminoso, titolo al centro e numeri', primary: '#2563eb', font: 'sans' },
  { id: 'agente', name: 'Agente', desc: 'Il tuo volto e la tua storia prima delle case', primary: '#5b7a5e', font: 'serif' },
  { id: 'notte', name: 'Notte', desc: 'Scuro ed elegante, per immobili di pregio', primary: '#c9a96e', font: 'serif' },
  { id: 'rivista', name: 'Rivista', desc: 'Impaginato come un magazine, colore deciso', primary: '#e4572e', font: 'sans' },
]

export function defaultSite(name: string, email = ''): SiteConfig {
  return {
    template: 'chiaro', primary: '#2563eb', font: 'sans',
    heroTitle: name ? `${name}, la tua prossima casa` : 'La tua prossima casa',
    heroSubtitle: 'Immobili selezionati, seguiti dall’inizio alla fine. Scegli, visita, entra.',
    heroImage: '', aboutTitle: 'Chi sono',
    aboutText: 'Seguo ogni immobile come se fosse mio: valutazione, foto, visite e trattativa. Ti accompagno fino al rogito, senza sorprese.',
    aboutImage: '', ctaLabel: 'Contattami', phone: '', whatsapp: '', email, city: '',
    showPrices: true, showStats: true, showAbout: true, showContact: true,
  }
}

const str = (v: unknown, max: number, fallback: string) => (typeof v === 'string' ? v.slice(0, max) : fallback)
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)
// solo immagini https (niente javascript:, data: enormi, http)
const img = (v: unknown) => (typeof v === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(v) && v.length < 2000 ? v : '')
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
