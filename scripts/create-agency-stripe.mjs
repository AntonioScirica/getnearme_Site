/**
 * create-agency-stripe.mjs
 *
 * Script one-off per creare su Stripe i prodotti, i prezzi ricorrenti e i
 * Payment Link del nuovo piano "Agenzia" (mensile + annuale).
 *
 * Crea UN prodotto "GetNearMe Agenzia" con DUE prezzi (mensile + annuale) e i
 * relativi Payment Link.
 *
 * Uso (NON incollare la chiave in chat: passala via env):
 *   set -a; . <(grep '^STRIPE_SECRET_KEY=' .env.vercel.production); set +a
 *   node scripts/create-agency-stripe.mjs
 *
 * Requisiti:
 *   - Pacchetto `stripe` installato (npm i stripe).
 *   - STRIPE_SECRET_KEY valorizzata. Con una restricted key (rk_live_...) servono
 *     i permessi WRITE su: Products, Prices, Payment Links.
 *
 * ATTENZIONE — IDEMPOTENZA:
 *   Questo script NON e' idempotente. Ogni esecuzione crea NUOVI prodotti,
 *   prezzi e payment link (duplicati). Eseguilo una sola volta.
 */

// Import dinamico: gestiamo il caso in cui `stripe` non sia installato.
let Stripe;
try {
  ({ default: Stripe } = await import('stripe'));
} catch {
  console.error('\n[ERRORE] Pacchetto "stripe" non trovato.');
  console.error('Installalo con:  npm i stripe\n');
  process.exit(1);
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('\n[ERRORE] Variabile d\'ambiente STRIPE_SECRET_KEY mancante.');
  console.error('Esegui:  STRIPE_SECRET_KEY=sk_live_... node scripts/create-agency-stripe.mjs\n');
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// UN prodotto "GetNearMe Agenzia" con DUE prezzi (mensile + annuale) e i
// rispettivi Payment Link — come per il piano Individuale.
const PRICES = [
  { period: 'monthly', unit_amount: 39900, interval: 'month' }, // €399,00/mese
  { period: 'annual', unit_amount: 358800, interval: 'year' },  // €3.588,00/anno (=€299/mese)
];

const product = await stripe.products.create({
  name: 'GetNearMe Agenzia',
  description: 'Piano Agenzia: team fino a 5 utenti, brand condiviso, quote estese.',
  metadata: { tier: 'agency' },
});

const results = [];
for (const p of PRICES) {
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: p.unit_amount,
    recurring: { interval: p.interval },
    metadata: { tier: 'agency', period: p.period },
  });
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: { tier: 'agency', period: p.period },
  });
  results.push({ plan: { period: p.period, productName: `GetNearMe Agenzia (${p.period})` }, product, price, paymentLink });
}

// Riepilogo finale.
console.log('\n========================================');
console.log('  PIANO AGENZIA — CREATO SU STRIPE');
console.log('========================================');
for (const { plan, product, price, paymentLink } of results) {
  console.log(`\n[${plan.period.toUpperCase()}] ${plan.productName}`);
  console.log(`  product_id : ${product.id}`);
  console.log(`  price_id   : ${price.id}`);
  console.log(`  link       : ${paymentLink.url}`);
}

console.log('\n----------------------------------------');
console.log('PROSSIMI PASSI:');
console.log('  (a) Incolla gli URL dei Payment Link in STRIPE_PAYMENT_LINKS');
console.log('      in src/components/dashboard/DashboardApp.tsx e nella landing.');
console.log('  (b) Aggiungi i nuovi price_id alla mappa PRICE_TO_TIER nello');
console.log('      stripe-webhook (repo extension), mappandoli a:');
console.log(`      "${results.find((r) => r.plan.period === 'monthly')?.price.id}" -> "agency_monthly"`);
console.log(`      "${results.find((r) => r.plan.period === 'annual')?.price.id}"  -> "agency_annual"`);
console.log('----------------------------------------\n');
