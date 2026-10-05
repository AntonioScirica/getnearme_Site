import { cancelRender, continueRender, delayRender, staticFile } from 'remotion'

// Font del brand da file locali (public/fonts, OFL): niente rete al render e niente font di sistema.
// Il render aspetta (delayRender) che tutti i pesi siano caricati.
export const SANS = "'Plus Jakarta Sans'"
export const SERIF = "'Instrument Serif'"

const FACES: [family: string, file: string, weight: string, style: string][] = [
  ['Plus Jakarta Sans', 'plus-jakarta-sans-latin-300-normal.woff2', '300', 'normal'],
  ['Plus Jakarta Sans', 'plus-jakarta-sans-latin-500-normal.woff2', '500', 'normal'],
  ['Plus Jakarta Sans', 'plus-jakarta-sans-latin-600-normal.woff2', '600', 'normal'],
  ['Plus Jakarta Sans', 'plus-jakarta-sans-latin-700-normal.woff2', '700', 'normal'],
  ['Plus Jakarta Sans', 'plus-jakarta-sans-latin-800-normal.woff2', '800', 'normal'],
  ['Instrument Serif', 'instrument-serif-latin-400-normal.woff2', '400', 'normal'],
  ['Instrument Serif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'],
]

let started = false
export function loadFonts() {
  if (started || typeof document === 'undefined') return
  started = true
  const handle = delayRender('Caricamento font del brand')
  Promise.all(
    FACES.map(([family, file, weight, style]) =>
      new FontFace(family, `url('${staticFile(`fonts/${file}`)}') format('woff2')`, { weight, style }).load().then(f => {
        document.fonts.add(f)
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch(err => cancelRender(err))
}
