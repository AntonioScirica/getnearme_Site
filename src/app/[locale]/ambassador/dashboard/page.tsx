'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Copy, Check, Users, Wallet, Clock, AlertCircle, LogOut } from 'lucide-react';
import { type Locale } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';

const EDGE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/functions/v1/ambassador-dashboard`;

type PlanTier = 'agency_monthly' | 'agency_quarterly' | 'agency_annual';
type RefStatus = 'active' | 'cancelled' | 'completed';

interface Referral {
  id: number;
  agency_email: string;
  agency_name: string | null;
  plan_tier: PlanTier;
  signup_date: string;
  status: RefStatus;
  total_bounty_eur: number;
  installments_total: number;
  installments_earned: number;
  earned_so_far: number | null;
}

interface Payout {
  id: number;
  referral_id: number;
  installment_index: number;
  amount_eur: number;
  earned_at: string;
  paid_at: string | null;
  paid_method: string | null;
  paid_reference: string | null;
}

interface DashboardData {
  code: string | null;
  totalReferrals: number;
  activeReferrals: number;
  cancelledReferrals: number;
  breakdown: { monthly: number; quarterly: number; annual: number };
  earnedToDate: number;
  paidOut: number;
  pendingPayout: number;
  referrals: Referral[];
  payouts: Payout[];
}

const PLAN_LABEL: Record<PlanTier, { label: string; cls: string }> = {
  agency_monthly: { label: 'Mensile', cls: 'bg-blue-100 text-blue-700' },
  agency_quarterly: { label: 'Trimestrale', cls: 'bg-indigo-100 text-indigo-700' },
  agency_annual: { label: 'Annuale', cls: 'bg-emerald-100 text-emerald-700' },
};

const STATUS_LABEL: Record<RefStatus, { label: string; cls: string }> = {
  active: { label: 'Attiva', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancellata', cls: 'bg-red-100 text-red-700' },
  completed: { label: 'Completata', cls: 'bg-slate-100 text-slate-700' },
};

function eur(n: number): string {
  return `€${(n || 0).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AmbassadorDashboardPage() {
  const params = useParams();
  const locale = (params.locale as Locale) || 'it';

  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState<{ access_token: string; user_id: string; email: string } | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [data, setData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auth bootstrap + listen for OAuth redirect-back
  useEffect(() => {
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user && s.access_token) {
        setSession({ access_token: s.access_token, user_id: s.user.id, email: s.user.email || '' });
      }
      setAuthLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user && s.access_token) {
        setSession({ access_token: s.access_token, user_id: s.user.id, email: s.user.email || '' });
      } else {
        setSession(null);
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function handleGoogleLogin() {
    setLoginError(null);
    setLoggingIn(true);
    // Redirect to /dashboard (whitelisted) — that page auto-redirects ambassadors back here
    const dest = `${window.location.origin}/${locale}/dashboard?as_ambassador=1`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: dest },
    });
    if (err) {
      setLoginError(err.message);
      setLoggingIn(false);
    }
  }

  // Load dashboard data
  const loadData = useCallback(async (token: string) => {
    setDataLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'get-stats' }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 403) { setForbidden(true); return; }
        throw new Error(body.detail || body.error || 'errore');
      }
      setData(body as DashboardData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'errore caricamento');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadData(session.access_token);
  }, [session, loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    const { data: d, error: err } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setLoggingIn(false);
    if (err || !d.session) {
      setLoginError(err?.message || 'Credenziali non valide');
      return;
    }
    setSession({ access_token: d.session.access_token, user_id: d.user!.id, email: d.user!.email || '' });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setData(null);
  }

  function copyCode() {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // Loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <Navbar locale={locale} />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  // Login form
  if (!session) {
    return (
      <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1a1a2e]">
        <Navbar locale={locale} />
        <main className="max-w-md mx-auto px-4 py-24">
          <h1 className="text-3xl font-bold mb-2">Ambassador</h1>
          <p className="text-slate-500 mb-8">Accedi alla tua dashboard</p>

          <div className="bg-white neo-border rounded-2xl p-6 space-y-4 mb-4" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loggingIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-[#1a1a2e] rounded-xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-200" />
              <span>oppure</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>

          <form onSubmit={handleLogin} className="bg-white neo-border rounded-2xl p-6 space-y-4" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#1a1a2e] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#1a1a2e] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl neo-border neo-btn font-bold transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
            >
              {loggingIn ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <p className="text-slate-400 text-xs text-center mt-6">
            Usa l&apos;email registrata come ambassador. Se non hai un account contatta l&apos;amministratore.
          </p>
        </main>
      </div>
    );
  }

  // Forbidden (logged but not ambassador)
  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1a1a2e]">
        <Navbar locale={locale} />
        <main className="max-w-xl mx-auto px-4 py-24">
          <div className="bg-white neo-border rounded-2xl p-8 text-center" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Accesso non autorizzato</h1>
            <p className="text-slate-500 mb-6">
              Il tuo account ({session.email}) non è registrato come ambassador. Se pensi sia un errore contatta l&apos;amministratore.
            </p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              <LogOut className="w-4 h-4" /> Esci
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Loading data
  if (dataLoading || !data) {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <Navbar locale={locale} />
        <div className="min-h-screen flex items-center justify-center">
          {error ? (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => session && loadData(session.access_token)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
              >
                Riprova
              </button>
            </div>
          ) : (
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          )}
        </div>
      </div>
    );
  }

  const totalRef = data.totalReferrals;
  const bd = data.breakdown;
  const maxBd = Math.max(bd.monthly, bd.quarterly, bd.annual, 1);

  return (
    <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1a1a2e]">
      <Navbar locale={locale} />

      <main className="max-w-5xl mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Ambassador</h1>
            <p className="text-slate-500 text-sm mt-1">{session.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>

        {/* Promo code hero */}
        {data.code && (
          <div
            className="rounded-2xl p-8 mb-6 neo-border text-white"
            style={{
              background: 'linear-gradient(135deg, #3B83F6 0%, #6366f1 50%, #8b5cf6 100%)',
              boxShadow: '6px 6px 0px #1a1a2e',
            }}
          >
            <p className="uppercase tracking-wider text-xs font-bold opacity-80 mb-2">Il tuo codice promo</p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight font-mono">{data.code}</div>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-[#1a1a2e] rounded-xl font-bold text-sm transition-all hover:bg-slate-100"
                style={{ boxShadow: '4px 4px 0px #1a1a2e' }}
              >
                {copied ? <><Check className="w-4 h-4" /> Copiato!</> : <><Copy className="w-4 h-4" /> Copia</>}
              </button>
            </div>
            <p className="text-sm opacity-80 mt-4">
              Le agenzie ottengono il 10% di sconto sul primo pagamento usando questo codice al checkout.
            </p>
          </div>
        )}

        {!data.code && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-6">
            <p className="text-amber-800 font-medium">
              Nessun codice ancora assegnato. L&apos;amministratore deve registrarne uno per te.
            </p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard
            icon={<Users className="w-5 h-5" />}
            label="Agenzie firmate"
            value={String(totalRef)}
            sub={`${data.activeReferrals} attive · ${data.cancelledReferrals} cancellate`}
            tone="blue"
          />
          <KpiCard
            icon={<Wallet className="w-5 h-5" />}
            label="Provvigioni totali"
            value={eur(data.earnedToDate)}
            sub={`${eur(data.paidOut)} già incassati`}
            tone="green"
          />
          <KpiCard
            icon={<Clock className="w-5 h-5" />}
            label="Da incassare"
            value={eur(data.pendingPayout)}
            sub="In attesa di bonifico"
            tone="amber"
          />
        </div>

        {/* Breakdown */}
        {totalRef > 0 && (
          <div className="bg-white neo-border rounded-2xl p-6 mb-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Distribuzione piani</h2>
            <div className="space-y-3">
              <BreakdownRow label="Mensile" count={bd.monthly} max={maxBd} cls="bg-blue-500" />
              <BreakdownRow label="Trimestrale" count={bd.quarterly} max={maxBd} cls="bg-indigo-500" />
              <BreakdownRow label="Annuale" count={bd.annual} max={maxBd} cls="bg-emerald-500" />
            </div>
          </div>
        )}

        {/* Referrals */}
        <div className="bg-white neo-border rounded-2xl p-6 mb-6 overflow-hidden" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Agenzie firmate</h2>
          {data.referrals.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">
              Nessuna agenzia ha ancora usato il tuo codice. Condividilo per iniziare a guadagnare.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-400 border-b-2 border-slate-100">
                    <th className="py-2 pr-3">Agenzia</th>
                    <th className="py-2 pr-3">Piano</th>
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Stato</th>
                    <th className="py-2 pr-3">Provvigione</th>
                    <th className="py-2">Avanzamento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.map((r) => {
                    const plan = PLAN_LABEL[r.plan_tier] || { label: r.plan_tier, cls: 'bg-slate-100 text-slate-700' };
                    const stat = STATUS_LABEL[r.status] || { label: r.status, cls: 'bg-slate-100 text-slate-700' };
                    const earned = r.earned_so_far || 0;
                    const pct = r.total_bounty_eur > 0 ? (earned / r.total_bounty_eur) * 100 : 0;
                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="font-medium">{r.agency_name || '—'}</div>
                          <div className="text-slate-400 text-xs">{r.agency_email}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${plan.cls}`}>{plan.label}</span>
                        </td>
                        <td className="py-3 pr-3 text-slate-600">{formatDate(r.signup_date)}</td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${stat.cls}`}>{stat.label}</span>
                        </td>
                        <td className="py-3 pr-3 font-bold">{eur(earned)} <span className="text-slate-400 font-normal">/ {eur(r.total_bounty_eur)}</span></td>
                        <td className="py-3 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">{r.installments_earned}/{r.installments_total}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payouts history */}
        <div className="bg-white neo-border rounded-2xl p-6 mb-6 overflow-hidden" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Dettaglio provvigioni</h2>
          <p className="text-xs text-slate-400 mb-4">
            Ogni riga rappresenta una rata della provvigione, sbloccata quando l&apos;agenzia paga la rispettiva fattura.
          </p>
          {data.payouts.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">Nessuna provvigione ancora sbloccata.</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-400 border-b-2 border-slate-100">
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Rata</th>
                    <th className="py-2 pr-3">Importo</th>
                    <th className="py-2 pr-3">Stato</th>
                    <th className="py-2">Riferimento bonifico</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-3 text-slate-600">{formatDate(p.earned_at)}</td>
                      <td className="py-3 pr-3">#{p.installment_index}</td>
                      <td className="py-3 pr-3 font-bold">{eur(p.amount_eur)}</td>
                      <td className="py-3 pr-3">
                        {p.paid_at ? (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">Incassata · {formatDate(p.paid_at)}</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">Da incassare</span>
                        )}
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {p.paid_method ? <span className="font-mono">{p.paid_method}{p.paid_reference ? ` · ${p.paid_reference}` : ''}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs">
          I bonifici vengono effettuati periodicamente. Per domande contatta l&apos;amministratore.
        </p>
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: 'blue' | 'green' | 'amber' }) {
  const toneCls = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
  }[tone];
  return (
    <div className="bg-white neo-border rounded-2xl p-6" style={{ boxShadow: '6px 6px 0px #1a1a2e' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneCls}`}>{icon}</div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="text-3xl font-extrabold mb-1">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function BreakdownRow({ label, count, max, cls }: { label: string; count: number; max: number; cls: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm font-medium text-slate-600">{label}</div>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${cls} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-right text-sm font-bold">{count}</div>
    </div>
  );
}
