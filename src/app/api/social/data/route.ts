import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Data API for the social dashboard (/metrics/social).
// Views: calendar (topics + generated content by month), news, costs.

export const dynamic = "force-dynamic";

const METRICS_KEY = "ZuoQ6k*_6wmBbUQQim!B"; // same key as /api/metrics
const ACCOUNT = "getnearme";

function db() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim(),
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()
  );
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-metrics-key") !== METRICS_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "calendar";
  const supabase = db();

  try {
    if (view === "calendar") {
      // month = YYYY-MM (default: current month)
      const month =
        url.searchParams.get("month") ||
        new Date().toISOString().slice(0, 7);
      const from = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const to = `${month}-${String(lastDay).padStart(2, "0")}`;

      const { data: topics, error: tErr } = await supabase
        .from("content_topics")
        .select("id, plan_date, rubric, category, title, status, edition, template, slide_data")
        .eq("account_id", ACCOUNT)
        .gte("plan_date", from)
        .lte("plan_date", to)
        .order("plan_date")
        .order("created_at", { ascending: true });
      if (tErr) throw tErr;

      const { data: content, error: cErr } = await supabase
        .from("generated_content")
        .select(
          "id, topic_id, post_id, type, status, publish_date, published_at, ig_post_id, ig_story_id, image_urls, content_data"
        )
        .eq("account_id", ACCOUNT)
        .gte("publish_date", from)
        .lte("publish_date", to)
        .order("created_at", { ascending: false });
      if (cErr) throw cErr;

      return NextResponse.json({ month, topics: topics || [], content: content || [] });
    }

    if (view === "news") {
      const { data, error } = await supabase
        .from("ai_news_raw")
        .select("id, title, url, summary, source, source_type, published_at, discovered_at, metadata")
        .eq("account_id", ACCOUNT)
        .order("discovered_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return NextResponse.json({ news: data || [] });
    }

    if (view === "costs") {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("api_usage")
        .select("service, model, operation, input_tokens, output_tokens, cost_usd, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;

      const byDay: Record<string, { anthropic: number; replicate: number; total: number }> = {};
      const byOperation: Record<string, number> = {};
      let total = 0;
      for (const row of data || []) {
        const day = String(row.created_at).slice(0, 10);
        byDay[day] ??= { anthropic: 0, replicate: 0, total: 0 };
        const cost = Number(row.cost_usd) || 0;
        if (row.service === "anthropic") byDay[day].anthropic += cost;
        if (row.service === "replicate") byDay[day].replicate += cost;
        byDay[day].total += cost;
        byOperation[row.operation] = (byOperation[row.operation] || 0) + cost;
        total += cost;
      }
      return NextResponse.json({ totalUsd: total, byDay, byOperation, recent: (data || []).slice(0, 50) });
    }

    if (view === "performance") {
      const days = Math.min(Number(url.searchParams.get("days")) || 30, 365);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      // Le metriche vivono in generated_content.content_data.insights (scritte
      // dal cron ped-insights). La vecchia tabella post_metrics non viene mai
      // popolata, quindi leggiamo direttamente dal contenuto pubblicato.
      const { data: rows, error: pErr } = await supabase
        .from("generated_content")
        .select("id, ig_post_id, type, publish_date, image_urls, content_data")
        .eq("account_id", ACCOUNT)
        .eq("status", "published")
        .gte("publish_date", since)
        .not("ig_post_id", "is", null)
        .order("publish_date", { ascending: false });
      if (pErr) throw pErr;

      type Insights = {
        reach?: number; views?: number; impressions?: number; likes?: number;
        comments?: number; saved?: number; shares?: number; plays?: number;
        video_views?: number; total_interactions?: number; fetched_at?: string;
      };
      type ContentData = {
        insights?: Insights; caption?: string; rubric?: string;
        hook?: string; cta?: string;
      };

      const posts = (rows || [])
        .map((r) => {
          const cd = (r.content_data || {}) as ContentData;
          const ins = cd.insights || {};
          const reach = ins.reach ?? 0;
          const likes = ins.likes ?? 0;
          const comments = ins.comments ?? 0;
          const saves = ins.saved ?? 0;
          const shares = ins.shares ?? 0;
          const interactions = ins.total_interactions ?? likes + comments + saves + shares;
          return {
            id: r.id,
            content_id: r.id,
            ig_post_id: r.ig_post_id,
            publish_date: r.publish_date,
            impressions: ins.views ?? ins.impressions ?? 0,
            reach,
            saves,
            shares,
            comments,
            likes,
            plays: ins.plays ?? ins.video_views ?? 0,
            total_interactions: interactions,
            save_rate: reach ? saves / reach : 0,
            share_rate: reach ? shares / reach : 0,
            engagement_rate: reach ? interactions / reach : 0,
            content_type: r.type ?? null,
            rubric: cd.rubric ?? null,
            hook_text: cd.hook ?? null,
            cta_text: cd.cta ?? null,
            fetched_at: ins.fetched_at ?? null,
            thumbnail: r.image_urls?.[0] ?? null,
            caption: cd.caption ?? null,
            _hasInsights: ins.reach != null,
          };
        })
        // Solo post con insight raccolti (gli altri non hanno ancora metriche)
        .filter((p) => p._hasInsights)
        .map(({ _hasInsights, ...p }) => p);

      const { data: insights } = await supabase
        .from("performance_insights")
        .select("id, week_start, week_end, insights, applied, created_at")
        .eq("account_id", ACCOUNT)
        .order("week_start", { ascending: false })
        .limit(8);

      return NextResponse.json({ days, posts, insights: insights || [] });
    }

    if (view === "market-stats") {
      const { data, error } = await supabase
        .from("market_stats")
        .select("id, indicator, period, region, value, prev_value, unit, source, fetched_at")
        .eq("account_id", ACCOUNT)
        .order("period", { ascending: false })
        .limit(200);
      if (error) throw error;

      // Group by indicator for easy consumption
      const byIndicator: Record<string, typeof data> = {};
      for (const row of data || []) {
        (byIndicator[row.indicator] ??= []).push(row);
      }

      return NextResponse.json({ stats: data || [], byIndicator });
    }

    return NextResponse.json({ error: `Unknown view "${view}"` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
