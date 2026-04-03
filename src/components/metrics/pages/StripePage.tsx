"use client";

import type { MetricsData } from "../types";
import { MONO, fmt } from "../types";

const EVENT_LABEL: Record<string, string> = {
  "checkout.session.completed":        "Checkout completato",
  "invoice.payment_succeeded":         "Pagamento riuscito",
  "invoice.payment_failed":            "Pagamento fallito",
  "customer.subscription.created":     "Nuova subscription",
  "customer.subscription.updated":     "Subscription aggiornata",
  "customer.subscription.deleted":     "Subscription cancellata",
  "payment_intent.succeeded":          "Payment intent ok",
  "payment_intent.payment_failed":     "Payment intent fallito",
};

const EVENT_COLOR: Record<string, string> = {
  "checkout.session.completed":        "text-emerald-400",
  "invoice.payment_succeeded":         "text-emerald-400",
  "invoice.payment_failed":            "text-red-400",
  "customer.subscription.created":     "text-indigo-400",
  "customer.subscription.updated":     "text-sky-400",
  "customer.subscription.deleted":     "text-amber-400",
  "payment_intent.succeeded":          "text-emerald-400",
  "payment_intent.payment_failed":     "text-red-400",
};

// Monthly price per plan (EUR)
const PLAN_PRICE: Record<string, number> = {
  agency_starter:   24,
  agency:           99,
  agency_pro:       149,
  agency_monthly:   399,
  agency_quarterly: Math.round(349 * 3 / 3),   // 349/mese equivalente
  agency_annual:    Math.round(300 / 12),        // 25/mese equivalente
  user_lite:        4.99,
};

// 4 macro-piani da mostrare
const PLAN_GROUPS = [
  {
    key: "lite",
    label: "Lite",
    color: "bg-slate-500/70",
    types: ["user_lite"],
    price: 4.99,
  },
  {
    key: "starter",
    label: "Starter",
    color: "bg-sky-500/70",
    types: ["agency_starter"],
    price: 24,
  },
  {
    key: "pro",
    label: "Pro",
    color: "bg-indigo-500/70",
    types: ["agency", "agency_pro"],
    price: 99, // avg
  },
  {
    key: "agency",
    label: "Agency",
    color: "bg-violet-500/70",
    types: ["agency_monthly", "agency_quarterly", "agency_annual"],
    price: 399,
  },
];

function fmtEur(eur: number) {
  return `€${eur.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtEurInt(eur: number) {
  return `€${Math.round(eur).toLocaleString("it-IT")}`;
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
}

export default function StripePage({ data }: { data: MetricsData }) {
  const s = data.stripeStats;

  // ── Subscription distribution from user_credits (always available) ──
  const creditsByType = Object.fromEntries(
    data.credits.map(c => [c.subscription_type, c])
  );

  const planGroups = PLAN_GROUPS.map(g => {
    const users = g.types.reduce((sum, t) => sum + (creditsByType[t]?.users || 0), 0);
    // MRR: sum each sub-type's users × its price
    const mrr = g.types.reduce((sum, t) => {
      const u = creditsByType[t]?.users || 0;
      return sum + u * (PLAN_PRICE[t] ?? g.price);
    }, 0);
    return { ...g, users, mrr };
  }).filter(g => g.users > 0 || true); // show all even if 0

  const totalPaidUsers = planGroups.reduce((s, g) => s + g.users, 0);
  const totalMrrFromCredits = planGroups.reduce((s, g) => s + g.mrr, 0);
  const planMax = Math.max(...planGroups.map(g => g.users), 1);

  // ── Stripe events data ──
  const hasStripeData = s?.hasData && s.totalEvents > 0;
  const revTrend = s?.revenueTrend.slice(-12) || [];
  const revMax = Math.max(...revTrend.map(r => r.amount_eur), 1);
  const allMonths = Array.from(new Set([
    ...(s?.newSubsTrend.map(r => r.month) || []),
    ...(s?.churnByMonth.map(r => r.month) || []),
  ])).sort().slice(-12);
  const newSubMap = Object.fromEntries((s?.newSubsTrend || []).map(r => [r.month, r.count]));
  const churnMap  = Object.fromEntries((s?.churnByMonth || []).map(r => [r.month, r.count]));
  const subChurnMax = Math.max(...allMonths.map(m => Math.max(newSubMap[m] || 0, churnMap[m] || 0)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Stripe</h1>
        <p className={`${MONO} text-xs text-gray-500 mt-1`}>Revenue, abbonamenti e pagamenti</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>MRR stimato</p>
          <p className={`${MONO} text-3xl font-semibold text-emerald-400`}>{fmtEurInt(totalMrrFromCredits)}</p>
          <p className={`${MONO} text-[10px] text-gray-600 mt-1`}>da piani attivi</p>
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Abbonati paganti</p>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{fmt(totalPaidUsers)}</p>
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Revenue 30d</p>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>
            {hasStripeData ? fmtEur(s!.revenue_30d_eur) : "—"}
          </p>
          {!hasStripeData && <p className={`${MONO} text-[10px] text-gray-600 mt-1`}>webhook non ancora attivo</p>}
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Pagamenti falliti 30d</p>
          <p className={`${MONO} text-3xl font-semibold ${(s?.failed_payments_30d || 0) > 0 ? "text-red-400" : "text-gray-100"}`}>
            {hasStripeData ? fmt(s!.failed_payments_30d) : "—"}
          </p>
        </div>
      </div>

      {/* Distribuzione 4 piani */}
      <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
        <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400 mb-5`}>Distribuzione abbonamenti</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {planGroups.map(g => (
            <div key={g.key} className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-sm ${g.color} shrink-0`} />
                <span className={`${MONO} text-xs text-gray-400`}>{g.label}</span>
              </div>
              <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(g.users)}</p>
              <p className={`${MONO} text-[10px] text-gray-600 mt-1`}>{fmtEurInt(g.mrr)}/mese</p>
            </div>
          ))}
        </div>
        {/* Barre comparative */}
        <div className="space-y-2">
          {planGroups.map(g => {
            const w = planMax > 0 ? (g.users / planMax) * 100 : 0;
            return (
              <div key={g.key} className="flex items-center gap-3">
                <span className={`${MONO} text-xs text-gray-500 w-16 shrink-0`}>{g.label}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full ${g.color} rounded-full`} style={{ width: `${Math.max(w, g.users > 0 ? 2 : 0)}%` }} />
                </div>
                <span className={`${MONO} text-xs text-gray-300 w-6 text-right shrink-0`}>{g.users}</span>
                <span className={`${MONO} text-[10px] text-gray-600 w-20 text-right shrink-0`}>{fmtEurInt(g.mrr)}/m</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue trend — solo se webhook attivo */}
      {hasStripeData && revTrend.length > 0 && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400 mb-4`}>Revenue mensile (€)</p>
          <div className="flex items-end gap-1.5 h-24">
            {revTrend.map(r => {
              const h = (r.amount_eur / revMax) * 100;
              return (
                <div key={r.month} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group relative">
                  <div
                    className="w-full rounded-sm bg-emerald-500/60 group-hover:bg-emerald-400/80 transition-all"
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                  <div className={`${MONO} absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-300 bg-[#0d0f14] border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10`}>
                    {fmtMonth(r.month)} — {fmtEur(r.amount_eur)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex mt-1.5">
            {revTrend.map(r => (
              <div key={r.month} className="flex-1 text-center">
                <span className={`${MONO} text-[9px] text-gray-600`}>{fmtMonth(r.month)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nuove sub vs Churn — solo se webhook attivo */}
      {hasStripeData && allMonths.length > 0 && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-center gap-4 mb-4">
            <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400`}>Nuovi abbonati vs Churn</p>
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-indigo-500/70 inline-block" />
                <span className={`${MONO} text-[10px] text-gray-500`}>Nuovi</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-amber-500/70 inline-block" />
                <span className={`${MONO} text-[10px] text-gray-500`}>Churn</span>
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-20">
            {allMonths.map(m => {
              const ns = newSubMap[m] || 0;
              const ch = churnMap[m] || 0;
              return (
                <div key={m} className="flex-1 flex items-end gap-0.5 h-full group relative">
                  <div className="flex-1 flex items-end h-full">
                    <div
                      className="w-full rounded-sm bg-indigo-500/70 group-hover:bg-indigo-400/80 transition-all"
                      style={{ height: `${Math.max((ns / subChurnMax) * 100, ns > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <div className="flex-1 flex items-end h-full">
                    <div
                      className="w-full rounded-sm bg-amber-500/70 group-hover:bg-amber-400/80 transition-all"
                      style={{ height: `${Math.max((ch / subChurnMax) * 100, ch > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <div className={`${MONO} absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-300 bg-[#0d0f14] border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10`}>
                    {fmtMonth(m)} — +{ns} / -{ch}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex mt-1.5">
            {allMonths.map(m => (
              <div key={m} className="flex-1 text-center">
                <span className={`${MONO} text-[9px] text-gray-600`}>{fmtMonth(m)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent events — solo se webhook attivo */}
      {hasStripeData && s!.recentEvents.length > 0 && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400 mb-4`}>Ultimi eventi</p>
          <div className="space-y-1.5">
            {s!.recentEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0">
                <span className={`${MONO} text-xs shrink-0 w-44 truncate ${EVENT_COLOR[e.type] || "text-gray-400"}`}>
                  {EVENT_LABEL[e.type] || e.type}
                </span>
                <span className={`${MONO} text-xs text-gray-500 flex-1 truncate`}>
                  {e.customer_email || "—"}
                </span>
                <span className={`${MONO} text-xs text-gray-300 w-16 text-right shrink-0`}>
                  {e.amount_eur != null ? fmtEur(e.amount_eur) : "—"}
                </span>
                <span className={`${MONO} text-[10px] text-gray-600 w-28 text-right shrink-0`}>
                  {new Date(e.occurred_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder webhook note quando non ci sono ancora eventi */}
      {!hasStripeData && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.06] p-5">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-600 mb-2`}>Webhook Stripe</p>
          <p className={`${MONO} text-xs text-gray-600`}>
            Il webhook <span className="text-indigo-400/70">stripe-events-logger</span> è attivo — i grafici revenue e churn appariranno ai prossimi pagamenti.
          </p>
        </div>
      )}
    </div>
  );
}
