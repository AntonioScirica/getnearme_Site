// Sessioni d'uso della piattaforma (tabella platform_sessions): sezioni ammesse e nomi per /metrics.
// Condiviso tra il battito del browser, la rotta api/platform/heartbeat e la cronologia in /metrics.
export const SECTIONS = ['home', 'chat', 'immobili', 'immobile', 'sito', 'galleria', 'profilo', 'piano', 'import', 'altro'] as const
export type Section = (typeof SECTIONS)[number]
export const isSection = (s: unknown): s is Section => typeof s === 'string' && (SECTIONS as readonly string[]).includes(s)

export const SECTION_LABEL: Record<Section, string> = {
  home: 'Home', chat: 'Chat', immobili: 'Immobili', immobile: 'Scheda immobile', sito: 'Sito', galleria: 'Galleria',
  profilo: 'Profilo', piano: 'Piano', import: 'Importa', altro: 'Altro',
}

// rotta a hash della piattaforma (#/staging, #/immobile/<id>...) -> sezione
export function sectionOf(route: string): Section {
  const r = route.split('?')[0]
  if (r === '/' || r === '' || r === '/migliora') return 'home'
  if (r === '/staging') return 'chat'
  if (r === '/immobili' || r === '/nuovo') return 'immobili'
  if (r.startsWith('/immobile/')) return 'immobile'
  if (r === '/portfolio' || r.startsWith('/anteprima/')) return 'sito'
  if (r === '/galleria') return 'galleria'
  if (r === '/profilo') return 'profilo'
  if (r === '/piano') return 'piano'
  if (r === '/importa') return 'import'
  return 'altro'
}

// durata leggibile: "45 s", "12 min", "1 h 05 min"
export const duration = (secs: number) => secs < 60 ? `${Math.round(secs)} s`
  : secs < 3600 ? `${Math.floor(secs / 60)} min`
  : `${Math.floor(secs / 3600)} h ${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')} min`
