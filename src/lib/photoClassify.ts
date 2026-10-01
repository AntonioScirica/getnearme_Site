import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '@/lib/ai'

// Tipo di foto con Claude Haiku: usato dalla chat (api/platform/photo-classify) e dalla prova gratis (api/landing/demo,
// che rifiuta le foto che non sono di una casa prima di spendere la generazione)
export type Classified = { scene: 'interno' | 'esterno' | 'giardino' | 'planimetria'; room: string; state?: string }
const SCENES = ['interno', 'esterno', 'giardino', 'planimetria']
const ROOMS = ['openspace', 'soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'sala', 'studio', 'ingresso', 'corridoio', 'balcone', 'cantina', 'box', 'altro']
const STATES = ['vuota', 'disordinata', 'datata', 'arredata']
const PROMPT = `Classifica questa foto immobiliare. Rispondi SOLO con JSON {"scene": "...", "room": "...", "state": "..."}.
scene: interno (stanza, anche balconi/logge/terrazzi di appartamento), esterno (facciata vista da fuori), giardino (giardino o cortile a terra), planimetria (disegno tecnico della pianta di una casa, con muri e stanze), nessuna (NON e' una foto o una pianta di un immobile: sfondi, grafiche astratte, schermate, persone, documenti, oggetti).
room (solo per interno, altrimenti ""): ${ROOMS.join(', ')}. openspace = cucina e zona giorno nello stesso ambiente (anche separate da penisola o muretto): SOLO se nella foto si vedono davvero mobili o elettrodomestici della cucina (piano cottura, lavello, pensili, frigo, cappa, penisola con piano di lavoro). Un tavolo da pranzo con le sedie NON e' una cucina: divano + tavolo da pranzo senza cucina visibile = soggiorno. Balconi e terrazzi = balcone.
state (solo per interno, altrimenti ""): vuota (senza veri mobili), disordinata (arredata ma in disordine), datata (mobili/finiture vecchi), arredata (arredata e in ordine).`

const clean = (o: Partial<Classified> | null | undefined): Classified | null => {
  if (!o || !SCENES.includes(String(o.scene))) return null
  const interno = o.scene === 'interno'
  return { scene: o.scene as Classified['scene'], room: interno && ROOMS.includes(String(o.room)) ? String(o.room) : interno ? 'altro' : '', state: interno && STATES.includes(String(o.state)) ? String(o.state) : '' }
}

// ~0,002 $ a foto (immagine + 60 token): si registra in ai_usage e si blocca oltre CLASSIFY_DAILY_LIMIT al giorno (500)
export async function viaHaiku(image: { imageBase64?: string; imageUrl?: string }, userId: string): Promise<Classified> {
  const key = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!key) throw new Error('no_key')
  const t0 = Date.now()
  const m = image.imageBase64?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/)
  const source = m
    ? { type: 'base64' as const, media_type: m[1] as 'image/jpeg' | 'image/png' | 'image/webp', data: m[2] }
    : { type: 'url' as const, url: image.imageUrl! }
  const resp = await new Anthropic({ apiKey: key }).messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 60, temperature: 0,
    messages: [{ role: 'user', content: [{ type: 'image', source }, { type: 'text', text: PROMPT }] }],
  })
  const text = resp.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  const c = clean(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? 'null'))
  await logUsage({ userId, kind: 'classify' }, false, Date.now() - t0, { input: resp.usage.input_tokens, output: resp.usage.output_tokens }, !!c, 'claude-haiku-4-5-20251001').catch(() => {})
  if (!c) throw new Error('haiku_failed')
  return c
}

