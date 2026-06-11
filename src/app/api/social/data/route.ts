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

      const { data: posts, error: pErr } = await supabase
        .from("post_metrics")
        .select(
          "id, content_id, ig_post_id, publish_date, impressions, reach, saves, shares, comments, likes, plays, total_interactions, save_rate, share_rate, engagement_rate, content_type, rubric, hook_text, cta_text, fetched_at"
        )
        .eq("account_id", ACCOUNT)
        .gte("publish_date", since)
        .order("publish_date", { ascending: false });
      if (pErr) throw pErr;

      // Attach slide thumbnails + captions for the posts we have
      const contentIds = (posts || [])
        .map((p) => p.content_id)
        .filter((id): id is number => id != null);
      let contentById: Record<number, { image_urls: string[] | null; content_data: { caption?: string } | null }> = {};
      if (contentIds.length > 0) {
        const { data: contents } = await supabase
          .from("generated_content")
          .select("id, image_urls, content_data")
          .in("id", contentIds);
        contentById = Object.fromEntries((contents || []).map((c) => [c.id, c]));
      }

      const { data: insights } = await supabase
        .from("performance_insights")
        .select("id, week_start, week_end, insights, applied, created_at")
        .eq("account_id", ACCOUNT)
        .order("week_start", { ascending: false })
        .limit(8);

      return NextResponse.json({
        days,
        posts: (posts || []).map((p) => ({
          ...p,
          thumbnail: p.content_id != null ? contentById[p.content_id]?.image_urls?.[0] || null : null,
          caption: p.content_id != null ? contentById[p.content_id]?.content_data?.caption || null : null,
        })),
        insights: insights || [],
      });
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
