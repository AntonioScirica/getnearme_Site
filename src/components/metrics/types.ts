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
  retention?: {
    cohort_month: string;
    size: number;
    months: (number | null)[];
  }[];
  retention_months?: string[];
  emailStats?: {
    total_events: number;
    last_30d: {
      delivered: number;
      opened: number;
      clicked: number;
      unsubscribed: number;
      open_rate: number | null;
      click_rate: number | null;
      unsubscribe_rate: number | null;
    };
  };
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
  allUsers: {
    email: string;
    subscription_type: string;
    credits: number;
    total_earned: number;
    total_spent: number;
    onboarding_completed: boolean;
    properties_saved: number;
    full_analyses: number;
    created_at: string;
    last_sign_in_at: string | null;
    pdf_reports: number;
    zone_analyses: number;
    staging_photos: number;
    staging_photo_by_style: Record<string, number>;
    post_png_exports: number;
    post_png_by_size: Record<string, number>;
    post_png_by_template: Record<string, number>;
    post_video_exports: number;
    staging_video_exports: number;
    team: { role: string; team_id: string; member_count: number; team_name: string } | null;
  }[];
  sectionUnlocks: { section: string; count: number }[];
  teamsStats?: {
    total: number;
    active: number;
    avg_members: number;
    size_distribution: { size: number; label: string; count: number }[];
  };
  exportAggregates?: {
    hourly: number[];
    formats: { format: string; count: number }[];
    top_templates: { template: string; count: number }[];
  };
  aiVideoStats?: {
    total: number;
    top_templates: { template: string; count: number }[];
    models: { model: string; count: number }[];
  };
  stripeStats?: {
    hasData: boolean;
    totalEvents: number;
    mrr_cents: number;
    mrr_eur: number;
    active_subscriptions: number;
    revenue_30d_cents: number;
    revenue_30d_eur: number;
    failed_payments_30d: number;
    revenueTrend: { month: string; amount_cents: number; amount_eur: number }[];
    newSubsTrend: { month: string; count: number }[];
    churnByMonth: { month: string; count: number }[];
    planDistribution: { plan: string; count: number }[];
    recentEvents: {
      id: string;
      type: string;
      customer_email: string | null;
      amount_eur: number | null;
      status: string | null;
      occurred_at: string;
    }[];
  };
  allUsersForAmbassador: {
    email: string;
    subscription_type: string;
    credits: number;
    total_earned: number;
    total_spent: number;
    onboarding_completed: boolean;
    properties_saved: number;
    full_analyses: number;
    created_at: string;
    last_sign_in_at: string | null;
    pdf_reports: number;
    zone_analyses: number;
    staging_photos: number;
    staging_photo_by_style: Record<string, number>;
    post_png_exports: number;
    post_png_by_size: Record<string, number>;
    post_png_by_template: Record<string, number>;
    post_video_exports: number;
    staging_video_exports: number;
    team: { role: string; team_id: string; member_count: number; team_name: string } | null;
  }[];
  summary: {
    totalUsers: number;
    totalProperties: number;
    totalUniquePropertyUsers: number;
    totalSpent: number;
    active7d: number;
    usersWithAnalysis: number;
    totalUsersWithProperties: number;
    totalFullAnalyses: number;
    usersWithUnlockedSection: number;
  };
}

export type PageId =
  | "overview"
  | "newsletter"
  | "users"
  | "exports"
  | "stripe"
  | "ambassador"
  | "costs";

export const MONO = "font-[family-name:var(--font-jetbrains)]";

export const fmt = (n: number) => n.toLocaleString("it-IT");

export const pct = (part: number, total: number) =>
  total > 0 ? ((part / total) * 100).toFixed(1) : "0";
