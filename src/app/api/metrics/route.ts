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
      stagingRes,
      exportEventsRes,
      teamsRes,
      teamMembersRes,
      stripeEventsRes,
    ] = await Promise.all([
      admin.from("user_credits").select("*"),
      admin.from("credit_transactions").select("*").order("created_at", { ascending: false }),
      admin.from("saved_properties").select("*"),
      admin.from("newsletter").select("*"),
      admin.from("daily_bonus_tokens").select("*"),
      admin.from("referrals").select("*"),
      admin.from("staging_usage").select("user_id, style, created_at"),
      admin.from("export_events").select("user_id, export_type, width, height, format, template, created_at"),
      admin.from("teams").select("id, owner_id, name, is_active, created_at"),
      admin.from("team_members").select("team_id, user_id, role, joined_at"),
      admin.from("stripe_events").select("id, type, customer_id, customer_email, amount, currency, product_id, price_id, status, occurred_at").order("occurred_at", { ascending: false }),
    ]);

    // Optional tables — may not exist yet (run migrations first)
    let monthlyActivityRows: { user_id: string; month: string }[] = [];
    let emailEventRows: { event: string; campaign_id: number | null; campaign_name: string | null; occurred_at: string }[] = [];
    try {
      const res = await admin.from("user_monthly_activity").select("user_id, month");
      monthlyActivityRows = res.data || [];
    } catch { /* table not yet created */ }
    try {
      const res = await admin.from("email_events").select("event, campaign_id, campaign_name, occurred_at");
      emailEventRows = res.data || [];
    } catch { /* table not yet created */ }

    // AI video events (one row per delivered AI video)
    let aiVideoEventRows: { user_id: string; template: string; ai_model: string | null; created_at: string }[] = [];
    try {
      const res = await admin.from("ai_video_events").select("user_id, template, ai_model, created_at");
      aiVideoEventRows = res.data || [];
    } catch { /* table not yet created */ }

    const creditRows = creditsRes.data || [];
    const txRows = transactionsRes.data || [];
    const propRows = propertiesRes.data || [];
    const stagingRows = stagingRes.data || [];
    const exportRows = exportEventsRes.data || [];
    const nlRows = newsletterRes.data || [];
    const bonusRows = bonusRes.data || [];
    const refRows = referralRes.data || [];
    const teamRows = teamsRes.data || [];
    const teamMemberRows = teamMembersRes.data || [];
    const stripeEventRows: any[] = stripeEventsRes.data || [];

    // Exclude admin/test accounts from spending metrics
    const EXCLUDED_EMAILS = [
      "as.scirica@gmail.com",
      "antonioiphoneid@gmail.com",
      "lookgameyt@gmail.com",
      "info@getnearme.it",
      "calogero.scirica@inwind.it",
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

    // Filter out excluded (admin/test) users from auth list too
    const filteredAuthUsers = authUsers.filter(
      (u: any) => !EXCLUDED_EMAILS.includes(u.email)
    );

    if (filteredAuthUsers.length > 0) {
      users = {
        total: filteredAuthUsers.length,
        confirmed: filteredAuthUsers.filter((u: any) => u.email_confirmed_at).length,
        signedIn: filteredAuthUsers.filter((u: any) => u.last_sign_in_at).length,
        firstCreated: filteredAuthUsers.reduce((a: any, b: any) =>
          new Date(a.created_at) < new Date(b.created_at) ? a : b
        ).created_at,
        latestCreated: filteredAuthUsers.reduce((a: any, b: any) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        ).created_at,
      };
      const growthMap: Record<string, number> = {};
      filteredAuthUsers.forEach((u: any) => {
        const month = new Date(u.created_at).toISOString().slice(0, 7);
        growthMap[month] = (growthMap[month] || 0) + 1;
      });
      growth = Object.entries(growthMap)
        .map(([month, count]) => ({ month, new_users: count }))
        .sort((a, b) => a.month.localeCompare(b.month));
      const providerMap: Record<string, number> = {};
      filteredAuthUsers.forEach((u: any) => {
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
        total: filteredAuthUsers.filter((u: any) => u.last_sign_in_at).length,
        active_7d: filteredAuthUsers.filter(
          (u: any) => u.last_sign_in_at && new Date(u.last_sign_in_at) > sevenDaysAgo
        ).length,
        active_30d: filteredAuthUsers.filter(
          (u: any) => u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
        ).length,
      };
    } else {
      // Fallback: derive from user_credits table (already excludes admin via excludedUserIds)
      const filteredCreditRows = creditRows.filter((c: any) => !excludedUserIds.has(c.user_id));
      const totalUsers = filteredCreditRows.length;
      const growthMap: Record<string, number> = {};
      filteredCreditRows.forEach((c: any) => {
        const month = new Date(c.created_at).toISOString().slice(0, 7);
        growthMap[month] = (growthMap[month] || 0) + 1;
      });
      growth = Object.entries(growthMap)
        .map(([month, count]) => ({ month, new_users: count }))
        .sort((a, b) => a.month.localeCompare(b.month));
      const recentUsers = filteredCreditRows.filter(
        (c: any) => new Date(c.updated_at) > sevenDaysAgo
      ).length;
      const monthUsers = filteredCreditRows.filter(
        (c: any) => new Date(c.updated_at) > thirtyDaysAgo
      ).length;
      users = {
        total: totalUsers,
        confirmed: totalUsers,
        signedIn: totalUsers,
        firstCreated: filteredCreditRows.length
          ? filteredCreditRows.reduce((a: any, b: any) =>
              new Date(a.created_at) < new Date(b.created_at) ? a : b
            ).created_at
          : null,
        latestCreated: filteredCreditRows.length
          ? filteredCreditRows.reduce((a: any, b: any) =>
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

    // Credits by subscription (exclude admin emails)
    const creditsByType: Record<string, any> = {};
    creditRows.forEach((c: any) => {
      const t = c.subscription_type || "free";
      const isExcluded = excludedUserIds.has(c.user_id);
      if (isExcluded) return; // skip admin accounts entirely
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
      creditsByType[t].total_earned += c.total_earned || 0;
      creditsByType[t].total_spent += c.total_spent || 0;
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

    // Properties by site (exclude admin accounts)
    const propBySite: Record<string, any> = {};
    const propUserIds = new Set<string>();
    propRows.forEach((p: any) => {
      if (excludedUserIds.has(p.user_id)) return; // skip admin properties
      const s = p.site || "unknown";
      if (!propBySite[s]) {
        propBySite[s] = { site: s, count: 0, unique_users: new Set(), full_analyses: 0 };
      }
      propBySite[s].count++;
      propBySite[s].unique_users.add(p.user_id);
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

    // Properties trend (exclude admin accounts)
    const propTrendMap: Record<string, any> = {};
    propRows.forEach((p: any) => {
      if (excludedUserIds.has(p.user_id)) return;
      const month = new Date(p.created_at).toISOString().slice(0, 7);
      if (!propTrendMap[month]) {
        propTrendMap[month] = { month, saved: 0, full_analyses: 0 };
      }
      propTrendMap[month].saved++;
    });
    const propertiesTrend = Object.values(propTrendMap).sort((a: any, b: any) =>
      a.month.localeCompare(b.month)
    );

    // Newsletter — also count users with marketing_consent in auth metadata but not in newsletter table
    const nlEmails = new Set(nlRows.map((n: any) => n.email));
    const authMarketingConsent = filteredAuthUsers.filter(
      (u: any) =>
        (u.user_metadata?.marketing_consent === true || u.user_metadata?.marketing_consent === "true") &&
        u.email &&
        !nlEmails.has(u.email)
    ).length;
    const newsletter = {
      total_subs: nlRows.length + authMarketingConsent,
      marketing_consent: nlRows.filter((n: any) => n.marketing_consent).length + authMarketingConsent,
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

    // Per-user property counts (exclude admin accounts)
    const userPropCount: Record<string, { saved: number }> = {};
    propRows.forEach((p: any) => {
      if (excludedUserIds.has(p.user_id)) return;
      if (!userPropCount[p.user_id]) {
        userPropCount[p.user_id] = { saved: 0 };
      }
      userPropCount[p.user_id].saved++;
    });

    // Build per-user lookup maps for credit transaction counts
    // full_analyses comes from credit_transactions (source of truth — full_analysis on saved_properties is unreliable)
    const userTxCount: Record<string, { pdf_reports: number; zone_analyses: number; full_analyses: number }> = {};
    txRows.forEach((tx: any) => {
      if (!userTxCount[tx.user_id]) userTxCount[tx.user_id] = { pdf_reports: 0, zone_analyses: 0, full_analyses: 0 };
      if (tx.transaction_type === "spend" && tx.reason === "pdf_report") userTxCount[tx.user_id].pdf_reports++;
      if (tx.transaction_type === "spend" && tx.reason === "zone_analysis") userTxCount[tx.user_id].zone_analyses++;
      if (tx.transaction_type === "spend" && tx.reason === "full_analysis") userTxCount[tx.user_id].full_analyses++;
    });

    // Build per-user staging photo count
    const userStagingCount: Record<string, number> = {};
    stagingRows.forEach((s: any) => {
      userStagingCount[s.user_id] = (userStagingCount[s.user_id] || 0) + 1;
    });

    // ─── Teams ───
    const memberCountByTeam: Record<string, number> = {};
    teamMemberRows.forEach((m: any) => {
      memberCountByTeam[m.team_id] = (memberCountByTeam[m.team_id] || 0) + 1;
    });
    const activeTeams = teamRows.filter((t: any) => t.is_active !== false);
    const memberCounts = activeTeams.map((t: any) => memberCountByTeam[t.id] || 1);
    const teamsStats = {
      total: teamRows.length,
      active: activeTeams.length,
      avg_members: activeTeams.length > 0
        ? +(memberCounts.reduce((s: number, n: number) => s + n, 0) / activeTeams.length).toFixed(1)
        : 0,
      size_distribution: (() => {
        const ranges = [{ label: "5", min: 5, max: 5 }, { label: "6-8", min: 6, max: 8 }, { label: "9-12", min: 9, max: 12 }, { label: "13-20", min: 13, max: 20 }, { label: "20+", min: 21, max: Infinity }];
        return ranges.map(r => ({ size: r.min, label: r.label, count: memberCounts.filter((n: number) => n >= r.min && n <= r.max).length }));
      })(),
    };

    // Per-user team info (is_owner, team_id, member_count)
    const userTeamInfo: Record<string, { role: string; team_id: string; member_count: number; team_name: string }> = {};
    teamMemberRows.forEach((m: any) => {
      const team = teamRows.find((t: any) => t.id === m.team_id);
      if (!team) return;
      userTeamInfo[m.user_id] = {
        role: m.role,
        team_id: m.team_id,
        member_count: memberCountByTeam[m.team_id] || 1,
        team_name: team.name || "",
      };
    });

    // ─── Global export aggregates (heatmap, formats, templates) ───
    const hourlyExports = new Array(24).fill(0);
    const formatCounts: Record<string, number> = {};
    const templateCounts: Record<string, number> = {};

    exportRows.forEach((e: any) => {
      // Heatmap: hour of day (UTC)
      if (e.created_at) {
        const hour = new Date(e.created_at).getUTCHours();
        hourlyExports[hour]++;
      }
      // Format breakdown
      if (e.format) {
        formatCounts[e.format] = (formatCounts[e.format] || 0) + 1;
      }
      // Template breakdown (only post_png)
      if (e.export_type === "post_png" && e.template) {
        templateCounts[e.template] = (templateCounts[e.template] || 0) + 1;
      }
    });

    const exportAggregates = {
      hourly: hourlyExports,
      formats: Object.entries(formatCounts)
        .map(([format, count]) => ({ format, count }))
        .sort((a, b) => b.count - a.count),
      top_templates: Object.entries(templateCounts)
        .map(([template, count]) => ({ template, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };

    // Build per-user export counts
    const userExportCount: Record<string, { post_png: number; post_video: number; template_video: number; staging_video: number; staging_photo: number; post_png_by_size: Record<string, number>; post_png_by_template: Record<string, number>; staging_photo_by_style: Record<string, number> }> = {};
    exportRows.forEach((e: any) => {
      if (!userExportCount[e.user_id]) userExportCount[e.user_id] = { post_png: 0, post_video: 0, template_video: 0, staging_video: 0, staging_photo: 0, post_png_by_size: {}, post_png_by_template: {}, staging_photo_by_style: {} };
      const t = e.export_type as string;
      if (t === "post_png") {
        userExportCount[e.user_id].post_png++;
        const sizeKey = e.width && e.height ? `${e.width}×${e.height}` : "n/d";
        userExportCount[e.user_id].post_png_by_size[sizeKey] = (userExportCount[e.user_id].post_png_by_size[sizeKey] || 0) + 1;
        if (e.template) {
          userExportCount[e.user_id].post_png_by_template[e.template] = (userExportCount[e.user_id].post_png_by_template[e.template] || 0) + 1;
        }
      } else if (t === "staging_photo") {
        userExportCount[e.user_id].staging_photo++;
        const styleKey = e.template || "n/d";
        userExportCount[e.user_id].staging_photo_by_style[styleKey] = (userExportCount[e.user_id].staging_photo_by_style[styleKey] || 0) + 1;
      } else if (t === "post_video" || t === "template_video" || t === "staging_video") {
        (userExportCount[e.user_id] as any)[t]++;
      }
    });

    // Build a lookup map from user_id → last_sign_in_at (from auth users if available)
    const authSignInMap: Record<string, string | null> = {};
    authUsers.forEach((u: any) => {
      authSignInMap[u.id] = u.last_sign_in_at || null;
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
        full_analyses: userTxCount[c.user_id]?.full_analyses || 0,
      }))
      .sort((a: any, b: any) => b.properties_saved - a.properties_saved)
      .slice(0, 15);

    const allUsers = creditRows
      .filter((c: any) => !excludedUserIds.has(c.user_id))
      .map((c: any) => ({
        email: c.email || "(no email)",
        subscription_type: c.subscription_type || "free",
        credits: c.credits,
        total_earned: c.total_earned,
        total_spent: c.total_spent,
        onboarding_completed: c.onboarding_completed,
        properties_saved: userPropCount[c.user_id]?.saved || 0,
        full_analyses: userTxCount[c.user_id]?.full_analyses || 0,
        created_at: c.created_at,
        last_sign_in_at: authSignInMap[c.user_id] ?? null,
        pdf_reports: userTxCount[c.user_id]?.pdf_reports || 0,
        zone_analyses: userTxCount[c.user_id]?.zone_analyses || 0,
        staging_photos: userStagingCount[c.user_id] || 0,
        staging_photo_by_style: userExportCount[c.user_id]?.staging_photo_by_style || {},
        post_png_exports: userExportCount[c.user_id]?.post_png || 0,
        post_png_by_size: userExportCount[c.user_id]?.post_png_by_size || {},
        post_png_by_template: userExportCount[c.user_id]?.post_png_by_template || {},
        post_video_exports: (userExportCount[c.user_id]?.post_video || 0),
        staging_video_exports: userExportCount[c.user_id]?.staging_video || 0,
        team: userTeamInfo[c.user_id] || null,
      }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Summary totals (exclude admin emails)
    const totalSpent = creditRows
      .filter((c: any) => !excludedUserIds.has(c.user_id))
      .reduce((s: number, c: any) => s + (c.total_spent || 0), 0);
    // totalProperties and propUserIds are already filtered above (exclude admin)
    const totalProperties = propRows.filter((p: any) => !excludedUserIds.has(p.user_id)).length;
    const totalUniquePropertyUsers = propUserIds.size;
    // full_analyses count from credit_transactions (source of truth)
    const totalFullAnalysesTx = filteredTxRows.filter((tx: any) => tx.reason === "full_analysis").length;
    const usersWithAnalysis = new Set(
      filteredTxRows.filter((tx: any) => tx.reason === "full_analysis").map((tx: any) => tx.user_id)
    ).size;
    // Users who saved at least 1 property (active property users, denominator for analysis rate)
    const totalUsersWithProperties = Object.keys(userPropCount).length;

    // Section unlocks — from saved_properties.unlocked_sections (array of section names)
    const sectionUnlockMap: Record<string, number> = {};
    const usersWithUnlockedSectionSet = new Set<string>();
    propRows.forEach((p: any) => {
      if (excludedUserIds.has(p.user_id)) return;
      const sections: string[] = p.unlocked_sections || [];
      if (sections.length > 0) {
        usersWithUnlockedSectionSet.add(p.user_id);
        sections.forEach((s) => {
          sectionUnlockMap[s] = (sectionUnlockMap[s] || 0) + 1;
        });
      }
    });
    const sectionUnlocks = Object.entries(sectionUnlockMap)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => b.count - a.count);
    const usersWithUnlockedSection = usersWithUnlockedSectionSet.size;

    // ─── Email performance (from Brevo webhook events) ───
    // Group by campaign, compute open/click/unsubscribe rates per campaign
    const emailCampaignMap: Record<string, {
      campaign_id: number | null;
      campaign_name: string;
      delivered: number;
      opened: Set<string>;
      clicked: Set<string>;
      unsubscribed: number;
    }> = {};

    emailEventRows.forEach((e) => {
      const key = e.campaign_id ? String(e.campaign_id) : "transactional";
      if (!emailCampaignMap[key]) {
        emailCampaignMap[key] = {
          campaign_id: e.campaign_id,
          campaign_name: e.campaign_name || key,
          delivered: 0,
          opened: new Set(),
          clicked: new Set(),
          unsubscribed: 0,
        };
      }
      if (e.event === "delivered") emailCampaignMap[key].delivered++;
      if (e.event === "opened" || e.event === "open") emailCampaignMap[key].opened.add(e.occurred_at + e.event);
      if (e.event === "clicked" || e.event === "click") emailCampaignMap[key].clicked.add(e.occurred_at + e.event);
      if (e.event === "unsubscribed" || e.event === "unsubscribe") emailCampaignMap[key].unsubscribed++;
    });

    // Overall stats across all campaigns (last 30 days)
    const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString();
    const recentEvents = emailEventRows.filter(e => e.occurred_at >= thirtyDaysAgoStr);
    const totalDelivered = recentEvents.filter(e => e.event === "delivered").length;
    const totalOpened   = recentEvents.filter(e => e.event === "opened" || e.event === "open").length;
    const totalClicked  = recentEvents.filter(e => e.event === "clicked" || e.event === "click").length;
    const totalUnsub    = recentEvents.filter(e => e.event === "unsubscribed" || e.event === "unsubscribe").length;

    const emailStats = {
      total_events: emailEventRows.length,
      last_30d: {
        delivered:        totalDelivered,
        opened:           totalOpened,
        clicked:          totalClicked,
        unsubscribed:     totalUnsub,
        open_rate:        totalDelivered > 0 ? +((totalOpened / totalDelivered) * 100).toFixed(1) : null,
        click_rate:       totalDelivered > 0 ? +((totalClicked / totalDelivered) * 100).toFixed(1) : null,
        unsubscribe_rate: totalDelivered > 0 ? +((totalUnsub / totalDelivered) * 100).toFixed(1) : null,
      },
    };

    // ─── Retention cohort ───
    // For each registration month (cohort), find which months those users were active.
    // "Active in month M" = has a row in user_monthly_activity for that month.

    // Build map: user_id → registration month
    const userRegMonth: Record<string, string> = {};
    const registrationSource = filteredAuthUsers.length > 0 ? filteredAuthUsers : creditRows.filter((c: any) => !excludedUserIds.has(c.user_id));
    registrationSource.forEach((u: any) => {
      const uid = u.id ?? u.user_id;
      if (uid) userRegMonth[uid] = new Date(u.created_at).toISOString().slice(0, 7);
    });

    // Build map: user_id → Set of active months
    const userActiveMonths: Record<string, Set<string>> = {};
    monthlyActivityRows.forEach(({ user_id, month }) => {
      if (excludedUserIds.has(user_id)) return;
      if (!userActiveMonths[user_id]) userActiveMonths[user_id] = new Set();
      userActiveMonths[user_id].add(month);
    });

    // Build cohorts
    const cohortMap: Record<string, { cohort_month: string; size: number; months: Record<string, number> }> = {};
    Object.entries(userRegMonth).forEach(([uid, regMonth]) => {
      if (!cohortMap[regMonth]) cohortMap[regMonth] = { cohort_month: regMonth, size: 0, months: {} };
      cohortMap[regMonth].size++;
      const activeMonths = userActiveMonths[uid] || new Set();
      activeMonths.forEach((m) => {
        cohortMap[regMonth].months[m] = (cohortMap[regMonth].months[m] || 0) + 1;
      });
    });

    // All months seen across all activity (sorted)
    const allMonthsSet = new Set<string>();
    monthlyActivityRows.forEach(({ month }) => allMonthsSet.add(month));
    Object.values(userRegMonth).forEach((m) => allMonthsSet.add(m));
    const allMonths = Array.from(allMonthsSet).sort();

    // Convert to relative cohort offsets: M+0 = registration month, M+1 = next month, etc.
    // maxOffset = how many months of activity we have after the earliest cohort
    const currentMonth = new Date().toISOString().slice(0, 7);
    const sortedCohorts = Object.values(cohortMap).sort((a, b) => a.cohort_month.localeCompare(b.cohort_month));

    // Max offset = how many months since the earliest cohort (capped at 12)
    const maxOffset = sortedCohorts.length > 0
      ? Math.min(12, (() => {
          const earliest = sortedCohorts[0].cohort_month;
          const [ey, em] = earliest.split("-").map(Number);
          const [cy, cm] = currentMonth.split("-").map(Number);
          return (cy - ey) * 12 + (cm - em);
        })())
      : 0;

    // Helper: add N months to a YYYY-MM string
    const addMonths = (ym: string, n: number): string => {
      const [y, m] = ym.split("-").map(Number);
      const d = new Date(y, m - 1 + n, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    const retention = sortedCohorts.map((cohort) => ({
      cohort_month: cohort.cohort_month,
      size: cohort.size,
      // months[i] = active users in M+i (null if that month is in the future)
      months: Array.from({ length: maxOffset + 1 }, (_, i) => {
        const targetMonth = addMonths(cohort.cohort_month, i);
        if (targetMonth > currentMonth) return null; // future
        return cohort.months[targetMonth] ?? 0;
      }),
    }));

    // retention_months now carries relative labels: "M+0", "M+1", ...
    const retentionMonths = Array.from({ length: maxOffset + 1 }, (_, i) => `M+${i}`);

    // ─── Stripe stats ───
    // Price → monthly equivalent (EUR cents)
    const PRICE_MONTHLY_EUR: Record<string, number> = {
      'price_1TGNcrFzCo1FYIKTi8wM0AlR': 499,     // Lite €4.99/mese
      'price_1TDCwIFzCo1FYIKTTwEkUipa': 2400,    // Starter €24/mese
      'price_1T3xknFzCo1FYIKTI3bw6ex2': 9900,    // Agency legacy €99/mese
      'price_1TDCwxFzCo1FYIKTGXx9bBw3': 14900,   // Pro €149/mese
      'price_1TFlD3FzCo1FYIKTtMMkvi37': Math.round(24500 / 12),  // Starter annual
      'price_1TFlEJFzCo1FYIKT7giujZVx': Math.round(101000 / 12), // Agency annual
      'price_1TFlRUFzCo1FYIKTeJAppMHE': Math.round(152000 / 12), // Pro annual
      'price_1TI4oKFzCo1FYIKTtbbSbj0h': 39900,   // Mensile €399/mese
      'price_1TI5AbFzCo1FYIKTzfpV41Ic': Math.round(104700 / 3),  // Trimestrale €349×3/3
      'price_1TI5B8FzCo1FYIKTS3UqmlX6': Math.round(30000 / 12),  // Annuale €300/anno
    };

    // Active subscriptions = most recent subscription event per customer
    const latestSubByCustomer: Record<string, any> = {};
    stripeEventRows
      .filter(e => ['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(e.type))
      .forEach(e => {
        const cid = e.customer_id;
        if (!cid) return;
        if (!latestSubByCustomer[cid] || new Date(e.occurred_at) > new Date(latestSubByCustomer[cid].occurred_at)) {
          latestSubByCustomer[cid] = e;
        }
      });

    const activeSubs = Object.values(latestSubByCustomer).filter(e => e.status === 'active' || e.status === 'trialing');
    const mrr = activeSubs.reduce((sum: number, e: any) => {
      const monthly = e.price_id ? (PRICE_MONTHLY_EUR[e.price_id] || 0) : 0;
      return sum + monthly;
    }, 0);

    // Revenue by month (invoice.payment_succeeded amounts)
    const revenueByMonth: Record<string, number> = {};
    stripeEventRows
      .filter(e => e.type === 'invoice.payment_succeeded' && e.amount)
      .forEach(e => {
        const month = new Date(e.occurred_at).toISOString().slice(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + e.amount;
      });
    const revenueTrend = Object.entries(revenueByMonth)
      .map(([month, amount_cents]) => ({ month, amount_cents, amount_eur: +(amount_cents / 100).toFixed(2) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // New subscriptions per month (subscription.created)
    const newSubsByMonth: Record<string, number> = {};
    stripeEventRows
      .filter(e => e.type === 'customer.subscription.created')
      .forEach(e => {
        const month = new Date(e.occurred_at).toISOString().slice(0, 7);
        newSubsByMonth[month] = (newSubsByMonth[month] || 0) + 1;
      });
    const newSubsTrend = Object.entries(newSubsByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Churn per month (subscription.deleted)
    const churnByMonth: Record<string, number> = {};
    stripeEventRows
      .filter(e => e.type === 'customer.subscription.deleted')
      .forEach(e => {
        const month = new Date(e.occurred_at).toISOString().slice(0, 7);
        churnByMonth[month] = (churnByMonth[month] || 0) + 1;
      });

    // Failed payments last 30d
    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 86400000);
    const failedPayments30d = stripeEventRows.filter(
      e => (e.type === 'invoice.payment_failed' || e.type === 'payment_intent.payment_failed')
        && new Date(e.occurred_at) > thirtyDaysAgoDate
    ).length;

    // Revenue last 30d
    const revenue30d = stripeEventRows
      .filter(e => e.type === 'invoice.payment_succeeded' && new Date(e.occurred_at) > thirtyDaysAgoDate && e.amount)
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    // Plan distribution from active subs
    const planDist: Record<string, number> = {};
    activeSubs.forEach((e: any) => {
      const tier = e.price_id ? (
        PRICE_MONTHLY_EUR[e.price_id] !== undefined ? e.price_id : 'other'
      ) : 'other';
      // Map price_id to friendly label using existing PRICE_TO_TIER equivalent
      const PRICE_LABEL: Record<string, string> = {
        'price_1TGNcrFzCo1FYIKTi8wM0AlR': 'Lite',
        'price_1TDCwIFzCo1FYIKTTwEkUipa': 'Starter',
        'price_1T3xknFzCo1FYIKTI3bw6ex2': 'Agency',
        'price_1TDCwxFzCo1FYIKTGXx9bBw3': 'Pro',
        'price_1TFlD3FzCo1FYIKTtMMkvi37': 'Starter Annual',
        'price_1TFlEJFzCo1FYIKT7giujZVx': 'Agency Annual',
        'price_1TFlRUFzCo1FYIKTeJAppMHE': 'Pro Annual',
        'price_1TI4oKFzCo1FYIKTtbbSbj0h': 'Mensile',
        'price_1TI5AbFzCo1FYIKTzfpV41Ic': 'Trimestrale',
        'price_1TI5B8FzCo1FYIKTS3UqmlX6': 'Annuale',
      };
      const label = (e.price_id && PRICE_LABEL[e.price_id]) || e.price_id || 'Other';
      planDist[label] = (planDist[label] || 0) + 1;
    });
    const planDistribution = Object.entries(planDist)
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count);

    const stripeStats = {
      hasData: stripeEventRows.length > 0,
      totalEvents: stripeEventRows.length,
      mrr_cents: mrr,
      mrr_eur: +(mrr / 100).toFixed(2),
      active_subscriptions: activeSubs.length,
      revenue_30d_cents: revenue30d,
      revenue_30d_eur: +(revenue30d / 100).toFixed(2),
      failed_payments_30d: failedPayments30d,
      revenueTrend,
      newSubsTrend,
      churnByMonth: Object.entries(churnByMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      planDistribution,
      recentEvents: stripeEventRows.slice(0, 20).map(e => ({
        id: e.id,
        type: e.type,
        customer_email: e.customer_email,
        amount_eur: e.amount ? +(e.amount / 100).toFixed(2) : null,
        status: e.status,
        occurred_at: e.occurred_at,
      })),
    };

    // All users including admin/test — used only for Ambassador page
    const allUsersForAmbassador = creditRows.map((c: any) => ({
      email: c.email || "(no email)",
      subscription_type: c.subscription_type || "free",
      credits: c.credits,
      total_earned: c.total_earned,
      total_spent: c.total_spent,
      onboarding_completed: c.onboarding_completed,
      properties_saved: userPropCount[c.user_id]?.saved || 0,
      full_analyses: userTxCount[c.user_id]?.full_analyses || 0,
      created_at: c.created_at,
      last_sign_in_at: authSignInMap[c.user_id] ?? null,
      pdf_reports: userTxCount[c.user_id]?.pdf_reports || 0,
      zone_analyses: userTxCount[c.user_id]?.zone_analyses || 0,
      staging_photos: userStagingCount[c.user_id] || 0,
      staging_photo_by_style: userExportCount[c.user_id]?.staging_photo_by_style || {},
      post_png_exports: userExportCount[c.user_id]?.post_png || 0,
      post_png_by_size: userExportCount[c.user_id]?.post_png_by_size || {},
      post_png_by_template: userExportCount[c.user_id]?.post_png_by_template || {},
      post_video_exports: userExportCount[c.user_id]?.post_video || 0,
      staging_video_exports: userExportCount[c.user_id]?.staging_video || 0,
      team: userTeamInfo[c.user_id] || null,
    }));

    // Aggregate AI video template usage
    const aiVideoTemplateCounts: Record<string, number> = {};
    const aiVideoModelCounts: Record<string, number> = {};
    aiVideoEventRows.forEach((e) => {
      if (e.template) {
        aiVideoTemplateCounts[e.template] = (aiVideoTemplateCounts[e.template] || 0) + 1;
      }
      if (e.ai_model) {
        aiVideoModelCounts[e.ai_model] = (aiVideoModelCounts[e.ai_model] || 0) + 1;
      }
    });
    const aiVideoStats = {
      total: aiVideoEventRows.length,
      top_templates: Object.entries(aiVideoTemplateCounts)
        .map(([template, count]) => ({ template, count }))
        .sort((a, b) => b.count - a.count),
      models: Object.entries(aiVideoModelCounts)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count),
    };

    return NextResponse.json({
      retention,
      retention_months: retentionMonths,
      emailStats,
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
      allUsers,
      allUsersForAmbassador,
      sectionUnlocks,
      teamsStats,
      exportAggregates,
      aiVideoStats,
      stripeStats,
      summary: {
        totalUsers: users.total,
        totalProperties,
        totalUniquePropertyUsers,
        totalSpent,
        active7d: sessions.active_7d,
        usersWithAnalysis,
        totalUsersWithProperties,
        totalFullAnalyses: totalFullAnalysesTx,
        usersWithUnlockedSection,
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
