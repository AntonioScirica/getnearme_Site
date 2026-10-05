"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Download, RefreshCw, Loader2, ExternalLink,
} from "lucide-react";
import { MONO, fmt } from "../types";
import UserActivity from "./UserActivity";
import type { AgenteImmoResponse, AgenteImmoUser } from "@/app/api/metrics/agenteimmo/route";

const DEFAULT_SINCE = "2026-09-23"; // primi commit del rebrand GetNearMe → Agente Immo
const SITE_HOST = "agenteimmo.me";

const euro = (n: number, digits = 2) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits });
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-");
const dayTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-");
// pagante che non usa la piattaforma da piu' di 7 giorni (senza sessioni salvate vale l'ultima attivita')
const WEEK = 7 * 86_400_000;
const idlePaying = (u: AgenteImmoUser) => {
  const at = u.lastUse ?? u.lastActivity;
  return u.paying && (!at || Date.now() - Date.parse(at) > WEEK);
};
const pct = (n: number) => `${n.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%`;

type SortKey = "email" | "createdAt" | "plan" | "paying" | "paidEur" | "credits" | "aiEur" | "photos" | "videos" | "properties" | "sitePublished" | "leads" | "siteViews" | "lastActivity" | "lastUse" | "minutes7";
type SortDir = "asc" | "desc";

const PLAN_LABEL: Record<string, string> = { none: "Gratis", starter: "Starter", plus: "Plus", pro: "Pro" };
const planLabel = (u: AgenteImmoUser) => {
  const p = PLAN_LABEL[u.plan] ?? u.plan;
  if (u.plan === "none") return u.welcomeCredits ? "Prova" : "Gratis";
  return u.planActive ? p : `${p} scaduto`;
};

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
      <p className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-2`}>{label}</p>
      <p className={`${MONO} text-2xl font-semibold ${accent ?? "text-gray-100"}`}>{value}</p>
      {sub && <p className={`${MONO} text-xs text-gray-500 mt-1`}>{sub}</p>}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />;
  return dir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1 text-indigo-400" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-indigo-400" />;
}

// iscritti per giorno (fino a 62 giorni) o per settimana (lunedi')
function buckets(users: AgenteImmoUser[], since: string) {
  const start = new Date(`${since}T00:00:00`);
  const today = new Date();
  const days = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / 86_400_000) + 1);
  const weekly = days > 62;
  const key = (d: Date) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (weekly) x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x.getTime();
  };
  const counts = new Map<number, number>();
  for (const u of users) { const k = key(new Date(u.createdAt)); counts.set(k, (counts.get(k) ?? 0) + 1); }
  const items: { label: string; value: number }[] = [];
  for (let t = key(start); t <= today.getTime(); ) {
    const d = new Date(t);
    items.push({ label: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }), value: counts.get(t) ?? 0 });
    d.setDate(d.getDate() + (weekly ? 7 : 1));
    t = d.getTime();
  }
  return { items, weekly };
}

function csv(users: AgenteImmoUser[]) {
  const head = ["Email", "Nome", "Agenzia", "Iscritto", "Metodo", "Piano", "Piano fino al", "Pagante", "MRR EUR", "Incassato EUR", "Crediti", "Costo AI EUR", "Foto", "Video", "Immobili", "Sito pubblicato", "Link sito", "Richieste", "Visite", "Ultima attivita", "Ultimo uso", "Minuti 7 gg", "Sconti", "Consenso marketing", "Test"];
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const rows = users.map(u => [
    u.email, u.name, u.agency, day(u.createdAt), u.method, planLabel(u), day(u.planUntil), u.paying ? "si" : "no", num(u.mrrEur), num(u.paidEur),
    u.credits ?? "", num(u.aiEur), u.photos, u.videos, u.properties, u.sitePublished ? "si" : "no",
    u.siteSlug ? `https://${SITE_HOST}/${u.siteSlug}` : "", u.leads, u.siteViews, dayTime(u.lastActivity), dayTime(u.lastUse), u.minutes7, u.discounts.join(" "),
    u.marketingConsent == null ? "" : u.marketingConsent ? "si" : "no", u.isTest || u.isAdmin ? "si" : "no",
  ].map(esc).join(";"));
  return "\uFEFF" + [head.join(";"), ...rows].join("\n");
}

export default function AgenteImmoPage({ authKey }: { authKey: string }) {
  const [since, setSince] = useState(DEFAULT_SINCE);
  const [hideTest, setHideTest] = useState(true);
  const [data, setData] = useState<AgenteImmoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/metrics/agenteimmo?since=${encodeURIComponent(s)}`, { headers: { "x-metrics-key": authKey }, cache: "no-store" });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, [authKey]);

  useEffect(() => { load(since); }, [since, load]);

  const visible = useMemo(() => (data?.users ?? []).filter(u => !hideTest || (!u.isTest && !u.isAdmin)), [data, hideTest]);

  const s = useMemo(() => {
    const n = visible.length;
    const paying = visible.filter(u => u.paying);
    const activePlan = visible.filter(u => u.planActive && u.plan !== "none");
    const ai = visible.reduce((t, u) => t + u.aiEur, 0);
    const aiPaying = paying.reduce((t, u) => t + u.aiEur, 0);
    const paid = visible.reduce((t, u) => t + u.paidEur, 0);
    const mrrSignups = paying.reduce((t, u) => t + u.mrrEur, 0);
    return { n, paying: paying.length, activePlan: activePlan.length, ai, aiPaying, paid, mrrSignups };
  }, [visible]);

  const chart = useMemo(() => buckets(visible, data?.since ?? since), [visible, data, since]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? visible.filter(u => `${u.email} ${u.name} ${u.agency} ${u.siteSlug ?? ""}`.toLowerCase().includes(q)) : visible;
    const val = (u: AgenteImmoUser): string | number => {
      switch (sortKey) {
        case "email": return u.email.toLowerCase();
        case "plan": return planLabel(u);
        case "paying": return u.paying ? 1 : 0;
        case "sitePublished": return u.sitePublished ? 1 : 0;
        case "credits": return u.credits ?? -1;
        case "lastActivity": return u.lastActivity ?? "";
        case "lastUse": return u.lastUse ?? "";
        case "createdAt": return u.createdAt;
        default: return u[sortKey];
      }
    };
    return [...list].sort((a, b) => {
      const x = val(a), y = val(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sortDir === "asc" ? c : -c;
    });
  }, [visible, search, sortKey, sortDir]);

  const sortBy = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "email" || k === "plan" ? "asc" : "desc"); }
  };

  const exportCsv = () => {
    const blob = new Blob([csv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agenteimmo-iscritti-dal-${since}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const th = (k: SortKey, label: string, right = false) => (
    <th onClick={() => sortBy(k)} className={`px-3 py-2.5 font-medium cursor-pointer select-none whitespace-nowrap hover:text-gray-300 ${right ? "text-right" : "text-left"}`}>
      {label}<SortIcon active={sortKey === k} dir={sortDir} />
    </th>
  );

  const sinceLabel = day(`${since}T00:00:00`);
  const margin = s.paid - s.ai;

  return (
    <div className="space-y-6">
      {/* intestazione e filtri */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Agente Immo</h1>
          <p className="text-sm text-gray-500 mt-1">Chi si è iscritto da quando GetNearMe è diventato Agente Immo, con costi e dati.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className={`${MONO} flex items-center gap-2 text-xs text-gray-400`}>
            Dal
            <input type="date" value={since} max={new Date().toISOString().slice(0, 10)} onChange={e => e.target.value && setSince(e.target.value)}
              className="bg-[#161920] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-gray-200 [color-scheme:dark]" />
          </label>
          <label className={`${MONO} flex items-center gap-2 text-xs text-gray-400 cursor-pointer`}>
            <input type="checkbox" checked={hideTest} onChange={e => setHideTest(e.target.checked)} className="accent-indigo-500" />
            Nascondi test
          </label>
          <button onClick={() => load(since)} disabled={loading} className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:text-gray-100 disabled:opacity-40" title="Aggiorna">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!data && loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Carico gli iscritti...</div>
      )}

      {data && (
        <>
          {/* riepilogo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card label={`Iscritti dal ${sinceLabel}`} value={fmt(s.n)} sub={hideTest ? "senza admin e account di test" : "tutti, anche test e admin"} />
            <Card label="Paganti (Stripe)" value={fmt(s.paying)} sub={`con piano attivo: ${fmt(s.activePlan)}`} accent="text-emerald-400" />
            <Card label="In prova o gratis" value={fmt(s.n - s.paying)} sub={`conversione ${s.n ? pct((s.paying / s.n) * 100) : "-"}`} />
            <Card label="MRR attuale" value={euro(data.mrr.eur)} sub={`${fmt(data.mrr.customers)} clienti, fonte ${data.mrr.source}; da questi iscritti ${euro(s.mrrSignups)}`} accent="text-indigo-400" />
            <Card label={`Incassato dal ${sinceLabel}`} value={euro(s.paid)} sub={data.stripeOk ? `Stripe totale ${euro(data.totals.chargesEur)}, non collegato ${euro(data.totals.chargesUnmatchedEur)}` : "Stripe non raggiungibile"} />
            <Card label={`Costo AI dal ${sinceLabel}`} value={euro(s.ai)} accent="text-amber-400" />
            <Card label="Costo AI medio" value={s.n ? euro(s.ai / s.n) : "-"} sub={`per iscritto; per pagante ${s.paying ? euro(s.aiPaying / s.paying) : "-"}`} />
            <Card label="Margine" value={euro(margin)} sub="incassato meno costo AI" accent={margin >= 0 ? "text-emerald-400" : "text-red-400"} />
          </div>

          {/* iscritti nel tempo */}
          <div className="bg-[#161920] rounded-xl p-5 border border-white/[0.08]">
            <p className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 mb-4`}>Iscritti per {chart.weekly ? "settimana" : "giorno"}</p>
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(chart.items.length * 28, 320) }}>
                <Bars items={chart.items} />
              </div>
            </div>
          </div>

          {/* tabella iscritti */}
          <div className="bg-[#161920] rounded-xl border border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca email, nome, agenzia"
                  className="bg-[#0d0f14] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 w-72 max-w-full" />
              </div>
              <div className="flex items-center gap-3">
                <span className={`${MONO} text-xs text-gray-500`}>{fmt(rows.length)} iscritti</span>
                <button onClick={exportCsv} className={`${MONO} flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700`}>
                  <Download className="w-3.5 h-3.5" /> Esporta CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${MONO} text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/[0.06]`}>
                  <tr>
                    <th className="w-8" />
                    {th("email", "Iscritto")}
                    {th("createdAt", "Data")}
                    {th("plan", "Piano")}
                    {th("paying", "Pagante")}
                    {th("paidEur", "Incassato", true)}
                    {th("credits", "Crediti", true)}
                    {th("aiEur", "Costo AI", true)}
                    {th("photos", "Foto", true)}
                    {th("videos", "Video", true)}
                    {th("properties", "Immobili", true)}
                    {th("sitePublished", "Sito")}
                    {th("leads", "Richieste", true)}
                    {th("siteViews", "Visite", true)}
                    {th("lastActivity", "Ultima attività")}
                    {th("lastUse", "Ultimo uso")}
                    {th("minutes7", "Minuti 7 gg", true)}
                  </tr>
                </thead>
                <tbody className={MONO}>
                  {rows.map(u => {
                    const open = expanded === u.id;
                    const idle = idlePaying(u);
                    return (
                      <Fragment key={u.id}>
                        <tr onClick={() => setExpanded(open ? null : u.id)} className={`border-b border-white/[0.04] cursor-pointer ${idle ? "bg-amber-500/[0.06] hover:bg-amber-500/10 text-amber-200" : "hover:bg-white/[0.02] text-gray-300"}`}
                          title={idle ? "Pagante senza uso della piattaforma da più di 7 giorni" : undefined}>
                          <td className="pl-3"><ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${open ? "rotate-90" : ""}`} /></td>
                          <td className="px-3 py-2.5 max-w-[260px]">
                            <p className={`truncate ${idle ? "text-amber-300" : "text-gray-100"}`}>{u.email}</p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {[u.name, u.agency].filter(Boolean).join(", ") || "-"} · {u.method}
                              {(u.isTest || u.isAdmin) && <span className="ml-1 text-amber-400">{u.isAdmin ? "admin" : "test"}</span>}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{day(u.createdAt)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{planLabel(u)}</td>
                          <td className="px-3 py-2.5">{u.paying ? <span className="text-emerald-400">sì</span> : <span className="text-gray-600">no</span>}</td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap">{u.paidEur ? euro(u.paidEur) : "-"}</td>
                          <td className="px-3 py-2.5 text-right">{u.credits == null ? "-" : fmt(u.credits)}</td>
                          <td className="px-3 py-2.5 text-right whitespace-nowrap" title={Object.entries(u.aiByCategory).map(([k, v]) => `${k}: ${euro(v)}`).join("\n")}>{euro(u.aiEur)}</td>
                          <td className="px-3 py-2.5 text-right">{fmt(u.photos)}</td>
                          <td className="px-3 py-2.5 text-right">{fmt(u.videos)}</td>
                          <td className="px-3 py-2.5 text-right">{fmt(u.properties)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {u.siteSlug && u.sitePublished ? (
                              <a href={`https://${SITE_HOST}/${u.siteSlug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-indigo-400 hover:underline inline-flex items-center gap-1">
                                /{u.siteSlug}<ExternalLink className="w-3 h-3" />
                              </a>
                            ) : <span className="text-gray-600">{u.siteSlug ? "bozza" : "no"}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right">{fmt(u.leads)}</td>
                          <td className="px-3 py-2.5 text-right">{fmt(u.siteViews)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap">{dayTime(u.lastActivity)}</td>
                          <td className={`px-3 py-2.5 whitespace-nowrap ${idle ? "text-amber-400 font-semibold" : ""}`}>{dayTime(u.lastUse)}</td>
                          <td className="px-3 py-2.5 text-right">{u.minutes7 ? fmt(u.minutes7) : <span className="text-gray-600">0</span>}</td>
                        </tr>
                        {open && (
                          <tr className="bg-white/[0.015] border-b border-white/[0.04]">
                            <td />
                            <td colSpan={16} className="px-3 py-4">
                              {/* resta nella parte visibile anche se la tabella scorre in orizzontale */}
                              <div className="sticky left-3 grid max-w-[calc(100vw-80px)] md:max-w-[min(1040px,calc(100vw-330px))] gap-6 md:grid-cols-3 text-xs">
                                <dl className="space-y-1.5 text-gray-400">
                                  <Row k="Nome" v={u.name || "-"} />
                                  <Row k="Agenzia" v={u.agency || "-"} />
                                  <Row k="Metodo" v={u.method} />
                                  <Row k="Iscritto" v={dayTime(u.createdAt)} />
                                  <Row k="Ultimo accesso" v={dayTime(u.lastSignIn)} />
                                  <Row k="Consenso marketing" v={u.marketingConsent == null ? "-" : u.marketingConsent ? "sì" : "no"} />
                                  <Row k="ID" v={u.id} />
                                </dl>
                                <dl className="space-y-1.5 text-gray-400">
                                  <Row k="Piano" v={planLabel(u)} />
                                  <Row k="Fino al" v={day(u.planUntil)} />
                                  <Row k="Canone mensile" v={u.mrrEur ? euro(u.mrrEur) : "-"} />
                                  <Row k="Incassato" v={euro(u.paidEur)} />
                                  <Row k="Codice sconto" v={u.discounts.join(", ") || "-"} />
                                  <Row k="Crediti di benvenuto" v={u.welcomeCredits ? "sì" : "no"} />
                                  <Row k="Margine" v={euro(u.paidEur - u.aiEur)} />
                                </dl>
                                <div>
                                  <p className="text-gray-500 uppercase tracking-wider text-[10px] mb-2">Costo AI per tipo</p>
                                  {u.aiByKind.length === 0 ? <p className="text-gray-600">nessun costo</p> : (
                                    <table className="w-full">
                                      <tbody>
                                        {Object.entries(u.aiByCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                                          <tr key={k} className="text-gray-200"><td className="py-0.5">{k}</td><td /><td className="text-right">{euro(v)}</td></tr>
                                        ))}
                                        <tr><td colSpan={3} className="pt-2" /></tr>
                                        {u.aiByKind.map(k => (
                                          <tr key={k.kind} className="text-gray-500"><td className="py-0.5">{k.kind}</td><td className="text-right pr-3">{k.n}×</td><td className="text-right">{euro(k.eur, 3)}</td></tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </div>
                              {/* cronologia completa: caricata solo ora che la riga e' aperta */}
                              <div className="sticky left-3 mt-6 pt-4 border-t border-white/[0.06] max-w-[calc(100vw-80px)] md:max-w-[min(1040px,calc(100vw-330px))]">
                                <UserActivity userId={u.id} authKey={authKey} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan={17} className="px-3 py-10 text-center text-gray-600">Nessun iscritto</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className={`${MONO} text-[11px] text-gray-600`}>
            Costi AI da ai_usage (USD × {data.usdEur}). Foto e video dai movimenti crediti. Pagante = abbonamento Stripe attivo. Ultimo uso e minuti dalle sessioni sulla piattaforma (dal 05/10/2026); in ambra i paganti senza uso da più di 7 giorni. Aggiornato {dayTime(data.fetchedAt)}.
          </p>
        </>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-gray-200 text-right break-all">{v}</dd>
    </div>
  );
}

// barre in pixel (l'altezza in % non funziona dentro colonne flex senza altezza)
function Bars({ items }: { items: { label: string; value: number }[] }) {
  const top = Math.max(1, ...items.map(i => i.value));
  const H = 140;
  return (
    <div className="flex items-end gap-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1">
          <span className={`${MONO} text-[10px] text-gray-400 h-3`}>{it.value || ""}</span>
          <div className="w-full flex items-end" style={{ height: H }}>
            <div className="w-full rounded-t-md bg-indigo-500" style={{ height: it.value ? Math.max(4, (it.value / top) * H) : 2, opacity: it.value ? 1 : 0.15 }} />
          </div>
          <span className={`${MONO} text-[9px] text-gray-500 truncate w-full text-center`}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
