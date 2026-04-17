"use client";

import type { MetricsData } from "../types";
import { MONO, fmt } from "../types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function AgencyPage({ data }: { data: MetricsData }) {
  const teams = data.teamsStats;
  const hourly = data.exportAggregates?.hourly;

  // Agency users: subscription_type starts with "agency"
  const agencyUsers = data.allUsers.filter(u =>
    u.subscription_type?.startsWith("agency")
  );
  const agencyCount = agencyUsers.length;

  const featureSum = (key: keyof typeof agencyUsers[0]) =>
    agencyUsers.reduce((acc, u) => acc + (Number(u[key]) || 0), 0);

  const features = [
    { label: "Analisi complete",    value: featureSum("full_analyses"),       color: "bg-indigo-500/70" },
    { label: "Foto AI staging",     value: featureSum("staging_photos"),      color: "bg-violet-500/70" },
    { label: "Post PNG",            value: featureSum("post_png_exports"),    color: "bg-sky-500/70" },
    { label: "Report PDF",          value: featureSum("pdf_reports"),         color: "bg-emerald-500/70" },
    { label: "Analisi zona",        value: featureSum("zone_analyses"),       color: "bg-amber-500/70" },
    { label: "Video staging",       value: featureSum("staging_video_exports"), color: "bg-pink-500/70" },
    { label: "Video post",          value: featureSum("post_video_exports"),  color: "bg-rose-500/70" },
  ].sort((a, b) => b.value - a.value);

  const featMax = Math.max(...features.map(f => f.value), 1);

  if (!teams) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Agenzie</h1>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>Statistiche team e abbonamenti agency</p>
        </div>
        <p className={`${MONO} text-sm text-gray-600`}>Nessun dato team disponibile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Agenzie</h1>
        <p className={`${MONO} text-xs text-gray-500 mt-1`}>Statistiche team e abbonamenti agency</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Team creati</p>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{fmt(teams.total)}</p>
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Team attivi</p>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{fmt(teams.active)}</p>
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Media membri</p>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{teams.avg_members}</p>
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 mb-2`}>Utenti agency</p>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{fmt(agencyCount)}</p>
        </div>
      </div>

      {/* Feature usage — agency only */}
      {agencyCount > 0 && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-baseline justify-between mb-4">
            <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400`}>Cosa usano di più (utenti agency)</p>
            <p className={`${MONO} text-[10px] text-gray-600`}>media per utente in parentesi</p>
          </div>
          <div className="space-y-2.5">
            {features.map(f => {
              const w = (f.value / featMax) * 100;
              const avg = agencyCount > 0 ? (f.value / agencyCount).toFixed(1) : "0";
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <span className={`${MONO} text-xs text-gray-500 w-36 shrink-0 truncate`}>{f.label}</span>
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full ${f.color} rounded-full`} style={{ width: `${w}%` }} />
                  </div>
                  <span className={`${MONO} text-xs text-gray-300 w-12 text-right shrink-0`}>{fmt(f.value)}</span>
                  <span className={`${MONO} text-[10px] text-gray-600 w-10 text-right shrink-0`}>({avg})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap oraria */}
      {hourly && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400 mb-4`}>Attività oraria export</p>
          <div className="flex items-end gap-1 h-16">
            {(() => {
              const maxH = Math.max(...hourly, 1);
              return HOURS.map(h => {
                const v = hourly[h] ?? 0;
                const heightPct = (v / maxH) * 100;
                const isDay = h >= 8 && h <= 20;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group relative">
                    <div
                      className={`w-full rounded-sm transition-all ${isDay ? "bg-indigo-500/60" : "bg-indigo-500/25"} group-hover:bg-indigo-400/80`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className={`${MONO} absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-300 bg-[#0d0f14] border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10`}>
                      {h}:00 — {fmt(v)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {/* X-axis labels */}
          <div className="flex mt-1.5">
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center">
                {h % 6 === 0 && (
                  <span className={`${MONO} text-[9px] text-gray-600`}>{h}h</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribuzione dimensione team */}
      <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
        <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400 mb-3`}>Distribuzione dimensione team</p>
        <div className="space-y-2">
          {teams.size_distribution.map(({ size, label, count }) => {
            const max = Math.max(...teams.size_distribution.map(s => s.count), 1);
            const w = max > 0 ? (count / max) * 100 : 0;
            return (
              <div key={size} className="flex items-center gap-3">
                <span className={`${MONO} text-xs text-gray-500 w-12 shrink-0`}>{label}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500/70 rounded-full" style={{ width: `${w}%` }} />
                </div>
                <span className={`${MONO} text-xs text-gray-300 w-4 text-right shrink-0`}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video AI templates ranking */}
      {data.aiVideoStats && data.aiVideoStats.total > 0 && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <div className="flex items-baseline justify-between mb-4">
            <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400`}>Video AI — template più usati</p>
            <p className={`${MONO} text-[10px] text-gray-600`}>{fmt(data.aiVideoStats.total)} video generati</p>
          </div>
          <div className="space-y-2.5">
            {(() => {
              const max = Math.max(...data.aiVideoStats.top_templates.map(t => t.count), 1);
              const labels: Record<string, string> = {
                classic: "Classic (avatar)",
                split: "Split screen",
                walkthrough: "Walkthrough",
                sottotitoli: "Sottotitoli karaoke",
                before_after: "Before / After",
                ai_staging: "AI Staging video",
              };
              const colors: Record<string, string> = {
                classic: "bg-indigo-500/70",
                split: "bg-sky-500/70",
                walkthrough: "bg-emerald-500/70",
                sottotitoli: "bg-amber-500/70",
                before_after: "bg-violet-500/70",
                ai_staging: "bg-pink-500/70",
              };
              return data.aiVideoStats!.top_templates.map(t => {
                const w = (t.count / max) * 100;
                const pct = ((t.count / data.aiVideoStats!.total) * 100).toFixed(1);
                return (
                  <div key={t.template} className="flex items-center gap-3">
                    <span className={`${MONO} text-xs text-gray-400 w-40 shrink-0 truncate`}>
                      {labels[t.template] || t.template}
                    </span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full ${colors[t.template] || "bg-gray-500/70"} rounded-full`} style={{ width: `${w}%` }} />
                    </div>
                    <span className={`${MONO} text-xs text-gray-300 w-16 text-right shrink-0`}>
                      {fmt(t.count)}
                      <span className="text-gray-600 ml-1">({pct}%)</span>
                    </span>
                  </div>
                );
              });
            })()}
          </div>
          {data.aiVideoStats.models.length > 0 && (
            <div className="mt-5 pt-4 border-t border-white/[0.04]">
              <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-2`}>Modello AI (solo Before/After)</p>
              <div className="flex gap-4 flex-wrap">
                {data.aiVideoStats.models.map(m => (
                  <span key={m.model} className={`${MONO} text-xs text-gray-400`}>
                    <span className="text-gray-200">{m.model}</span>
                    <span className="text-gray-600 ml-1">{fmt(m.count)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabella team con utenti */}
      {data.allUsers.filter(u => u.team?.role === "owner").length > 0 && (
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-5">
          <p className={`${MONO} text-[11px] uppercase tracking-wider text-gray-400 mb-4`}>Team attivi</p>
          <div className="space-y-2">
            {data.allUsers
              .filter(u => u.team?.role === "owner" && u.team?.team_name)
              .sort((a, b) => (b.team?.member_count ?? 0) - (a.team?.member_count ?? 0))
              .map(u => (
                <div key={u.email} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className={`${MONO} text-sm text-gray-200`}>{u.team!.team_name}</p>
                    <p className={`${MONO} text-[10px] text-gray-600 mt-0.5`}>{u.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`${MONO} text-xs text-gray-400`}>{u.team!.member_count} membri</p>
                      <p className={`${MONO} text-[10px] text-gray-600`}>{u.subscription_type}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
