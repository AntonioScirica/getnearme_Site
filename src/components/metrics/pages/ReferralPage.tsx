import type { MetricsData } from "../types";
import { fmt, pct } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import { StatLine } from "../ui/StatCard";
import Donut from "../ui/Donut";
import HBar from "../ui/HBar";

export default function ReferralPage({ data }: { data: MetricsData }) {
  const ref = data.referral;
  const completionRate = pct(ref.completed, ref.total);

  // Onboarding completion per subscription type
  const onboardingData = data.credits.map((c) => ({
    label: c.subscription_type,
    value: c.users > 0 ? Math.round((c.onboarding_done / c.users) * 100) : 0,
    sub: `${c.onboarding_done}/${c.users}`,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Referral</h1>

      {/* Referral KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Referrals" value={ref.total} />
        <KpiCard label="Completed" value={ref.completed} />
        <KpiCard label="Pending" value={ref.pending} />
        <KpiCard
          label="Completion Rate"
          value={0}
          sub={`${completionRate}%`}
        />
      </div>

      {ref.total === 0 && (
        <div className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg p-4 mb-6 text-sm">
          No referrals have been used yet. The referral system is available but
          hasn&apos;t seen adoption.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Referral Breakdown">
          {ref.total > 0 ? (
            <Donut
              segments={[
                { label: "Completed", value: ref.completed, color: "#10b981" },
                { label: "Pending", value: ref.pending, color: "#f59e0b" },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-20">
              <p className="text-sm text-gray-400">No data to display</p>
            </div>
          )}
        </StatCard>

        <StatCard title="Referral Stats">
          <StatLine label="Total referrals" value={fmt(ref.total)} />
          <StatLine label="Completed" value={fmt(ref.completed)} />
          <StatLine label="Pending" value={fmt(ref.pending)} />
          <StatLine
            label="Completion rate"
            value={`${completionRate}%`}
            warn={ref.total > 0 && ref.completed === 0}
          />
        </StatCard>
      </div>

      {/* Onboarding */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Onboarding Completion
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="By Subscription Type">
          <HBar
            items={onboardingData}
            color="bg-indigo-500"
          />
        </StatCard>

        <StatCard title="Onboarding Details">
          {data.credits.map((c) => (
            <StatLine
              key={c.subscription_type}
              label={c.subscription_type}
              value={`${c.onboarding_done}/${c.users} (${pct(c.onboarding_done, c.users)}%)`}
              warn={c.onboarding_done === 0}
            />
          ))}
        </StatCard>
      </div>
    </div>
  );
}
