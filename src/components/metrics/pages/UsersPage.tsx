"use client";

import React, { useState, useMemo, useRef } from "react";
import type { MetricsData } from "../types";
import { fmt, MONO } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import Donut from "../ui/Donut";
import { Users, ShieldCheck, Building2, Activity, Search, ChevronUp, ChevronDown, ChevronsUpDown, Info, RefreshCw } from "lucide-react";

const DONUT_COLORS = ["#4f46e5", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

const SUB_COLORS: Record<string, string> = {
  agency: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  agency_subscription: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  ambassador: "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  user_lite: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  free: "bg-white/10 text-gray-400 border border-white/10",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "2-digit" });
}

type SortKey = "email" | "subscription_type" | "credits" | "total_spent" | "properties_saved" | "full_analyses" | "zone_analyses" | "pdf_reports" | "staging_photos" | "post_png_exports" | "staging_video_exports" | "estimated_cost" | "created_at";
type SortDir = "asc" | "desc";

type UserRow = MetricsData["allUsers"][0];

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-500" />
    : <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-500" />;
}

export default function UsersPage({ data, onRefresh, loading, authKey }: { data: MetricsData; onRefresh?: () => void; loading?: boolean; authKey?: string | null }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [postTooltipUser, setPostTooltipUser] = useState<string | null>(null);
  const [postHeaderTooltip, setPostHeaderTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const totalPostPng = useMemo(() => data.allUsers.reduce((s, u) => s + (u.post_png_exports || 0), 0), [data.allUsers]);
  const totalPostVideo = useMemo(() => data.allUsers.reduce((s, u) => s + (u.post_video_exports || 0), 0), [data.allUsers]);

  const agencyCount = data.credits
    .filter((c) => c.subscription_type !== "free" && c.subscription_type !== "ambassador")
    .reduce((s, c) => s + c.users, 0);

  const subscriptionTypes = useMemo(() => {
    const types = Array.from(new Set(data.allUsers.map((u) => u.subscription_type)));
    return types.sort();
  }, [data.allUsers]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    let rows = data.allUsers.filter((u) => u.email && u.email !== "(no email)");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((u) => u.email.toLowerCase().includes(q));
    }
    if (filterType !== "all") {
      rows = rows.filter((u) => u.subscription_type === filterType);
    }
    rows = [...rows].sort((a, b) => {
      let va: string | number = a[sortKey] ?? "";
      let vb: string | number = b[sortKey] ?? "";
      if (sortKey === "created_at") {
        va = va ? new Date(va as string).getTime() : 0;
        vb = vb ? new Date(vb as string).getTime() : 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [data.allUsers, search, filterType, sortKey, sortDir]);

  const thClass = `${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-left cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`;
  const thRClass = `${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-100">Users</h1>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`${MONO} flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-white/10 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors disabled:opacity-40`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Aggiorna
          </button>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Users" value={data.users.total} icon={<Users className="w-[18px] h-[18px]" />} />
        <KpiCard label="Confirmed" value={data.users.confirmed} icon={<ShieldCheck className="w-[18px] h-[18px]" />} />
        <KpiCard label="Paganti" value={agencyCount} icon={<Building2 className="w-[18px] h-[18px]" />} />
        <KpiCard label="Active 7d" value={data.sessions.active_7d} sub={`di ${data.sessions.active_30d} attivi 30d`} icon={<Activity className="w-[18px] h-[18px]" />} />
      </div>

      {/* Growth + Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Costo totale utenti">
          {(() => {
            const totalCost = data.allUsers.reduce((sum, u) => sum + (u.estimated_cost ?? 0), 0);
            const photoCost = data.allUsers.reduce((sum, u) => sum + (u.staging_photos ?? 0) * 0.036, 0);
            const videoCost = totalCost - photoCost;
            return (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <span className={`${MONO} text-4xl font-bold ${totalCost > 100 ? "text-red-400" : totalCost > 30 ? "text-amber-400" : "text-emerald-400"}`}>€{totalCost.toFixed(2)}</span>
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <span className={`${MONO} text-lg font-semibold text-gray-200`}>€{photoCost.toFixed(2)}</span>
                    <p className={`${MONO} text-[10px] text-gray-500 mt-1`}>Foto AI</p>
                  </div>
                  <div className="text-center">
                    <span className={`${MONO} text-lg font-semibold text-gray-200`}>€{videoCost.toFixed(2)}</span>
                    <p className={`${MONO} text-[10px] text-gray-500 mt-1`}>Video AI</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </StatCard>
        <StatCard title="Auth Providers">
          <Donut
            segments={data.providers.map((p, i) => ({
              label: p.provider,
              value: p.count,
              color: DONUT_COLORS[i % DONUT_COLORS.length],
            }))}
          />
        </StatCard>
      </div>

      {/* Search + Filter */}
      <StatCard title="All Users">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per email..."
              className={`${MONO} w-full pl-9 pr-4 py-2 text-sm border border-white/10 rounded-lg bg-white/5 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition`}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`${MONO} px-3 py-2 text-sm border border-white/10 rounded-lg bg-[#161920] text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition`}
          >
            <option value="all">Tutti i tipi</option>
            {subscriptionTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className={`${MONO} text-xs text-gray-500 self-center whitespace-nowrap`}>
            {filtered.length} utenti
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className={thClass} onClick={() => handleSort("email")}>Email <SortIcon col="email" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thClass} onClick={() => handleSort("subscription_type")}>Tipo <SortIcon col="subscription_type" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("credits")}>Credits <SortIcon col="credits" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("total_spent")}>Spent <SortIcon col="total_spent" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("properties_saved")}>Immobili <SortIcon col="properties_saved" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("zone_analyses")}>Analisi <SortIcon col="zone_analyses" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("pdf_reports")}>PDF <SortIcon col="pdf_reports" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("staging_photos")}>Foto AI <SortIcon col="staging_photos" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right select-none whitespace-nowrap`}>
                  <span className="cursor-pointer hover:text-gray-300 transition-colors" onClick={() => handleSort("post_png_exports")}>Post <SortIcon col="post_png_exports" sortKey={sortKey} sortDir={sortDir} /></span>
                  <span className="relative inline-block ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPostHeaderTooltip((v) => !v); }}
                      className="text-gray-600 hover:text-gray-400 transition-colors align-middle"
                    >
                      <Info className="w-3 h-3 inline" />
                    </button>
                    {postHeaderTooltip && (
                      <div className="absolute right-0 top-6 z-50 w-44 text-left normal-case tracking-normal" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[#12141a] border border-white/[0.12] rounded-lg shadow-2xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-white/[0.06]">
                            <p className={`${MONO} text-[9px] uppercase tracking-widest text-indigo-400/70`}>Post · totali</p>
                          </div>
                          <div className="px-3 py-2 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                <span className={`${MONO} text-[11px] text-gray-400`}>PNG</span>
                              </div>
                              <span className={`${MONO} text-[11px] font-medium text-gray-100`}>{fmt(totalPostPng)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                <span className={`${MONO} text-[11px] text-gray-400`}>Video</span>
                              </div>
                              <span className={`${MONO} text-[11px] font-medium text-gray-100`}>{fmt(totalPostVideo)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </span>
                </th>
                <th className={thRClass} onClick={() => handleSort("staging_video_exports")}>Video <SortIcon col="staging_video_exports" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("estimated_cost")}>Costo <SortIcon col="estimated_cost" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("created_at")}>Joined <SortIcon col="created_at" sortKey={sortKey} sortDir={sortDir} /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <React.Fragment key={user.email}>
                  <tr
                    onClick={() => setExpanded(expanded === user.email ? null : user.email)}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${expanded === user.email ? "bg-white/[0.05]" : ""}`}
                  >
                    <td className={`${MONO} text-sm py-3 pr-4 text-gray-300`}><span className="truncate block max-w-[180px]">{user.email}</span></td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${SUB_COLORS[user.subscription_type] || SUB_COLORS.free}`}>{user.subscription_type}</span>
                    </td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right text-gray-300`}>{fmt(user.credits)}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right text-gray-300`}>{fmt(user.total_spent)}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.properties_saved > 0 ? "text-gray-300" : "text-gray-700"}`}>{user.properties_saved > 0 ? fmt(user.properties_saved) : "—"}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.zone_analyses > 0 ? "text-indigo-400" : "text-gray-700"}`}>{user.zone_analyses > 0 ? fmt(user.zone_analyses) : "—"}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.pdf_reports > 0 ? "text-gray-300" : "text-gray-700"}`}>{user.pdf_reports > 0 ? fmt(user.pdf_reports) : "—"}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.staging_photos > 0 ? "text-violet-400" : "text-gray-700"}`}>{user.staging_photos > 0 ? fmt(user.staging_photos) : "—"}</td>
                    <td className="py-3 pr-4 text-right">
                      <span className={`${MONO} text-sm ${user.post_png_exports + user.post_video_exports > 0 ? "text-gray-300" : "text-gray-700"}`}>
                        {user.post_png_exports + user.post_video_exports > 0 ? fmt(user.post_png_exports + user.post_video_exports) : "—"}
                      </span>
                      {(user.post_png_exports > 0 || user.post_video_exports > 0) && (
                        <span className="relative inline-block ml-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPostTooltipUser(postTooltipUser === user.email ? null : user.email); }}
                            className="text-gray-600 hover:text-gray-400 transition-colors align-middle"
                          >
                            <Info className="w-3 h-3 inline" />
                          </button>
                          {postTooltipUser === user.email && (
                            <div ref={tooltipRef} className="absolute right-0 top-6 z-50 w-48 text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="bg-[#12141a] border border-white/[0.12] rounded-lg shadow-2xl overflow-hidden">
                                <div className="px-3 py-2 border-b border-white/[0.06]">
                                  <p className={`${MONO} text-[9px] uppercase tracking-widest text-indigo-400/70`}>Dettaglio post</p>
                                </div>
                                <div className="px-3 py-2 space-y-1.5">
                                  {/* PNG totale + breakdown per dimensione */}
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                      <span className={`${MONO} text-[11px] text-gray-400`}>PNG</span>
                                    </div>
                                    <span className={`${MONO} text-[11px] font-medium text-gray-100`}>{fmt(user.post_png_exports)}</span>
                                  </div>
                                  {(["1080×1350", "1080×1080", "1080×1920"].map((size) => {
                                    const count = (user.post_png_by_size || {})[size] ?? 0;
                                    return (
                                      <div key={size} className="flex items-center justify-between gap-2 pl-3">
                                        <span className={`${MONO} text-[10px] text-gray-600`}>{size}</span>
                                        <span className={`${MONO} text-[10px] ${count > 0 ? "text-gray-400" : "text-gray-700"}`}>{fmt(count)}</span>
                                      </div>
                                    );
                                  }))}
                                  {/* Video */}
                                  {user.post_video_exports > 0 && (
                                    <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-white/[0.04]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                                        <span className={`${MONO} text-[11px] text-gray-400`}>Video</span>
                                      </div>
                                      <span className={`${MONO} text-[11px] font-medium text-gray-100`}>{fmt(user.post_video_exports)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </span>
                      )}
                    </td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.staging_video_exports > 0 ? "text-teal-400" : "text-gray-700"}`}>{user.staging_video_exports > 0 ? fmt(user.staging_video_exports) : "—"}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right font-medium ${(user.estimated_cost ?? 0) > 5 ? "text-red-400" : (user.estimated_cost ?? 0) > 1 ? "text-amber-400" : "text-gray-500"}`}>{(user.estimated_cost ?? 0) > 0 ? `€${(user.estimated_cost ?? 0).toFixed(2)}` : "—"}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right text-gray-500`}>{formatDate(user.created_at)}</td>
                  </tr>
                  {expanded === user.email && (
                    <tr key={`${user.email}-detail`} className="bg-white/[0.02]">
                      <td colSpan={12} className="px-4 py-4">
                        <UserDetail user={user} authKey={authKey} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className={`${MONO} text-sm text-center py-8 text-gray-400`}>Nessun utente trovato</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StatCard>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-400">{label}</span>
      <span className={`${MONO} text-gray-200`}>{value}</span>
    </div>
  );
}

function UserDetail({ user, authKey }: { user: MetricsData["allUsers"][0]; authKey?: string | null }) {
  const earnedPct = user.total_earned > 0 ? (user.total_spent / user.total_earned) * 100 : 0;
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  async function resetQuota() {
    if (!user.id) { setResetMsg("ID utente mancante"); return; }
    if (!confirm(`Resettare le quote di ${user.email} al massimo?\n\nVideo, Foto AI, Post e Montaggio tornano disponibili al massimo.`)) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch("/api/metrics/users/reset-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-metrics-key": authKey || "" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Errore");
      setResetMsg("Quote resettate al massimo");
    } catch (e) {
      setResetMsg(`Errore: ${(e as Error).message}`);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Credits */}
      <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
        <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Credits</p>
        <div className="space-y-1">
          <DetailRow label="Earned" value={<span className="text-gray-100 font-medium">{fmt(user.total_earned)}</span>} />
          <DetailRow label="Spent" value={<span className="text-red-400 font-medium">{fmt(user.total_spent)}</span>} />
          <DetailRow label="Balance" value={<span className="text-indigo-400 font-medium">{fmt(user.credits)}</span>} />
          <div className="mt-2 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(earnedPct, 100)}%` }} />
          </div>
          <p className={`${MONO} text-[10px] text-gray-400`}>{earnedPct.toFixed(0)}% spesi</p>
        </div>
      </div>

      {/* Analisi immobili */}
      <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
        <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Analisi immobili</p>
        <div className="space-y-1">
          <DetailRow label="Analisi zona" value={fmt(user.full_analyses)} />
          <DetailRow label="Report PDF" value={fmt(user.pdf_reports)} />
        </div>
      </div>

      {/* Contenuti creati */}
      <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
        <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Contenuti creati</p>
        <div className="space-y-1">
          <DetailRow label="Foto AI" value={fmt(user.staging_photos)} />
          {(() => {
            const STYLE_LABELS: Record<string, string> = {
              modern: "Moderno", nordic: "Nordico", industrial: "Luxury", boho: "Boho", daynight: "Giorno/Notte", empty: "Svuota stanza", custom: "Custom",
              bright: "Luminoso", neutral: "Neutro", minimal: "Minimal", cozy: "Accogliente", lived: "Vissuto", family: "Famiglia",
            };
            const byStyle = user.staging_photo_by_style || {};
            const sorted = Object.entries(byStyle)
              .filter(([, count]) => count > 0)
              .sort((a, b) => b[1] - a[1]);
            return (
              <>
                {sorted.map(([id, count]) => (
                  <div key={id} className="flex justify-between text-sm py-0.5 pl-3">
                    <span className={`${MONO} text-[11px] text-gray-200`}>↳ {STYLE_LABELS[id] ?? id}</span>
                    <span className={`${MONO} text-[11px] text-gray-200`}>{count}</span>
                  </div>
                ))}
              </>
            );
          })()}
          <DetailRow label="Post PNG" value={fmt(user.post_png_exports)} />
          {[["1080×1350", "↳ Feed"], ["1080×1080", "↳ Square"], ["1080×1920", "↳ Story"]].map(([size, label]) => {
            const count = (user.post_png_by_size || {})[size] ?? 0;
            return (
              <div key={size} className="flex justify-between text-sm py-0.5 pl-3">
                <span className={`${MONO} text-[11px] text-gray-200`}>{label}</span>
                <span className={`${MONO} text-[11px] text-gray-200`}>{count}</span>
              </div>
            );
          })}
          <div className="border-t border-white/[0.06] my-1 mx-0" />
          {(() => {
            const TPL_ORDER = ["gradient", "blue", "diagonal", "centered", "card", "elegant", "topbar", "clean", "magazine", "ribbon", "polaroid", "spotlight", "minimal", "frame", "gallery", "split", "fade", "sidebar"];
            const TPL: Record<string, string> = { gradient: "Gradient", blue: "Blue", diagonal: "Diagonal", centered: "Centered", card: "Card", elegant: "Elegant", topbar: "Top Bar", clean: "Clean", magazine: "Magazine", ribbon: "Ribbon", polaroid: "Polaroid", spotlight: "Spotlight", minimal: "Minimal", frame: "Frame", gallery: "Gallery", split: "Split", fade: "Fade", sidebar: "Sidebar" };
            const byTpl = user.post_png_by_template || {};
            const hasData = Object.values(byTpl).some(v => v > 0);
            const top3 = hasData
              ? Object.entries(byTpl).sort((a, b) => b[1] - a[1]).slice(0, 3)
              : TPL_ORDER.slice(0, 3).map(k => [k, 0] as [string, number]);
            return (
              <>
                {top3.map(([tpl, count]) => (
                  <div key={tpl} className="flex justify-between text-sm py-0.5 pl-3">
                    <span className={`${MONO} text-[11px] text-gray-200`}>↳ {TPL[tpl] ?? tpl}</span>
                    <span className={`${MONO} text-[11px] ${count > 0 ? "text-gray-200" : "text-gray-600"}`}>{count}</span>
                  </div>
                ))}
              </>
            );
          })()}
          <DetailRow label="Post Video" value={fmt(user.post_video_exports)} />
          {(() => {
            const VID_LABELS: Record<string, string> = { ai_staging: "Before/After", walkthrough: "Walkthrough", classic: "Classico", split: "Split", construction: "Ristrutturazione", day_night: "Giorno/Notte", montaggio: "Montaggio", sottotitoli: "Sottotitoli" };
            const vt = user.ai_videos_by_template || {};
            const entries = Object.entries(vt).filter(([,c]) => c > 0).sort((a, b) => b[1] - a[1]);
            return entries.length > 0 ? entries.map(([tpl, count]) => (
              <div key={tpl} className="flex justify-between text-sm py-0.5 pl-3">
                <span className={`${MONO} text-[11px] text-gray-200`}>↳ {VID_LABELS[tpl] ?? tpl}</span>
                <span className={`${MONO} text-[11px] text-gray-200`}>{count}</span>
              </div>
            )) : null;
          })()}
        </div>
      </div>

      {/* Team */}
      {user.team && (
        <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
          <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Team</p>
          <div className="space-y-1">
            <DetailRow label="Nome" value={<span className="text-xs">{user.team.team_name || "—"}</span>} />
            <DetailRow label="Ruolo" value={
              <span className={`text-xs px-2 py-0.5 rounded ${user.team.role === "owner" ? "bg-indigo-500/15 text-indigo-400" : "bg-white/10 text-gray-400"}`}>
                {user.team.role === "owner" ? "Owner" : "Membro"}
              </span>
            } />
            <DetailRow label="Membri" value={fmt(user.team.member_count)} />
          </div>
        </div>
      )}

      {/* Costo stimato */}
      {(user.estimated_cost ?? 0) > 0 && (
        <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
          <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Costo stimato</p>
          <div className="space-y-1">
            <DetailRow label="Totale" value={<span className={`font-medium ${(user.estimated_cost ?? 0) > 5 ? "text-red-400" : (user.estimated_cost ?? 0) > 1 ? "text-amber-400" : "text-gray-200"}`}>€{(user.estimated_cost ?? 0).toFixed(2)}</span>} />
            {user.staging_photos > 0 && <DetailRow label="Foto AI" value={<span className="text-xs text-gray-400">{fmt(user.staging_photos)} × €0.036 = €{(user.staging_photos * 0.036).toFixed(2)}</span>} />}
            {(() => {
              const VID_LABELS: Record<string, string> = { ai_staging: "Before/After", walkthrough: "Walkthrough", classic: "Classico", split: "Split", construction: "Ristrutturazione", day_night: "Giorno/Notte", montaggio: "Montaggio" };
              const VID_COST: Record<string, number> = { ai_staging: 1.03, walkthrough: 0.78, classic: 0.32, split: 0.32, construction: 0.78, day_night: 0.78, montaggio: 0.003 };
              const vt = user.ai_videos_by_template || {};
              return Object.entries(vt).filter(([,c]) => c > 0).map(([tpl, count]) => (
                <DetailRow key={tpl} label={`↳ ${VID_LABELS[tpl] ?? tpl}`} value={<span className="text-xs text-gray-400">{count} × €{(VID_COST[tpl] ?? 0.5).toFixed(2)} = €{(count * (VID_COST[tpl] ?? 0.5)).toFixed(2)}</span>} />
              ));
            })()}
          </div>
        </div>
      )}

      {/* Account */}
      <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
        <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Account</p>
        <div className="space-y-1">
          <DetailRow label="Joined" value={<span className="text-xs">{formatDate(user.created_at)}</span>} />
          <DetailRow label="Last seen" value={<span className="text-xs text-gray-400">{formatDate(user.last_sign_in_at)}</span>} />
        </div>
        <button
          onClick={resetQuota}
          disabled={resetting}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 hover:bg-indigo-500/25 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
          {resetting ? "Reset..." : "Reset quote (Video/Foto/Post/Montaggio)"}
        </button>
        {resetMsg && (
          <p className={`${MONO} text-[10px] mt-2 ${resetMsg.startsWith("Errore") ? "text-red-400" : "text-emerald-400"}`}>{resetMsg}</p>
        )}
      </div>
    </div>
  );
}
