import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'

// Planimetrie catastali: foglio A4 con intestazione, timbri, cartiglio, cantina a parte e bussola. Dato intero al
// modello, la pianta veniva ridisegnata inventata; ritagliata sul solo appartamento, GPT la tiene uguale (prova del
// 29/09 su una catastale di Milano ruotata di 45 gradi). Sonnet trova il riquadro (~0,005 $).
export type Box = { left: number; top: number; width: number; height: number }

export async function planBox(img: Buffer, userId: string): Promise<Box | null> {
  const { width: W = 0, height: H = 0 } = await sharp(img).rotate().metadata()
  if (!W || !H) return null
  const small = await sharp(img).rotate().resize(1024, 1024, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()
  const t0 = Date.now()
  try {
    const resp = await new Anthropic().messages.create({
      model: 'claude-sonnet-5', max_tokens: 300,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: small.toString('base64') } },
        { type: 'text', text: 'This is a floor plan document. Find the bounding box of the MAIN apartment floor plan only: its outer walls, balconies and terraces, plus the stairwell and lift drawn attached to it. Exclude the title block, header, stamps, signatures, legend, compass, scale, notes and any separate small drawing (cellar, garage, attic drawn apart). Reply only with JSON {"x0": ..., "y0": ..., "x1": ..., "y1": ...} as fractions 0-1 of the image width and height.' },
      ] }],
    })
    await logUsage({ userId, kind: 'planimetria_ritaglio' }, false, Date.now() - t0, { input: resp.usage.input_tokens, output: resp.usage.output_tokens }, true, 'claude-sonnet-5').catch(() => {})
    const txt = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('')
    const b = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as { x0: number; y0: number; x1: number; y1: number }
    const m = 0.03 // margine: i muri esterni non vanno tagliati
    const x0 = Math.max(0, b.x0 - m), y0 = Math.max(0, b.y0 - m), x1 = Math.min(1, b.x1 + m), y1 = Math.min(1, b.y1 + m)
    // riquadro strano (vuoto o quasi tutto il foglio): si usa l'immagine intera
    if (!(x1 - x0 > 0.15 && y1 - y0 > 0.15) || (x1 - x0) * (y1 - y0) > 0.9) return null
    return { left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) }
  } catch (e) {
    console.error('planimetria ritaglio', e)
    return null
  }
}

export const cropTo = async (img: Buffer, b: Box) =>
  `data:image/jpeg;base64,${(await sharp(img).rotate().extract(b).jpeg({ quality: 92 }).toBuffer()).toString('base64')}`

// risultato rimesso dove stava la pianta, su un foglio bianco grande come l'originale (il prima/dopo combacia)
export async function pasteBack(img: Buffer, out: Buffer, b: Box): Promise<string> {
  const { width = 0, height = 0 } = await sharp(img).rotate().metadata()
  const piece = await sharp(out).resize(b.width, b.height, { fit: 'fill' }).toBuffer()
  const page = await sharp({ create: { width, height, channels: 3, background: '#ffffff' } }).composite([{ input: piece, left: b.left, top: b.top }]).png().toBuffer()
  return page.toString('base64')
}

// Foto da un punto della planimetria: prima di disegnare, Claude legge la pianta con la fotocamera rossa e scrive cosa si
// vede davvero da li' (muri pieni che bloccano la vista, porte, stanze dietro). GPT da solo "vedeva" anche un bagno che
// si apre solo dalla camera (prova del 02/10). ~0,03 $ con Opus.
export async function camView(marked: Buffer, fov: number, userId: string): Promise<string | null> {
  const img = await sharp(marked).rotate().resize(1600, 1600, { fit: 'inside' }).jpeg({ quality: 88 }).toBuffer()
  const t0 = Date.now()
  try {
    const resp = await new Anthropic().messages.create({
      model: 'claude-opus-5-5', max_tokens: 6000, // Opus ragiona prima di rispondere: con 900 token il ragionamento li consumava tutti e il testo restava vuoto
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img.toString('base64') } },
        { type: 'text', text: `This is an apartment floor plan. A photographer stands at the solid red dot, eye height 1.5 m, and the red cone is the camera's horizontal field of view (about ${fov} degrees). Work out precisely what the photo will show. Solid wall lines block the view completely; only door openings (gaps in walls, door swing arcs), open passages and windows let you see beyond. A room is visible ONLY if there is a straight line of sight from the dot through an opening into it within the cone; rooms reachable only through another room's door (for example an en-suite bathroom accessed from a bedroom) are NOT visible unless that inner door is also in direct line of sight. Assume doors drawn with a swing arc are open; a door seen at a sharp angle shows only a sliver of the room.
Reply in English, plain text, no preamble, in this order:
1. ROOM: the room the photographer is in, its approximate size and shape.
2. VISIBLE, from left to right across the frame: each wall, corner, door opening, window, passage and what can be seen through it (which room, how much of it), with rough distance from the camera.
3. NOT VISIBLE: rooms and doors that must NOT appear (behind walls, behind the camera or outside the cone).
Be exact and brief.` },
      ] }],
    })
    await logUsage({ userId, kind: 'planimetria_vista' }, false, Date.now() - t0, { input: resp.usage.input_tokens, output: resp.usage.output_tokens }, true, 'claude-opus-5-5').catch(() => {})
    const txt = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('').trim()
    return txt || null
  } catch (e) {
    console.error('camView', e)
    return null
  }
}
