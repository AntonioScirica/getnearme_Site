// Planimetrie tra le foto importate: l'import le segna con #planimetria (immobiliare.it le da' a parte; dai siti delle
// agenzie si riconoscono dal nome del file). Serve a metterle in fondo e a sapere se l'immobile puo' avere la Casa 3D.
export const PLAN_MARK = '#planimetria'
export const isPlanUrl = (u: string) => u.endsWith(PLAN_MARK)
  || /planimetr|pianta|piantina|floor.?plan|(?:^|[-_/])(?:pt|p\d|primop|secondop|terzop|quartop|plan)[-_.]/i.test(u.split(/[?#]/)[0].split('/').pop() ?? '')

// Tipo di foto dal nome del file o dalla didascalia, senza AI: solo i casi sicuri dove la stanza e lo stato non servono
// (planimetria, esterno, giardino). Per gli interni serve l'AI (arredata o vuota cambia cosa proporre).
export function sceneFromName(u: string): { scene: 'planimetria' | 'esterno' | 'giardino'; room: ''; state: '' } | null {
  if (isPlanUrl(u)) return { scene: 'planimetria', room: '', state: '' }
  const n = decodeURIComponent(u.split(/[?#]/)[0].split('/').pop() ?? '').toLowerCase()
  if (/facciat|prospett|estern|exterior|outside|condominio|palazz/.test(n)) return { scene: 'esterno', room: '', state: '' }
  if (/giardin|garden|cortil|prato/.test(n)) return { scene: 'giardino', room: '', state: '' }
  return null
}
