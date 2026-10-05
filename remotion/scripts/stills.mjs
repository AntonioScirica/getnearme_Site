// Fotogrammi di controllo: node scripts/stills.mjs <composizione> <props> <cartella> <frame...>
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const [, , id, propsFile, outDir, ...frames] = process.argv
const serveUrl = await bundle({ entryPoint: resolve('src/index.ts') })
const inputProps = JSON.parse(readFileSync(propsFile, 'utf8'))
const composition = await selectComposition({ serveUrl, id, inputProps })
console.log(id, propsFile, 'durata', composition.durationInFrames)
for (const fr of frames) {
  const frame = fr === 'end' ? composition.durationInFrames - 1 : Number(fr)
  await renderStill({ serveUrl, composition, inputProps, frame, output: resolve(outDir, `${frame}.png`), imageFormat: 'png' })
}
