import { z } from 'zod'
import { zColor } from '@remotion/zod-types'

// Props dei due video. Gli stessi campi che oggi arrivano a src/lib/reel/render.ts (rotta /api/platform/video-reel),
// con le foto come URL (in produzione: URL firmati; in Studio: file in public/).
export const photoSchema = z.object({
  src: z.string().min(1),
  staged: z.boolean(), // "Immagine arredata virtualmente"
})

export const agentSchema = z.object({
  name: z.string(),
  agency: z.string(),
  phone: z.string(),
  site: z.string(),
  color: zColor(),
  logoUrl: z.string().optional(),
})

export const styleSchema = z.enum(['vivace', 'elegante'])
export const contractSchema = z.enum(['vendita', 'affitto'])

export const annuncioSchema = z.object({
  style: styleSchema,
  contract: contractSchema,
  photos: z.array(photoSchema).min(1).max(8),
  title: z.string(),
  place: z.string(),
  price: z.string(),
  mq: z.string(),
  rooms: z.string(),
  agent: agentSchema,
  musicUrl: z.string().optional(),
})

export const vendutoSchema = z.object({
  style: styleSchema,
  contract: contractSchema,
  photo: photoSchema,
  place: z.string(),
  days: z.string(),
  agent: agentSchema,
  musicUrl: z.string().optional(),
})

export type AnnuncioProps = z.infer<typeof annuncioSchema>
export type VendutoProps = z.infer<typeof vendutoSchema>
export type Agent = z.infer<typeof agentSchema>
