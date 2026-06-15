// Abilita i codici promo (coupon) su TUTTI i Payment Link Stripe.
// I Payment Link creati via API non sono modificabili dal Dashboard -> solo via API.
//
// Uso:
//   STRIPE_SECRET_KEY=sk_live_xxx node scripts/enable-stripe-promo.mjs
//   (oppure rk_live_xxx con scope payment_links:write)
//
// Idempotente: rilanciabile, abilita allow_promotion_codes=true su ogni link attivo.

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error('Manca STRIPE_SECRET_KEY. Uso: STRIPE_SECRET_KEY=sk_live_xxx node scripts/enable-stripe-promo.mjs');
  process.exit(1);
}

const AUTH = { Authorization: `Bearer ${KEY}` };

async function listAll() {
  const links = [];
  let starting_after = null;
  for (;;) {
    const qs = new URLSearchParams({ limit: '100', active: 'true' });
    if (starting_after) qs.set('starting_after', starting_after);
    const res = await fetch(`https://api.stripe.com/v1/payment_links?${qs}`, { headers: AUTH });
    const json = await res.json();
    if (json.error) { console.error('List error:', json.error.message); process.exit(1); }
    links.push(...json.data);
    if (!json.has_more) break;
    starting_after = json.data[json.data.length - 1].id;
  }
  return links;
}

async function enable(id) {
  const body = new URLSearchParams({ allow_promotion_codes: 'true' });
  const res = await fetch(`https://api.stripe.com/v1/payment_links/${id}`, { method: 'POST', headers: { ...AUTH, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const json = await res.json();
  if (json.error) return { id, ok: false, err: json.error.message };
  return { id, ok: true, url: json.url, allow: json.allow_promotion_codes };
}

const links = await listAll();
console.log(`Trovati ${links.length} payment link attivi.`);
for (const l of links) {
  const r = await enable(l.id);
  console.log(r.ok ? `✓ ${r.id} promo=${r.allow} (${r.url})` : `✗ ${r.id}: ${r.err}`);
}
console.log('Fatto.');
