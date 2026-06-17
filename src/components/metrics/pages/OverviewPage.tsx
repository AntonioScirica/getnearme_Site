"use client";

import { useMemo } from "react";
import type { MetricsData } from "../types";
import { fmt, pct, MONO } from "../types";
import StatCard from "../ui/StatCard";
import HBar from "../ui/HBar";
import Donut from "../ui/Donut";
import BarChart from "../ui/BarChart";
import {
  Users, Building2, Activity, DollarSign,
  ImageIcon, Video, FileText, Search, MapPin, Share2,
} from "lucide-react";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${MONO} text-[10px] uppercase tracking-widest text-gray-600 mb-3 mt-8 first:mt-0`}>
      {children}
    </p>
  );
}

function retentionColor(p: number): string {
  if (p === 0) return "bg-white/[0.04] text-gray-600";
  if (p >= 80) return "bg-emerald-500/30 text-emerald-300";
  if (p >= 60) return "bg-emerald-500/20 text-emerald-400";
  if (p >= 40) return "bg-teal-500/15 text-teal-400";
  if (p >= 20) return "bg-blue-500/10 text-blue-400";
  return "bg-white/[0.06] text-gray-500";
}

export default function OverviewPage({ data }: { data: MetricsData }) {
  const paying = data.credits
    .filter((c) => c.subscription_type !== "free" && c.subscription_type !== "ambassador")
    .reduce((s, c) => s + c.users, 0);

  const totalCost = useMemo(() => data.allUsers.reduce((s, u) => s + (u.estimated_cost ?? 0), 0), [data.allUsers]);
  const totalPhotos = useMemo(() => data.allUsers.reduce((s, u) => s + (u.staging_photos ?? 0), 0), [data.allUsers]);
  const photoCost = totalPhotos * 0.036;
  const videoCost = totalCost - photoCost;

  const totalVideos = useMemo(() => {
    const byTpl: Record<string, number> = {};
    data.allUsers.forEach(u => {
      Object.entries(u.ai_videos_by_template || {}).forEach(([tpl, count]) => {
        byTpl[tpl] = (byTpl[tpl] || 0) + count;
      });
    });
    return byTpl;
  }, [data.allUsers]);
  const totalVideoCount = Object.values(totalVideos).reduce((s, v) => s + v, 0);

  const totalPng = useMemo(() => data.allUsers.reduce((s, u) => s + (u.post_png_exports ?? 0), 0), [data.allUsers]);
  const totalPostVideo = useMemo(() => data.allUsers.reduce((s, u) => s + (u.post_video_exports ?? 0), 0), [data.allUsers]);
  const totalAnalyses = useMemo(() => data.allUsers.reduce((s, u) => s + (u.full_analyses ?? 0), 0), [data.allUsers]);
  const totalPdf = useMemo(() => data.allUsers.reduce((s, u) => s + (u.pdf_reports ?? 0), 0), [data.allUsers]);
  const totalZone = useMemo(() => data.allUsers.reduce((s, u) => s + (u.zone_analyses ?? 0), 0), [data.allUsers]);
  const totalProperties = data.summary.totalProperties;

  const usersWithActivity = useMemo(() => data.allUsers.filter(u =>
    u.full_analyses > 0 || u.staging_photos > 0 || u.post_png_exports > 0 || u.post_video_exports > 0
  ).length, [data.allUsers]);

  const subDonut = data.credits.map((c, i) => ({
    label: c.subscription_type,
    value: c.users,
    color: ["#4f46e5", "#f59e0b", "#8b5cf6", "#3b82f6", "#10b981"][i % 5],
  }));

  const VID_LABELS: Record<string, string> = {
    ai_staging: "Before/After", walkthrough: "Walkthrough", classic: "Classic",
    split: "Split", construction: "Ristrutturazione", day_night: "Giorno/Notte",
    montaggio: "Montaggio", sottotitoli: "Sottotitoli",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-100">Overview</h1>
        <span className={`${MONO} text-xs text-gray-500`}>
          {new Date(data.timestamp).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* ── KPI ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-start justify-between">
            <p className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-2`}>Utenti</p>
            <Users className="w-[18px] h-[18px] text-gray-500/50" />
          </div>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{fmt(data.summary.totalUsers)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{data.sessions.active_7d} attivi 7d · {data.sessions.active_30d} attivi 30d</p>
        </div>
        <div className={`bg-[#161920] rounded-xl p-5 border ${paying > 0 ? "border-amber-500/40" : "border-white/[0.08]"}`}>
          <div className="flex items-start justify-between">
            <p className={`${MONO} text-[11px] tracking-wider uppercase ${paying > 0 ? "text-amber-500/70" : "text-gray-500"} mb-2`}>Paganti</p>
            <Building2 className="w-[18px] h-[18px] text-amber-500/50" />
          </div>
          <p className={`${MONO} text-3xl font-semibold ${paying > 0 ? "text-amber-400" : "text-gray-400"}`}>{fmt(paying)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{pct(paying, data.summary.totalUsers)}% degli utenti</p>
        </div>
        <div className={`bg-[#161920] rounded-xl p-5 border ${totalCost > 50 ? "border-red-500/40" : "border-white/[0.08]"}`}>
          <div className="flex items-start justify-between">
            <p className={`${MONO} text-[11px] tracking-wider uppercase ${totalCost > 50 ? "text-red-500/70" : "text-gray-500"} mb-2`}>Costo AI totale</p>
            <DollarSign className="w-[18px] h-[18px] text-gray-500/50" />
          </div>
          <p className={`${MONO} text-3xl font-semibold ${totalCost > 100 ? "text-red-400" : totalCost > 30 ? "text-amber-400" : "text-emerald-400"}`}>€{totalCost.toFixed(2)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>foto €{photoCost.toFixed(2)} · video €{videoCost.toFixed(2)}</p>
        </div>
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-start justify-between">
            <p className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-2`}>Attivi</p>
            <Activity className="w-[18px] h-[18px] text-gray-500/50" />
          </div>
          <p className={`${MONO} text-3xl font-semibold text-gray-100`}>{fmt(usersWithActivity)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>{pct(usersWithActivity, data.summary.totalUsers)}% hanno usato almeno 1 feature</p>
        </div>
      </div>

      {/* ── CONTENUTI GENERATI ───────────────────────────────────── */}
      <SectionLabel>Contenuti generati</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
        {[
          { label: "Foto AI", value: totalPhotos, icon: ImageIcon, color: "text-emerald-400" },
          { label: "Video AI", value: totalVideoCount, icon: Video, color: "text-indigo-400" },
          { label: "Post PNG", value: totalPng, icon: Share2, color: "text-sky-400" },
          { label: "Post Video", value: totalPostVideo, icon: Video, color: "text-pink-400" },
          { label: "Analisi zona", value: totalAnalyses + totalZone, icon: Search, color: "text-violet-400" },
          { label: "Report PDF", value: totalPdf, icon: FileText, color: "text-amber-400" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-[#161920] rounded-xl p-4 border border-white/[0.08]">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500`}>{item.label}</p>
              </div>
              <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(item.value)}</p>
            </div>
          );
        })}
      </div>

      {/* ── COSTI + ABBONAMENTI ──────────────────────────────────── */}
      <SectionLabel>Costi & abbonamenti</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
        <StatCard title="Costi AI per tipo" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/[0.04] rounded-lg p-3">
              <p className={`${MONO} text-[10px] uppercase text-gray-500 mb-1`}>Foto AI</p>
              <p className={`${MONO} text-xl font-semibold text-gray-100`}>€{photoCost.toFixed(2)}</p>
              <p className={`${MONO} text-[10px] text-gray-500 mt-1`}>{fmt(totalPhotos)} foto × €0.036</p>
            </div>
            <div className="bg-white/[0.04] rounded-lg p-3">
              <p className={`${MONO} text-[10px] uppercase text-gray-500 mb-1`}>Video AI</p>
              <p className={`${MONO} text-xl font-semibold text-gray-100`}>€{videoCost.toFixed(2)}</p>
              <p className={`${MONO} text-[10px] text-gray-500 mt-1`}>{fmt(totalVideoCount)} video</p>
            </div>
          </div>
          {Object.entries(totalVideos).filter(([,c]) => c > 0).sort((a, b) => b[1] - a[1]).length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <p className={`${MONO} text-[10px] uppercase text-gray-500 mb-2`}>Video per template</p>
              <div className="space-y-1.5">
                {Object.entries(totalVideos).filter(([,c]) => c > 0).sort((a, b) => b[1] - a[1]).map(([tpl, count]) => {
                  const max = Math.max(...Object.values(totalVideos), 1);
                  return (
                    <div key={tpl} className="flex items-center gap-3">
                      <span className={`${MONO} text-xs text-gray-400 w-28 shrink-0 truncate`}>{VID_LABELS[tpl] ?? tpl}</span>
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500/60 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <span className={`${MONO} text-xs text-gray-300 w-6 text-right`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </StatCard>
        <StatCard title="Abbonamenti">
          <Donut segments={subDonut} />
        </StatCard>
      </div>

      {/* ── CRESCITA UTENTI ──────────────────────────────────────── */}
      <SectionLabel>Crescita utenti</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
        <StatCard title="Nuovi utenti per mese">
          <BarChart items={data.growth.map((g) => ({ label: g.month.slice(5), value: g.new_users }))} />
        </StatCard>
        <StatCard title="Utilizzo feature">
          <HBar
            items={[
              { label: "Analisi zona", value: totalAnalyses + totalZone },
              { label: "Foto AI staging", value: totalPhotos },
              { label: "Post PNG", value: totalPng },
              { label: "Video AI", value: totalVideoCount },
              { label: "Post video", value: totalPostVideo },
              { label: "Report PDF", value: totalPdf },
              { label: "Immobili salvati", value: totalProperties },
            ].filter(i => i.value > 0).sort((a, b) => b.value - a.value)}
            color="bg-indigo-500"
          />
        </StatCard>
      </div>

      {/* ── RETENTION ────────────────────────────────────────────── */}
      {data.retention && data.retention.length > 0 && (
        <>
          <SectionLabel>Retention per coorte</SectionLabel>
          <div className="mb-2">
            <StatCard title="% utenti attivi mese per mese dopo registrazione">
              {(() => {
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
                    <p className={`${MONO} text-[10px] text-gray-600 mt-2`}>M+0 = mese di registrazione · M+1 = mese successivo</p>
                  </div>
                );
              })()}
            </StatCard>
          </div>
        </>
      )}

      {/* ── IMMOBILI ─────────────────────────────────────────────── */}
      <SectionLabel>Immobili</SectionLabel>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500`}>Salvati</p>
          </div>
          <p className={`${MONO} text-2xl font-semibold text-gray-100`}>{fmt(totalProperties)}</p>
          <p className={`${MONO} text-xs text-gray-500 mt-1`}>da {fmt(data.summary.totalUniquePropertyUsers)} utenti</p>
        </div>
        <StatCard title="Per portale" className="col-span-1 lg:col-span-2">
          <Donut segments={data.properties.map((p, i) => ({
            label: p.site,
            value: p.count,
            color: ["#4f46e5", "#3b82f6", "#8b5cf6", "#f59e0b"][i % 4],
          }))} />
        </StatCard>
      </div>
    </div>
  );
}
