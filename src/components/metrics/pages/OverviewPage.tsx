import type { MetricsData } from "../types";
import { fmt } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import BarChart from "../ui/BarChart";
import HBar from "../ui/HBar";
import { Users, Building2, CreditCard, Activity } from "lucide-react";

export default function OverviewPage({ data }: { data: MetricsData }) {
  const spendTx = data.transactions
    .filter((t) => t.transaction_type === "spend")
    .sort((a, b) => Math.abs(b.total_amount) - Math.abs(a.total_amount));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Users"
          value={data.summary.totalUsers}
          sub={`${data.sessions.active_7d} active 7d`}
          icon={<Users className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label="Properties Saved"
          value={data.summary.totalProperties}
          sub={`by ${data.summary.totalUniquePropertyUsers} users`}
          icon={<Building2 className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label="Credits Spent"
          value={data.summary.totalSpent}
          sub={`${data.transactions.length} types`}
          icon={<CreditCard className="w-[18px] h-[18px]" />}
        />
        <KpiCard
          label="Active Sessions 7d"
          value={data.sessions.active_7d}
          sub={`of ${data.sessions.total} total`}
          icon={<Activity className="w-[18px] h-[18px]" />}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="User Growth by Month">
          <BarChart
            items={data.growth.map((g) => ({
              label: g.month.slice(5),
              value: g.new_users,
            }))}
          />
        </StatCard>

        <StatCard title="Spend Breakdown">
          {spendTx.length > 0 ? (
            <HBar
              items={spendTx.map((t) => ({
                label: t.reason,
                value: Math.abs(t.total_amount),
              }))}
              color="bg-violet-500"
            />
          ) : (
            <p className="text-sm text-gray-400">No spend data</p>
          )}
        </StatCard>
      </div>
    </div>
  );
}
