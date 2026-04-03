"use client";

import { useState, useMemo } from "react";
import type { MetricsData } from "../types";
import { fmt, pct, MONO } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import BarChart from "../ui/BarChart";
import HBar from "../ui/HBar";
import Donut from "../ui/Donut";
import {
  Users, Building2, Activity,
  ArrowUpRight, Minus, Search,
} from "lucide-react";

type Range = "all" | "6m" | "30d" | "7d";

const RANGES: { key: Range; label: string }[] = [
  { key: "all", label: "All" },
  { key: "6m",  label: "6 mesi" },
  { key: "30d", label: "30g" },
  { key: "7d",  label: "7d" },
];

function getCutoff(range: Range): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "7d")  return new Date(now.getTime() - 7  * 86400000);
  if (range === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (range === "6m")  return new Date(now.getTime() - 180 * 86400000);
  return null;
}

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.05] rounded-lg p-1">
      {RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`${MONO} text-xs px-3 py-1 rounded-md transition-colors ${
            value === r.key
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Delta({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null;
  const diff = current - prev;
  const pctDiff = ((diff / prev) * 100).toFixed(0);
  if (diff === 0) return <span className={`${MONO} text-xs text-gray-400 flex items-center gap-0.5`}><Minus className="w-3 h-3" />0%</span>;
  const up = diff > 0;
  return (
    <span className={`${MONO} text-xs flex items-center gap-0.5 ${up ? "text-emerald-500" : "text-red-400"}`}>
      <ArrowUpRight className={`w-3 h-3 ${up ? "" : "rotate-90"}`} />
      {up ? "+" : ""}{pctDiff}% vs prev period
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${MONO} text-[10px] uppercase tracking-widest text-gray-600 mb-3 mt-6 first:mt-0`}>
      {children}
    </p>
  );
}

function retentionColor(pct: number): string {
  if (pct === 0) return "bg-white/[0.04] text-gray-600";
  if (pct >= 80) return "bg-emerald-500/30 text-emerald-300";
  if (pct >= 60) return "bg-emerald-500/20 text-emerald-400";
  if (pct >= 40) return "bg-teal-500/15 text-teal-400";
  if (pct >= 20) return "bg-blue-500/10 text-blue-400";
  return "bg-white/[0.06] text-gray-500";
}

export default function OverviewPage({ data }: { data: MetricsData }) {
  const [range, setRange] = useState<Range>("all");
  const cutoff = getCutoff(range);

  const filteredUsers = useMemo(() => {
    if (!cutoff) return data.allUsers;
    return data.allUsers.filter((u) => new Date(u.created_at) >= cutoff!);
  }, [data.allUsers, cutoff, range]);

  const filteredTxTrend = useMemo(() => {
    if (!cutoff) return data.transactionsTrend;
    const cutoffMonth = cutoff.toISOString().slice(0, 7);
    return data.transactionsTrend.filter((t) => t.month >= cutoffMonth);
  }, [data.transactionsTrend, cutoff, range]);

  const newUsersInRange = useMemo(() => {
    if (range === "all") {
      const sorted = [...data.growth].sort((a, b) => a.month.localeCompare(b.month));
      return sorted.length >= 2 ? sorted[sorted.length - 1].new_users : (sorted[0]?.new_users ?? 0);
    }
    return filteredUsers.length;
  }, [range, data.growth, filteredUsers]);

  const analysesInRange = filteredUsers.reduce((s, u) => s + u.full_analyses, 0);
  const usersWithAnalysisInRange = filteredUsers.filter((u) => u.full_analyses > 0).length;

  const activeInRange = useMemo(() => {
    if (!cutoff) return data.sessions.active_30d;
    return data.allUsers.filter(
      (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) >= cutoff!
    ).length;
  }, [data.allUsers, data.sessions.active_30d, cutoff]);

  const activeRate = data.users.total > 0
    ? ((activeInRange / data.users.total) * 100).toFixed(0)
    : "0";

  const prevCutoff = useMemo(() => {
    if (!cutoff) return null;
    const span = new Date().getTime() - cutoff.getTime();
    return new Date(cutoff.getTime() - span);
  }, [cutoff]);

  const prevPeriodUsers = useMemo(() => {
    if (!cutoff || !prevCutoff) return 0;
    return data.allUsers.filter(
      (u) => new Date(u.created_at) >= prevCutoff! && new Date(u.created_at) < cutoff!
    ).length;
  }, [data.allUsers, cutoff, prevCutoff]);

  const agencyUsers = data.credits
    .filter((c) => c.subscription_type === "agency" || c.subscription_type === "agency_subscription")
    .reduce((s, c) => s + c.users, 0);

  const totalBalance  = data.credits.reduce((s, c) => s + c.total_credits, 0);
  const totalSectionUnlocks = data.sectionUnlocks.reduce((s, x) => s + x.count, 0);

  const spendItems = useMemo(() => {
    if (range === "all") {
      return data.transactions
        .filter((t) => t.transaction_type === "spend" && !t.reason.startsWith("unlock_"))
        .sort((a, b) => Math.abs(b.total_amount) - Math.abs(a.total_amount))
        .map((t) => ({ label: t.reason, value: Math.abs(t.total_amount) }));
    }
    const map: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      if (u.full_analyses)  map["full_analysis"]   = (map["full_analysis"]   || 0) + u.full_analyses;
      if (u.pdf_reports)    map["pdf_report"]      = (map["pdf_report"]      || 0) + u.pdf_reports;
      if (u.zone_analyses)  map["zone_analysis"]   = (map["zone_analysis"]   || 0) + u.zone_analyses;
      if (u.staging_photos) map["virtual_staging"] = (map["virtual_staging"] || 0) + u.staging_photos;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [range, data.transactions, filteredUsers]);

  const subDonut = data.credits.map((c, i) => ({
    label: c.subscription_type,
    value: c.users,
    color: ["#4f46e5", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981"][i % 5],
  }));

  const propDonut = data.properties.map((p, i) => ({
    label: p.site,
    value: p.count,
    color: ["#4f46e5", "#3b82f6", "#8b5cf6", "#f59e0b"][i % 4],
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-100">Overview</h1>
        <div className="flex items-center gap-3">
          <RangePicker value={range} onChange={setRange} />
          <span className={`${MONO} text-xs text-gray-500 hidden sm:block`}>
            {new Date(data.timestamp).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── 1. KPI PRINCIPALI ─────────────────────────────────────── */}
      <SectionLabel>Utenti</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Utenti totali"
          value={data.summary.totalUsers}
          sub={`${data.sessions.active_7d} active 7d`}
          icon={<Users className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label={range === "all" ? "Attivi 30d" : `Attivi (${RANGES.find(r => r.key === range)?.label})`}
          value={activeInRange}
          sub={`${activeRate}% degli utenti`}
          icon={<Activity className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label={range === "all" ? "Nuovi (mese)" : `Nuovi (${RANGES.find(r => r.key === range)?.label})`}
          value={newUsersInRange}
          sub={(() => {
            if (range === "all") {
              const sorted = [...data.growth].sort((a, b) => a.month.localeCompare(b.month));
              const prev = sorted.length >= 2 ? sorted[sorted.length - 2].new_users : null;
              return prev != null ? `vs ${prev} mese prec.` : undefined;
            }
            return prevPeriodUsers > 0 ? `vs ${prevPeriodUsers} periodo prec.` : undefined;
          })()}
          icon={<Users className="w-[18px] h-[18px]" />}
        />
        <div className="bg-[#161920] rounded-xl p-5 border border-amber-500/40">
          <div className="flex items-start justify-between">
            <p className={`${MONO} text-[11px] tracking-wider uppercase text-amber-500/70 mb-2`}>Agency</p>
            <Building2 className="w-[18px] h-[18px] text-amber-500/50" />
          </div>
          <p className={`${MONO} text-3xl font-semibold text-amber-400`}>{fmt(agencyUsers)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{pct(agencyUsers, data.summary.totalUsers)}% degli utenti</p>
        </div>
      </div>

      {/* ── 2. CRESCITA + ABBONAMENTI ─────────────────────────────── */}
      <SectionLabel>Crescita & abbonamenti</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Crescita mensile utenti" className="lg:col-span-2">
          <div className="mb-2">
            {(() => {
              const sorted = [...data.growth].sort((a, b) => a.month.localeCompare(b.month));
              const cur = sorted[sorted.length - 1]?.new_users ?? 0;
              const prev = sorted[sorted.length - 2]?.new_users ?? 0;
              return <Delta current={cur} prev={prev} />;
            })()}
          </div>
          <BarChart items={data.growth.map((g) => ({ label: g.month.slice(5), value: g.new_users }))} />
        </StatCard>
        <StatCard title="Abbonamenti">
          <Donut segments={subDonut} />
        </StatCard>
      </div>

      {/* ── 3. RETENTION ──────────────────────────────────────────── */}
      <SectionLabel>Retention per coorte</SectionLabel>
      <div className="mb-6">
        <StatCard title="Retention per coorte — % utenti attivi mese per mese dopo la registrazione">
          {!data.retention || data.retention.length === 0 ? (
            <p className={`${MONO} text-xs text-gray-500`}>Nessun dato disponibile.</p>
          ) : (() => {
            const labels = (data.retention_months ?? []).slice(0, 7);
            const cohorts = data.retention.slice(-8);
            return (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs border-separate border-spacing-[2px]">
                  <thead>
                    <tr>
                      <th className={`${MONO} text-left text-gray-500 pr-3 pb-1 font-normal whitespace-nowrap`}>Coorte</th>
                      <th className={`${MONO} text-gray-500 pb-1 font-normal whitespace-nowrap px-1`}>N</th>
                      {labels.map((lbl) => (
                        <th key={lbl} className={`${MONO} text-gray-500 pb-1 font-normal whitespace-nowrap px-1`}>{lbl}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((cohort) => (
                      <tr key={cohort.cohort_month}>
                        <td className={`${MONO} text-gray-400 pr-3 py-0.5 whitespace-nowrap`}>{cohort.cohort_month}</td>
                        <td className={`${MONO} text-gray-500 text-center px-1`}>{cohort.size}</td>
                        {labels.map((lbl, i) => {
                          const val = cohort.months[i];
                          if (val === null || val === undefined) return <td key={lbl} className="px-1" />;
                          const p = cohort.size > 0 ? Math.round((val / cohort.size) * 100) : 0;
                          return (
                            <td key={lbl} className="px-1 py-0.5">
                              <div className={`${MONO} rounded px-2 py-0.5 text-center min-w-[40px] ${retentionColor(p)}`}>{p}%</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>M+0 = mese di registrazione · M+1 = mese successivo · attivo = almeno una transazione crediti</p>
              </div>
            );
          })()}
        </StatCard>
      </div>

      {/* ── 4. PRODOTTO & UTILIZZO ────────────────────────────────── */}
      <SectionLabel>Prodotto & utilizzo</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-[#1a1d25] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-1`}>{range === "all" ? "Analisi complete" : `Analisi (${RANGES.find(r=>r.key===range)?.label})`}</p>
          <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(analysesInRange)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>da {usersWithAnalysisInRange} utenti</p>
        </div>
        <div className="bg-[#1a1d25] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-1`}>Sezioni sbloccate</p>
          <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(data.summary.usersWithUnlockedSection)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{totalSectionUnlocks} sblocchi totali</p>
        </div>
        <div className="bg-[#1a1d25] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-1`}>Credits Spent</p>
          <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(data.summary.totalSpent)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>balance {fmt(totalBalance)}</p>
        </div>
        <div className="bg-[#1a1d25] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-1`}>Immobili salvati</p>
          <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(data.summary.totalProperties)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{fmt(data.summary.totalUniquePropertyUsers)} utenti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title={`Utilizzo funzionalità${range !== "all" ? ` · ${RANGES.find(r => r.key === range)?.label}` : ""}`}>
          <HBar
            items={[
              { label: "Analisi complete",  value: filteredUsers.reduce((s, u) => s + u.full_analyses,       0) },
              { label: "PDF report",        value: filteredUsers.reduce((s, u) => s + u.pdf_reports,         0) },
              { label: "Zone analysis",     value: filteredUsers.reduce((s, u) => s + u.zone_analyses,       0) },
              { label: "Staging foto",      value: filteredUsers.reduce((s, u) => s + u.staging_photos,      0) },
              { label: "Export PNG",        value: filteredUsers.reduce((s, u) => s + u.post_png_exports,    0) },
              { label: "Export video",      value: filteredUsers.reduce((s, u) => s + u.post_video_exports + u.staging_video_exports, 0) },
            ].filter(i => i.value > 0).sort((a, b) => b.value - a.value)}
            color="bg-indigo-500"
          />
        </StatCard>
        <StatCard title={`Spend breakdown${range !== "all" ? ` · ${RANGES.find(r=>r.key===range)?.label}` : ""}`}>
          {spendItems.length > 0 ? (
            <HBar items={spendItems} color="bg-violet-500" />
          ) : (
            <p className="text-sm text-gray-500">No spend data</p>
          )}
        </StatCard>
      </div>

      {/* ── 5. PROPERTIES ─────────────────────────────────────────── */}
      {data.sectionUnlocks.length > 0 && (
        <>
          <SectionLabel>Properties & sezioni</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <StatCard title="Sezioni sbloccate">
              <HBar items={data.sectionUnlocks.map((s) => ({ label: s.section, value: s.count }))} color="bg-teal-500" />
            </StatCard>
            <StatCard title="Properties per portale">
              <Donut segments={propDonut} />
            </StatCard>
          </div>
        </>
      )}
    </div>
  );
}
