// Impronta del dispositivo per la prova gratis della landing (30/09): resta uguale cambiando IP (VPN) o aprendo una
// finestra in incognito. Mette insieme cose stabili del browser e dell'hardware (disegno su canvas, scheda grafica,
// schermo, fuso orario, lingua, core) e ne fa un hash: nessun dato personale lascia il browser, solo l'hash.
// ponytail: fatta in casa, si inganna cambiando browser; servizio a pagamento (Fingerprint Pro) se serve piu' precisione.
export async function deviceId(): Promise<string> {
  const parts: string[] = []
  try {
    const c = document.createElement('canvas'); c.width = 240; c.height = 60
    const g = c.getContext('2d')!
    g.textBaseline = 'top'; g.font = "16px 'Arial'"; g.fillStyle = '#f60'; g.fillRect(100, 1, 62, 20)
    g.fillStyle = '#069'; g.fillText('Agente Immo, prova 🏠 1.0', 2, 15)
    g.fillStyle = 'rgba(102, 204, 0, 0.7)'; g.fillText('Agente Immo, prova 🏠 1.0', 4, 17)
    parts.push(c.toDataURL())
  } catch { parts.push('nocanvas') }
  try {
    const gl = document.createElement('canvas').getContext('webgl') as WebGLRenderingContext | null
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info')
    parts.push(gl && dbg ? `${gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)}` : 'nogl')
  } catch { parts.push('nogl') }
  const n = navigator as Navigator & { deviceMemory?: number }
  parts.push(`${screen.width}x${screen.height}x${screen.colorDepth}`, String(devicePixelRatio), Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language, String(n.hardwareConcurrency ?? ''), String(n.deviceMemory ?? ''), navigator.platform, String(navigator.maxTouchPoints))
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('||')))
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}
