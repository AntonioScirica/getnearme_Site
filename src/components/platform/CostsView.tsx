'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Cpu, Loader2, RefreshCw, Wallet, Zap } from 'lucide-react';
import { authFetch } from './api';

// Costi AI in tempo reale (solo admin): RunPod (credito, spesa/ora, worker) + ai_usage
// per agente. Dati da /api/platform/costs (lib/aiCosts), refresh ogni 10 s.

type Health = { jobs: { inQueue: number; inProgress: number; completed: number; failed: number }; workers: { idle: number; running: number; initializing: number; ready: number } } | null;
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
const card = 'card p-5';

export default function CostsView() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await authFetch('/api/platform/costs', { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status === 403 ? 'Solo per admin.' : `Errore ${res.status}`);
        const d = await res.json();
        if (alive) { setData(d); setError(null); }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    load();
    const t = setInterval(load, 10_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!data) return error ? <p className="text-sm text-red-600">{error}</p> : <Loader2 className="animate-spin text-muted" />;

  const rp = data.runpod;
  const alwaysOn = rp?.endpoints.filter(e => e.workersMin > 0) ?? [];
  const maxDay = Math.max(0.0001, ...data.usage.byDay.map(d => d.cost));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Costi AI</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted"><RefreshCw size={12} /> Aggiornato {new Date(data.fetchedAt).toLocaleTimeString('it-IT')} · ogni 10 s{error && <span className="text-red-600"> · ultimo aggiornamento fallito</span>}</span>
      </div>

      {!rp && <div className={`${card} text-sm text-amber-700`}>RunPod non raggiungibile o RUNPOD_API_KEY mancante.</div>}

      {rp && (
        <>
          {alwaysOn.map(e => (
            <div key={e.id} className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
              <AlertTriangle size={18} className="shrink-0" />
              <div><b>{e.name}</b> ha <b>{e.workersMin} worker sempre accesi</b>: paghi la GPU anche senza richieste.</div>
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-4">
            <Kpi icon={Wallet} label="Credito RunPod" value={usd(rp.balance)} warn={rp.balance < 5} />
            <Kpi icon={Zap} label="Spesa adesso" value={`${usd(rp.spendPerHr)}/h`} sub={`≈ ${usd(rp.spendPerHr * 24 * 30, 0)}/mese a questo ritmo`} warn={rp.spendPerHr > 0} />
            <Kpi icon={Wallet} label="Limite di spesa" value={`${usd(rp.spendLimit, 0)}/h`} />
            <Kpi icon={Cpu} label="Costo AI stimato, mese" value={usd(data.usage.monthTotal, 3)} sub={`${data.usage.calls} chiamate`} />
          </div>

          <div className={card}>
            <h2 className="font-display text-lg font-semibold">Endpoint RunPod</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted">
                  <tr className="text-left"><th className="py-2 font-medium">Nome</th><th className="font-medium">GPU</th><th className="font-medium">Min/Max</th><th className="font-medium">Idle</th><th className="font-medium">Accesi</th><th className="font-medium">In lavoro</th><th className="font-medium">In avvio</th><th className="font-medium">Coda</th><th className="font-medium">Falliti</th></tr>
                </thead>
                <tbody>
                  {rp.endpoints.map(e => {
                    const w = e.health?.workers; const j = e.health?.jobs;
                    const on = w ? w.idle + w.running + w.initializing : 0;
                    return (
                      <tr key={e.id} className="border-t border-line">
                        <td className="py-2.5 font-medium">{e.name}<div className="text-xs font-normal text-muted">{e.id}</div></td>
                        <td className="text-xs">{e.gpuIds}</td>
                        <td className={e.workersMin > 0 ? 'font-semibold text-red-600' : ''}>{e.workersMin}/{e.workersMax}</td>
                        <td>{e.idleTimeout}s</td>
                        <td className={on > 0 ? 'font-semibold text-amber-600' : 'text-muted'}>{w ? on : '?'}</td>
                        <td>{w?.running ?? '?'}</td>
                        <td>{w?.initializing ?? '?'}</td>
                        <td>{j?.inQueue ?? '?'}</td>
                        <td className={j?.failed ? 'text-red-600' : ''}>{j?.failed ?? '?'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <h2 className="font-display text-lg font-semibold">Costo per agente, mese</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {data.usage.byUser.map(u => (
                <tr key={u.id} className="border-t border-line"><td className="py-2 truncate">{u.email}</td><td className="text-right text-muted">{u.calls} chiamate</td><td className="text-right font-medium">{usd(u.cost, 4)}</td></tr>
              ))}
              {!data.usage.byUser.length && <tr><td className="py-3 text-muted">Nessuna chiamata AI questo mese.</td></tr>}
            </tbody>
          </table>
          {!!data.usage.byKind.length && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
              {data.usage.byKind.map(k => <span key={k.kind} className="rounded-full bg-canvas px-3 py-1">{k.kind}: {k.calls} · {usd(k.cost, 4)}</span>)}
            </div>
          )}
        </div>
        <div className={card}>
          <h2 className="font-display text-lg font-semibold">Costo per giorno, mese</h2>
          <div className="mt-4 flex h-32 items-end gap-1">
            {data.usage.byDay.map(d => (
              <div key={d.day} title={`${d.day}: ${usd(d.cost, 4)}`} className="flex-1 rounded-t bg-ai/70" style={{ height: `${Math.max(2, (d.cost / maxDay) * 100)}%` }} />
            ))}
            {!data.usage.byDay.length && <p className="text-sm text-muted">Nessun dato.</p>}
          </div>
        </div>
      </div>

      <div className={card}>
        <h2 className="font-display text-lg font-semibold">Ultime chiamate AI</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {data.usage.recent.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-2 text-xs text-muted">{new Date(r.created_at).toLocaleString('it-IT')}</td>
                <td className="truncate">{r.email}</td><td>{r.kind}</td><td className="text-muted">{r.provider}</td>
                <td className="text-right">{(r.duration_ms / 1000).toFixed(1)}s</td>
                <td className={`text-right font-medium ${r.ok ? '' : 'text-red-600'}`}>{usd(r.cost_usd, 4)}</td>
              </tr>
            ))}
            {!data.usage.recent.length && <tr><td className="py-3 text-muted">Nessuna chiamata.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, warn }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-xs text-muted"><Icon size={14} /> {label}</div>
      <div className={`mt-2 font-display text-2xl font-bold ${warn ? 'text-amber-600' : ''}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}
