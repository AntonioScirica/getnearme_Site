// Planimetrie tra le foto importate: l'import le segna con #planimetria (immobiliare.it le da' a parte; dai siti delle
// agenzie si riconoscono dal nome del file). Serve a metterle in fondo e a sapere se l'immobile puo' avere la Casa 3D.
export const PLAN_MARK = '#planimetria'
export const isPlanUrl = (u: string) => u.endsWith(PLAN_MARK)
  || /planimetr|pianta|piantina|floor.?plan|(?:^|[-_/])(?:pt|p\d|primop|secondop|terzop|quartop|plan)[-_.]/i.test(u.split(/[?#]/)[0].split('/').pop() ?? '')
