"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Cpu, Loader2, RefreshCw, Wallet, Zap } from "lucide-react";
import { MONO } from "../types";

// Costi AI in tempo reale: RunPod (credito, spesa/ora, worker) + ai_usage per agente.
// Aggiornamento automatico ogni 10 s.

type Health = { jobs: { inQueue: number; inProgress: number; completed: number; failed: number }; workers: { idle: number; running: number; initializing: number; ready: number; throttled: number; unhealthy: number } } | null;
type Endpoint = { id: string; name: string; gpuIds: string; workersMin: number; workersMax: number; idleTimeout: number; health: Health };
type Data = {
  runpod: { balance: number; spendPerHr: number; spendLimit: number; endpoints: Endpoint[] } | null;
  usage: {
    monthTotal: number; calls: number;
    byUser: { id: string; email: string; calls: number; cost: number }[];
    byDay: { day: string; cost: number }[];
    byKind: { kind: string; calls: number; cost: number }[];
    recent: { email: string; kind: string; provider: string; cost_usd: number; duration_ms: number; ok: boolean; created_at: string }[];
  };
  fetchedAt: string;
};

const usd = (n: number, d = 2) => `$${(Number(n) || 0).toFixed(d)}`;
const card = "bg-[#161920] rounded-xl border border-white/10 p-5";

export default function RunpodPage({ authKey }: { authKey: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/metrics/runpod", { headers: { "x-metrics-key": authKey }, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (alive) { setData(d); setError(null); }
      } catch (e) {
        if (alive) setError(String(e));
      }
    };
    load();
    const t = setInterval(load, 10_000);
    return () => { alive = false; clearInterval(t); };
  }, [authKey]);

  if (!data) return <div className="flex items-center gap-2 text-gray-500">{error ? <span className="text-red-400">{error}</span> : <><Loader2 className="w-4 h-4 animate-spin" /> Carico...</>}</div>;

  const rp = data.runpod;
  const alwaysOn = rp?.endpoints.filter((e) => e.workersMin > 0) ?? [];
  const maxDay = Math.max(0.0001, ...data.usage.byDay.map((d) => d.cost));

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-2 ${MONO} text-xs text-gray-500`}>
        <RefreshCw className="w-3 h-3" /> Aggiornato {new Date(data.fetchedAt).toLocaleTimeString("it-IT")} · ogni 10 s {error && <span className="text-red-400">· errore ultimo aggiornamento</span>}
      </div>

      {!rp && <div className={`${card} text-amber-400 text-sm`}>RUNPOD_API_KEY non configurata o RunPod non raggiungibile.</div>}

      {rp && (
        <>
          {alwaysOn.map((e) => (
            <div key={e.id} className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div><b>{e.name}</b> ha <b>{e.workersMin} worker minimi sempre accesi</b>: paghi la GPU anche senza richieste. Portalo a 0 salvo motivi precisi.</div>
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-4">
            <Kpi icon={Wallet} label="Credito RunPod" value={usd(rp.balance)} warn={rp.balance < 5} />
            <Kpi icon={Zap} label="Spesa adesso" value={`${usd(rp.spendPerHr)}/h`} sub={`≈ ${usd(rp.spendPerHr * 24 * 30, 0)}/mese a questo ritmo`} warn={rp.spendPerHr > 0} />
            <Kpi icon={Wallet} label="Limite di spesa" value={`${usd(rp.spendLimit, 0)}/h`} />
            <Kpi icon={Cpu} label="Costo AI stimato (mese)" value={usd(data.usage.monthTotal, 3)} sub={`${data.usage.calls} chiamate`} />
          </div>

          <div className={card}>
            <h3 className="text-sm font-semibold text-gray-200">Endpoint</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${MONO} text-xs text-gray-500`}>
                  <tr className="text-left"><th className="py-2">Nome</th><th>GPU</th><th>Min/Max</th><th>Idle</th><th>Accesi</th><th>In lavoro</th><th>In avvio</th><th>Coda</th><th>Falliti</th></tr>
                </thead>
                <tbody className="text-gray-300">
                  {rp.endpoints.map((e) => {
                    const w = e.health?.workers; const j = e.health?.jobs;
                    const on = w ? w.idle + w.running + w.initializing : 0;
                    return (
                      <tr key={e.id} className="border-t border-white/5">
                        <td className="py-2">{e.name}<div className={`${MONO} text-[10px] text-gray-600`}>{e.id}</div></td>
                        <td className={`${MONO} text-xs`}>{e.gpuIds}</td>
                        <td className={e.workersMin > 0 ? "text-red-400" : ""}>{e.workersMin}/{e.workersMax}</td>
                        <td>{e.idleTimeout}s</td>
                        <td className={on > 0 ? "text-amber-400" : "text-gray-500"}>{w ? on : "?"}</td>
                        <td>{w?.running ?? "?"}</td>
                        <td>{w?.initializing ?? "?"}</td>
                        <td>{j?.inQueue ?? "?"}</td>
                        <td className={j?.failed ? "text-red-400" : ""}>{j?.failed ?? "?"}</td>
                      </tr>
                    );
                  })}
                  {!rp.endpoints.length && <tr><td colSpan={9} className="py-3 text-gray-500">Nessun endpoint.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h3 className="text-sm font-semibold text-gray-200">Costo per agente (mese)</h3>
          <table className="mt-3 w-full text-sm text-gray-300">
            <tbody>
              {data.usage.byUser.map((u) => (
                <tr key={u.id} className="border-t border-white/5"><td className="py-2 truncate">{u.email}</td><td className="text-right text-gray-500">{u.calls} chiamate</td><td className={`${MONO} text-right`}>{usd(u.cost, 4)}</td></tr>
              ))}
              {!data.usage.byUser.length && <tr><td className="py-3 text-gray-500">Nessuna chiamata AI questo mese.</td></tr>}
            </tbody>
          </table>
          {!!data.usage.byKind.length && (
            <div className={`mt-4 flex flex-wrap gap-2 ${MONO} text-xs text-gray-400`}>
              {data.usage.byKind.map((k) => <span key={k.kind} className="rounded bg-white/5 px-2 py-1">{k.kind}: {k.calls} · {usd(k.cost, 4)}</span>)}
            </div>
          )}
        </div>

        <div className={card}>
          <h3 className="text-sm font-semibold text-gray-200">Costo per giorno (mese)</h3>
          <div className="mt-4 flex h-32 items-end gap-1">
            {data.usage.byDay.map((d) => (
              <div key={d.day} title={`${d.day}: ${usd(d.cost, 4)}`} className="flex-1 rounded-t bg-indigo-500/70" style={{ height: `${Math.max(2, (d.cost / maxDay) * 100)}%` }} />
            ))}
            {!data.usage.byDay.length && <div className="text-sm text-gray-500">Nessun dato.</div>}
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-sm font-semibold text-gray-200">Ultime chiamate AI</h3>
        <table className="mt-3 w-full text-sm text-gray-300">
          <tbody>
            {data.usage.recent.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className={`${MONO} py-2 text-xs text-gray-500`}>{new Date(r.created_at).toLocaleString("it-IT")}</td>
                <td className="truncate">{r.email}</td><td>{r.kind}</td><td className="text-gray-500">{r.provider}</td>
                <td className="text-right">{(r.duration_ms / 1000).toFixed(1)}s</td>
                <td className={`${MONO} text-right ${r.ok ? "" : "text-red-400"}`}>{usd(r.cost_usd, 4)}</td>
              </tr>
            ))}
            {!data.usage.recent.length && <tr><td className="py-3 text-gray-500">Nessuna chiamata.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, warn }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-xs text-gray-500"><Icon className="w-4 h-4" /> {label}</div>
      <div className={`mt-2 ${MONO} text-2xl ${warn ? "text-amber-400" : "text-gray-100"}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
