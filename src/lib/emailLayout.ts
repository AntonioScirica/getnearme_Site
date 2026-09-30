// Layout comune delle email di Agente Immo (tabelle e stili in linea: Gmail, Outlook, Apple Mail).
// Carattere della piattaforma (Plus Jakarta Sans) dove il client lo carica, altrimenti quello di sistema.
// Pezzi: email() = pagina intera, eyebrow/title/text/photo/button/features/beforeAfter = blocchi del corpo.

const BLUE = '#537eec'
const INK = '#1d1d1f'
const FONT = "'Plus Jakarta Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const eyebrow = (t: string) => `<tr><td style="padding:0 40px"><span style="display:inline-block;background:#eef2fd;color:${BLUE};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px">${t}</span></td></tr>`
export const title = (t: string) => `<tr><td style="padding:16px 40px 0;font-family:${FONT};font-size:30px;line-height:1.18;font-weight:800;letter-spacing:-.02em;color:${INK}">${t}</td></tr>`
export const text = (t: string) => `<tr><td style="padding:14px 40px 0;font-family:${FONT};font-size:16px;line-height:1.65;color:#55555a">${t}</td></tr>`
export const photo = (src: string, alt: string, caption?: string) => `<tr><td style="padding:26px 40px 0"><img src="${src}" width="480" alt="${esc(alt)}" style="display:block;width:100%;height:auto;border-radius:22px;border:0">${caption ? `<div style="padding-top:10px;font-family:${FONT};font-size:13px;color:#8a8a8f;text-align:center">${caption}</div>` : ''}</td></tr>`
export const button = (href: string, label: string, sub?: string) => `<tr><td align="center" style="padding:30px 40px 0;text-align:center">
<a href="${href}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-family:${FONT};font-weight:700;font-size:16px;line-height:1;padding:18px 32px;border-radius:999px;box-shadow:0 10px 24px -10px rgba(83,126,236,.7)">${label}&nbsp;&nbsp;&rarr;</a>
${sub ? `<div style="padding-top:12px;font-family:${FONT};font-size:13px;color:#8a8a8f">${sub}</div>` : ''}</td></tr>`
// righe con numero nel cerchio blu, titolo e descrizione
export const features = (rows: [string, string][]) => `<tr><td style="padding:26px 40px 0"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;border-radius:22px">${rows.map(([t, d], i) => `
<tr><td width="52" valign="middle" style="padding:${i ? 14 : 20}px 0 ${i === rows.length - 1 ? 20 : 0}px 20px"><div style="width:32px;height:32px;line-height:32px;border-radius:999px;background:${BLUE};color:#fff;text-align:center;font-family:${FONT};font-weight:800;font-size:14px">${i + 1}</div></td>
<td valign="middle" style="padding:${i ? 14 : 20}px 20px ${i === rows.length - 1 ? 20 : 0}px 0;font-family:${FONT}"><div style="font-size:15px;font-weight:700;color:${INK}">${t}</div><div style="font-size:14px;line-height:1.5;color:#6b6b70;padding-top:2px">${d}</div></td></tr>`).join('')}</table></td></tr>`
export const beforeAfter = (before: string, after: string, label: string) => `<tr><td style="padding:28px 40px 0"><div style="font-family:${FONT};font-size:13px;font-weight:700;color:#8a8a8f;padding-bottom:10px">${label}</div>
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" style="padding-right:5px"><img src="${before}" width="235" alt="Prima" style="display:block;width:100%;border-radius:16px"><div style="padding-top:6px;font-family:${FONT};font-size:12px;color:#8a8a8f;text-align:center">Prima</div></td>
<td width="50%" style="padding-left:5px"><img src="${after}" width="235" alt="Dopo" style="display:block;width:100%;border-radius:16px"><div style="padding-top:6px;font-family:${FONT};font-size:12px;color:${BLUE};font-weight:700;text-align:center">Dopo, con Agente Immo</div></td>
</tr></table></td></tr>`
// prima e dopo grande, affiancato, con le etichette sopra (niente testo sulle foto: alcuni client lo perdono)
export const beforeAfterHero = (before: string, after: string) => `<tr><td style="padding:26px 28px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="50%" valign="top" style="padding-right:6px"><div style="padding:0 0 8px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:.1em;color:#8a8a8f">PRIMA</div><img src="${before}" width="246" alt="La stanza prima" style="display:block;width:100%;height:auto;border-radius:18px;border:0"></td>
<td width="50%" valign="top" style="padding-left:6px"><div style="padding:0 0 8px;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:.1em;color:${BLUE}">DOPO, CON AGENTE IMMO</div><img src="${after}" width="246" alt="La stanza arredata" style="display:block;width:100%;height:auto;border-radius:18px;border:0"></td>
</tr></table></td></tr>`
// blocco blu con tre numeri grandi
export const stats = (heading: string, items: [string, string][]) => `<tr><td style="padding:28px 28px 0"><table width="100%" cellpadding="0" cellspacing="0" style="background:${BLUE};background-image:linear-gradient(135deg,#5f8af2,#4a6fe0);border-radius:24px"><tr><td colspan="${items.length}" style="padding:22px 24px 4px;font-family:${FONT};font-size:13px;font-weight:700;color:rgba(255,255,255,.8)">${heading}</td></tr><tr>${items.map(([n, l]) => `<td valign="top" style="padding:6px 24px 24px;font-family:${FONT}"><div style="font-size:30px;font-weight:800;letter-spacing:-.02em;color:#fff;line-height:1.1">${n}</div><div style="font-size:13px;color:rgba(255,255,255,.85);padding-top:4px">${l}</div></td>`).join('')}</tr></table></td></tr>`
// firma personale: chi scrive e che si puo' rispondere (reply-to info@agenteimmo.me)
export const signature = (name: string, role: string) => `<tr><td style="padding:32px 40px 0;font-family:${FONT}"><div style="border-top:1px solid #eeeeec;padding-top:22px;font-size:15px;line-height:1.6;color:#55555a">Se hai una domanda rispondi pure a questa email: la leggo io.</div><div style="padding-top:12px;font-size:15px;font-weight:800;color:${INK}">${name}</div><div style="font-size:13px;color:#8a8a8f">${role}</div></td></tr>`
export const ps = (t: string) => `<tr><td style="padding:18px 40px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#6b6b70"><strong style="color:${INK}">P.S.</strong> ${t}</td></tr>`
// versione solo testo (va sempre insieme all'HTML: aiuta a non finire in spam)
export const toText = (html: string) => html
  .replace(/<div style="display:none[\s\S]*?<\/div>/, '')
  .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_m, h: string, t: string) => `${t.replace(/<[^>]+>/g, '').replace(/&nbsp;|&rarr;/g, ' ').trim()}: ${h}`)
  .replace(/<br\s*\/?>|<\/(tr|div|p|h1)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '').replace(/&amp;/g, '&')
  .replace(/&#8199;|&#847;/g, '').split('\n').map(l => l.trim()).filter((l, i, a) => l || (a[i - 1] ?? '') !== '').join('\n').trim()

// link di riserva sotto il bottone (se il bottone non si apre, es. alcuni client aziendali)
export const fallback = (href: string) => `<tr><td style="padding:22px 40px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:#9a9a9f">Se il bottone non funziona, copia questo indirizzo nel browser:<br><a href="${href}" style="color:${BLUE};word-break:break-all">${href}</a></td></tr>`

export function email(opts: { preheader: string; body: string; footer?: string }) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet"><title>Agente Immo</title></head>
<body style="margin:0;padding:0;background:#f3f3f1;font-family:${FONT};color:${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f1"><tr><td align="center" style="padding:32px 14px 40px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="background:#ffffff;border-radius:32px;border:1px solid #ebebea;padding:34px 0 40px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 40px 24px;text-align:center"><a href="https://agenteimmo.me/it" style="text-decoration:none;color:${INK}"><img src="https://agenteimmo.me/immo/logo-mark.png" width="40" height="40" alt="" style="vertical-align:middle;border:0"><span style="font-family:${FONT};font-size:20px;font-weight:800;letter-spacing:-.02em;vertical-align:middle;padding-left:8px">Agente <span style="color:${BLUE}">Immo</span></span></a></td></tr>
<tr><td style="padding:0 40px 30px"><div style="height:1px;line-height:1px;font-size:0;background:#eeeeec">&nbsp;</div></td></tr>
${opts.body}</table>
</td></tr>
<tr><td align="center" style="padding:24px 24px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#9a9a9f;text-align:center">
${opts.footer ? `${opts.footer}<br>` : ''}Agente Immo · Viale Pretoriano 3, Roma · P.IVA 16096461005<br><a href="https://agenteimmo.me/it" style="color:#9a9a9f">agenteimmo.me</a></td></tr>
</table></td></tr></table></body></html>`
}
