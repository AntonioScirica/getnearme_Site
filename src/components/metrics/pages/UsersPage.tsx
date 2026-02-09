import type { MetricsData } from "../types";
import { fmt, MONO } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import { StatLine } from "../ui/StatCard";
import BarChart from "../ui/BarChart";
import Donut from "../ui/Donut";
import DataTable from "../ui/DataTable";

const DONUT_COLORS = ["#4f46e5", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

export default function UsersPage({ data }: { data: MetricsData }) {
  const neverReturned = data.users.total - data.users.signedIn;

  const columns = [
    {
      key: "email",
      label: "Email",
      render: (r: (typeof data.topUsers)[0]) => (
        <span className="text-gray-900 truncate block max-w-[200px]">
          {r.email}
        </span>
      ),
    },
    {
      key: "subscription_type",
      label: "Type",
      render: (r: (typeof data.topUsers)[0]) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${
            r.subscription_type === "agency"
              ? "bg-amber-50 text-amber-600"
              : "bg-indigo-50 text-indigo-600"
          }`}
        >
          {r.subscription_type}
        </span>
      ),
    },
    {
      key: "credits",
      label: "Credits",
      align: "right" as const,
      render: (r: (typeof data.topUsers)[0]) => fmt(r.credits),
    },
    {
      key: "total_spent",
      label: "Spent",
      align: "right" as const,
      render: (r: (typeof data.topUsers)[0]) => fmt(r.total_spent),
    },
    {
      key: "properties_saved",
      label: "Properties",
      align: "right" as const,
      render: (r: (typeof data.topUsers)[0]) => fmt(r.properties_saved),
    },
    {
      key: "full_analyses",
      label: "Analyses",
      align: "right" as const,
      render: (r: (typeof data.topUsers)[0]) => fmt(r.full_analyses),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Users</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Users" value={data.users.total} />
        <KpiCard label="Confirmed" value={data.users.confirmed} />
        <KpiCard label="Signed In" value={data.users.signedIn} />
        <KpiCard
          label="Never Returned"
          value={neverReturned}
          sub={neverReturned > 0 ? "attention" : undefined}
        />
      </div>

      {/* Growth + Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="User Growth by Month">
          <BarChart
            items={data.growth.map((g) => ({
              label: g.month.slice(5),
              value: g.new_users,
            }))}
          />
        </StatCard>

        <StatCard title="Auth Providers">
          <Donut
            segments={data.providers.map((p, i) => ({
              label: p.provider,
              value: p.count,
              color: DONUT_COLORS[i % DONUT_COLORS.length],
            }))}
          />
        </StatCard>
      </div>

      {/* Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Sessions">
          <StatLine label="Total sessions" value={fmt(data.sessions.total)} />
          <StatLine label="Active 7d" value={fmt(data.sessions.active_7d)} />
          <StatLine label="Active 30d" value={fmt(data.sessions.active_30d)} />
          <StatLine
            label="Never returned"
            value={fmt(neverReturned)}
            warn={neverReturned > 0}
          />
        </StatCard>

        <StatCard title="Account Info">
          <StatLine
            label="First created"
            value={
              data.users.firstCreated
                ? new Date(data.users.firstCreated).toLocaleDateString("it-IT")
                : "N/A"
            }
          />
          <StatLine
            label="Latest created"
            value={
              data.users.latestCreated
                ? new Date(data.users.latestCreated).toLocaleDateString("it-IT")
                : "N/A"
            }
          />
        </StatCard>
      </div>

      {/* Top Users Table */}
      <StatCard title="Top Users">
        <DataTable columns={columns} rows={data.topUsers} />
      </StatCard>
    </div>
  );
}
