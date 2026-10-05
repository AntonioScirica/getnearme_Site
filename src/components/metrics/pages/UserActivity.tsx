"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Play, X, ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { MONO, fmt } from "../types";
import type { ActEvent, ActivityResponse, ActCat } from "@/lib/userActivity";
import { duration } from "@/lib/platformSessions";

// Cronologia di un iscritto (riga espansa della pagina Agente Immo): si carica solo quando la riga si apre.
type Filter = "tutto" | "sessioni" | "foto" | "video" | "crediti" | "pagamenti" | "immobili";
const FILTERS: { id: Filter; label: string; test: (e: ActEvent) => boolean }[] = [
  { id: "tutto", label: "Tutto", test: () => true },
  { id: "sessioni", label: "Sessioni", test: e => e.cat === "sessione" },
  { id: "foto", label: "Foto", test: e => e.cat === "foto" },
  { id: "video", label: "Video", test: e => e.cat === "video" || e.cat === "casa3d" },
  { id: "crediti", label: "Crediti", test: e => e.credits !== undefined },
  { id: "pagamenti", label: "Pagamenti", test: e => e.cat === "pagamento" },
  { id: "immobili", label: "Immobili", test: e => e.cat === "immobile" || e.cat === "richiesta" || e.cat === "sito" },
];
const CAT: Record<ActCat, { label: string; cls: string }> = {
  sessione: { label: "sessione", cls: "text-cyan-300 bg-cyan-500/10" },
  account: { label: "account", cls: "text-gray-400 bg-white/[0.05]" },
  foto: { label: "foto", cls: "text-sky-300 bg-sky-500/10" },
  video: { label: "video", cls: "text-fuchsia-300 bg-fuchsia-500/10" },
  casa3d: { label: "casa 3D", cls: "text-teal-300 bg-teal-500/10" },
  crediti: { label: "crediti", cls: "text-amber-300 bg-amber-500/10" },
  pagamento: { label: "stripe", cls: "text-emerald-300 bg-emerald-500/10" },
  immobile: { label: "immobile", cls: "text-indigo-300 bg-indigo-500/10" },
  richiesta: { label: "richiesta", cls: "text-pink-300 bg-pink-500/10" },
  sito: { label: "sito", cls: "text-indigo-300 bg-indigo-500/10" },
  ai: { label: "AI", cls: "text-gray-400 bg-white/[0.04]" },
};

const euro = (n: number, d = 3) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d });
const thumb = (u: string, w = 160) => `/api/thumb?w=${w}&u=${encodeURIComponent(u)}`;
const time = (iso: string) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

type Open = { kind: "image" | "video"; url: string; poster?: string; label?: string } | null;

export default function UserActivity({ userId, authKey }: { userId: string; authKey: string }) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("tutto");
  const [open, setOpen] = useState<Open>(null);

  const load = useCallback(async (fresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/metrics/agenteimmo/user?id=${encodeURIComponent(userId)}${fresh ? "&fresh=1" : ""}`, { headers: { "x-metrics-key": authKey }, cache: "no-store" });
      if (!r.ok) throw new Error(`Errore ${r.status}`);
      setData(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, [userId, authKey]);
  useEffect(() => { load(false); }, [load]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, data?.events.filter(f.test).length ?? 0])), [data]);
  const days = useMemo(() => {
    const test = FILTERS.find(f => f.id === filter)!.test;
    const out: { key: string; label: string; items: ActEvent[]; ai: number; credits: number }[] = [];
    for (const e of data?.events ?? []) {
      if (!test(e)) continue;
      const k = dayKey(e.at);
      let d = out[out.length - 1];
      if (!d || d.key !== k) { d = { key: k, label: dayLabel(e.at), items: [], ai: 0, credits: 0 }; out.push(d); }
      d.items.push(e);
      d.ai += e.aiEur ?? 0;
      if ((e.credits ?? 0) < 0) d.credits += -(e.credits ?? 0);
    }
    return out;
  }, [data, filter]);

  if (!data) {
    return (
      <div className={`${MONO} text-xs text-gray-500 flex items-center gap-2 py-3`}>
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Carico ogni movimento (sessioni, foto, video, crediti, Stripe)...</> : <span className="text-red-400">{error ?? "Nessun dato"}</span>}
      </div>
    );
  }
  const t = data.totals;
  const u = data.usage ?? { d7: 0, d30: 0, total: 0, sessions: 0, avg: 0 };

  return (
    <div className="space-y-4">
      {/* totali */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`${MONO} text-gray-500 uppercase tracking-wider text-[10px]`}>Attività, ogni movimento</p>
        <button onClick={() => load(true)} disabled={loading} className={`${MONO} flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-200 disabled:opacity-40`}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> aggiorna
        </button>
      </div>
      {/* tempo sulla piattaforma (platform_sessions, dal 05/10/2026) */}
      <p className={`${MONO} text-gray-500 uppercase tracking-wider text-[10px] -mb-2`}>Tempo sulla piattaforma</p>
      <div className={`${MONO} grid grid-cols-2 md:grid-cols-5 gap-2 text-xs`}>
        <Stat k="Tempo ultimi 7 giorni" v={u.d7 ? duration(u.d7) : "-"} accent="text-cyan-300" />
        <Stat k="Tempo ultimi 30 giorni" v={u.d30 ? duration(u.d30) : "-"} />
        <Stat k="Tempo totale" v={u.total ? duration(u.total) : "-"} sub="dal 05/10/2026" />
        <Stat k="Sessioni" v={fmt(u.sessions)} />
        <Stat k="Media per sessione" v={u.avg ? duration(u.avg) : "-"} sub="tempo attivo, senza pause" />
      </div>
      <div className={`${MONO} grid grid-cols-2 md:grid-cols-5 gap-2 text-xs`}>
        <Stat k="Foto" v={fmt(t.photos)} sub={t.previews ? `+ ${t.previews} anteprime per video` : undefined} />
        <Stat k="Video" v={fmt(t.videos)} sub={t.casa3d ? `+ ${t.casa3d} case 3D` : undefined} />
        <Stat k="Costo AI totale" v={euro(t.aiEur, 2)} accent="text-amber-400" />
        <Stat k="Crediti usati" v={fmt(t.creditsUsed)} sub={`ricevuti ${fmt(t.creditsAdded)}`} />
        <Stat k="Chat salvate" v={fmt(t.chats)} sub="ultime 50, 30 giorni" />
      </div>
      {Object.keys(t.videosByTemplate).length > 0 && (
        <div className={`${MONO} flex flex-wrap gap-1.5 text-[11px]`}>
          {Object.entries(t.videosByTemplate).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
            <span key={k} className="px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-300">{k} <span className="text-gray-400">×{n}</span></span>
          ))}
        </div>
      )}

      {/* filtri */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`${MONO} px-2.5 py-1 rounded-lg text-[11px] border ${filter === f.id ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-gray-200"}`}>
            {f.label} <span className="opacity-60">{counts[f.id]}</span>
          </button>
        ))}
        {!data.stripeOk && <span className={`${MONO} text-[11px] text-amber-400 self-center`}>Stripe non raggiungibile</span>}
      </div>

      {/* cronologia per giorno */}
      <div className="space-y-4">
        {days.length === 0 && <p className={`${MONO} text-xs text-gray-600`}>Nessun movimento in questa vista</p>}
        {days.map(d => (
          <div key={d.key}>
            <div className={`${MONO} flex items-baseline justify-between gap-3 border-b border-white/[0.06] pb-1 mb-1 text-[11px]`}>
              <span className="text-gray-300 capitalize">{d.label}</span>
              <span className="text-gray-500">{d.items.length} eventi{d.ai ? ` · AI ${euro(d.ai, 2)}` : ""}{d.credits ? ` · ${fmt(d.credits)} crediti` : ""}</span>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {d.items.map(e => <Row key={e.id} e={e} onOpen={setOpen} />)}
            </div>
          </div>
        ))}
      </div>

      <details className={`${MONO} text-[11px] text-gray-500`}>
        <summary className="cursor-pointer hover:text-gray-300">Dati che non esistono</summary>
        <ul className="mt-1.5 space-y-0.5 list-disc pl-5">{data.missing.map(m => <li key={m}>{m}</li>)}</ul>
      </details>

      {open && <Viewer open={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Stat({ k, v, sub, accent }: { k: string; v: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0d0f14] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{k}</p>
      <p className={`text-base font-semibold ${accent ?? "text-gray-100"}`}>{v}</p>
      {sub && <p className="text-[10px] text-gray-500">{sub}</p>}
    </div>
  );
}

function Row({ e, onOpen }: { e: ActEvent; onOpen: (o: Open) => void }) {
  const c = CAT[e.cat];
  const media = e.before || e.after || e.video || e.poster || (e.frames?.length ?? 0) > 0;
  return (
    <div className="grid grid-cols-[44px_64px_1fr] md:grid-cols-[44px_64px_minmax(0,1fr)_auto_140px] gap-x-3 gap-y-2 py-2 items-start text-xs">
      <span className={`${MONO} text-gray-500 pt-0.5`}>{time(e.at)}</span>
      <span className={`${MONO} text-[10px] px-1.5 py-0.5 rounded text-center ${c.cls}`}>{c.label}</span>
      <div className="min-w-0 space-y-1">
        <p className="text-gray-100">{e.title}</p>
        {!!e.tags?.length && (
          <div className="flex flex-wrap gap-1">
            {e.tags.filter(Boolean).map(t => <span key={t} className={`${MONO} text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-300`}>{t}</span>)}
          </div>
        )}
        {e.prompt && <p className="text-gray-300 italic break-words">&ldquo;{e.prompt}&rdquo;</p>}
        {e.lines?.map(l => <p key={l} className="text-gray-500 break-words">{l}</p>)}
        {e.link && (
          <a href={e.link.href} target="_blank" rel="noopener noreferrer" className={`${MONO} inline-flex items-center gap-1 text-indigo-400 hover:underline text-[11px]`}>
            {e.link.label}<ExternalLink className="w-3 h-3" />
          </a>
        )}
        {e.warn && <p className="text-amber-400/90 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" />{e.warn}</p>}
        {e.ai && e.ai.length > 1 && (
          <details className={`${MONO} text-[10px] text-gray-500`}>
            <summary className="cursor-pointer hover:text-gray-300">{e.ai.length} chiamate AI</summary>
            <table className="mt-1"><tbody>
              {e.ai.map((a, i) => <tr key={i}><td className="pr-3">{time(a.at)}</td><td className="pr-3">{a.kind}</td><td className="pr-3">{a.model}</td><td className="text-right">{euro(a.eur)}</td></tr>)}
            </tbody></table>
          </details>
        )}
        {e.ai?.length === 1 && <p className={`${MONO} text-[10px] text-gray-600`}>{e.ai[0].kind} · {e.ai[0].model}</p>}
        {media && <div className="md:hidden"><Media e={e} onOpen={onOpen} /></div>}
      </div>
      <div className="hidden md:block">{media && <Media e={e} onOpen={onOpen} />}</div>
      <div className={`${MONO} col-span-3 md:col-span-1 text-right space-y-0.5`}>
        {e.aiEur !== undefined && <p className="text-amber-400">{euro(e.aiEur)}</p>}
        {e.credits !== undefined && (
          <p className={e.credits < 0 ? "text-red-300" : e.credits > 0 ? "text-emerald-300" : "text-gray-500"}>{e.credits > 0 ? "+" : ""}{fmt(e.credits)} crediti</p>
        )}
        {e.balance != null && <p className="text-[10px] text-gray-500">saldo {fmt(e.balance)}</p>}
        {e.creditReasons && e.creditReasons.length > 1 && <p className="text-[10px] text-gray-600">{e.creditReasons.join(", ")}</p>}
      </div>
    </div>
  );
}

function Thumb({ url, label, video, poster, onOpen, big }: { url: string; label?: string; video?: boolean; poster?: string; onOpen: (o: Open) => void; big?: boolean }) {
  const img = video ? poster : url;
  const size = big ? "w-[120px] h-[80px]" : "w-[52px] h-[40px]";
  return (
    <button onClick={ev => { ev.stopPropagation(); onOpen({ kind: video ? "video" : "image", url, poster, label }); }} title={label}
      className={`relative ${size} rounded-md overflow-hidden bg-[#0d0f14] border border-white/10 hover:border-indigo-400 shrink-0`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb(img, 160)} alt={label ?? ""} loading="lazy" className="w-full h-full object-cover" />
      ) : null}
      {video && <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-black/60 p-1"><Play className="w-3 h-3 text-white fill-white" /></span></span>}
      {label && big && <span className={`${MONO} absolute left-0 bottom-0 text-[9px] px-1 bg-black/60 text-gray-200`}>{label}</span>}
    </button>
  );
}

function Media({ e, onOpen }: { e: ActEvent; onOpen: (o: Open) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {e.video ? <Thumb url={e.video} video poster={e.poster} label="video" onOpen={onOpen} big />
          : <>
            {e.before && <Thumb url={e.before} label="prima" onOpen={onOpen} big />}
            {e.after && <Thumb url={e.after} label={e.before ? "dopo" : undefined} onOpen={onOpen} big />}
            {!e.before && !e.after && e.poster && <Thumb url={e.poster} label="copertina" onOpen={onOpen} big />}
          </>}
      </div>
      {!!e.frames?.length && (
        <div className="flex flex-wrap gap-1 max-w-[260px]">
          {e.frames.map(f => <Thumb key={f.url} url={f.url} label={f.label} video={f.video} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function Viewer({ open, onClose }: { open: NonNullable<Open>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-gray-200 hover:bg-white/20" aria-label="Chiudi"><X className="w-5 h-5" /></button>
      <div className="max-w-[92vw] max-h-[88vh] flex flex-col items-center gap-2" onClick={e => e.stopPropagation()}>
        {open.kind === "video" ? (
          <video src={open.url} poster={open.poster} controls autoPlay preload="none" className="max-w-[92vw] max-h-[82vh] rounded-lg bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={open.url} alt={open.label ?? ""} className="max-w-[92vw] max-h-[82vh] rounded-lg object-contain" />
        )}
        <a href={open.url} target="_blank" rel="noopener noreferrer" className={`${MONO} text-[11px] text-indigo-300 hover:underline inline-flex items-center gap-1`}>
          {open.label ? `${open.label} · ` : ""}apri l’originale<ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
