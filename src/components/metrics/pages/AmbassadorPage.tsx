"use client";

import React, { useState, useMemo } from "react";
import type { MetricsData } from "../types";
import { MONO, fmt } from "../types";
import StatCard from "../ui/StatCard";
import KpiCard from "../ui/KpiCard";
import { Star, Search, UserCheck, UserX, Loader2, CheckCircle, AlertCircle } from "lucide-react";

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

  const baseUsers = data.allUsersForAmbassador ?? data.allUsers;
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Ambassador attivi"
          value={ambassadors.length}
          icon={<Star className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label="Annunci salvati"
          value={ambassadors.reduce((s, u) => s + u.properties_saved, 0)}
          icon={<UserCheck className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label="Analisi totali"
          value={ambassadors.reduce((s, u) => s + u.full_analyses, 0)}
          icon={<UserCheck className="w-[18px] h-[18px]" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
