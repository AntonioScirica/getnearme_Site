"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  CreditCard,
  RefreshCw,
  LogOut,
  ChevronUp,
  Star,
} from "lucide-react";
import { MONO } from "./types";
import type { PageId } from "./types";

const navItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",    label: "Overview",     icon: LayoutDashboard },
  { id: "newsletter",  label: "Marketing",    icon: Megaphone },
  { id: "users",       label: "Utenti",       icon: Users },
  { id: "exports",     label: "Agenzie",      icon: Building2 },
  { id: "stripe",      label: "Stripe",       icon: CreditCard },
  { id: "ambassador",  label: "Ambassador",   icon: Star },
];

interface SidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  timestamp?: string;
  onRefresh: () => void;
  onLogout: () => void;
  loading: boolean;
}

export default function Sidebar({
  activePage,
  onPageChange,
  timestamp,
  onRefresh,
  onLogout,
  loading,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-full bg-[#161920] border-r border-white/[0.08] flex flex-col">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-white/[0.08] shrink-0">
        <span className="font-semibold text-gray-100 text-lg">GetNearMe</span>
        <span className={`${MONO} text-[10px] text-gray-500 tracking-wider uppercase ml-2`}>
          Metrics
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer text-left ${
                active
                  ? "bg-indigo-500/20 text-indigo-400 font-medium"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile footer */}
      <div className="shrink-0 border-t border-white/[0.08]">
        {/* Dropdown menu */}
        {menuOpen && (
          <div className="px-3 py-2 border-b border-white/[0.06] space-y-0.5">
            {timestamp && (
              <p className={`${MONO} text-[10px] text-gray-600 px-3 py-1.5`}>
                Aggiornato {new Date(timestamp).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <button
              onClick={() => { onRefresh(); setMenuOpen(false); }}
              disabled={loading}
              className={`${MONO} w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors disabled:opacity-40`}
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
              Aggiorna dati
            </button>
            <button
              onClick={() => { onLogout(); setMenuOpen(false); }}
              className={`${MONO} w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Esci
            </button>
          </div>
        )}

        {/* Profile row */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <span className={`${MONO} text-xs font-semibold text-white`}>A</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className={`${MONO} text-sm text-gray-200 truncate`}>Admin</p>
            <p className={`${MONO} text-[10px] text-gray-600 truncate`}>GetNearMe</p>
          </div>
          <ChevronUp className={`w-4 h-4 text-gray-600 shrink-0 transition-transform ${menuOpen ? "" : "rotate-180"}`} />
        </button>
      </div>
    </div>
  );
}
