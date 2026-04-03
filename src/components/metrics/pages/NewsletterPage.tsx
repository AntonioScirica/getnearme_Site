"use client";

import type { MetricsData } from "../types";
import { fmt, pct, MONO } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import { StatLine } from "../ui/StatCard";
import HBar from "../ui/HBar";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${MONO} text-[10px] uppercase tracking-widest text-gray-600 mb-3 mt-8 first:mt-0`}>
      {children}
    </p>
  );
}

export default function NewsletterPage({ data }: { data: MetricsData }) {
  const nl = data.newsletter;
  const bonus = data.bonus;
  const ref = data.referral;

  const totalUsers = data.users.total;
  const reachable = nl.marketing_consent - nl.unsubscribed;
  const noConsent = Math.max(0, totalUsers - nl.marketing_consent);
  const reachableRate = totalUsers > 0 ? Math.round((reachable / totalUsers) * 100) : 0;

  // Churn risk
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const d60 = new Date(now.getTime() - 60 * 86400000);
  const churnRisk     = data.allUsers.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) < d30 && new Date(u.last_sign_in_at) >= d60).length;
  const churnLost     = data.allUsers.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) < d60).length;
  const neverReturned = data.allUsers.filter(u => !u.last_sign_in_at).length;
  const churnTotal    = data.allUsers.length;
  const healthy       = Math.max(0, churnTotal - churnRisk - churnLost - neverReturned);

  // Email stats
  const s = data.emailStats?.last_30d;
  const hasEmailData = (data.emailStats?.total_events ?? 0) > 0;

  const segments = [
    { label: "Raggiungibili",  value: reachable,           color: "#4f46e5" },
    { label: "Disiscritti",    value: nl.unsubscribed,     color: "#ef4444" },
    { label: "Senza consenso", value: noConsent,           color: "#1f2937" },
  ].filter(s => s.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-1">Marketing</h1>
      <p className={`${MONO} text-xs text-gray-500 mb-6`}>Lista contatti · performance email · churn risk · daily bonus · referral</p>

      {/* ── 1. LISTA RAGGIUNGIBILE ──────────────────────────────────── */}
      <SectionLabel>Lista contatti raggiungibili</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-[#161920] rounded-xl p-5 border border-indigo-500/30 col-span-2 lg:col-span-1">
          <p className={`${MONO} text-[11px] tracking-wider uppercase text-indigo-400/70 mb-2`}>Raggiungibili</p>
          <p className={`${MONO} text-3xl font-semibold text-indigo-400`}>{fmt(reachable)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{reachableRate}% su {fmt(totalUsers)} utenti</p>
        </div>
        <KpiCard label="Con consenso" value={nl.marketing_consent} sub={`${pct(nl.marketing_consent, totalUsers)}% degli utenti`} />
        <KpiCard label="Disiscritti" value={nl.unsubscribed} sub={nl.unsubscribed > 0 ? `${pct(nl.unsubscribed, nl.marketing_consent)}% dei consensi` : "—"} />
        <KpiCard label="Agenzie" value={nl.agencies} sub={`su ${fmt(reachable)} raggiungibili`} />
      </div>

      <div className="mb-6">
        <StatCard title="Distribuzione lista">
          <div className="flex h-3 rounded-full overflow-hidden gap-px mb-2">
            {segments.map(sg => (
              <div key={sg.label} className="h-full transition-all"
                style={{ width: `${totalUsers > 0 ? (sg.value / totalUsers) * 100 : 0}%`, backgroundColor: sg.color }} />
            ))}
          </div>
          <div className="flex gap-6 mb-4">
            {segments.map(sg => (
              <span key={sg.label} className={`${MONO} text-[11px] text-gray-400 flex items-center gap-1.5`}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: sg.color }} />
                {sg.label} · {fmt(sg.value)}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            <StatLine label="Con consenso marketing" value={fmt(nl.marketing_consent)} />
            <StatLine label="Senza consenso"         value={fmt(noConsent)} />
            <StatLine label="Disiscritti"            value={fmt(nl.unsubscribed)} warn={nl.unsubscribed > 0} />
            <StatLine label="Di cui agenzie"         value={fmt(nl.agencies)} />
          </div>
        </StatCard>
      </div>

      {/* ── 2. PERFORMANCE EMAIL ────────────────────────────────────── */}
      <SectionLabel>Performance email · ultimi 30 giorni</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open Rate",        value: s?.open_rate        ?? null, color: "text-indigo-400", border: "border-indigo-500/20", sub: s ? `${fmt(s.opened)} aperture · ${fmt(s.delivered)} consegnate` : "" },
          { label: "Click Rate",       value: s?.click_rate       ?? null, color: "text-violet-400", border: "border-violet-500/20", sub: s ? `${fmt(s.clicked)} click · ${fmt(s.delivered)} consegnate` : "" },
          { label: "Unsubscribe Rate", value: s?.unsubscribe_rate ?? null, color: "text-red-400",    border: "border-red-500/20",    sub: s ? `${fmt(s.unsubscribed)} disiscritti` : "" },
        ].map((card) => (
          <div key={card.label} className={`bg-[#161920] rounded-xl p-5 border ${card.border}`}>
            <p className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-2`}>{card.label}</p>
            {hasEmailData && card.value !== null ? (
              <>
                <p className={`${MONO} text-3xl font-semibold ${card.color}`}>{card.value}%</p>
                <p className={`${MONO} text-xs text-gray-500 mt-1`}>{card.sub}</p>
              </>
            ) : (
              <>
                <p className={`${MONO} text-3xl font-semibold ${card.color} opacity-25`}>—</p>
                <p className={`${MONO} text-xs text-gray-600 mt-1`}>In attesa dei primi eventi Brevo</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── 3. CHURN RISK ───────────────────────────────────────────── */}
      <SectionLabel>Attività utenti · churn risk</SectionLabel>
      <div className="mb-6">
        <StatCard title={`Su ${fmt(churnTotal)} utenti registrati`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { value: healthy,       label: "utenti attivi",         sub: "accesso negli ultimi 30gg",      bg: "bg-emerald-500/10", border: "border-emerald-500/20", color: "text-emerald-400" },
              { value: churnRisk,     label: "a rischio churn",       sub: "nessun accesso da 30–60 giorni", bg: "bg-amber-500/10",   border: "border-amber-500/20",   color: "text-amber-400" },
              { value: churnLost,     label: "churned",               sub: "nessun accesso da >60 giorni",   bg: "bg-red-500/10",     border: "border-red-500/20",     color: "text-red-400" },
              { value: neverReturned, label: "registrati, mai usato", sub: "nessun accesso dopo signup",     bg: "bg-white/[0.04]",   border: "border-white/[0.06]",   color: "text-gray-500" },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4 text-center`}>
                <p className={`${MONO} text-3xl font-semibold ${c.color}`}>{fmt(c.value)}</p>
                <p className={`${MONO} text-xs ${c.color} opacity-80 mt-1`}>{c.label}</p>
                <p className={`${MONO} text-[10px] text-gray-600 mt-0.5`}>{c.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
            {[
              { value: healthy,       color: "#10b981" },
              { value: churnRisk,     color: "#f59e0b" },
              { value: churnLost,     color: "#ef4444" },
              { value: neverReturned, color: "#374151" },
            ].filter(sg => sg.value > 0).map((sg, i) => (
              <div key={i} className="h-full rounded-full"
                style={{ width: `${churnTotal > 0 ? (sg.value / churnTotal) * 100 : 0}%`, backgroundColor: sg.color }} />
            ))}
          </div>
        </StatCard>
      </div>

      {/* ── 4. DAILY BONUS ──────────────────────────────────────────── */}
      <SectionLabel>Daily bonus</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KpiCard label="Token generati"    value={bonus.total_tokens} />
        <KpiCard label="Riscattati"        value={bonus.claimed} sub={`${pct(bonus.claimed, bonus.total_tokens)}% claim rate`} />
        <KpiCard label="Scaduti"           value={bonus.expired_unclaimed} sub={bonus.expired_unclaimed > bonus.claimed ? "⚠ alto expiry rate" : undefined} />
        <KpiCard label="Crediti erogati"   value={bonus.credits_claimed} />
      </div>
      <div className="mb-6">
        <StatCard title="Dettaglio bonus">
          <div className="grid grid-cols-2 gap-0">
            <StatLine label="Email uniche"     value={fmt(bonus.unique_emails)} />
            <StatLine label="Streak massimo"   value={fmt(bonus.max_streak_day)} />
            <StatLine label="Max streak (nl)"  value={fmt(nl.max_streak)} />
          </div>
          {bonus.total_tokens > 0 && (
            <div className="mt-4">
              <HBar items={[
                { label: "Riscattati",  value: bonus.claimed },
                { label: "Scaduti",     value: bonus.expired_unclaimed },
                { label: "Pendenti",    value: Math.max(0, bonus.total_tokens - bonus.claimed - bonus.expired_unclaimed) },
              ].filter(i => i.value > 0)} color="bg-emerald-500" />
            </div>
          )}
        </StatCard>
      </div>

      {/* ── 5. REFERRAL ─────────────────────────────────────────────── */}
      <SectionLabel>Referral</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <KpiCard label="Totali"     value={ref.total} />
        <KpiCard label="Completati" value={ref.completed} sub={`${pct(ref.completed, ref.total)}% conversion`} />
        <KpiCard label="In attesa"  value={ref.pending} />
      </div>
      {ref.total > 0 && (
        <div className="mb-4">
          <StatCard title="Referral funnel">
            <HBar items={[
              { label: "Completati", value: ref.completed },
              { label: "In attesa",  value: ref.pending },
            ].filter(i => i.value > 0)} color="bg-teal-500" />
          </StatCard>
        </div>
      )}
    </div>
  );
}
