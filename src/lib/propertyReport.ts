// Report PDF di UN immobile ("Scarica il report" sul sito dell'agente e nella pagina dell'immobile in piattaforma):
// brochure A4 verticale da mandare ai clienti, in stile editoriale (29/09/2026): foto a tutta pagina, titoli con il
// font dei titoli del sito (o Playfair Display), filetti sottili al posto dei riquadri grigi, numeri grandi, una fascia
// scura con l'agente in chiusura. Funzione pura (HTML + CSS in linea): il server la compone, il browser la stampa in
// PDF da un iframe nascosto (lib/printHtml). Ogni pagina e' piena e niente trabocca.
//   1. copertina: foto a tutta pagina, titolo, indirizzo, prezzo e numeri chiave
//   2. la casa: numeri in colonna, descrizione, una foto
//   3. foto: fino a 40, nove per pagina (3 x 3) a filo dei bordi; l'ultima pagina si adatta a quante ne restano
//   4. caratteristiche: dati chiave in grande, scala energetica, il resto della scheda a filetti
//   5. zona e costi, chiusura con l'agente
import { calculateDetailedCosts } from './reportHtml'
import { ALL_FIELDS, ENERGY_COLORS, GROUPS, formatValue, visible, type Details } from './propertyFields'
import { FONTS, zoneOnly, type SiteConfig, type SiteProperty } from './siteTemplates'
import type { Poi } from './zone'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const eur = (n: number) => `${Math.round(n).toLocaleString('it-IT')} €`
const far = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`)
const walk = (m: number) => `${Math.max(1, Math.round(m / 80))} min a piedi`
const ENERGY_SCALE = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G']

// icone (tracciati lucide, 24x24)
const ICON: Record<string, string> = {
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  web: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
}
const icon = (k: string, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[k] ?? ''}</svg>`
// i dati chiave della scheda, in ordine di importanza per chi compra: al massimo 4 in grande
const KEY_FIELDS = ['piano', 'anno', 'stato', 'riscaldamento', 'spese_condominiali', 'posto_auto', 'ascensore', 'esposizione', 'arredato', 'disponibilita']
const SHORT: Record<string, string> = { spese_condominiali: 'Spese condominiali', posto_auto: 'Box / posto auto', anno: 'Anno', piani_edificio: 'Piani edificio' }

export type ReportInput = {
  p: SiteProperty; name: string; logo?: string | null; cfg: SiteConfig; url: string; pois: Poi[]; origin: string
  online?: string // indirizzo dell'annuncio online (vuoto: niente "Vedi l'annuncio online")
}

export function buildPropertyReportHtml(a: ReportInput): string {
  const { p, cfg } = a
  const c = cfg.primary || '#2563eb'
  const d = (p.details ?? {}) as Details
  const rent = /affitt/i.test(p.contratto ?? '')
  const showPrice = cfg.showPrices && !d.trattativa_riservata && p.prezzo > 0
  const address = d.mostra_indirizzo ? p.addr : zoneOnly(p.addr)
  const city = (p.addr ?? '').split(',').map(x => x.trim()).filter(Boolean).pop()?.replace(/^\d{5}\s*/, '') ?? ''
  const photos = (p.photos?.length ? p.photos : p.cover ? [p.cover] : []).slice(0, 40)
  const tipo = p.tipologia?.split('|')[0]?.trim() || 'Immobile'
  const facts = ([[p.mq ? `${p.mq}` : '', 'm²', 'Superficie'], [p.locali, '', 'Locali'], [p.camere, '', 'Camere'], [p.bagni, '', 'Bagni']] as const).filter(([v]) => v)
  const perSqm = showPrice && !rent && p.mq ? `${Math.round(p.prezzo / p.mq).toLocaleString('it-IT')} €/m²` : ''
  const fieldBy = (k: string) => ALL_FIELDS.find(f => f.key === k)
  const val = (k: string) => { const f = fieldBy(k); return f && visible(f, d) ? formatValue(f, d[k]) : null }
  const energy = typeof d.classe_energetica === 'string' ? d.classe_energetica : ''
  const keyFacts = KEY_FIELDS.map(k => ({ k, label: SHORT[k] ?? fieldBy(k)!.label, v: val(k) })).filter(x => x.v).slice(0, energy ? 3 : 4)
  const inKey = new Set(keyFacts.map(x => x.k))
  const groups = GROUPS.map(g => ({ title: g.title, rows: g.fields.filter(f => visible(f, d) && !['riferimento', 'dotazioni', 'esterni', 'classe_energetica', 'ipe'].includes(f.key) && !inKey.has(f.key) && !/virtual|link/i.test(f.label)).map(f => ({ label: f.label, value: formatValue(f, d[f.key]) })).filter((r): r is { label: string; value: string } => !!r.value) })).filter(g => g.rows.length)
  const extras = [...new Set([...(Array.isArray(d.esterni) ? d.esterni : []), ...(Array.isArray(d.dotazioni) ? d.dotazioni : [])] as string[])]
  const costs = !rent && showPrice ? calculateDetailedCosts(p.prezzo, p.mq || 0) : null
  const desc = (p.descrizione ?? '').replace(/^## /gm, '').trim()
  const paras = desc ? desc.split(/\n{2,}/).map(t => t.trim()).filter(Boolean) : []
  const pois = [...a.pois].sort((x, y) => x.distanza - y.distanza).slice(0, 8)
  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const site = a.url.replace(/^https?:\/\//, '')
  // font dei titoli: quello scelto per il sito, altrimenti Playfair Display (servito dal nostro proxy dei font)
  const heading = FONTS.find(f => f.id === cfg.headingFont) ?? FONTS.find(f => f.id === 'playfair')!
  const brand = a.logo ? `<img src="${esc(a.logo)}" alt="" class="logo">` : `<span class="wordmark">${esc(a.name)}</span>`
  const avatar = (size: number) => (cfg.aboutImage ? `<img class="avatar" src="${esc(cfg.aboutImage)}" alt="" style="width:${size}px;height:${size}px">` : `<div class="avatar ini" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px">${esc(a.name.slice(0, 1))}</div>`)
  const head = (n: number, title: string) => `<div class="phead"><span>${String(n).padStart(2, '0')} — ${esc(title)}</span><span>${esc(a.name)}</span></div>`
  const foot = (n: number) => `<div class="foot"><span>${esc(p.titolo)}</span><span>${n}</span></div>`

  const pages: string[] = []
  // 1. copertina
  pages.push(`<section class="page cover">
    ${photos[0] ? `<img class="full" src="${esc(photos[0])}" alt="">` : ''}
    <div class="shade"></div>
    <div class="cover-top">${brand}<span class="cover-ref">${rent ? 'Affitto' : 'Vendita'}${p.riferimento ? ` · Rif. ${esc(p.riferimento)}` : ''}</span></div>
    <div class="cover-text">
      <div class="eyebrow light">${esc(tipo)}${city ? ` · ${esc(city)}` : ''}</div>
      <h1>${esc(p.titolo)}</h1>
      ${address ? `<div class="addr">${icon('pin', 14)} ${esc(address)}</div>` : ''}
      <div class="cover-row">
        <div class="cover-facts">${facts.map(([v, u, l]) => `<div><b>${esc(v)}${u ? `<small> ${u}</small>` : ''}</b><span>${l}</span></div>`).join('')}</div>
        <div class="cover-price">${showPrice ? `<b>${eur(p.prezzo)}${rent ? '<small>/mese</small>' : ''}</b>${perSqm ? `<span>${perSqm}</span>` : ''}` : '<b class="small">Prezzo su richiesta</b>'}</div>
      </div>
    </div>
  </section>`)

  // 2. la casa: numeri in colonna a sinistra, descrizione a destra, foto sotto
  const numbers = [...facts.map(([v, u, l]) => [`${v}${u ? ` ${u}` : ''}`, l] as const), ...keyFacts.slice(0, 2).map(x => [x.v!, x.label] as const), ...(energy ? [[energy, 'Classe energetica'] as const] : [])].slice(0, 6)
  if (paras.length || numbers.length) pages.push(`<section class="page">
    ${head(2, 'La casa')}
    <div class="body fill">
      <div class="cols">
        <div class="numbers">${numbers.map(([v, l]) => `<div class="num"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
        <div class="text">
          ${paras.length ? `<p class="lead">${esc(paras[0]).replace(/\n/g, '<br>')}</p>${paras.slice(1, 5).map(t => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('')}` : ''}
          ${extras.length ? `<p class="extras"><span class="eyebrow">Dotazioni</span>${extras.map(esc).join(' <i>·</i> ')}</p>` : ''}
        </div>
      </div>
      ${photos[1] ? `<div class="band"><img src="${esc(photos[photos.length > 2 ? 2 : 1])}" alt=""></div>` : ''}
    </div>
    ${foot(pages.length + 1)}
  </section>`)

  // 3. foto: nove per pagina (3 x 3) a filo dei bordi; con meno di nove la griglia si allarga
  const rest = photos.slice(1)
  const chunks: string[][] = []
  for (let i = 0; i < rest.length; i += 9) chunks.push(rest.slice(i, i + 9))
  let shown = 1
  for (const chunk of chunks) {
    const n = chunk.length
    const cls = n === 1 ? 'g1' : n === 2 ? 'g2' : n === 3 ? 'g3' : n === 4 ? 'g4' : n <= 6 ? 'g6' : 'g9'
    pages.push(`<section class="page">
      ${head(pages.length + 1, `Fotografie · ${shown + 1}–${shown + chunk.length} di ${photos.length}`)}
      <div class="gallery ${cls}">${chunk.map(u => `<div><img src="${esc(u)}" alt=""></div>`).join('')}</div>
      ${foot(pages.length + 1)}
    </section>`)
    shown += chunk.length
  }

  // 4. caratteristiche
  const scale = energy ? `<div class="scale">${ENERGY_SCALE.map(k => `<span class="${k === energy ? 'on' : ''}" style="background:${ENERGY_COLORS[k]}">${k}</span>`).join('')}<div class="scale-cap"><b>Classe ${esc(energy)}</b>${d.ipe ? ` · ${esc(d.ipe)} kWh/m² anno` : ''}</div></div>` : ''
  if (keyFacts.length || groups.length || energy || extras.length) pages.push(`<section class="page">
    ${head(pages.length + 1, 'Caratteristiche')}
    <div class="body fill">
      ${keyFacts.length || energy ? `<div class="keys">${keyFacts.map(x => `<div class="key"><span class="eyebrow">${esc(x.label)}</span><b>${esc(x.v)}</b></div>`).join('')}${energy ? `<div class="key"><span class="eyebrow">Classe energetica</span><b><i class="badge" style="background:${ENERGY_COLORS[energy] ?? '#9ca3af'};color:#151515">${esc(energy)}</i></b></div>` : ''}</div>` : ''}
      ${scale}
      ${groups.length ? `<div class="sheet">${groups.map(g => `<div class="grp"><h3>${esc(g.title)}</h3>${g.rows.map(r => `<div class="row"><span>${esc(r.label)}</span><b>${esc(r.value)}</b></div>`).join('')}</div>`).join('')}</div>` : ''}
      ${extras.length ? `<div class="grp wide"><h3>Dotazioni e spazi esterni</h3><div class="tags">${extras.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>` : ''}
      ${photos.length > 3 ? `<div class="band grow"><img src="${esc(photos[3])}" alt=""></div>` : ''}
    </div>
    ${foot(pages.length + 1)}
  </section>`)

  // 5. zona e costi, chiusura con l'agente
  const poisHtml = pois.length ? `<div><h2>Cosa c'è vicino</h2><div class="list">${pois.map(x => `<div class="row"><span><b>${esc(x.nome)}</b><br><em>${esc(x.categoria)}</em></span><b>${far(x.distanza)}<br><em>${walk(x.distanza)}</em></b></div>`).join('')}</div><p class="note">Distanze in linea d'aria da OpenStreetMap.</p></div>` : ''
  const costsHtml = costs ? `<div><h2>Quanto costa davvero</h2><div class="list">${([['Prezzo richiesto', costs.listingPrice], [`Agenzia (~${costs.agencyPercentage}% + IVA)`, costs.agencyCost], ['Notaio (stima)', costs.notaryCost], ['Imposte (stima)', costs.taxesCost], ['Perizia e assicurazione', costs.otherCosts]] as const).map(([l, v]) => `<div class="row"><span>${esc(l)}</span><b>${eur(v)}</b></div>`).join('')}</div><div class="total"><span class="eyebrow">Totale stimato</span><b>${eur(costs.totalEstimated)}</b></div><p class="note">Stima indicativa per l'acquisto come prima casa: le cifre reali dipendono da mutuo, notaio e accordi con l'agenzia.</p></div>` : ''
  const contact = ([['phone', cfg.phone, `tel:${cfg.phone}`], ['mail', cfg.email, `mailto:${cfg.email}`], ['web', site, a.url]] as const).filter(([, v]) => v)
  pages.push(`<section class="page last">
    ${head(pages.length + 1, 'Zona e costi')}
    <div class="body top">
      ${poisHtml || costsHtml ? `<div class="cols2">${poisHtml}${costsHtml}</div>` : ''}
      ${photos[1] ? `<div class="band grow"><img src="${esc(photos[photos.length > 4 ? 4 : 1])}" alt=""></div>` : ''}
    </div>
    <div class="agent">
      <div class="agent-row">${avatar(64)}
        <div class="agent-who"><span class="eyebrow light">${esc(cfg.agentRole || 'Agente immobiliare')}${cfg.city ? ` · ${esc(cfg.city)}` : ''}</span><b>${esc(a.name)}</b></div>
        ${a.online ? `<a class="cta" href="${esc(a.online)}">Vedi l'annuncio online</a>` : ''}
      </div>
      <p class="agent-lead">Chiamami per una visita o per qualsiasi domanda su questa casa${p.riferimento ? ` (rif. ${esc(p.riferimento)})` : ''}.</p>
      <div class="agent-contacts">${contact.map(([k, v, href]) => `<a href="${esc(href)}">${icon(k, 14)} ${esc(v)}</a>`).join('')}${cfg.address ? `<span>${icon('pin', 14)} ${esc(cfg.address)}</span>` : ''}</div>
    </div>
    <p class="legal">Report generato il ${today}. Le informazioni sono fornite dall'agente a titolo indicativo e non costituiscono proposta contrattuale.${cfg.legal ? ` ${esc(cfg.legal)}.` : ''}</p>
  </section>`)

  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(p.titolo)}</title>
<base href="${esc(a.origin)}/"><link rel="stylesheet" href="/fonts/satoshi/satoshi.css"><link rel="stylesheet" href="/api/site/fonts?ids=${esc(heading.id)}">
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:Satoshi,system-ui,sans-serif;color:#151515;background:#e9e9e7;font-size:12px;line-height:1.5}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff;margin:0 auto;page-break-after:always;break-after:page;display:flex;flex-direction:column}
h1,h2,.num b,.key b,.cover-price b,.total b,.agent-who b{font-family:'${heading.family}',Georgia,serif;font-weight:${heading.weight};letter-spacing:-.01em}
h1{font-size:44px;line-height:1.05;margin:8px 0 12px;color:#fff;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
h2{font-size:24px;margin:0 0 10px;line-height:1.15}h3{font-size:9.5px;margin:0 0 4px;text-transform:uppercase;letter-spacing:.16em;color:${c};font-weight:700}
.eyebrow{font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${c}}.eyebrow.light{color:#fff;opacity:.85}
.phead{display:flex;justify-content:space-between;padding:12mm 16mm 0;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#888;font-weight:600}
.body{padding:8mm 16mm 0}.body.fill{flex:1;min-height:0;display:flex;flex-direction:column;padding-bottom:6mm}.body.top{flex:1;min-height:0;display:flex;flex-direction:column;padding-bottom:8mm}
.foot{padding:0 16mm 9mm;display:flex;justify-content:space-between;font-size:9px;color:#aaa}.page:not(.cover)>.foot{margin-top:auto}
/* copertina */
.cover .full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 28%,rgba(0,0,0,0) 45%,rgba(0,0,0,.78) 100%)}
.cover-top{position:absolute;left:16mm;right:16mm;top:14mm;display:flex;justify-content:space-between;align-items:center;color:#fff}
.logo{height:30px;max-width:180px;object-fit:contain;display:block;filter:drop-shadow(0 1px 6px rgba(0,0,0,.4))}.wordmark{font-size:15px;font-weight:700;letter-spacing:.02em}.cover-ref{font-size:10px;letter-spacing:.16em;text-transform:uppercase;opacity:.9}
.cover-text{position:absolute;left:16mm;right:16mm;bottom:18mm;color:#fff}
.addr{display:flex;gap:6px;align-items:center;font-size:13px;opacity:.95}
.cover-row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.35)}
.cover-facts{display:flex;gap:22px}.cover-facts b{display:block;font-size:20px;font-weight:700;line-height:1.1}.cover-facts small{font-size:12px;font-weight:500;opacity:.85}.cover-facts span{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;margin-top:2px}
.cover-price{text-align:right}.cover-price b{display:block;font-size:34px;line-height:1}.cover-price b.small{font-size:20px}.cover-price small{font-size:14px;font-family:Satoshi,sans-serif;font-weight:500;opacity:.85}.cover-price span{display:block;font-size:11px;opacity:.8;margin-top:4px}
/* la casa */
.cols{display:grid;grid-template-columns:52mm 1fr;gap:12mm;align-items:start}
.numbers .num{padding:9px 0;border-bottom:1px solid #e3e3e0}.numbers .num:first-child{border-top:1px solid #151515}.num b{display:block;font-size:26px;line-height:1.05}.num span{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-top:3px}
.text .lead{font-size:16px;line-height:1.45;margin:0 0 10px;color:#151515}.text p{margin:0 0 8px;color:#444;font-size:12px;line-height:1.6}
.text{max-height:112mm;overflow:hidden}
.extras{margin-top:12px!important;font-size:11.5px;color:#444}.extras .eyebrow{display:block;margin-bottom:4px}.extras i{color:${c};font-style:normal;margin:0 2px}
.band{flex:1;min-height:30mm;margin-top:8mm;overflow:hidden;border-radius:4px;background:#f0f0ee}.band img{width:100%;height:100%;object-fit:cover;display:block}.band.grow{min-height:20mm}
/* foto */
.gallery{flex:1;min-height:0;display:grid;gap:4mm;padding:6mm 10mm 0}.gallery>div{min-height:0;overflow:hidden;border-radius:3px;background:#f0f0ee}.gallery img{width:100%;height:100%;object-fit:cover;display:block}
.gallery.g1{grid-template-columns:1fr}.gallery.g2{grid-template-columns:1fr;grid-template-rows:1fr 1fr}
.gallery.g3{grid-template-columns:1fr 1fr;grid-template-rows:1.6fr 1fr}.gallery.g3>div:first-child{grid-column:span 2}
.gallery.g4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}.gallery.g6{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr 1fr}
.gallery.g9{grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr;gap:3mm}
.gallery+.foot{padding-top:6mm}
/* caratteristiche */
.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:8mm;border-top:1px solid #151515;padding-top:10px;margin-bottom:8mm}.key b{display:block;font-size:22px;line-height:1.1;margin-top:5px}.key .eyebrow{color:#888}
.badge{display:inline-block;font-style:normal;font-family:Satoshi,sans-serif;font-weight:800;border-radius:6px;padding:2px 12px;font-size:16px;line-height:1.4}
.scale{margin-bottom:8mm}.scale>span{display:inline-block;width:9.4%;margin-right:.6%;padding:5px 0;text-align:center;font-size:9.5px;font-weight:800;color:#151515;opacity:.45;border-radius:3px}.scale>span.on{opacity:1;box-shadow:0 0 0 2px #fff,0 0 0 3.5px #151515}.scale-cap{font-size:11px;color:#666;margin-top:6px}
.sheet{columns:2;column-gap:12mm}.grp{break-inside:avoid;margin-bottom:6mm}.grp.wide{margin-top:2mm}
.row{display:flex;justify-content:space-between;gap:12px;font-size:11.5px;padding:5px 0;border-bottom:1px solid #e6e6e3}.row span{color:#666}.row b{text-align:right;font-weight:600}
.tags{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11.5px}.tags span::before{content:"";display:inline-block;width:5px;height:5px;border-radius:99px;background:${c};margin-right:7px;vertical-align:2px}
/* zona e costi */
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:12mm}.list .row{align-items:flex-start;padding:7px 0}.list em{font-style:normal;font-size:10px;color:#999}
.total{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid #151515;margin-top:6px;padding-top:10px}.total b{font-size:26px}
.note{font-size:9.5px;color:#999;margin:8px 0 0;line-height:1.5}
/* agente */
.agent{margin:auto 12mm 0;background:#151515;color:#fff;border-radius:10px;padding:8mm 9mm 7mm}
.agent-row{display:flex;align-items:center;gap:14px}.agent-who{flex:1;min-width:0}.agent-who b{display:block;font-size:24px;line-height:1.1;margin-top:3px}
.avatar{border-radius:999px;object-fit:cover;flex:none}.ini{background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:Satoshi,sans-serif}
.cta{background:#fff;color:#151515;text-decoration:none;font-weight:700;border-radius:999px;padding:10px 18px;font-size:12px;white-space:nowrap}
.agent-lead{font-size:14px;line-height:1.5;margin:14px 0 10px;color:rgba(255,255,255,.9)}
.agent-contacts{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:12.5px}.agent-contacts a,.agent-contacts span{display:inline-flex;align-items:center;gap:7px;color:#fff;text-decoration:none}.agent-contacts svg{color:${c};filter:brightness(1.6)}
.legal{margin:5mm 16mm 9mm;font-size:8.5px;color:#999;line-height:1.5}
@media print{body{background:#fff}.page{margin:0}}
</style></head><body>${pages.join('')}</body></html>`
}
