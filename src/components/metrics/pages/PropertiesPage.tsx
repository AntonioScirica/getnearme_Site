import type { MetricsData } from "../types";
import { fmt } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import BarChart from "../ui/BarChart";
import HBar from "../ui/HBar";
import DataTable from "../ui/DataTable";

export default function PropertiesPage({ data }: { data: MetricsData }) {
  const totalAnalyses = data.properties.reduce(
    (s, p) => s + p.full_analyses,
    0
  );

  const columns = [
    { key: "site", label: "Site" },
    {
      key: "count",
      label: "Saved",
      align: "right" as const,
      render: (r: (typeof data.properties)[0]) => fmt(r.count),
    },
    {
      key: "unique_users",
      label: "Users",
      align: "right" as const,
      render: (r: (typeof data.properties)[0]) => fmt(r.unique_users),
    },
    {
      key: "full_analyses",
      label: "Full Analyses",
      align: "right" as const,
      render: (r: (typeof data.properties)[0]) => fmt(r.full_analyses),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">Properties</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Annunci visitati"
          value={data.summary.totalProperties}
        />
        <KpiCard label="Analisi complete" value={data.summary.totalFullAnalyses} />
        <KpiCard
          label="Unique Users"
          value={data.summary.totalUniquePropertyUsers}
        />
      </div>

      {/* Properties by site */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="By Source Site">
          <HBar
            items={data.properties.map((p) => ({
              label: p.site,
              value: p.count,
              sub: `${p.unique_users} users`,
            }))}
            color="bg-blue-500"
          />
        </StatCard>

        <StatCard title="Site Details">
          <DataTable columns={columns} rows={data.properties} />
        </StatCard>
      </div>

      {/* Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="Annunci visitati per mese">
          <BarChart
            items={data.propertiesTrend.map((p) => ({
              label: p.month.slice(5),
              value: p.saved,
            }))}
            color="#3b82f6"
          />
        </StatCard>

        <StatCard title="Full Analyses by Month">
          <BarChart
            items={data.propertiesTrend.map((p) => ({
              label: p.month.slice(5),
              value: p.full_analyses,
            }))}
            color="#8b5cf6"
          />
        </StatCard>
      </div>
    </div>
  );
}
