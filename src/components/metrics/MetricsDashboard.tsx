"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, Loader2 } from "lucide-react";
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

export default function MetricsDashboard() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        return <UsersPage data={data} />;
      case "exports":
        return <ExportsPage data={data} />;
      case "stripe":
        return <StripePage data={data} />;
      case "ambassador":
        return <AmbassadorPage data={data} authKey={authKey!} />;
      case "costs":
        return <CostsPage />;
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
      <main className="flex-1 md:ml-60 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center h-14 px-4 bg-[#161920] border-b border-white/10 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-medium text-gray-100 text-sm">
            GetNearMe Metrics
          </span>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
