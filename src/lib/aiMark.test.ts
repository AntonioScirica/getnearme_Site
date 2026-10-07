// Segno nascosto AI (lib/aiMark): npx tsx --test src/lib/aiMark.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { markImage, markVideo } from './aiMark'

const GEN = 'digitalsourcetype/trainedAlgorithmicMedia'
const COMP = 'digitalsourcetype/compositeWithTrainedAlgorithmicMedia'
const img = () => sharp({ create: { width: 64, height: 48, channels: 3, background: { r: 200, g: 120, b: 40 } } })
const xmpOf = async (b: Buffer) => (await sharp(b).metadata()).xmp?.toString('utf8') ?? ''

test('JPEG: XMP con DigitalSourceType, pixel identici (nessuna ricodifica)', async () => {
  const src = await img().jpeg({ quality: 90 }).withMetadata().toBuffer()
  const out = markImage(src, 'composite')
  assert.ok((await xmpOf(out)).includes(COMP))
  assert.ok((await xmpOf(out)).includes('Agente Immo (AI)'))
  // i dati compressi dopo l'header sono gli stessi byte: si cerca la coda del file originale
  assert.ok(out.includes(src.subarray(src.indexOf(Buffer.from([0xff, 0xda])))))
  assert.deepEqual(await sharp(out).raw().toBuffer(), await sharp(src).raw().toBuffer())
  // marcare due volte non duplica il pacchetto
  const twice = markImage(out, 'generated')
  assert.equal(twice.toString('latin1').split('http://ns.adobe.com/xap/1.0/\0').length - 1, 1)
  assert.ok((await xmpOf(twice)).includes(GEN))
})

test('PNG: chunk iTXt XML:com.adobe.xmp letto da libvips', async () => {
  const src = await img().png().toBuffer()
  const out = markImage(src, 'generated')
  assert.ok((await xmpOf(out)).includes(GEN))
  assert.deepEqual(await sharp(out).raw().toBuffer(), await sharp(src).raw().toBuffer())
})

test('WebP semplice (VP8) e lossless (VP8L): VP8X creato con il flag XMP', async () => {
  for (const lossless of [false, true]) {
    const src = await img().webp({ lossless }).toBuffer()
    const out = markImage(src, 'composite')
    assert.equal(out.toString('latin1', 12, 16), 'VP8X')
    assert.equal(out.readUInt32LE(4), out.length - 8)
    assert.ok((await xmpOf(out)).includes(COMP))
    const m = await sharp(out).metadata()
    assert.equal(m.width, 64); assert.equal(m.height, 48)
    assert.deepEqual(await sharp(out).raw().toBuffer(), await sharp(src).raw().toBuffer())
  }
})

test('formato sconosciuto: torna uguale', () => {
  const b = Buffer.from('non sono una foto')
  assert.equal(markImage(b, 'generated'), b)
})

test('MP4: commento ffmpeg e box XMP uuid in coda', async () => {
  const { spawnSync } = await import('child_process')
  const ffmpegPath = (await import('ffmpeg-static')).default as unknown as string
  const { mkdtempSync, readFileSync } = await import('fs')
  const { join } = await import('path')
  const dir = mkdtempSync(join((await import('os')).tmpdir(), 'aimark-t-'))
  const f = join(dir, 'a.mp4')
  spawnSync(ffmpegPath, ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=blue:s=64x48:d=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', f])
  const out = await markVideo(readFileSync(f), 'generated')
  const s = out.toString('latin1')
  assert.ok(s.includes('Contenuto generato o modificato con intelligenza artificiale'))
  assert.ok(out.includes(Buffer.from('be7acfcb97a942e89c71999491e3afac', 'hex')))
  assert.ok(s.includes(GEN))
  // il file resta leggibile da ffmpeg
  const probe = spawnSync(ffmpegPath, ['-v', 'error', '-i', '-', '-f', 'null', '-'], { input: out })
  assert.equal(probe.status, 0, probe.stderr?.toString())
})
