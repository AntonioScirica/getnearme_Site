import { NextRequest, NextResponse } from "next/server";

// Meta (Facebook) Ads performance for the metrics dashboard.
// Reads a System User token + ad account id from env and pulls insights from the
// Marketing API. Read-only (ads_read).
const TOKEN = process.env.FB_ADS_TOKEN || "";
const ACCOUNT = process.env.FB_ADS_ACCOUNT_ID || ""; // e.g. act_3994668350826300
const GRAPH = "https://graph.facebook.com/v23.0";

// UI range → Meta date_preset.
const PRESETS: Record<string, string> = {
  today: "today",
  "7d": "last_7d",
  "30d": "last_30d",
  max: "maximum",
};

const num = (v: unknown) => (v == null ? 0 : Number(v));

// Map Meta action arrays → a flat {type: value} dict.
function flatActions(arr: { action_type: string; value: string }[] | undefined) {
  const o: Record<string, number> = {};
  for (const a of arr || []) o[a.action_type] = num(a.value);
  return o;
}

export async function GET(request: NextRequest) {
  if (request.headers.get("x-metrics-key") !== "ZuoQ6k*_6wmBbUQQim!B") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!TOKEN || !ACCOUNT) {
    return NextResponse.json({ error: "FB_ADS_TOKEN / FB_ADS_ACCOUNT_ID not configured" }, { status: 503 });
  }

  const range = request.nextUrl.searchParams.get("range") || "max";
  const preset = PRESETS[range] || "maximum";

  try {
    const insFields =
      "campaign_name,spend,impressions,reach,frequency,clicks,inline_link_clicks,ctr,cpc,cpm,actions,cost_per_action_type";

    const [campRes, insRes] = await Promise.all([
      fetch(`${GRAPH}/${ACCOUNT}/campaigns?fields=name,effective_status,objective,daily_budget,lifetime_budget,start_time&limit=100&access_token=${TOKEN}`),
      fetch(`${GRAPH}/${ACCOUNT}/insights?level=campaign&date_preset=${preset}&limit=100&fields=${insFields}&access_token=${TOKEN}`),
    ]);
    const campJson = await campRes.json();
    const insJson = await insRes.json();
    if (campJson.error) return NextResponse.json({ error: campJson.error.message }, { status: 502 });
    if (insJson.error) return NextResponse.json({ error: insJson.error.message }, { status: 502 });

    // status/budget/objective by campaign name
    const meta: Record<string, { status: string; objective: string; budget: number | null }> = {};
    for (const c of campJson.data || []) {
      const b = c.daily_budget || c.lifetime_budget;
      meta[c.name] = {
        status: c.effective_status || "",
        objective: c.objective || "",
        budget: b ? num(b) / 100 : null,
      };
    }

    const campaigns = (insJson.data || []).map((r: Record<string, unknown>) => {
      const acts = flatActions(r.actions as never);
      const cpa = flatActions(r.cost_per_action_type as never);
      const name = String(r.campaign_name || "");
      const m = meta[name] || { status: "", objective: "", budget: null };
      const leads = acts["lead"] || acts["offsite_conversion.fb_pixel_lead"] || acts["onsite_conversion.lead_grouped"] || 0;
      const purchases = acts["purchase"] || acts["offsite_conversion.fb_pixel_purchase"] || 0;
      const costPerLead = cpa["lead"] || cpa["offsite_conversion.fb_pixel_lead"] || cpa["onsite_conversion.lead_grouped"] || 0;
      return {
        name,
        status: m.status,
        objective: m.objective,
        budget: m.budget,
        spend: num(r.spend),
        impressions: num(r.impressions),
        reach: num(r.reach),
        frequency: num(r.frequency),
        clicks: num(r.clicks),
        linkClicks: num(r.inline_link_clicks),
        ctr: num(r.ctr),
        cpc: num(r.cpc),
        cpm: num(r.cpm),
        landingViews: acts["landing_page_view"] || 0,
        leads,
        purchases,
        costPerLead,
      };
    });

    const totals = campaigns.reduce(
      (t: Record<string, number>, c: Record<string, number>) => ({
        spend: t.spend + c.spend,
        impressions: t.impressions + c.impressions,
        reach: t.reach + c.reach,
        clicks: t.clicks + c.clicks,
        linkClicks: t.linkClicks + c.linkClicks,
        leads: t.leads + c.leads,
        purchases: t.purchases + c.purchases,
      }),
      { spend: 0, impressions: 0, reach: 0, clicks: 0, linkClicks: 0, leads: 0, purchases: 0 }
    );

    return NextResponse.json({ range, account: ACCOUNT, campaigns, totals });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
