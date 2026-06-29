"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, RefreshCw, LogOut, X,
  LayoutDashboard, Users, Contact, Wallet, MoreHorizontal,
  Megaphone, Building2, Mail, Share2,
} from "lucide-react";
import type { MetricsData, PageId } from "./types";
import { MONO } from "./types";
import LoginScreen from "./LoginScreen";
import Sidebar from "./Sidebar";
import OverviewPage from "./pages/OverviewPage";
import UsersPage from "./pages/UsersPage";
import NewsletterPage from "./pages/NewsletterPage";
import ExportsPage from "./pages/ExportsPage";
import StripePage from "./pages/StripePage";
import AmbassadorPage from "./pages/AmbassadorPage";
import CostsPage from "./pages/CostsPage";
import EmailsPage from "./pages/EmailsPage";
import CrmPage from "./pages/CrmPage";
import AdsPage from "./pages/AdsPage";

// Mobile bottom-nav: 4 primary tabs; everything else lives in the "Altro" sheet.
const MOBILE_TABS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Home", icon: LayoutDashboard },
  { id: "users", label: "Utenti", icon: Users },
  { id: "crm", label: "CRM", icon: Contact },
  { id: "costs", label: "Costi", icon: Wallet },
];
const MOBILE_MORE: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "newsletter", label: "Marketing", icon: Megaphone },
  { id: "exports", label: "Agenzie", icon: Building2 },
  { id: "emails", label: "Email", icon: Mail },
];
const PAGE_TITLES: Record<string, string> = {
  overview: "Overview", newsletter: "Marketing", users: "Utenti", exports: "Agenzie",
  stripe: "Stripe", ambassador: "Ambassador", costs: "Costi", emails: "Email", crm: "CRM",
};

export default function MetricsDashboard() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const router = useRouter();

  // Restore auth from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("metrics_key");
    if (saved) setAuthKey(saved);
  }, []);

  const fetchData = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/metrics", {
        headers: { "x-metrics-key": key },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on auth
  useEffect(() => {
    if (authKey) fetchData(authKey);
  }, [authKey, fetchData]);

  const handleAuth = (key: string) => {
    sessionStorage.setItem("metrics_key", key);
    setAuthKey(key);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("metrics_key");
    setAuthKey(null);
    setData(null);
  };

  // Not authenticated
  if (!authKey) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  // Loading (no data yet)
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className={`${MONO} text-xs text-gray-500 tracking-wider`}>
            Loading metrics...
          </p>
        </div>
      </div>
    );
  }

  // Error (no data)
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
        <div className="bg-[#161920] rounded-xl border border-white/10 p-8 max-w-sm text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchData(authKey)}
            className={`${MONO} bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Render active page
  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <OverviewPage data={data} />;
      case "newsletter":
        return <NewsletterPage data={data} />;
      case "users":
        return <UsersPage data={data} onRefresh={() => fetchData(authKey)} loading={loading} authKey={authKey} />;
      case "exports":
        return <ExportsPage data={data} />;
      case "stripe":
        return <StripePage data={data} />;
      case "ambassador":
        return <AmbassadorPage data={data} authKey={authKey!} />;
      case "costs":
        return <CostsPage />;
      case "emails":
        return <EmailsPage />;
      case "crm":
        return <CrmPage authKey={authKey} />;
      case "ads":
        return <AdsPage authKey={authKey} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0d0f14]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-60 transform transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          activePage={activePage}
          onPageChange={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
          timestamp={data.timestamp}
          onRefresh={() => fetchData(authKey)}
          onLogout={handleLogout}
          loading={loading}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:ml-60 min-h-screen">
        {/* Mobile app header */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 bg-[#161920]/95 backdrop-blur border-b border-white/10 sticky top-0 z-20" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <span className="font-semibold text-gray-100 text-base">{PAGE_TITLES[activePage] ?? "Metrics"}</span>
          <button
            onClick={() => fetchData(authKey)}
            disabled={loading}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Page content */}
        <div className="p-4 pb-24 md:p-6 md:pb-6 max-w-7xl mx-auto">{renderPage()}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#161920]/95 backdrop-blur border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-stretch">
          {MOBILE_TABS.map((t) => {
            const Icon = t.icon;
            const active = activePage === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActivePage(t.id); setMoreOpen(false); }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${active ? "text-indigo-400" : "text-gray-500"}`}
              >
                <Icon className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            );
          })}
          {(() => {
            const moreActive = MOBILE_MORE.some((m) => m.id === activePage) || moreOpen;
            return (
              <button
                onClick={() => setMoreOpen(true)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${moreActive ? "text-indigo-400" : "text-gray-500"}`}
              >
                <MoreHorizontal className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-medium">Altro</span>
              </button>
            );
          })()}
        </div>
      </nav>

      {/* Mobile "Altro" sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#161920] rounded-t-2xl border-t border-white/10 p-4 pb-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-100">Altro</span>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_MORE.map((m) => {
                const Icon = m.icon;
                const active = activePage === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setActivePage(m.id); setMoreOpen(false); }}
                    className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border ${active ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400" : "bg-white/[0.02] border-white/[0.06] text-gray-300"}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => router.push("/metrics/social")}
                className="flex flex-col items-center gap-1.5 py-4 rounded-xl border bg-white/[0.02] border-white/[0.06] text-gray-300"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs">Social</span>
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex gap-2">
              <button onClick={() => { fetchData(authKey); setMoreOpen(false); }} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] text-sm text-gray-300 disabled:opacity-40">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Aggiorna
              </button>
              <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-sm text-red-400">
                <LogOut className="w-4 h-4" /> Esci
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
