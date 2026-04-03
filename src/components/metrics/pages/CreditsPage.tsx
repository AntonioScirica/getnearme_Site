import type { MetricsData } from "../types";
import { fmt, MONO, pct } from "../types";
import StatCard from "../ui/StatCard";
import { StatLine } from "../ui/StatCard";
import BarChart from "../ui/BarChart";
import HBar from "../ui/HBar";

export default function CreditsPage({ data }: { data: MetricsData }) {
  const earnTx = data.transactions.filter(
    (t) => t.transaction_type === "earn"
  );
  const spendTx = data.transactions.filter(
    (t) => t.transaction_type === "spend"
  );

  // Monthly trend - aggregate earn/spend per month
  const months = [
    ...new Set(data.transactionsTrend.map((t) => t.month)),
  ].sort();
  const earnByMonth = months.map((m) => {
    const rows = data.transactionsTrend.filter(
      (t) => t.month === m && t.transaction_type === "earn"
    );
    return {
      label: m.slice(5),
      value: rows.reduce((s, r) => s + r.total_amount, 0),
    };
  });
  const spendByMonth = months.map((m) => {
    const rows = data.transactionsTrend.filter(
      (t) => t.month === m && t.transaction_type === "spend"
    );
    return {
      label: m.slice(5),
      value: Math.abs(rows.reduce((s, r) => s + r.total_amount, 0)),
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-100 mb-6">
        Credits & Transactions
      </h1>

      {/* Credits by subscription */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.credits.map((c) => (
          <StatCard
            key={c.subscription_type}
            title={c.subscription_type.toUpperCase()}
          >
            <div className="mb-3">
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium ${
                  c.subscription_type === "agency"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-indigo-500/15 text-indigo-400"
                }`}
              >
                {c.users} users
              </span>
            </div>
            <StatLine label="Credits available" value={fmt(c.total_credits)} />
            <StatLine label="Total earned" value={fmt(c.total_earned)} />
            <StatLine label="Total spent" value={fmt(c.total_spent)} />
            <StatLine
              label="Onboarding done"
              value={`${c.onboarding_done}/${c.users} (${pct(c.onboarding_done, c.users)}%)`}
              warn={c.onboarding_done === 0}
            />
          </StatCard>
        ))}
      </div>

      {/* Transaction breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Earn Transactions">
          {earnTx.length > 0 ? (
            <HBar
              items={earnTx.map((t) => ({
                label: t.reason,
                value: t.total_amount,
                sub: `${t.count}x`,
              }))}
              color="bg-emerald-500"
            />
          ) : (
            <p className="text-sm text-gray-500">No earn data</p>
          )}
        </StatCard>

        <StatCard title="Spend Transactions">
          {spendTx.length > 0 ? (
            <HBar
              items={spendTx.map((t) => ({
                label: t.reason,
                value: Math.abs(t.total_amount),
                sub: `${t.count}x`,
              }))}
              color="bg-violet-500"
            />
          ) : (
            <p className="text-sm text-gray-500">No spend data</p>
          )}
        </StatCard>
      </div>

      {/* Transaction trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="Monthly Earn Trend">
          <BarChart items={earnByMonth} color="#10b981" />
        </StatCard>
        <StatCard title="Monthly Spend Trend">
          <BarChart items={spendByMonth} color="#8b5cf6" />
        </StatCard>
      </div>
    </div>
  );
}
