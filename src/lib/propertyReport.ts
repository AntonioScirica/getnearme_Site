// Report PDF di UN immobile per il sito dell'agente ("Scarica il report"): brochure A4 verticale,
// senza la tabella di confronto del report dell'estensione. Funzione pura (HTML + CSS in linea):
// il server la compone, il browser la stampa in PDF da un iframe nascosto.
import { calculateDetailedCosts } from './reportHtml'
import { ENERGY_COLORS, GROUPS, groupFacts, type Details } from './propertyFields'
import type { SiteConfig, SiteProperty } from './siteTemplates'
import type { Poi } from './zone'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const eur = (n: number) => `${Math.round(n).toLocaleString('it-IT')} €`
const far = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`)

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
}
const icon = (k: string, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[k] ?? ''}</svg>`

export function buildPropertyReportHtml(a: {
  p: SiteProperty; name: string; logo?: string | null; cfg: SiteConfig; url: string; pois: Poi[]; origin: string
}): string {
  const { p, cfg } = a
  const c = cfg.primary || '#2563eb'
  const d = (p.details ?? {}) as Details
  const rent = /affitt/i.test(p.contratto ?? '')
  const showPrice = cfg.showPrices && !d.trattativa_riservata && p.prezzo > 0
  const address = d.mostra_indirizzo ? p.addr : p.addr?.split(',').map(x => x.trim()).filter(Boolean).slice(-2).join(', ')
  const photos = (p.photos?.length ? p.photos : p.cover ? [p.cover] : []).slice(0, 5)
  const tipo = p.tipologia?.split('|')[0]?.trim() || 'Immobile'
  const facts = ([['mq', p.mq ? `${p.mq} m²` : '', 'Superficie'], ['locali', p.locali, 'Locali'], ['camere', p.camere, 'Camere'], ['bagni', p.bagni, 'Bagni']] as const)
    .filter(([, v]) => v)
  const groups = GROUPS.map(g => ({ title: g.title, rows: groupFacts(g, d).filter(r => !/virtual|link/i.test(r.label)) })).filter(g => g.rows.length)
  const extras = [...(Array.isArray(d.esterni) ? d.esterni : []), ...(Array.isArray(d.dotazioni) ? d.dotazioni : [])] as string[]
  const energy = typeof d.classe_energetica === 'string' ? d.classe_energetica : ''
  const costs = !rent && showPrice ? calculateDetailedCosts(p.prezzo, p.mq || 0) : null
  const desc = (p.descrizione ?? '').replace(/^## /gm, '').trim()
  const pois = [...a.pois].sort((x, y) => x.distanza - y.distanza).slice(0, 10)
  const logo = a.logo ? `<img src="${esc(a.logo)}" alt="" style="height:30px;max-width:180px;object-fit:contain">` : `<span style="font-weight:700;font-size:15px">${esc(a.name)}</span>`
  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const foot = (n: number) => `<div class="foot"><span>${esc(a.name)} · ${esc(a.url.replace(/^https?:\/\//, ''))}</span><span>${n}</span></div>`

  const pages: string[] = []
  // 1. copertina
  pages.push(`<section class="page cover">
    <div class="hero">${photos[0] ? `<img src="${esc(photos[0])}" alt="">` : ''}<div class="brand">${logo}</div></div>
    <div class="pad">
      <div class="eyebrow">${esc(tipo)} · ${rent ? 'Affitto' : 'Vendita'}</div>
      <h1>${esc(p.titolo)}</h1>
      ${address ? `<div class="addr">${icon('pin', 15)} ${esc(address)}</div>` : ''}
      ${showPrice ? `<div class="price">${eur(p.prezzo)}${rent ? '<small> /mese</small>' : ''}</div>` : '<div class="price small">Prezzo su richiesta</div>'}
      <div class="facts">${facts.map(([k, v, l]) => `<div class="fact"><span class="ic">${icon(k, 20)}</span><b>${esc(v)}</b><span>${l}</span></div>`).join('')}</div>
    </div>
    <div class="strip">${cfg.aboutImage ? `<img src="${esc(cfg.aboutImage)}" alt="">` : `<div class="ini">${esc(a.name.slice(0, 1))}</div>`}
      <div><b>${esc(a.name)}</b><span>${esc(cfg.agentRole || 'Agente immobiliare')}</span></div>
      <div class="r">${cfg.phone ? `<b>${esc(cfg.phone)}</b>` : ''}${cfg.email ? `<span>${esc(cfg.email)}</span>` : ''}</div></div>
    ${foot(1)}
  </section>`)
  // 2. foto e descrizione
  if (photos.length > 1 || desc) pages.push(`<section class="page">
    <div class="pad">
      ${photos.length > 1 ? `<div class="grid g${Math.min(4, photos.length - 1)}">${photos.slice(1, 5).map(u => `<div><img src="${esc(u)}" alt=""></div>`).join('')}</div>` : ''}
      ${desc ? `<h2>L'immobile</h2><div class="desc">${esc(desc).split(/\n{2,}/).map(t => `<p>${t.replace(/\n/g, '<br>')}</p>`).join('')}</div>` : ''}
    </div>
    ${foot(pages.length + 1)}
  </section>`)
  // 3. dettagli: caratteristiche a sinistra, zona e costi a destra. Con molte caratteristiche queste prendono
  //    tutta la pagina su due colonne e zona e costi passano alla pagina dei contatti.
  const heavy = groups.reduce((n, g) => n + g.rows.length + 2, 0) + Math.ceil(extras.length / 3) > 24
  const left = groups.length || extras.length || energy ? `<h2>Caratteristiche</h2>
      ${energy ? `<div class="energy"><span style="background:${ENERGY_COLORS[energy] ?? '#9ca3af'};color:${/^(B|C|D)$/.test(energy) ? '#1a1a1a' : '#fff'}">${esc(energy)}</span> Classe energetica${d.ipe ? ` · ${esc(d.ipe)} kWh/m² anno` : ''}</div>` : ''}
      <div class="${heavy ? 'groups' : ''}">${groups.map(g => `<div class="card"><h3>${esc(g.title)}</h3>${g.rows.map(r => `<div class="row"><span>${esc(r.label)}</span><b>${esc(r.value)}</b></div>`).join('')}</div>`).join('')}</div>
      ${extras.length ? `<div class="chips">${extras.map(x => `<span>${icon('check', 13)} ${esc(x)}</span>`).join('')}</div>` : ''}` : ''
  const right = `${pois.length ? `<h2>Cosa c'è vicino</h2><div class="pois">${pois.map(x => `<div class="poi"><div><b>${esc(x.nome)}</b><span>${esc(x.categoria)}</span></div><div class="r"><b>${far(x.distanza)}</b><span>${Math.max(1, Math.round(x.distanza / 80))} min a piedi</span></div></div>`).join('')}</div>` : ''}
      ${costs ? `<h2 style="margin-top:${pois.length ? 24 : 0}px">Quanto costa davvero</h2><div class="card costs">
        ${([['Prezzo richiesto', costs.listingPrice], [`Agenzia (~${costs.agencyPercentage}% + IVA)`, costs.agencyCost], ['Notaio (stima)', costs.notaryCost], ['Imposte (stima)', costs.taxesCost], ['Perizia e assicurazione', costs.otherCosts]] as const).map(([l, v]) => `<div class="row"><span>${l}</span><b>${eur(v)}</b></div>`).join('')}
        <div class="row total"><span>Totale stimato</span><b>${eur(costs.totalEstimated)}</b></div>
      </div><p class="note">Stima indicativa per l'acquisto come prima casa: le cifre reali dipendono da mutuo, notaio e accordi con l'agenzia.</p>` : ''}`
  // senza caratteristiche, zona e costi vanno nella pagina dei contatti (niente pagina mezza vuota)
  const rightOnEnd = (!left || heavy) && !!right.trim()
  if (left) pages.push(`<section class="page">
    <div class="pad"><div class="${!rightOnEnd && right.trim() ? 'two' : ''}"><div>${left}</div>${rightOnEnd ? '' : `<div>${right}</div>`}</div></div>
    ${foot(pages.length + 1)}
  </section>`)
  // 5. contatti
  const contact = ([['phone', cfg.phone, `tel:${cfg.phone}`], ['mail', cfg.email, `mailto:${cfg.email}`], ['pin', cfg.address || cfg.city, ''], ['web', a.url.replace(/^https?:\/\//, ''), a.url]] as const).filter(([, v]) => v)
  pages.push(`<section class="page end">
    <div class="pad">
      ${rightOnEnd ? `<div style="margin-bottom:14mm">${right}</div>` : ''}
      <div class="agent" style="${rightOnEnd ? 'margin-top:0' : ''}">
        ${cfg.aboutImage ? `<img src="${esc(cfg.aboutImage)}" alt="">` : `<div class="ini">${esc(a.name.slice(0, 1))}</div>`}
        <div><div class="eyebrow">Ti interessa?</div><h2 style="margin:6px 0 4px">${esc(a.name)}</h2><div class="muted">${esc(cfg.agentRole || 'Agente immobiliare')}${cfg.city ? ` a ${esc(cfg.city)}` : ''}</div></div>
      </div>
      <p class="lead">Chiamami per una visita o per qualsiasi domanda su questa casa${p.riferimento ? ` (rif. ${esc(p.riferimento)})` : ''}.</p>
      <div class="contact">${contact.map(([k, v, href]) => `<div>${icon(k, 18)} ${href ? `<a href="${esc(href)}">${esc(v)}</a>` : esc(v)}</div>`).join('')}</div>
      <a class="cta" href="${esc(`${a.url}/${p.id}`)}">Vedi l'annuncio online</a>
      <p class="legal">Report generato il ${today}. Le informazioni sono fornite dall'agente a titolo indicativo e non costituiscono proposta contrattuale; distanze in linea d'aria da OpenStreetMap.${cfg.legal ? ` ${esc(cfg.legal)}.` : ''}</p>
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
.pad{padding:16mm 16mm 22mm}
.hero{position:relative;height:150mm;background:#f2f2f2}.hero img{width:100%;height:100%;object-fit:cover;display:block}
.brand{position:absolute;left:12mm;top:12mm;background:#fff;border-radius:16px;padding:10px 16px;box-shadow:0 8px 24px rgba(0,0,0,.15)}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${c}}
h1{font-size:32px;line-height:1.12;margin:10px 0 12px;letter-spacing:-.02em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
h2{font-size:22px;margin:0 0 14px;letter-spacing:-.01em}h3{font-size:13px;margin:0 0 8px;color:${c};text-transform:uppercase;letter-spacing:.08em}
.addr{display:flex;gap:6px;align-items:center;color:#666;font-size:14px}.addr svg{color:${c}}
.price{font-size:34px;font-weight:800;margin-top:14px;letter-spacing:-.02em}.price small{font-size:15px;color:#777;font-weight:500}.price.small{font-size:18px;color:#666}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}
.fact{background:#f6f6f4;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}.fact .ic{color:${c};margin-bottom:4px}.fact b{font-size:18px}.fact span:last-child{font-size:11px;color:#777}
.grid{display:grid;gap:8px;margin-bottom:20px}.grid img{width:100%;height:100%;object-fit:cover;border-radius:16px;display:block}
.grid.g1{grid-template-columns:1fr;height:110mm}.grid.g2{grid-template-columns:1fr 1fr;height:80mm}.grid.g3{grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;height:110mm}.grid.g3>div:first-child{grid-row:span 2}
.grid.g4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:120mm}.grid>div{min-height:0}
.desc{font-size:12.5px;line-height:1.6;color:#444;column-count:1;max-height:118mm;overflow:hidden}.desc p{margin:0 0 8px}
.energy{display:flex;align-items:center;gap:10px;font-size:13px;margin-bottom:14px}.energy span{font-weight:800;border-radius:8px;padding:4px 10px}
.strip{position:absolute;left:16mm;right:16mm;bottom:18mm;display:flex;align-items:center;gap:12px;border-top:1px solid #eee;padding-top:12px}
.strip img,.strip .ini{width:44px;height:44px;border-radius:999px;object-fit:cover;flex:none}.strip .ini{background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px}
.strip b{display:block;font-size:14px}.strip span{display:block;font-size:11.5px;color:#777}.strip .r{margin-left:auto;text-align:right}
.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.groups{columns:2;column-gap:10px}
.card{break-inside:avoid;background:#f6f6f4;border-radius:16px;padding:12px 14px;margin-bottom:10px}
.row{display:flex;justify-content:space-between;gap:12px;font-size:11.5px;padding:4px 0;border-bottom:1px solid #e6e6e2}.row:last-child{border-bottom:0}.row span{color:#666}.row b{text-align:right}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.chips span{display:inline-flex;align-items:center;gap:4px;font-size:12px;background:#f6f6f4;border-radius:999px;padding:6px 12px}.chips svg{color:${c}}
.pois{display:grid;gap:6px}.poi{display:flex;justify-content:space-between;gap:8px;background:#f6f6f4;border-radius:12px;padding:9px 12px;font-size:12px}.poi span{display:block;color:#777;font-size:10.5px}.poi .r{text-align:right;white-space:nowrap}
.costs .total{border-top:2px solid ${c};margin-top:4px;padding-top:8px;font-size:14px}.costs .total span{color:#1c1c1c;font-weight:700}.note{font-size:10.5px;color:#888;margin:8px 2px}
.agent{display:flex;align-items:center;gap:18px;margin-top:20mm}.agent img,.agent .ini{width:84px;height:84px;border-radius:999px;object-fit:cover;flex:none}.agent .ini{background:${c};color:#fff;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700}
.muted{color:#777;font-size:14px}.lead{font-size:18px;line-height:1.5;margin:22px 0}
.contact{display:grid;gap:12px;font-size:15px}.contact div{display:flex;align-items:center;gap:10px}.contact svg{color:${c}}.contact a{color:inherit;text-decoration:none}
.cta{display:inline-block;margin-top:24px;background:${c};color:#fff;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 22px;font-size:14px}
.legal{position:absolute;left:16mm;right:16mm;bottom:20mm;font-size:9.5px;color:#999;line-height:1.5}
.foot{position:absolute;left:16mm;right:16mm;bottom:9mm;display:flex;justify-content:space-between;font-size:9.5px;color:#aaa}
@media print{body{background:#fff}.page{margin:0}}
</style></head><body>${pages.join('')}</body></html>`
}
