import type { MetricsData } from "../types";
import { fmt, pct } from "../types";
import KpiCard from "../ui/KpiCard";
import StatCard from "../ui/StatCard";
import { StatLine } from "../ui/StatCard";
import Donut from "../ui/Donut";

export default function NewsletterPage({ data }: { data: MetricsData }) {
  const nl = data.newsletter;
  const bonus = data.bonus;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Newsletter & Bonus
      </h1>

      {/* Newsletter KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Subscribers" value={nl.total_subs} />
        <KpiCard label="Marketing Consent" value={nl.marketing_consent} />
        <KpiCard label="Unsubscribed" value={nl.unsubscribed} />
        <KpiCard label="Agencies" value={nl.agencies} />
      </div>

      {/* Newsletter details + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <StatCard title="Newsletter Stats">
          <StatLine label="Total subscribers" value={fmt(nl.total_subs)} />
          <StatLine
            label="Marketing consent"
            value={`${fmt(nl.marketing_consent)} (${pct(nl.marketing_consent, nl.total_subs)}%)`}
          />
          <StatLine
            label="Unsubscribed"
            value={fmt(nl.unsubscribed)}
            warn={nl.unsubscribed > 0}
          />
          <StatLine label="Agencies" value={fmt(nl.agencies)} />
          <StatLine label="Avg streak" value={nl.avg_streak} />
          <StatLine label="Max streak" value={fmt(nl.max_streak)} />
          <StatLine label="Total bonuses claimed" value={fmt(nl.total_bonuses)} />
        </StatCard>

        <StatCard title="Subscriber Breakdown">
          <Donut
            segments={[
              {
                label: "Active",
                value: nl.total_subs - nl.unsubscribed,
                color: "#4f46e5",
              },
              { label: "Unsubscribed", value: nl.unsubscribed, color: "#ef4444" },
            ]}
          />
          <div className="mt-4">
            <Donut
              segments={[
                { label: "Consent", value: nl.marketing_consent, color: "#10b981" },
                {
                  label: "No consent",
                  value: nl.total_subs - nl.marketing_consent,
                  color: "#d1d5db",
                },
              ]}
              size={64}
            />
          </div>
        </StatCard>
      </div>

      {/* Daily Bonus */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Bonus</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Tokens Generated" value={bonus.total_tokens} />
        <KpiCard label="Claimed" value={bonus.claimed} />
        <KpiCard
          label="Expired Unclaimed"
          value={bonus.expired_unclaimed}
          sub={bonus.expired_unclaimed > bonus.claimed ? "high expiry rate" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="Bonus Details">
          <StatLine
            label="Credits claimed"
            value={fmt(bonus.credits_claimed)}
          />
          <StatLine label="Unique emails" value={fmt(bonus.unique_emails)} />
          <StatLine label="Max streak day" value={fmt(bonus.max_streak_day)} />
          <StatLine
            label="Claim rate"
            value={`${pct(bonus.claimed, bonus.total_tokens)}%`}
            warn={bonus.claimed === 0}
          />
        </StatCard>

        <StatCard title="Token Status">
          <Donut
            segments={[
              { label: "Claimed", value: bonus.claimed, color: "#10b981" },
              {
                label: "Expired",
                value: bonus.expired_unclaimed,
                color: "#ef4444",
              },
              {
                label: "Pending",
                value: Math.max(
                  0,
                  bonus.total_tokens - bonus.claimed - bonus.expired_unclaimed
                ),
                color: "#f59e0b",
              },
            ]}
          />
        </StatCard>
      </div>
    </div>
  );
}
