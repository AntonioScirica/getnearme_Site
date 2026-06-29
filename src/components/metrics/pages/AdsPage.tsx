"use client";

import { useCallback, useEffect, useState } from "react";
import { MONO } from "../types";
import KpiCard from "../ui/KpiCard";
import { RefreshCw, Megaphone, MousePointerClick, Eye, Euro, Target } from "lucide-react";

type Campaign = {
  name: string;
  status: string;
  objective: string;
  budget: number | null;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  linkClicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  landingViews: number;
  leads: number;
  purchases: number;
  costPerLead: number;
};
type AdsData = {
  range: string;
  account: string;
  campaigns: Campaign[];
  totals: { spend: number; impressions: number; reach: number; clicks: number; linkClicks: number; leads: number; purchases: number };
};

const RANGES: { id: string; label: string }[] = [
  { id: "today", label: "Oggi" },
  { id: "7d", label: "7 giorni" },
  { id: "30d", label: "30 giorni" },
  { id: "max", label: "Sempre" },
];

const eur = (n: number) => `€${(n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const int = (n: number) => (n || 0).toLocaleString("it-IT");

const OBJ_LABEL: Record<string, string> = {
  OUTCOME_TRAFFIC: "Traffico",
  OUTCOME_LEADS: "Lead",
  OUTCOME_SALES: "Vendite",
  OUTCOME_ENGAGEMENT: "Interazioni",
  OUTCOME_AWARENESS: "Notorietà",
  OUTCOME_APP_PROMOTION: "App",
};

export default function AdsPage({ authKey }: { authKey: string | null }) {
  const [range, setRange] = useState("max");
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!authKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metrics/ads?range=${range}`, { headers: { "x-metrics-key": authKey } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [authKey, range]);

  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const avgCtr = t && t.impressions ? (t.clicks / t.impressions) * 100 : 0;
  const avgCpc = t && t.clicks ? t.spend / t.clicks : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-gray-100">Ads — Meta</h1>
        <button onClick={load} disabled={loading} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className={`${MONO} text-xs text-gray-500 mb-5`}>Performance campagne Facebook/Instagram (Marketing API).</p>

      {/* Range tabs */}
      <div className="flex gap-2 mb-5">
        {RANGES.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${range === r.id ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" : "bg-white/[0.02] text-gray-400 border-white/[0.06] hover:text-gray-200"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className={`${MONO} text-sm text-red-400 bg-red-500/[0.06] border border-red-500/20 rounded-lg px-4 py-3 mb-5`}>
          ⚠ {error}
          {/FB_ADS/.test(error) && <div className="text-gray-400 mt-1">Aggiungi FB_ADS_TOKEN e FB_ADS_ACCOUNT_ID alle env (locale + Vercel).</div>}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="Spesa" value={0} sub={t ? eur(t.spend) : "—"} icon={<Euro className="w-[18px] h-[18px]" />} />
        <KpiCard label="Impression" value={t?.impressions ?? 0} icon={<Eye className="w-[18px] h-[18px]" />} />
        <KpiCard label="Click" value={t?.clicks ?? 0} sub={`${int(t?.linkClicks ?? 0)} sul link`} icon={<MousePointerClick className="w-[18px] h-[18px]" />} />
        <KpiCard label="CTR medio" value={0} sub={`${avgCtr.toFixed(2)}%`} icon={<Target className="w-[18px] h-[18px]" />} />
        <KpiCard label="CPC medio" value={0} sub={eur(avgCpc)} icon={<Euro className="w-[18px] h-[18px]" />} />
        <KpiCard label="Lead / Acquisti" value={t?.leads ?? 0} sub={`${int(t?.purchases ?? 0)} acquisti`} icon={<Megaphone className="w-[18px] h-[18px]" />} />
      </div>

      {/* Campaign table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 bg-white/[0.02]`}>
              {["Campagna", "Stato", "Obiettivo", "Budget/g", "Spesa", "Impression", "Reach", "Click", "CTR", "CPC", "Lead", "Costo/Lead"].map((h) => (
                <th key={h} className="text-left font-normal px-3 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.campaigns || []).map((c) => (
              <tr key={c.name} className="border-t border-white/[0.05] hover:bg-white/[0.03]">
                <td className="px-3 py-2.5 font-medium text-gray-100 whitespace-nowrap">{c.name}</td>
                <td className="px-3 py-2.5">
                  <span className={`${MONO} text-[10px] px-2 py-0.5 rounded ${c.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/10 text-gray-400"}`}>
                    {c.status === "ACTIVE" ? "Attiva" : (c.status || "—").toLowerCase()}
                  </span>
                </td>
                <td className={`${MONO} text-[12px] text-gray-400 px-3 py-2.5 whitespace-nowrap`}>{OBJ_LABEL[c.objective] || c.objective}</td>
                <td className={`${MONO} text-[12px] text-gray-300 px-3 py-2.5`}>{c.budget != null ? eur(c.budget) : "—"}</td>
                <td className={`${MONO} text-[12px] text-gray-100 px-3 py-2.5 font-medium`}>{eur(c.spend)}</td>
                <td className={`${MONO} text-[12px] text-gray-300 px-3 py-2.5`}>{int(c.impressions)}</td>
                <td className={`${MONO} text-[12px] text-gray-400 px-3 py-2.5`}>{int(c.reach)}</td>
                <td className={`${MONO} text-[12px] text-gray-300 px-3 py-2.5`}>{int(c.clicks)}</td>
                <td className={`${MONO} text-[12px] px-3 py-2.5 ${c.ctr >= 2 ? "text-green-400" : "text-gray-300"}`}>{c.ctr.toFixed(2)}%</td>
                <td className={`${MONO} text-[12px] text-gray-300 px-3 py-2.5`}>{eur(c.cpc)}</td>
                <td className={`${MONO} text-[12px] text-indigo-300 px-3 py-2.5`}>{int(c.leads)}</td>
                <td className={`${MONO} text-[12px] text-gray-300 px-3 py-2.5`}>{c.leads ? eur(c.costPerLead) : "—"}</td>
              </tr>
            ))}
            {data && data.campaigns.length === 0 && !error && (
              <tr><td colSpan={12} className={`${MONO} text-sm text-gray-500 text-center py-8`}>Nessuna campagna con dati per questo periodo.</td></tr>
            )}
            {!data && !error && (
              <tr><td colSpan={12} className={`${MONO} text-sm text-gray-600 text-center py-8`}>{loading ? "Carico…" : "—"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
