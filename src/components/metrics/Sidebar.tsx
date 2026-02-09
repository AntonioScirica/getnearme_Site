import {
  LayoutDashboard,
  Users,
  CreditCard,
  Building2,
  Newspaper,
  UserPlus,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { MONO } from "./types";
import type { PageId } from "./types";

const navItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "credits", label: "Credits & Transactions", icon: CreditCard },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "newsletter", label: "Newsletter & Bonus", icon: Newspaper },
  { id: "referral", label: "Referral", icon: UserPlus },
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
  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center border-b border-gray-100 shrink-0">
        <span className="font-semibold text-gray-900 text-lg">GetNearMe</span>
        <span
          className={`${MONO} text-[10px] text-gray-400 tracking-wider uppercase ml-2`}
        >
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
                  ? "bg-indigo-50 text-indigo-600 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2 shrink-0">
        {timestamp && (
          <p className={`${MONO} text-[10px] text-gray-400 truncate`}>
            {new Date(timestamp).toLocaleString("it-IT")}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`${MONO} text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 disabled:opacity-50`}
          >
            <RefreshCw
              className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={onLogout}
            className={`${MONO} text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1`}
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
