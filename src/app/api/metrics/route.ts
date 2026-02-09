import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}


export async function GET(request: NextRequest) {
  const authKey = request.headers.get("x-metrics-key");
  if (authKey !== "ZuoQ6k*_6wmBbUQQim!B") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();

  try {
    const now = new Date();

    // Try to fetch auth users - may fail if service key lacks admin access
    let authUsers: any[] = [];
    try {
      const { data: usersData } =
        await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      authUsers = usersData?.users || [];
    } catch {
      // Auth admin not available - we'll derive user data from user_credits table
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch public tables in parallel
    const [
      creditsRes,
      transactionsRes,
      propertiesRes,
      newsletterRes,
      bonusRes,
      referralRes,
    ] = await Promise.all([
      admin.from("user_credits").select("*"),
      admin.from("credit_transactions").select("*").order("created_at", { ascending: false }),
      admin.from("saved_properties").select("*"),
      admin.from("newsletter_subscriptions").select("*"),
      admin.from("daily_bonus_tokens").select("*"),
      admin.from("referrals").select("*"),
    ]);

    const creditRows = creditsRes.data || [];
    const txRows = transactionsRes.data || [];
    const propRows = propertiesRes.data || [];
    const nlRows = newsletterRes.data || [];
    const bonusRows = bonusRes.data || [];
    const refRows = referralRes.data || [];

    // Exclude admin/test accounts from spending metrics
    const EXCLUDED_EMAILS = [
      "as.scirica@gmail.com",
      "antonioiphoneid@gmail.com",
      "lookgameyt@gmail.com",
    ];
    const excludedUserIds = new Set(
      creditRows
        .filter((c: any) => EXCLUDED_EMAILS.includes(c.email))
        .map((c: any) => c.user_id)
    );

    // ─── Users / Growth / Providers / Sessions ───
    // If auth admin worked, use that data. Otherwise derive from user_credits.
    let users: any;
    let growth: any[];
    let providers: any[];
    let sessions: any;

    if (authUsers.length > 0) {
      users = {
        total: authUsers.length,
        confirmed: authUsers.filter((u: any) => u.email_confirmed_at).length,
        signedIn: authUsers.filter((u: any) => u.last_sign_in_at).length,
        firstCreated: authUsers.reduce((a: any, b: any) =>
          new Date(a.created_at) < new Date(b.created_at) ? a : b
        ).created_at,
        latestCreated: authUsers.reduce((a: any, b: any) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        ).created_at,
      };
      const growthMap: Record<string, number> = {};
      authUsers.forEach((u: any) => {
        const month = new Date(u.created_at).toISOString().slice(0, 7);
        growthMap[month] = (growthMap[month] || 0) + 1;
      });
      growth = Object.entries(growthMap)
        .map(([month, count]) => ({ month, new_users: count }))
        .sort((a, b) => a.month.localeCompare(b.month));
      const providerMap: Record<string, number> = {};
      authUsers.forEach((u: any) => {
        // Try identities first, then app_metadata.provider
        const ids = u.identities || [];
        if (ids.length > 0) {
          ids.forEach((id: any) => {
            providerMap[id.provider] = (providerMap[id.provider] || 0) + 1;
          });
        } else {
          const p = u.app_metadata?.provider || u.app_metadata?.providers?.[0] || "email";
          providerMap[p] = (providerMap[p] || 0) + 1;
        }
      });
      providers = Object.entries(providerMap)
        .map(([provider, count]) => ({ provider, count }))
        .sort((a, b) => b.count - a.count);
      sessions = {
        total: authUsers.filter((u: any) => u.last_sign_in_at).length,
        active_7d: authUsers.filter(
          (u: any) => u.last_sign_in_at && new Date(u.last_sign_in_at) > sevenDaysAgo
        ).length,
        active_30d: authUsers.filter(
          (u: any) => u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
        ).length,
      };
    } else {
      // Fallback: derive from user_credits table
      const totalUsers = creditRows.length;
      const growthMap: Record<string, number> = {};
      creditRows.forEach((c: any) => {
        const month = new Date(c.created_at).toISOString().slice(0, 7);
        growthMap[month] = (growthMap[month] || 0) + 1;
      });
      growth = Object.entries(growthMap)
        .map(([month, count]) => ({ month, new_users: count }))
        .sort((a, b) => a.month.localeCompare(b.month));
      const recentUsers = creditRows.filter(
        (c: any) => new Date(c.updated_at) > sevenDaysAgo
      ).length;
      const monthUsers = creditRows.filter(
        (c: any) => new Date(c.updated_at) > thirtyDaysAgo
      ).length;
      users = {
        total: totalUsers,
        confirmed: totalUsers,
        signedIn: totalUsers,
        firstCreated: creditRows.length
          ? creditRows.reduce((a: any, b: any) =>
              new Date(a.created_at) < new Date(b.created_at) ? a : b
            ).created_at
          : null,
        latestCreated: creditRows.length
          ? creditRows.reduce((a: any, b: any) =>
              new Date(a.created_at) > new Date(b.created_at) ? a : b
            ).created_at
          : null,
      };
      // Can't determine providers without auth data
      providers = [{ provider: "unknown", count: totalUsers }];
      sessions = {
        total: totalUsers,
        active_7d: recentUsers,
        active_30d: monthUsers,
      };
    }

    // Credits by subscription (exclude admin emails from spending)
    const creditsByType: Record<string, any> = {};
    creditRows.forEach((c: any) => {
      const t = c.subscription_type || "free";
      const isExcluded = excludedUserIds.has(c.user_id);
      if (!creditsByType[t]) {
        creditsByType[t] = {
          subscription_type: t,
          users: 0,
          total_credits: 0,
          total_earned: 0,
          total_spent: 0,
          onboarding_done: 0,
        };
      }
      creditsByType[t].users++;
      creditsByType[t].total_credits += c.credits || 0;
      creditsByType[t].total_earned += isExcluded ? 0 : (c.total_earned || 0);
      creditsByType[t].total_spent += isExcluded ? 0 : (c.total_spent || 0);
      if (c.onboarding_completed) creditsByType[t].onboarding_done++;
    });
    const credits = Object.values(creditsByType).sort(
      (a: any, b: any) => b.users - a.users
    );

    // Transactions breakdown (exclude admin emails)
    const filteredTxRows = txRows.filter((tx: any) => !excludedUserIds.has(tx.user_id));
    const txBreakdown: Record<string, any> = {};
    filteredTxRows.forEach((tx: any) => {
      const key = `${tx.transaction_type}|${tx.reason}`;
      if (!txBreakdown[key]) {
        txBreakdown[key] = {
          transaction_type: tx.transaction_type,
          reason: tx.reason,
          count: 0,
          total_amount: 0,
        };
      }
      txBreakdown[key].count++;
      txBreakdown[key].total_amount += tx.amount || 0;
    });
    const transactions = Object.values(txBreakdown).sort(
      (a: any, b: any) => b.count - a.count
    );

    // Transactions trend by month (exclude admin emails)
    const txTrendMap: Record<string, any> = {};
    filteredTxRows.forEach((tx: any) => {
      const month = new Date(tx.created_at).toISOString().slice(0, 7);
      const key = `${month}|${tx.transaction_type}`;
      if (!txTrendMap[key]) {
        txTrendMap[key] = {
          month,
          transaction_type: tx.transaction_type,
          count: 0,
          total_amount: 0,
        };
      }
      txTrendMap[key].count++;
      txTrendMap[key].total_amount += tx.amount || 0;
    });
    const transactionsTrend = Object.values(txTrendMap).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    );

    // Properties by site
    const propBySite: Record<string, any> = {};
    const propUserIds = new Set<string>();
    propRows.forEach((p: any) => {
      const s = p.site || "unknown";
      if (!propBySite[s]) {
        propBySite[s] = { site: s, count: 0, unique_users: new Set(), full_analyses: 0 };
      }
      propBySite[s].count++;
      propBySite[s].unique_users.add(p.user_id);
      if (p.full_analysis) propBySite[s].full_analyses++;
      propUserIds.add(p.user_id);
    });
    const properties = Object.values(propBySite)
      .map((p: any) => ({
        site: p.site,
        count: p.count,
        unique_users: p.unique_users.size,
        full_analyses: p.full_analyses,
      }))
      .sort((a: any, b: any) => b.count - a.count);

    // Properties trend
    const propTrendMap: Record<string, any> = {};
    propRows.forEach((p: any) => {
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      if (!propTrendMap[month]) {
        propTrendMap[month] = { month, saved: 0, full_analyses: 0 };
      }
      propTrendMap[month].saved++;
      if (p.full_analysis) propTrendMap[month].full_analyses++;
    });
    const propertiesTrend = Object.values(propTrendMap).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    );

    // Newsletter
    const newsletter = {
      total_subs: nlRows.length,
      marketing_consent: nlRows.filter((n: any) => n.marketing_consent).length,
      unsubscribed: nlRows.filter((n: any) => n.unsubscribed_at).length,
      agencies: nlRows.filter((n: any) => n.is_agency).length,
      avg_streak: nlRows.length
        ? +(
            nlRows.reduce((s: number, n: any) => s + (n.current_streak || 0), 0) /
            nlRows.length
          ).toFixed(1)
        : 0,
      max_streak: Math.max(0, ...nlRows.map((n: any) => n.longest_streak || 0)),
      total_bonuses: nlRows.reduce(
        (s: number, n: any) => s + (n.total_bonuses_claimed || 0),
        0
      ),
    };

    // Bonus
    const bonus = {
      total_tokens: bonusRows.length,
      claimed: bonusRows.filter((b: any) => b.is_claimed).length,
      expired_unclaimed: bonusRows.filter(
        (b: any) => !b.is_claimed && new Date(b.expires_at) < now
      ).length,
      credits_claimed: bonusRows
        .filter((b: any) => b.is_claimed)
        .reduce((s: number, b: any) => s + (b.credits_amount || 0), 0),
      unique_emails: new Set(bonusRows.map((b: any) => b.email)).size,
      max_streak_day: Math.max(0, ...bonusRows.map((b: any) => b.streak_day || 0)),
    };

    // Referral
    const referral = {
      total: refRows.length,
      completed: refRows.filter((r: any) => r.status === "completed").length,
      pending: refRows.filter((r: any) => r.status === "pending").length,
    };

    // Top users (join credits + properties count)
    const userPropCount: Record<string, { saved: number; analyses: number }> = {};
    propRows.forEach((p: any) => {
      if (!userPropCount[p.user_id]) {
        userPropCount[p.user_id] = { saved: 0, analyses: 0 };
      }
      userPropCount[p.user_id].saved++;
      if (p.full_analysis) userPropCount[p.user_id].analyses++;
    });

    const topUsers = creditRows
      .filter((c: any) => !excludedUserIds.has(c.user_id))
      .map((c: any) => ({
        email: c.email || "(no email)",
        subscription_type: c.subscription_type || "free",
        credits: c.credits,
        total_earned: c.total_earned,
        total_spent: c.total_spent,
        onboarding_completed: c.onboarding_completed,
        properties_saved: userPropCount[c.user_id]?.saved || 0,
        full_analyses: userPropCount[c.user_id]?.analyses || 0,
      }))
      .sort((a: any, b: any) => b.properties_saved - a.properties_saved)
      .slice(0, 15);

    // Summary totals (exclude admin emails from spending)
    const totalSpent = creditRows
      .filter((c: any) => !excludedUserIds.has(c.user_id))
      .reduce((s: number, c: any) => s + (c.total_spent || 0), 0);
    const totalProperties = propRows.length;
    const totalUniquePropertyUsers = propUserIds.size;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      users,
      growth,
      providers,
      sessions,
      credits,
      transactions,
      transactionsTrend,
      properties,
      propertiesTrend,
      newsletter,
      bonus,
      referral,
      topUsers,
      summary: {
        totalUsers: users.total,
        totalProperties,
        totalUniquePropertyUsers,
        totalSpent,
        active7d: sessions.active_7d,
      },
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
