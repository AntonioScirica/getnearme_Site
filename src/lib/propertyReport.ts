// Report PDF di UN immobile ("Scarica il report" sul sito dell'agente e nella pagina dell'immobile in piattaforma):
// brochure A4 verticale da mandare ai clienti. Funzione pura (HTML + CSS in linea): il server la compone, il browser
// la stampa in PDF da un iframe nascosto (lib/printHtml). Rifatto il 29/09/2026: ogni pagina ha un contenuto che la
// riempie (niente meta' pagine vuote) e nessuna zona che trabocca.
//   1. copertina: foto a tutta pagina con titolo sopra, prezzo, numeri chiave, agente
//   2. foto: fino a 25, la prima pagina con una foto grande e quattro sotto, poi 6 per pagina
//   3. l'immobile: descrizione e caratteristiche complete
//   4. zona e costi, poi i contatti dell'agente
import { calculateDetailedCosts } from './reportHtml'
import { ALL_FIELDS, ENERGY_COLORS, GROUPS, formatValue, visible, type Details } from './propertyFields'
import type { SiteConfig, SiteProperty } from './siteTemplates'
import type { Poi } from './zone'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const eur = (n: number) => `${Math.round(n).toLocaleString('it-IT')} €`
const far = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`)
const walk = (m: number) => `${Math.max(1, Math.round(m / 80))} min a piedi`

// icone (tracciati lucide, 24x24)
const ICON: Record<string, string> = {
  mq: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  locali: '<path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.56v16.157a.5.5 0 0 1-.652.476l-6-1.8A1 1 0 0 1 5 18.477V5.815a1 1 0 0 1 .629-.928l6-2.4A1 1 0 0 1 13 3.415z"/>',
  camere: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M12 4v6M2 18h20"/>',
  bagni: '<path d="M10 4 8 6M17 19v2M2 12h20M7 19v2M9 5 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  web: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  walk: '<circle cx="13" cy="4" r="1"/><path d="m7 21 3-4M16 21l-2-4-3-3 1-6M6 12l2-3 3-1 3 3 3 1"/>',
  piano: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
  stato: '<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"/><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"/><path d="M5 21h14"/>',
  anno: '<path d="M16 14v2.2l1.6 1M16 2v4M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M3 10h5M8 2v4"/><circle cx="16" cy="16" r="6"/>',
  riscaldamento: '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
  spese_condominiali: '<path d="M4 10h12M4 14h9M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/>',
  posto_auto: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  esposizione: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M9.8 4.4A2 2 0 1 1 11 8H2"/>',
  ascensore: '<path d="m21 16-4 4-4-4M17 20V4m-14 4 4-4 4 4M7 4v16"/>',
  classe_energetica: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  arredato: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2M19 18v2"/>',
  climatizzazione: '<path d="m10 20-1.25-2.5L6 18M10 4 8.75 6.5 6 6m8 14 1.25-2.5L18 18m-4-14 1.25 2.5L18 6m-1 15-3-6h-4m7-12-3 6 1.5 3M2 12h6.5L10 9m10 1-1.5 2 1.5 2M22 12h-6.5L14 15M4 10l1.5 2L4 14m3 7 3-6-1.5-3M7 3l3 6h4"/>',
  cucina: '<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8m-19.9 13.8 6.4-6.3M19 5l-7 7"/>',
  piani_edificio: '<path d="M10 12h4M10 8h4M14 21v-3a2 2 0 0 0-4 0v3M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>',
  disponibilita: '<path d="M16 14v2.2l1.6 1M16 2v4M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M3 10h5M8 2v4"/><circle cx="16" cy="16" r="6"/>',
}
// i dati chiave della scheda, in ordine di importanza per chi compra: al massimo 8 riquadri con icona
const KEY_FIELDS = ['stato', 'piano', 'classe_energetica', 'riscaldamento', 'anno', 'spese_condominiali', 'posto_auto', 'ascensore', 'esposizione', 'arredato', 'climatizzazione', 'cucina', 'piani_edificio', 'disponibilita']
const icon = (k: string, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k] ?? ''}</svg>`

export type ReportInput = {
  p: SiteProperty; name: string; logo?: string | null; cfg: SiteConfig; url: string; pois: Poi[]; origin: string
  online?: string // indirizzo dell'annuncio online (vuoto: niente pulsante "Vedi l'annuncio online")
}

export function buildPropertyReportHtml(a: ReportInput): string {
  const { p, cfg } = a
  const c = cfg.primary || '#2563eb'
  const d = (p.details ?? {}) as Details
  const rent = /affitt/i.test(p.contratto ?? '')
  const showPrice = cfg.showPrices && !d.trattativa_riservata && p.prezzo > 0
  const address = d.mostra_indirizzo ? p.addr : p.addr?.split(',').map(x => x.trim()).filter(Boolean).slice(-2).join(', ')
  const photos = (p.photos?.length ? p.photos : p.cover ? [p.cover] : []).slice(0, 25)
  const tipo = p.tipologia?.split('|')[0]?.trim() || 'Immobile'
  const facts = ([['mq', p.mq ? `${p.mq} m²` : '', 'Superficie'], ['locali', p.locali, 'Locali'], ['camere', p.camere, 'Camere'], ['bagni', p.bagni, 'Bagni']] as const).filter(([, v]) => v)
  const perSqm = showPrice && !rent && p.mq ? `${Math.round(p.prezzo / p.mq).toLocaleString('it-IT')} €/m²` : ''
  const fieldBy = (k: string) => ALL_FIELDS.find(f => f.key === k)
  const val = (k: string) => { const f = fieldBy(k); return f && visible(f, d) ? formatValue(f, d[k]) : null }
  const keyTiles = KEY_FIELDS.map(k => ({ k, f: fieldBy(k)!, v: val(k) })).filter(x => x.v).slice(0, 8)
  const inTiles = new Set(keyTiles.map(x => x.k))
  const groups = GROUPS.map(g => ({ title: g.title, rows: g.fields.filter(f => visible(f, d) && f.key !== 'riferimento' && !inTiles.has(f.key) && f.key !== 'dotazioni' && f.key !== 'esterni' && !/virtual|link/i.test(f.label)).map(f => ({ label: f.label, value: formatValue(f, d[f.key]) })).filter((r): r is { label: string; value: string } => !!r.value) })).filter(g => g.rows.length)
  const extras = [...new Set([...(Array.isArray(d.esterni) ? d.esterni : []), ...(Array.isArray(d.dotazioni) ? d.dotazioni : [])] as string[])]
  const energy = typeof d.classe_energetica === 'string' ? d.classe_energetica : ''
  const costs = !rent && showPrice ? calculateDetailedCosts(p.prezzo, p.mq || 0) : null
  const desc = (p.descrizione ?? '').replace(/^## /gm, '').trim()
  const pois = [...a.pois].sort((x, y) => x.distanza - y.distanza).slice(0, 8)
  const logo = a.logo ? `<img src="${esc(a.logo)}" alt="" style="height:28px;max-width:170px;object-fit:contain;display:block">` : `<span style="font-weight:700;font-size:15px">${esc(a.name)}</span>`
  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const site = a.url.replace(/^https?:\/\//, '')
  const foot = (n: number) => `<div class="foot"><span>${esc(a.name)} · ${esc(site)}</span><span>${esc(p.riferimento ? `Rif. ${p.riferimento} · ` : '')}${n}</span></div>`
  const avatar = (size: number) => (cfg.aboutImage ? `<img class="avatar" src="${esc(cfg.aboutImage)}" alt="" style="width:${size}px;height:${size}px">` : `<div class="avatar ini" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px">${esc(a.name.slice(0, 1))}</div>`)

  const pages: string[] = []
  // 1. copertina: foto grande con titolo e indirizzo sopra, poi prezzo e numeri, agente in fondo
  pages.push(`<section class="page">
    <div class="hero">${photos[0] ? `<img src="${esc(photos[0])}" alt="">` : ''}
      <div class="brand">${logo}</div>
      <div class="hero-text">
        <div class="eyebrow light">${esc(tipo)} · ${rent ? 'Affitto' : 'Vendita'}</div>
        <h1>${esc(p.titolo)}</h1>
        ${address ? `<div class="addr">${icon('pin', 15)} ${esc(address)}</div>` : ''}
      </div>
    </div>
    <div class="pad cover-body">
      <div class="bar"></div>
      <div class="price-row">
        ${showPrice ? `<div class="price">${eur(p.prezzo)}${rent ? '<small> /mese</small>' : ''}</div>` : '<div class="price small">Prezzo su richiesta</div>'}
        ${perSqm ? `<div class="persqm">${perSqm}</div>` : ''}
      </div>
      <div class="facts">${facts.map(([k, v, l]) => `<div class="fact"><span class="ic">${icon(k, 22)}</span><b>${esc(v)}</b><span>${l}</span></div>`).join('')}</div>
      ${extras.length || energy ? `<div class="chips cover-chips">${energy ? `<span class="energy-chip"><i style="background:${ENERGY_COLORS[energy] ?? '#9ca3af'}"></i>Classe ${esc(energy)}</span>` : ''}${extras.slice(0, 6).map(x => `<span>${icon('check', 12)} ${esc(x)}</span>`).join('')}</div>` : ''}
      <div class="strip">${avatar(46)}
        <div><b>${esc(a.name)}</b><span>${esc(cfg.agentRole || 'Agente immobiliare')}${cfg.city ? ` · ${esc(cfg.city)}` : ''}</span></div>
        <div class="r">${cfg.phone ? `<b>${esc(cfg.phone)}</b>` : ''}${cfg.email ? `<span>${esc(cfg.email)}</span>` : ''}</div></div>
    </div>
    ${foot(1)}
  </section>`)

  // 2. foto: prima pagina con una foto grande e quattro sotto, poi sei per pagina (2 colonne x 3 righe)
  const rest = photos.slice(1)
  const chunks: string[][] = []
  if (rest.length) { chunks.push(rest.slice(0, 5)); for (let i = 5; i < rest.length; i += 6) chunks.push(rest.slice(i, i + 6)) }
  let shown = 1
  for (const [k, chunk] of chunks.entries()) {
    const first = k === 0 && chunk.length >= 3
    const cls = first ? 'g5' : chunk.length === 1 ? 'g1' : chunk.length === 2 ? 'g2' : chunk.length <= 4 ? 'g4' : 'g6'
    pages.push(`<section class="page">
      <div class="pad fill">
        <div class="head"><div><div class="eyebrow">${String(pages.length + 1).padStart(2, '0')} · Fotografie</div><h2>Le foto</h2></div><span class="muted">${shown + 1}–${shown + chunk.length} di ${photos.length}</span></div>
        <div class="gallery ${cls}">${chunk.map(u => `<div><img src="${esc(u)}" alt=""></div>`).join('')}</div>
      </div>
      ${foot(pages.length + 1)}
    </section>`)
    shown += chunk.length
  }

  // 3. l'immobile: descrizione in alto (al massimo meta' pagina), caratteristiche sotto su due colonne
  const tilesHtml = keyTiles.length ? `<div class="tiles">${keyTiles.map(({ k, f, v }) => `<div class="tile"><span class="ic">${k === 'classe_energetica' ? icon(k, 18) : icon(k, 18)}</span><b>${k === 'classe_energetica' ? `<i class="badge" style="background:${ENERGY_COLORS[String(v)] ?? '#9ca3af'};color:${/^(B|C|D)$/.test(String(v)) ? '#1a1a1a' : '#fff'}">${esc(v)}</i>${d.ipe ? `<small> ${esc(d.ipe)} kWh/m²a</small>` : ''}` : esc(v)}</b><span>${esc(f.label.replace('Box o posto auto', 'Box / posto auto').replace('Spese condominiali', 'Spese cond.'))}</span></div>`).join('')}</div>` : ''
  const groupsHtml = groups.length ? `<div class="groups">${groups.map(g => `<div class="grp"><h3>${esc(g.title)}</h3>${g.rows.map(r => `<div class="row"><span>${esc(r.label)}</span><b>${esc(r.value)}</b></div>`).join('')}</div>`).join('')}</div>` : ''
  const chipsHtml = extras.length ? `<div class="chips-block"><h3>Dotazioni e spazi esterni</h3><div class="chips">${extras.map(x => `<span>${icon('check', 12)} ${esc(x)}</span>`).join('')}</div></div>` : ''
  const energyHtml = energy && !inTiles.has('classe_energetica') ? `<div class="energy"><span style="background:${ENERGY_COLORS[energy] ?? '#9ca3af'};color:${/^(B|C|D)$/.test(energy) ? '#1a1a1a' : '#fff'}">${esc(energy)}</span> Classe energetica${d.ipe ? ` · ${esc(d.ipe)} kWh/m² anno` : ''}</div>` : ''
  if (desc || groups.length || keyTiles.length || extras.length || energy) pages.push(`<section class="page">
    <div class="pad fill">
      ${desc ? `<div class="eyebrow">${String(pages.length + 1).padStart(2, '0')} · La casa</div><h2>L'immobile</h2><div class="${(groups.length || keyTiles.length) && photos[1] ? 'desc-row' : ''}"><div class="desc ${groups.length || keyTiles.length ? 'half' : 'full'}">${esc(desc).split(/\n{2,}/).map(t => `<p>${t.replace(/\n/g, '<br>')}</p>`).join('')}</div>${(groups.length || keyTiles.length) && photos[1] ? `<div class="side-photo"><img src="${esc(photos[photos.length > 2 ? 2 : 1])}" alt=""></div>` : ''}</div>` : ''}
      ${groups.length || keyTiles.length || extras.length || energy ? `${desc ? '<div class="sep"></div>' : `<div class="eyebrow">${String(pages.length + 1).padStart(2, '0')} · La casa</div>`}<h2>Caratteristiche</h2>${energyHtml}${tilesHtml}${groupsHtml}${chipsHtml}` : ''}
    </div>
    ${foot(pages.length + 1)}
  </section>`)

  // 4. zona e costi in alto (due colonne), contatti dell'agente in basso, sempre nella stessa pagina
  const poisHtml = pois.length ? `<div class="eyebrow">Zona</div><h2>Cosa c'è vicino</h2><div class="pois">${pois.map(x => `<div class="poi"><div><b>${esc(x.nome)}</b><span>${esc(x.categoria)}</span></div><div class="r"><b>${far(x.distanza)}</b><span>${walk(x.distanza)}</span></div></div>`).join('')}</div><p class="note">Distanze in linea d'aria da OpenStreetMap.</p>` : ''
  const costsHtml = costs ? `<div class="eyebrow">Acquisto</div><h2>Quanto costa davvero</h2><div class="card costs">
      ${([['Prezzo richiesto', costs.listingPrice], [`Agenzia (~${costs.agencyPercentage}% + IVA)`, costs.agencyCost], ['Notaio (stima)', costs.notaryCost], ['Imposte (stima)', costs.taxesCost], ['Perizia e assicurazione', costs.otherCosts]] as const).map(([l, v]) => `<div class="row"><span>${esc(l)}</span><b>${eur(v)}</b></div>`).join('')}
      <div class="row total"><span>Totale stimato</span><b>${eur(costs.totalEstimated)}</b></div>
    </div><p class="note">Stima indicativa per l'acquisto come prima casa: le cifre reali dipendono da mutuo, notaio e accordi con l'agenzia.</p>` : ''
  const contact = ([['phone', cfg.phone, `tel:${cfg.phone}`], ['mail', cfg.email, `mailto:${cfg.email}`], ['pin', cfg.address || cfg.city, ''], ['web', site, a.url]] as const).filter(([, v]) => v)
  pages.push(`<section class="page last">
    <div class="pad top">
      ${poisHtml || costsHtml ? `<div class="${poisHtml && costsHtml ? 'two' : ''}">${poisHtml ? `<div>${poisHtml}</div>` : ''}${costsHtml ? `<div>${costsHtml}</div>` : ''}</div>` : ''}
      ${photos.length > 1 ? `<div class="band"><img src="${esc(photos[photos.length > 3 ? 3 : 1])}" alt=""></div>` : ''}
    </div>
    <div class="end">
      <div class="agent">${avatar(76)}
        <div><div class="eyebrow">Ti interessa?</div><h2 style="margin:4px 0 2px">${esc(a.name)}</h2><div class="muted">${esc(cfg.agentRole || 'Agente immobiliare')}${cfg.city ? ` a ${esc(cfg.city)}` : ''}</div></div>
      </div>
      <p class="lead">Chiamami per una visita o per qualsiasi domanda su questa casa${p.riferimento ? ` (rif. ${esc(p.riferimento)})` : ''}.</p>
      <div class="contact">${contact.map(([k, v, href]) => `<div>${icon(k, 17)} ${href ? `<a href="${esc(href)}">${esc(v)}</a>` : esc(v)}</div>`).join('')}</div>
      ${a.online ? `<a class="cta" href="${esc(a.online)}">Vedi l'annuncio online</a>` : ''}
      <p class="legal">Report generato il ${today}. Le informazioni sono fornite dall'agente a titolo indicativo e non costituiscono proposta contrattuale.${cfg.legal ? ` ${esc(cfg.legal)}.` : ''}</p>
    </div>
    ${foot(pages.length + 1)}
  </section>`)

  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(p.titolo)}</title>
<base href="${esc(a.origin)}/"><link rel="stylesheet" href="/fonts/satoshi/satoshi.css">
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Satoshi,system-ui,sans-serif;color:#1c1c1c;background:#eee}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff;margin:0 auto;page-break-after:always;break-after:page}
.pad{padding:14mm 16mm 20mm}.pad.fill{height:100%;display:flex;flex-direction:column}
.head{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:2mm}.muted{color:#777;font-size:13px}.bar{width:14mm;height:4px;background:${c};border-radius:4px;margin:0 0 6mm}.sep{height:1px;background:#eee;margin:7mm 0 6mm}
.eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${c}}.eyebrow.light{color:#fff;opacity:.9}
h1{font-size:34px;line-height:1.1;margin:8px 0 10px;letter-spacing:-.02em;color:#fff;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 2px 12px rgba(0,0,0,.25)}
h2{font-size:21px;margin:0 0 10px;letter-spacing:-.01em}h3{font-size:11.5px;margin:0 0 6px;color:${c};text-transform:uppercase;letter-spacing:.08em}
/* copertina */
.hero{position:relative;height:172mm;background:#e9e9e6}.hero img{width:100%;height:100%;object-fit:cover;display:block}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.72) 100%)}
.brand{position:absolute;left:12mm;top:12mm;z-index:2;background:#fff;border-radius:14px;padding:9px 14px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.hero-text{position:absolute;left:16mm;right:16mm;bottom:12mm;z-index:2}
.addr{display:flex;gap:6px;align-items:center;color:#fff;font-size:14px;opacity:.95}.addr svg{color:#fff}
.cover-body{position:absolute;left:0;right:0;top:172mm;bottom:0;padding-top:11mm;padding-bottom:16mm}
.price-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.price{font-size:36px;font-weight:800;letter-spacing:-.02em}.price small{font-size:15px;color:#777;font-weight:500}.price.small{font-size:20px;color:#666;font-weight:700}.persqm{font-size:14px;color:#777;font-weight:500}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.fact{background:#f6f6f4;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:1px}.fact .ic{color:${c};margin-bottom:6px}.fact b{font-size:19px}.fact span:last-child{font-size:11px;color:#777}
.cover-chips{margin-top:10px}
.strip{position:absolute;left:16mm;right:16mm;bottom:16mm;display:flex;align-items:center;gap:12px;border-top:1px solid #eee;padding-top:11px}
.strip b{display:block;font-size:14px}.strip span{display:block;font-size:11.5px;color:#777}.strip .r{margin-left:auto;text-align:right}
.avatar{border-radius:999px;object-fit:cover;flex:none}.ini{background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
/* foto */
.gallery{display:grid;gap:8px;flex:1;min-height:0;margin-top:6px}.gallery>div{min-height:0;overflow:hidden;border-radius:16px;background:#f2f2f0}.gallery img{width:100%;height:100%;object-fit:cover;display:block}
.gallery.g5{grid-template-columns:1fr 1fr;grid-template-rows:1.15fr 1fr 1fr}.gallery.g5>div:first-child{grid-column:span 2}.gallery.g1{grid-template-columns:1fr}.gallery.g2{grid-template-columns:1fr;grid-template-rows:1fr 1fr}.gallery.g4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}.gallery.g6{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr}
/* immobile */
.desc-row{display:grid;grid-template-columns:1fr 62mm;gap:8mm;align-items:start}.side-photo{height:74mm;border-radius:16px;overflow:hidden;background:#f2f2f0}.side-photo img{width:100%;height:100%;object-fit:cover;display:block}
.desc{font-size:12.5px;line-height:1.62;color:#444;overflow:hidden}.desc.half{max-height:74mm}.desc.full{max-height:236mm;column-count:2;column-gap:10mm}.desc p{margin:0 0 8px;break-inside:avoid}
.energy{display:flex;align-items:center;gap:10px;font-size:13px;margin:-2px 0 10px}.energy span{font-weight:800;border-radius:8px;padding:4px 10px}
/* dati chiave con icona, poi il resto della scheda in due colonne a righe sottili */
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:2px 0 12px}
.tile{background:#f6f6f4;border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:1px;min-height:62px}.tile .ic{color:${c};height:20px;display:flex;align-items:center;margin-bottom:5px}.tile b{font-size:13.5px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.tile span:last-child{font-size:10px;color:#777;margin-top:2px}
.badge{display:inline-block;font-style:normal;font-weight:800;border-radius:6px;padding:1px 8px;font-size:12.5px}.tile small{font-size:10px;color:#777;font-weight:500}
.groups{columns:2;column-gap:12mm}
.grp{break-inside:avoid;margin-bottom:12px;padding-top:2px;border-top:2px solid ${c}22}.grp h3{margin:8px 0 2px}
.chips-block{margin-top:4px}.chips-block h3{margin-bottom:6px}
.card{break-inside:avoid;background:#f6f6f4;border-radius:14px;padding:10px 12px;margin-bottom:10px}
.row{display:flex;justify-content:space-between;gap:12px;font-size:11.5px;padding:5px 0;border-bottom:1px solid #ececea}.row:last-child{border-bottom:0}.row span{color:#666}.row b{text-align:right}.card .row{border-color:#e6e6e2}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.chips span{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;background:#f6f6f4;border-radius:999px;padding:5px 11px}.chips svg{color:${c}}
.energy-chip i{display:inline-block;width:9px;height:9px;border-radius:999px}
/* zona e costi */
.page.last{display:flex;flex-direction:column}.pad.top{flex:1;min-height:0;display:flex;flex-direction:column;padding-bottom:8mm}.band{flex:1;min-height:24mm;margin-top:8mm;border-radius:16px;overflow:hidden;background:#f2f2f0}.band img{width:100%;height:100%;object-fit:cover;display:block}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12mm}
.pois{display:grid;gap:6px}.poi{display:flex;justify-content:space-between;gap:8px;background:#f6f6f4;border-radius:12px;padding:8px 12px;font-size:11.5px}.poi span{display:block;color:#777;font-size:10px}.poi .r{text-align:right;white-space:nowrap}
.costs .total{border-top:2px solid ${c};margin-top:4px;padding-top:8px;font-size:14px}.costs .total span{color:#1c1c1c;font-weight:700}.note{font-size:10px;color:#888;margin:8px 2px 0}
/* contatti */
.end{flex:none;margin:0 12mm 14mm;background:${c}0f;border-radius:22px;padding:9mm 10mm 7mm}
.agent{display:flex;align-items:center;gap:16px}
.lead{font-size:16px;line-height:1.5;margin:12px 0 10px}
.contact{display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;font-size:13.5px}.contact div{display:flex;align-items:center;gap:9px;min-width:0}.contact svg{color:${c};flex:none}.contact a{color:inherit;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cta{display:inline-block;margin-top:14px;background:${c};color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:11px 20px;font-size:13px}
.legal{font-size:9.5px;color:#888;line-height:1.5;margin:10px 0 0}
.foot{position:absolute;left:16mm;right:16mm;bottom:8mm;display:flex;justify-content:space-between;font-size:9.5px;color:#aaa}
@media print{body{background:#fff}.page{margin:0}}
</style></head><body>${pages.join('')}</body></html>`
}
