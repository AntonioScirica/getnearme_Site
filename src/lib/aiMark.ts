import { spawn } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import ffmpegPath from 'ffmpeg-static'

// AI Act (Reg. UE 2024/1689, art. 50 par. 2, dal 2 agosto 2026): foto e video generati o modificati dall'AI della
// piattaforma escono marcati in modo leggibile dalle macchine. Segno nascosto standard IPTC/XMP:
// Iptc4xmpExt:DigitalSourceType (vocabolario IPTC), lo stesso campo che leggono Google, Meta, LinkedIn e Adobe.
// - generated: tutto fatto dal modello (foto da una planimetria, clip Kling/Veo)
// - composite: foto vera modificata con l'AI (home staging, Svuota, modifiche, montaggi con foto vere)
// Le immagini NON si ricodificano: il pacchetto XMP si inserisce nei byte (JPEG APP1, PNG iTXt, WebP chunk XMP).
// I video si rimuxano (-c copy, nessuna perdita) con i metadati, piu' il box XMP standard in coda al file.
// C2PA (manifest firmato) NON c'e': serve un certificato di firma, vedi nota nel report del 07/10/2026.
export type AiKind = 'generated' | 'composite'

const SOURCE: Record<AiKind, string> = {
  generated: 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia',
  composite: 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia',
}
export const AI_TOOL = 'Agente Immo (AI)'
export const AI_TEXT: Record<AiKind, string> = {
  generated: 'Contenuto generato con intelligenza artificiale (Agente Immo). AI-generated content.',
  composite: 'Contenuto modificato con intelligenza artificiale (Agente Immo), ad esempio arredamento virtuale. AI-modified content.',
}
export const AI_VIDEO_TEXT = 'Contenuto generato o modificato con intelligenza artificiale (Agente Immo)'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function xmpPacket(kind: AiKind, text = AI_TEXT[kind]): string {
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Agente Immo">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"
    Iptc4xmpExt:DigitalSourceType="${SOURCE[kind]}"
    xmp:CreatorTool="${esc(AI_TOOL)}"
    photoshop:Credit="${esc(AI_TOOL)}">
   <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(text)}</rdf:li></rdf:Alt></dc:description>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`
}

// ---------- immagini ----------
const XMP_NS = Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'latin1')

// Segno nascosto su una foto (JPEG, PNG o WebP), senza ricodificarla. Formato sconosciuto o file rotto: torna com'era
// (il segno non deve mai far fallire il salvataggio).
export function markImage(buf: Buffer, kind: AiKind): Buffer {
  try {
    const xmp = Buffer.from(xmpPacket(kind), 'utf8')
    if (buf[0] === 0xff && buf[1] === 0xd8) return jpegWithXmp(buf, xmp)
    if (buf.subarray(0, 8).equals(PNG_SIG)) return pngWithXmp(buf, xmp)
    if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return webpWithXmp(buf, xmp)
  } catch (e) { console.error('markImage', e) }
  return buf
}

// JPEG: segmento APP1 "http://ns.adobe.com/xap/1.0/" dopo APP0 (JFIF) ed Exif; un XMP gia' presente si sostituisce
function jpegWithXmp(buf: Buffer, xmp: Buffer): Buffer {
  const head: Buffer[] = [], rest: Buffer[] = []
  let pos = 2
  while (pos + 4 <= buf.length) {
    if (buf[pos] !== 0xff) throw new Error('jpeg: marker atteso')
    const m = buf[pos + 1]
    if (m === 0xff) { pos++; continue } // byte di riempimento
    if (m === 0xda || m === 0xd9) break // inizio dei dati: da qui si copia tutto com'e'
    if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) { rest.push(buf.subarray(pos, pos + 2)); pos += 2; continue }
    const len = buf.readUInt16BE(pos + 2)
    const seg = buf.subarray(pos, pos + 2 + len)
    const isXmp = m === 0xe1 && seg.subarray(4, 4 + XMP_NS.length).equals(XMP_NS)
    const leading = !rest.length && (m === 0xe0 || (m === 0xe1 && seg.toString('latin1', 4, 10) === 'Exif\0\0'))
    if (!isXmp) (leading ? head : rest).push(seg)
    pos += 2 + len
  }
  const payload = Buffer.concat([XMP_NS, xmp])
  if (payload.length + 2 > 0xffff) throw new Error('xmp troppo grande')
  const app1 = Buffer.alloc(4); app1[0] = 0xff; app1[1] = 0xe1; app1.writeUInt16BE(payload.length + 2, 2)
  return Buffer.concat([buf.subarray(0, 2), ...head, app1, payload, ...rest, buf.subarray(pos)])
}

// PNG: chunk iTXt "XML:com.adobe.xmp" subito dopo IHDR (prima dei dati, come vuole lo standard XMP)
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
function crc32(b: Buffer): number { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function pngWithXmp(buf: Buffer, xmp: Buffer): Buffer {
  const chunks: Buffer[] = []
  let pos = 8
  while (pos + 12 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('latin1', pos + 4, pos + 8)
    const chunk = buf.subarray(pos, pos + 12 + len)
    const oldXmp = type === 'iTXt' && buf.toString('latin1', pos + 8, pos + 8 + 18) === 'XML:com.adobe.xmp\0'
    if (!oldXmp) chunks.push(chunk)
    if (type === 'IHDR') {
      const data = Buffer.concat([Buffer.from('XML:com.adobe.xmp\0\0\0\0\0', 'latin1'), xmp]) // keyword, non compresso, lingua e traduzione vuote
      const c = Buffer.alloc(12 + data.length)
      c.writeUInt32BE(data.length, 0); c.write('iTXt', 4, 'latin1'); data.copy(c, 8)
      c.writeUInt32BE(crc32(c.subarray(4, 8 + data.length)), 8 + data.length)
      chunks.push(c)
    }
    pos += 12 + len
    if (type === 'IEND') break
  }
  return Buffer.concat([PNG_SIG, ...chunks])
}

// WebP: chunk "XMP " in coda e flag XMP nel VP8X (se il file e' "semplice" si crea il VP8X con le misure del fotogramma)
function webpWithXmp(buf: Buffer, xmp: Buffer): Buffer {
  const chunks: { type: string; data: Buffer }[] = []
  let pos = 12
  while (pos + 8 <= buf.length) {
    const type = buf.toString('latin1', pos, pos + 4), len = buf.readUInt32LE(pos + 4)
    if (type !== 'XMP ') chunks.push({ type, data: buf.subarray(pos + 8, pos + 8 + len) })
    pos += 8 + len + (len & 1)
  }
  let vp8x = chunks.find(c => c.type === 'VP8X')
  if (!vp8x) {
    const img = chunks.find(c => c.type === 'VP8 ' || c.type === 'VP8L')
    if (!img) throw new Error('webp: nessuna immagine')
    let w: number, h: number, alpha = false
    if (img.type === 'VP8 ') { w = img.data.readUInt16LE(6) & 0x3fff; h = img.data.readUInt16LE(8) & 0x3fff }
    else { const b = img.data.readUInt32LE(1); w = (b & 0x3fff) + 1; h = ((b >>> 14) & 0x3fff) + 1; alpha = !!((b >>> 28) & 1) }
    const d = Buffer.alloc(10)
    d[0] = alpha ? 0x10 : 0; d.writeUIntLE(w - 1, 4, 3); d.writeUIntLE(h - 1, 7, 3)
    vp8x = { type: 'VP8X', data: d }
    chunks.unshift(vp8x)
  } else vp8x.data = Buffer.from(vp8x.data) // copia: non si tocca il buffer di partenza
  vp8x.data[0] |= 0x04 // flag XMP
  chunks.push({ type: 'XMP ', data: xmp })
  const parts = chunks.flatMap(c => {
    const h = Buffer.alloc(8); h.write(c.type, 0, 'latin1'); h.writeUInt32LE(c.data.length, 4)
    return c.data.length & 1 ? [h, c.data, Buffer.alloc(1)] : [h, c.data]
  })
  const body = Buffer.concat(parts)
  const riff = Buffer.alloc(12); riff.write('RIFF', 0, 'latin1'); riff.writeUInt32LE(body.length + 4, 4); riff.write('WEBP', 8, 'latin1')
  return Buffer.concat([riff, body])
}

// ---------- video ----------
// box XMP standard dei file MP4/MOV (uuid BE7ACFCB-97A9-42E8-9C71-999491E3AFAC), di primo livello in coda:
// gli offset dei dati non si spostano, lo leggono exiftool e gli strumenti Adobe
const XMP_UUID = Buffer.from('be7acfcb97a942e89c71999491e3afac', 'hex')
export function mp4XmpBox(kind: AiKind, text = AI_TEXT[kind]): Buffer {
  const xmp = Buffer.from(xmpPacket(kind, text), 'utf8')
  const h = Buffer.alloc(8); h.writeUInt32BE(8 + 16 + xmp.length, 0); h.write('uuid', 4, 'latin1')
  return Buffer.concat([h, XMP_UUID, xmp])
}

// argomenti ffmpeg dei metadati (commento e descrizione leggibili ovunque, anche da "Informazioni" su Mac e Windows)
export const aiVideoMetaArgs = (kind: AiKind) => ['-metadata', `comment=${AI_VIDEO_TEXT}`, '-metadata', `description=${AI_TEXT[kind]}`]

// Segno nascosto su un MP4: remux senza ricodifica (-c copy) con i metadati + box XMP. Se ffmpeg fallisce resta il
// solo box XMP (che non richiede ffmpeg); file che non sembra un MP4: torna com'era.
export async function markVideo(buf: Buffer, kind: AiKind): Promise<Buffer> {
  if (buf.length < 12 || buf.toString('latin1', 4, 8) !== 'ftyp') return buf
  let out = buf
  const dir = await mkdtemp(join(tmpdir(), 'aimark-'))
  try {
    const a = join(dir, 'in.mp4'), b = join(dir, 'out.mp4')
    await writeFile(a, buf)
    await run(['-y', '-i', a, '-map', '0', '-c', 'copy', '-map_metadata', '0', ...aiVideoMetaArgs(kind), '-movflags', '+faststart', b])
    out = await readFile(b)
  } catch (e) {
    console.error('markVideo remux', (e as Error).message)
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
  return Buffer.concat([out, mp4XmpBox(kind)])
}

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath as unknown as string, ['-v', 'error', ...args])
    let err = ''
    p.stderr.on('data', c => { err += c })
    p.on('error', reject)
    p.on('close', code => (code === 0 ? resolve() : reject(new Error(err.slice(-600)))))
  })
}
