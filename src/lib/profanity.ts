import NAUGHTY from 'naughty-words'

// Parolacce e bestemmie in un testo scritto dall'utente (tutte le lingue della lista LDNOOBW, 28, piu' le
// bestemmie italiane). Usato dalla guardia globale sui campi (ProfanityGuard) e dalle API che salvano testi.
// Parole intere, non pezzi: "Cazzaniga", "classe", "canale" passano. Tolte le voci della lista che in un
// annuncio sono normali (pompa di calore, pareti nude, finocchio, Troia, pesce, regina, montare...).
const ALLOW = new Set([
  'pesce', 'regina', 'tirare', 'montare', 'monta', 'cozza', 'fava', 'patacca', 'porca', 'porco', 'pompa', 'battere', 'sbattere', 'sbattersi',
  'balle', 'palle', 'biga', 'mona', 'quaglia', 'spagnola', 'vangare', 'pisello', 'pippa', 'pippone', 'mannaggia', 'cesso', 'cacca', 'cadavere',
  'bagnarsi', 'brinca', 'cagna', 'vacca', 'lecchino', 'femminuccia', 'finocchio', 'casci', 'nave scuola', 'porca miseria', 'pisciare', 'piscio',
  'pipì', 'loffa', 'lofare', 'loffare', 'picio', 'pistolotto', 'pinnolone', 'ruffiano', 'goldone', 'tarzanello', 'zio cantante', 'soccia',
  'rizzarsi', 'bofilo', 'ciospo', 'fracicone', 'arrusa', 'belino', 'palloso', 'boiata', 'rompiballe', 'rompipalle', 'anale', 'scorreggiare',
  'sega', 'troia', 'topa', 'porco due', 'porco zio', 'imbecille', 'cornuto', 'terrone', 'guardone', 'pomiciare', 'lecca', 'chiappa',
  // altre lingue: parole comuni negli annunci
  'con', 'del', 'fan', 'fisse', 'perse', 'sm', 'nude', 'negro', 'xx', 'sexy', 'sex', 'sexo', 'pubes', 'scat', 'suck', 'sucks', 'butt', 'tushy', 'panty', 'grope', 'kinky', 'busty', 'mong', 'paki', 'spic',
])
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[0@4]/g, m => ({ '0': 'o', '@': 'a', '4': 'a' })[m]!).replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/\$/g, 's')
  .replace(/(\p{L})\1{2,}/gu, '$1$1') // "cazzzzo" -> "cazzo"
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let words: RegExp | null = null, cjk: string[] = []
function build() {
  const all = [...new Set(Object.values(NAUGHTY as Record<string, string[]>).flat().map(w => norm(w.trim())).filter(w => w && !ALLOW.has(w)))]
  // lingue senza spazi (cinese, giapponese, thai): si cerca il pezzo; le altre a parole intere
  cjk = all.filter(w => /[\u3040-\u30ff\u3400-\u9fff\u0e00-\u0e7f]/.test(w))
  const latin = all.filter(w => !cjk.includes(w)).sort((a, b) => b.length - a.length).map(w => esc(w).replace(/ /g, '[\\s\\W_]+'))
  words = new RegExp(`(?<![\\p{L}\\p{N}])(?:${latin.join('|')})(?![\\p{L}\\p{N}])`, 'u')
}
// bestemmie: santo + insulto vicini, in un ordine o nell'altro, anche attaccati ("diocane", "porcodio", "dio c4ne")
const HOLY = '(?:dio|madonna|cristo|gesu|padreterno)'
const INS = '(?:cane|can|porco|porca|maiale|boia|bestia|merda|ladro|serpente|infame|lupo|bastardo|schifoso|impestato|puttana|troia|zoccola|stronzo|stronza|rospo|cagnaccio)'
const BLAS = new RegExp(`(?<![\\p{L}])(?:${HOLY}[\\s\\W_]*${INS}|${INS}[\\s\\W_]*${HOLY})(?![\\p{L}])`, 'u')
// radici da evitare anche dentro una parola sola (indirizzi e nomi senza spazi: slug)
const ROOTS = ['cazzo', 'merda', 'merdos', 'stronz', 'puttan', 'vaffa', 'fanculo', 'minchia', 'pompin', 'bastard', 'coglion', 'frocio', 'froci', 'ricchion', 'porcodio', 'porcamadonna', 'diocan', 'zoccola', 'sborr', 'inculat',
  'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'nigg', 'whore', 'slut', 'asshole', 'porn', 'hitler']

export function hasProfanity(text: string): boolean {
  if (!text || text.length < 2) return false
  if (!words) build()
  const t = norm(text)
  return BLAS.test(t) || words!.test(t) || cjk.some(w => t.includes(w))
}
// slug: niente spazi, si cercano le radici anche attaccate ("cazz-o" non passa)
export const badSlug = (s: string) => { const flat = norm(s).replace(/-/g, ''); return ROOTS.some(w => flat.includes(w)) || hasProfanity(s.replace(/-/g, ' ')) }
// tutte le stringhe dentro un valore (config del sito, dettagli dell'immobile); link e immagini no
export const deepProfanity = (v: unknown): boolean =>
  typeof v === 'string' ? !/^(https?:|data:|blob:|\/)/.test(v) && hasProfanity(v) : Array.isArray(v) ? v.some(deepProfanity) : !!v && typeof v === 'object' ? Object.values(v).some(deepProfanity) : false
