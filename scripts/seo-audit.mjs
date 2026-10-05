#!/usr/bin/env node
// Audit SEO del sito pubblico su un server locale (dev o start): parte da /it, segue i link interni,
// legge la sitemap e segnala per le pagine /it della sitemap:
// - link interni in entrata da meno di MIN_INBOUND pagine diverse (orfane o quasi)
// - pagine della sitemap mai raggiunte seguendo i link
// - link interni rotti (non 200) e link a redirect
// - title e description duplicati, title > 60 caratteri, description fuori da 120-160
// - canonical mancante o diverso dall'URL della pagina, H1 mancante o multiplo
// Uso: node scripts/seo-audit.mjs [http://localhost:3001]   (esce con codice 1 se trova problemi)

const BASE = (process.argv[2] || process.env.AUDIT_BASE || 'http://localhost:3001').replace(/\/$/, '');
const PROD = 'https://agenteimmo.me';
const MIN_INBOUND = 3;
const CONCURRENCY = 4;
// pagine che non sono contenuti pubblici: non si seguono (siti degli agenti, accesso, piattaforma, anteprime)
const SKIP = [/^\/(it|en)\/a\//, /^\/(it|en)\/(accedi|dashboard|prova|checkout|confirm|demo|download|update|reference|tutorial|support|ambassador|bonus-result|forgot-password|reset-password|social-connected|unsubscribe-success|data-deletion|pricing_ext|nfc)(\/|$)/, /^\/(it|en)\/zz-/, /^\/api\//, /^\/_next\//, /^\/metrics/];

const decode = s => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const norm = p => { const u = new URL(p, BASE); u.hash = ''; u.search = ''; return u.pathname.replace(/\/$/, '') || '/'; };

async function get(path) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(BASE + path, { redirect: 'manual', headers: { 'user-agent': 'agenteimmo-seo-audit' } });
      const body = (r.headers.get('content-type') || '').includes('text/html') ? await r.text() : '';
      return { status: r.status, location: r.headers.get('location'), body };
    } catch (e) { if (i === 2) return { status: 0, error: String(e), body: '' }; }
  }
}

function parse(html) {
  const head = html.split('</head>')[0];
  const title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
  const desc = decode((head.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').trim();
  const canonical = (head.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const body = html.slice(head.length);
  const links = new Set();
  for (const m of body.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (/^(mailto:|tel:|javascript:|#)/.test(href)) continue;
    let u; try { u = new URL(href, BASE + '/'); } catch { continue; }
    if (u.origin !== new URL(BASE).origin && u.origin !== PROD) continue;
    links.add(norm(u.pathname));
  }
  return { title, desc, canonical, h1, links: [...links] };
}

const pages = new Map(); // path -> { status, location, title, desc, canonical, h1, links }
const inbound = new Map(); // path -> Set(source)
const skip = p => SKIP.some(r => r.test(p));

async function crawl(start) {
  const queue = [...start];
  const seen = new Set(queue);
  const worker = async () => {
    while (queue.length) {
      const path = queue.shift();
      const r = await get(path);
      const info = { status: r.status, location: r.location };
      if (r.status === 200 && r.body) Object.assign(info, parse(r.body));
      pages.set(path, info);
      for (const l of info.links || []) {
        if (l !== path) { if (!inbound.has(l)) inbound.set(l, new Set()); inbound.get(l).add(path); }
        if (!seen.has(l) && !skip(l) && /^\/(it|en)(\/|$)/.test(l)) { seen.add(l); queue.push(l); }
      }
    }
  };
  // la coda cresce mentre si legge: i worker ripartono finche' resta qualcosa
  while (queue.length) await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

const t0 = Date.now();
const sm = await get('/sitemap.xml').then(async r => r.body || (await fetch(BASE + '/sitemap.xml').then(x => x.text())));
const sitemap = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => norm(m[1].replace(PROD, '')));
const itSitemap = sitemap.filter(p => /^\/it(\/|$)/.test(p));
await crawl(['/it']);
// le pagine della sitemap mai raggiunte: si leggono comunque per controllarle
const unreached = itSitemap.filter(p => !pages.has(p));
await crawl(unreached);
// link interni verso pagine saltate (accesso, prova...): solo lo stato
const linked = [...inbound.keys()].filter(p => !pages.has(p));
for (const p of linked) { const r = await get(p); pages.set(p, { status: r.status, location: r.location }); }

const issues = {};
const add = (k, v) => (issues[k] ||= []).push(v);
for (const [p, info] of pages) {
  const from = [...(inbound.get(p) || [])];
  if (info.status !== 200 && !(info.status >= 300 && info.status < 400)) from.forEach(f => add('broken', `${f} -> ${p} (${info.status})`));
  else if (info.status >= 300 && info.status < 400 && from.length) add('redirect', `${p} -> ${info.location} (da ${from.length} pagine, es. ${from[0]})`);
}
const seo = itSitemap.map(p => [p, pages.get(p)]);
const dupe = (k) => { const m = new Map(); seo.forEach(([p, i]) => i?.[k] && m.set(i[k], [...(m.get(i[k]) || []), p])); return [...m].filter(([, ps]) => ps.length > 1); };
for (const [p, i] of seo) {
  if (!i || i.status !== 200) { add('sitemap-non-200', `${p} (${i?.status} ${i?.location || ''})`); continue; }
  const n = inbound.get(p)?.size || 0;
  if (n < MIN_INBOUND) add('low-inbound', `${p} (${n})`);
  if (!i.title) add('title-missing', p); else if (i.title.length > 60) add('title-long', `${p} (${i.title.length}) ${i.title}`);
  if (!i.desc) add('desc-missing', p); else if (i.desc.length < 120 || i.desc.length > 160) add('desc-length', `${p} (${i.desc.length})`);
  if (!i.canonical) add('canonical-missing', p); else if (norm(i.canonical.replace(PROD, '')) !== p) add('canonical-wrong', `${p} -> ${i.canonical}`);
  if (i.h1 === 0) add('h1-missing', p); else if (i.h1 > 1) add('h1-multiple', `${p} (${i.h1})`);
}
unreached.forEach(p => add('orphan-from-home', p));
dupe('title').forEach(([t, ps]) => add('title-duplicate', `"${t}": ${ps.join(', ')}`));
dupe('desc').forEach(([, ps]) => add('desc-duplicate', ps.join(', ')));

const inb = seo.map(([p]) => inbound.get(p)?.size || 0);
console.log(`\nAudit SEO ${BASE}: ${pages.size} URL lette, ${itSitemap.length} pagine /it in sitemap, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(`Link in entrata (pagine /it della sitemap): min ${Math.min(...inb)}, mediana ${inb.sort((a, b) => a - b)[inb.length >> 1]}, max ${Math.max(...inb)}`);
const keys = Object.keys(issues);
if (!keys.length) { console.log('Nessun problema trovato.'); process.exit(0); }
for (const k of keys) {
  console.log(`\n[${k}] ${issues[k].length}`);
  issues[k].slice(0, 40).forEach(x => console.log('  ' + x));
  if (issues[k].length > 40) console.log(`  ... e altri ${issues[k].length - 40}`);
}
console.log(`\nTotale: ${keys.map(k => `${k} ${issues[k].length}`).join(', ')}`);
process.exit(1);
