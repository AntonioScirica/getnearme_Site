'use client';

import { useEffect, useState } from 'react';
import { Cpu, Loader2, RefreshCw } from 'lucide-react';
import { authFetch } from './api';

// Costi AI in tempo reale (solo admin): ai_usage per agente. Dati da /api/platform/costs (lib/aiCosts), refresh ogni 10 s.

type Data = {
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

  const maxDay = Math.max(0.0001, ...data.usage.byDay.map(d => d.cost));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Costi AI</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted"><RefreshCw size={12} /> Aggiornato {new Date(data.fetchedAt).toLocaleTimeString('it-IT')} · ogni 10 s{error && <span className="text-red-600"> · ultimo aggiornamento fallito</span>}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi icon={Cpu} label="Costo AI stimato, mese" value={usd(data.usage.monthTotal, 3)} sub={`${data.usage.calls} chiamate`} />
      </div>

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
              {data.usage.byKind.map(k => <span key={k.kind} className="rounded-full bg-canvas px-3 py-1 ring-1 ring-inset ring-black/10">{k.kind}: {k.calls} · {usd(k.cost, 4)}</span>)}
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
