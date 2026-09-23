import { createClient } from "@supabase/supabase-js";

// Costi AI in tempo reale (pagina "Costi AI" della piattaforma, solo admin):
// - RunPod: credito, spesa/ora attuale, limite, stato worker e coda di ogni endpoint
// - ai_usage: costo stimato per agente e per giorno (mese corrente) + ultime chiamate
const RUNPOD_KEY = process.env.RUNPOD_API_KEY;

async function runpodAccount() {
  const res = await fetch("https://api.runpod.io/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RUNPOD_KEY}` },
    body: JSON.stringify({ query: "query { myself { clientBalance currentSpendPerHr spendLimit endpoints { id name gpuIds workersMin workersMax idleTimeout } } }" }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json();
  return json?.data?.myself ?? null;
}

async function endpointHealth(id: string) {
  try {
    const res = await fetch(`https://api.runpod.ai/v2/${id}/health`, {
      headers: { Authorization: `Bearer ${RUNPOD_KEY}` }, cache: "no-store", signal: AbortSignal.timeout(8_000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function getAiCosts() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

  const [account, usageRes] = await Promise.all([
    RUNPOD_KEY ? runpodAccount().catch(() => null) : Promise.resolve(null),
    admin.from("ai_usage").select("user_id, kind, provider, cost_usd, duration_ms, ok, created_at")
      .gte("created_at", monthStart).order("created_at", { ascending: false }).limit(5000),
  ]);

  const endpoints = await Promise.all(
    ((account?.endpoints ?? []) as { id: string }[]).map(async (e) => ({ ...e, health: await endpointHealth(e.id) })),
  );

  // Aggregati ai_usage del mese
  const rows = (usageRes.data ?? []) as { user_id: string | null; kind: string; provider: string; cost_usd: number; duration_ms: number; ok: boolean; created_at: string }[];
  const byUser = new Map<string, { calls: number; cost: number }>();
  const byDay = new Map<string, number>();
  const byKind = new Map<string, { calls: number; cost: number }>();
  for (const r of rows) {
    const c = Number(r.cost_usd) || 0;
    const u = byUser.get(r.user_id ?? "?") ?? { calls: 0, cost: 0 };
    byUser.set(r.user_id ?? "?", { calls: u.calls + 1, cost: u.cost + c });
    const d = r.created_at.slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + c);
    const k = byKind.get(r.kind) ?? { calls: 0, cost: 0 };
    byKind.set(r.kind, { calls: k.calls + 1, cost: k.cost + c });
  }

  // Email degli agenti (solo quelli presenti nel mese)
  const ids = [...byUser.keys()].filter((x) => x !== "?");
  const emails = new Map<string, string>();
  await Promise.all(ids.slice(0, 100).map(async (id) => {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data?.user?.email) emails.set(id, data.user.email);
  }));

  return {
    runpod: account ? {
      balance: account.clientBalance,
      spendPerHr: account.currentSpendPerHr,
      spendLimit: account.spendLimit,
      endpoints,
    } : null,
    usage: {
      monthTotal: rows.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0),
      calls: rows.length,
      byUser: [...byUser.entries()].map(([id, v]) => ({ id, email: emails.get(id) ?? id, ...v })).sort((a, b) => b.cost - a.cost),
      byDay: [...byDay.entries()].map(([day, cost]) => ({ day, cost })).sort((a, b) => a.day.localeCompare(b.day)),
      byKind: [...byKind.entries()].map(([kind, v]) => ({ kind, ...v })),
      recent: rows.slice(0, 20).map((r) => ({ ...r, email: r.user_id ? emails.get(r.user_id) ?? r.user_id : "?" })),
    },
    fetchedAt: new Date().toISOString(),
  };
}
