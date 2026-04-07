"use client";

import React, { useState, useMemo } from "react";
import type { MetricsData } from "../types";
import { MONO, fmt } from "../types";
import StatCard from "../ui/StatCard";
import KpiCard from "../ui/KpiCard";
import { Star, Search, UserCheck, UserX, Loader2, CheckCircle, AlertCircle, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type AmbSortKey = "email" | "full_analyses" | "staging_photos" | "post_png_exports" | "post_video_exports" | "staging_video_exports" | "pdf_reports" | "properties_saved" | "created_at";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: AmbSortKey; sortKey: AmbSortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-1 text-purple-400" />
    : <ChevronDown className="w-3 h-3 inline ml-1 text-purple-400" />;
}

type UserRow = MetricsData["allUsersForAmbassador"][0];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "2-digit" });
}

type LocalUser = MetricsData["allUsersForAmbassador"][0];

export default function AmbassadorPage({ data, authKey }: { data: MetricsData; authKey: string }) {
  const [search, setSearch] = useState("");
  const [promoteSearch, setPromoteSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [sortKey, setSortKey] = useState<AmbSortKey>("full_analyses");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const baseUsers = (data.allUsersForAmbassador ?? data.allUsers).filter(
    (u) => u.email && u.email !== "(no email)"
  );
  // Local override map: email → subscription_type (for instant UI update)
  const [localOverrides, setLocalOverrides] = useState<Record<string, string>>({});

  const allForAmbassador = useMemo(
    () => baseUsers.map((u) => localOverrides[u.email] !== undefined ? { ...u, subscription_type: localOverrides[u.email] } : u),
    [baseUsers, localOverrides]
  );

  const ambassadors = useMemo(
    () => allForAmbassador.filter((u) => u.subscription_type === "ambassador"),
    [allForAmbassador]
  );

  const filteredAmbassadors = useMemo(() => {
    if (!search.trim()) return ambassadors;
    const q = search.trim().toLowerCase();
    return ambassadors.filter((u) => u.email.toLowerCase().includes(q));
  }, [ambassadors, search]);

  function handleSort(key: AmbSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const tableAmbassadors = useMemo(() => {
    let rows = ambassadors;
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      rows = rows.filter((u) => u.email.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
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
  }, [ambassadors, tableSearch, sortKey, sortDir]);

  const promoteResults = useMemo(() => {
    if (!promoteSearch.trim()) return [];
    const q = promoteSearch.trim().toLowerCase();
    return allForAmbassador
      .filter((u) => u.subscription_type !== "ambassador" && u.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allForAmbassador, promoteSearch]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSetAmbassador(email: string, makeAmbassador: boolean) {
    setLoading(email);
    try {
      const res = await fetch("/api/metrics/ambassador", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-metrics-key": authKey,
        },
        body: JSON.stringify({ email, ambassador: makeAmbassador }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      // Update UI immediately without full refresh
      setLocalOverrides((prev) => ({ ...prev, [email]: makeAmbassador ? "ambassador" : "free" }));
      if (makeAmbassador) setPromoteSearch("");
      showToast("success", makeAmbassador ? `${email} è ora Ambassador` : `${email} rimosso da Ambassador`);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">Ambassador</h1>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm transition-all ${
            toast.type === "success"
              ? "bg-emerald-950 border-emerald-500/30 text-emerald-300"
              : "bg-red-950 border-red-500/30 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className={MONO}>{toast.message}</span>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Ambassador attivi"
          value={ambassadors.length}
          icon={<Star className="w-[18px] h-[18px]" />}
        />
        <UsageCounter label="Analisi AI" used={ambassadors.filter(u => u.full_analyses > 0).length} total={ambassadors.length} color="indigo" />
        <UsageCounter label="Foto AI" used={ambassadors.filter(u => u.staging_photos > 0).length} total={ambassadors.length} color="violet" />
        <UsageCounter label="Post esportati" used={ambassadors.filter(u => u.post_png_exports + u.post_video_exports > 0).length} total={ambassadors.length} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Lista ambassador */}
        <StatCard title="Ambassador attuali">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca tra gli ambassador..."
                className={`${MONO} w-full pl-9 pr-4 py-2 text-sm border border-white/10 rounded-lg bg-white/5 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition`}
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredAmbassadors.length === 0 && (
              <p className={`${MONO} text-sm text-gray-500 text-center py-6`}>
                {ambassadors.length === 0 ? "Nessun ambassador ancora" : "Nessun risultato"}
              </p>
            )}
            {filteredAmbassadors.map((user) => (
              <AmbassadorRow
                key={user.email}
                user={user}
                loading={loading === user.email}
                onRemove={() => handleSetAmbassador(user.email, false)}
              />
            ))}
          </div>
        </StatCard>

        {/* Promuovi utente */}
        <StatCard title="Promuovi un utente">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={promoteSearch}
                onChange={(e) => setPromoteSearch(e.target.value)}
                placeholder="Cerca per email..."
                className={`${MONO} w-full pl-9 pr-4 py-2 text-sm border border-white/10 rounded-lg bg-white/5 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition`}
              />
            </div>
          </div>

          <div className="space-y-2">
            {promoteSearch.trim().length > 0 && promoteResults.length === 0 && (
              <p className={`${MONO} text-sm text-gray-500 text-center py-6`}>
                Nessun utente trovato
              </p>
            )}
            {promoteSearch.trim().length === 0 && (
              <p className={`${MONO} text-xs text-gray-600 text-center py-6`}>
                Digita l'email per cercare un utente
              </p>
            )}
            {promoteResults.map((user) => (
              <PromoteRow
                key={user.email}
                user={user}
                loading={loading === user.email}
                onPromote={() => handleSetAmbassador(user.email, true)}
              />
            ))}
          </div>
        </StatCard>
      </div>

      {/* Ambassador detail table */}
      <StatCard title="Dettaglio Ambassador">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cerca ambassador..."
              className={`${MONO} w-full pl-9 pr-4 py-2 text-sm border border-white/10 rounded-lg bg-white/5 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition`}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-left cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("email")}>Email <SortIcon col="email" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("full_analyses")}>Analisi AI <SortIcon col="full_analyses" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("staging_photos")}>Foto AI <SortIcon col="staging_photos" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("post_png_exports")}>Post PNG <SortIcon col="post_png_exports" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("post_video_exports")}>Post Video <SortIcon col="post_video_exports" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("staging_video_exports")}>Staging Video <SortIcon col="staging_video_exports" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("pdf_reports")}>PDF <SortIcon col="pdf_reports" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("properties_saved")}>Annunci <SortIcon col="properties_saved" sortKey={sortKey} sortDir={sortDir} /></th>
                <th className={`${MONO} text-[10px] tracking-wider uppercase text-gray-400 pb-3 font-medium text-right cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap`} onClick={() => handleSort("created_at")}>Joined <SortIcon col="created_at" sortKey={sortKey} sortDir={sortDir} /></th>
              </tr>
            </thead>
            <tbody>
              {tableAmbassadors.map((user) => (
                <tr key={user.email} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className={`${MONO} text-sm py-3 pr-4 text-gray-300`}>
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate max-w-[180px] block">{user.email}</span>
                    </div>
                  </td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.full_analyses > 0 ? "text-indigo-400" : "text-gray-700"}`}>{user.full_analyses > 0 ? fmt(user.full_analyses) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.staging_photos > 0 ? "text-violet-400" : "text-gray-700"}`}>{user.staging_photos > 0 ? fmt(user.staging_photos) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.post_png_exports > 0 ? "text-gray-300" : "text-gray-700"}`}>{user.post_png_exports > 0 ? fmt(user.post_png_exports) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.post_video_exports > 0 ? "text-teal-400" : "text-gray-700"}`}>{user.post_video_exports > 0 ? fmt(user.post_video_exports) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.staging_video_exports > 0 ? "text-teal-400" : "text-gray-700"}`}>{user.staging_video_exports > 0 ? fmt(user.staging_video_exports) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.pdf_reports > 0 ? "text-gray-300" : "text-gray-700"}`}>{user.pdf_reports > 0 ? fmt(user.pdf_reports) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 pr-4 text-right ${user.properties_saved > 0 ? "text-gray-300" : "text-gray-700"}`}>{user.properties_saved > 0 ? fmt(user.properties_saved) : "—"}</td>
                  <td className={`${MONO} text-sm py-3 text-right text-gray-500`}>{formatDate(user.created_at)}</td>
                </tr>
              ))}
              {tableAmbassadors.length === 0 && (
                <tr>
                  <td colSpan={9} className={`${MONO} text-sm text-center py-8 text-gray-400`}>
                    {ambassadors.length === 0 ? "Nessun ambassador ancora" : "Nessun risultato"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </StatCard>
    </div>
  );
}

const COUNTER_COLORS = {
  indigo: { bar: "bg-indigo-500", text: "text-indigo-400", bg: "bg-indigo-500/10" },
  violet: { bar: "bg-violet-500", text: "text-violet-400", bg: "bg-violet-500/10" },
  teal:   { bar: "bg-teal-500",   text: "text-teal-400",   bg: "bg-teal-500/10"   },
  purple: { bar: "bg-purple-500", text: "text-purple-400", bg: "bg-purple-500/10" },
} as const;

function UsageCounter({ label, used, total, color }: { label: string; used: number; total: number; color: keyof typeof COUNTER_COLORS }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const c = COUNTER_COLORS[color];
  return (
    <div className={`bg-[#161920] rounded-xl border border-white/[0.08] p-4 flex flex-col gap-2`}>
      <p className={`${MONO} text-[10px] tracking-wider uppercase text-gray-500`}>{label}</p>
      <div className="flex items-end gap-1.5">
        <span className={`${MONO} text-2xl font-semibold ${c.text}`}>{used}</span>
        <span className={`${MONO} text-sm text-gray-600 mb-0.5`}>/ {total}</span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`${MONO} text-[11px] text-gray-600`}>{pct.toFixed(0)}% lo ha usato</p>
    </div>
  );
}

function AmbassadorRow({
  user,
  loading,
  onRemove,
}: {
  user: UserRow;
  loading: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors">
      <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center shrink-0">
        <Star className="w-3.5 h-3.5 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${MONO} text-sm text-gray-200 truncate`}>{user.email}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`${MONO} text-[10px] text-gray-500`}>
            {fmt(user.properties_saved)} annunci · {fmt(user.full_analyses)} analisi
          </span>
        </div>
      </div>
      <button
        onClick={onRemove}
        disabled={loading}
        className={`${MONO} flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <UserX className="w-3 h-3" />
        )}
        Rimuovi
      </button>
    </div>
  );
}

function PromoteRow({
  user,
  loading,
  onPromote,
}: {
  user: UserRow;
  loading: boolean;
  onPromote: () => void;
}) {
  const subLabel = user.subscription_type || "free";
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
        <span className={`${MONO} text-[10px] font-semibold text-gray-400 uppercase`}>
          {user.email.charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${MONO} text-sm text-gray-200 truncate`}>{user.email}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="px-1.5 py-0 rounded text-[10px] bg-white/10 text-gray-400 uppercase font-medium">
            {subLabel}
          </span>
          <span className={`${MONO} text-[10px] text-gray-500`}>
            {fmt(user.properties_saved)} annunci
          </span>
        </div>
      </div>
      <button
        onClick={onPromote}
        disabled={loading}
        className={`${MONO} flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 transition-colors disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Star className="w-3 h-3" />
        )}
        Promuovi
      </button>
    </div>
  );
}
