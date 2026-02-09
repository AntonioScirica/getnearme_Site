export interface MetricsData {
  timestamp: string;
  users: {
    total: number;
    confirmed: number;
    signedIn: number;
    firstCreated: string | null;
    latestCreated: string | null;
  };
  growth: { month: string; new_users: number }[];
  providers: { provider: string; count: number }[];
  sessions: { total: number; active_7d: number; active_30d: number };
  credits: {
    subscription_type: string;
    users: number;
    total_credits: number;
    total_earned: number;
    total_spent: number;
    onboarding_done: number;
  }[];
  transactions: {
    transaction_type: string;
    reason: string;
    count: number;
    total_amount: number;
  }[];
  transactionsTrend: {
    month: string;
    transaction_type: string;
    count: number;
    total_amount: number;
  }[];
  properties: {
    site: string;
    count: number;
    unique_users: number;
    full_analyses: number;
  }[];
  propertiesTrend: { month: string; saved: number; full_analyses: number }[];
  newsletter: {
    total_subs: number;
    marketing_consent: number;
    unsubscribed: number;
    agencies: number;
    avg_streak: number;
    max_streak: number;
    total_bonuses: number;
  };
  bonus: {
    total_tokens: number;
    claimed: number;
    expired_unclaimed: number;
    credits_claimed: number;
    unique_emails: number;
    max_streak_day: number;
  };
  referral: { total: number; completed: number; pending: number };
  topUsers: {
    email: string;
    subscription_type: string;
    credits: number;
    total_earned: number;
    total_spent: number;
    onboarding_completed: boolean;
    properties_saved: number;
    full_analyses: number;
  }[];
  summary: {
    totalUsers: number;
    totalProperties: number;
    totalUniquePropertyUsers: number;
    totalSpent: number;
    active7d: number;
  };
}

export type PageId =
  | "overview"
  | "users"
  | "credits"
  | "properties"
  | "newsletter"
  | "referral";

export const MONO = "font-[family-name:var(--font-jetbrains)]";

export const fmt = (n: number) => n.toLocaleString("it-IT");

export const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : "0";
