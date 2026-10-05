import { createHash } from 'crypto'

// Pagina /it/business-plan protetta da password (BP_PASSWORD su Vercel). Il cookie tiene l'hash, non la password.
export const BP_COOKIE = 'bp_auth'
export const bpToken = () => {
  const pw = process.env.BP_PASSWORD
  return pw ? createHash('sha256').update(`agenteimmo-bp:${pw}`).digest('hex') : null
}
