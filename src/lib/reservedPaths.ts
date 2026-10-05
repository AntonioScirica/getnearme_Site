// Primi segmenti dell'indirizzo che NON sono siti di agenti su agenteimmo.me/<slug>:
// pagine della piattaforma (senza lingua vengono rimandate a /it/...), cartelle di public/, rotte di sistema.
// Nessuno slug puo' usarli. Se aggiungi una cartella in src/app/[locale] o in public/, aggiungila qui.
export const RESERVED = new Set([
  'a', 'agente-immo', 'agente-immobiliare', 'ambassador', 'blog', 'bonus-result', 'checkout', 'confirm', 'cookie', 'dashboard', 'data-deletion', 'demo',
  'download', 'forgot-password', 'guida-acquisto-casa', 'pricing_ext', 'privacy', 'reference', 'reset-password', 'social-connected',
  'support', 'termini', 'tutorial', 'unsubscribe-success', 'update', 'home', 'login', 'signup', 'prezzi', 'pricing', 'app',
  'api', 'metrics', 'nfc', 'assets', 'immo', 'fonts', 'report', 'staging', 'templates', 'vendor', 'video-previews', 'email-previews',
  'quanto-vale-la-mia-casa', 'prezzi-case', 'vendere-casa', 'guide', 'llms.txt', 'llms-full.txt', 'admin', 'www', 'mail', 'help', 'aiuto', 'contatti', 'chi-siamo', 'about', 'legal', 'agenteimmo', 'getnearme', 'business-plan',
])
export const isReserved = (seg: string) => RESERVED.has(seg) || seg.startsWith('zz-')
