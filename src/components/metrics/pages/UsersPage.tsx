"use client";

import React, { useState, useMemo, useRef } from "react";
import type { MetricsData } from "../types";
import { fmt, MONO } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import BarChart from "../ui/BarChart";
import Donut from "../ui/Donut";
import { Users, ShieldCheck, Building2, Activity, Search, ChevronUp, ChevronDown, ChevronsUpDown, Info } from "lucide-react";

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

type SortKey = "email" | "subscription_type" | "credits" | "total_spent" | "properties_saved" | "full_analyses" | "pdf_reports" | "staging_photos" | "post_png_exports" | "staging_video_exports" | "last_sign_in_at" | "created_at";
type SortDir = "asc" | "desc";

type UserRow = MetricsData["allUsers"][0];

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-500" />
    : <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-500" />;
}

export default function UsersPage({ data }: { data: MetricsData }) {
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
    .filter((c) => c.subscription_type === "agency" || c.subscription_type === "agency_subscription")
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
      if (sortKey === "last_sign_in_at" || sortKey === "created_at") {
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
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">Users</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Users" value={data.users.total} icon={<Users className="w-[18px] h-[18px]" />} />
        <KpiCard label="Confirmed" value={data.users.confirmed} icon={<ShieldCheck className="w-[18px] h-[18px]" />} />
        <KpiCard label="Agency" value={agencyCount} icon={<Building2 className="w-[18px] h-[18px]" />} />
        <KpiCard label="Active 7d" value={data.sessions.active_7d} sub={`di ${data.sessions.active_30d} attivi 30d`} icon={<Activity className="w-[18px] h-[18px]" />} />
      </div>

      {/* Growth + Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="User Growth by Month">
          <BarChart
            items={data.growth.map((g) => ({
              label: g.month.slice(5),
              value: g.new_users,
            }))}
          />
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
                <th className={thRClass} onClick={() => handleSort("properties_saved")}>Annunci <SortIcon col="properties_saved" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={thRClass} onClick={() => handleSort("full_analyses")}>Analisi <SortIcon col="full_analyses" sortKey={sortKey} sortDir={sortDir} /></th>
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
                <th className={thRClass} onClick={() => handleSort("last_sign_in_at")}>Last Seen <SortIcon col="last_sign_in_at" sortKey={sortKey} sortDir={sortDir} /></th>
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
                    <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.full_analyses > 0 ? "text-indigo-400" : "text-gray-700"}`}>{user.full_analyses > 0 ? fmt(user.full_analyses) : "—"}</td>
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
                    <td className={`${MONO} text-sm py-3 pr-4 text-right text-gray-500`}>{formatDate(user.last_sign_in_at)}</td>
                    <td className={`${MONO} text-sm py-3 pr-4 text-right text-gray-500`}>{formatDate(user.created_at)}</td>
                  </tr>
                  {expanded === user.email && (
                    <tr key={`${user.email}-detail`} className="bg-white/[0.02]">
                      <td colSpan={12} className="px-4 py-4">
                        <UserDetail user={user} />
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

function UserDetail({ user }: { user: MetricsData["allUsers"][0] }) {
  const earnedPct = user.total_earned > 0 ? (user.total_spent / user.total_earned) * 100 : 0;

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
          <DetailRow label="Annunci analizzati" value={fmt(user.full_analyses)} />
          <DetailRow label="Report PDF" value={fmt(user.pdf_reports)} />
        </div>
      </div>

      {/* Contenuti creati */}
      <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
        <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Contenuti creati</p>
        <div className="space-y-1">
          <DetailRow label="Foto AI" value={fmt(user.staging_photos)} />
          {(() => {
            const STYLE_LABELS: Record<string, string> = { bright: "Luminoso", modern: "Moderno", neutral: "Neutro", minimal: "Minimal", cozy: "Accogliente", lived: "Vissuto", family: "Famiglia", empty: "Vuoto" };
            const byStyle = user.staging_photo_by_style || {};
            const sorted = Object.entries(STYLE_LABELS)
              .map(([id, label]) => ({ id, label, count: byStyle[id] ?? 0 }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 3);
            return (
              <>
                {sorted.map(({ id, label, count }) => (
                  <div key={id} className="flex justify-between text-sm py-0.5 pl-3">
                    <span className={`${MONO} text-[11px] text-gray-200`}>↳ {label}</span>
                    <span className={`${MONO} text-[11px] ${count > 0 ? "text-gray-200" : "text-gray-600"}`}>{count}</span>
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

      {/* Account */}
      <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.06]">
        <p className={`${MONO} text-[10px] uppercase tracking-wider text-gray-400 mb-3`}>Account</p>
        <div className="space-y-1">
          <DetailRow label="Joined" value={<span className="text-xs">{formatDate(user.created_at)}</span>} />
          <DetailRow label="Last seen" value={<span className="text-xs text-gray-400">{formatDate(user.last_sign_in_at)}</span>} />
        </div>
      </div>
    </div>
  );
}
