import { NextRequest, NextResponse } from "next/server";

// Content pipeline cron endpoints (ported from ai-for-dumbs).
// The handlers are Express-style (req, res); this route adapts them to Next.js.
// Called by cron-job.org with ?secret=<CRON_SECRET>.

export const dynamic = "force-dynamic";
export const maxDuration = 300; // generate renders carousels with Puppeteer

type ExpressHandler = (
  req: { query: Record<string, string>; headers: Record<string, string> },
  res: ShimRes
) => Promise<unknown>;

interface ShimRes {
  status(code: number): ShimRes;
  json(body: unknown): ShimRes;
  setHeader(name: string, value: string): ShimRes;
}

const LOADERS: Record<string, () => Promise<{ default: ExpressHandler }>> = {
  discover: () => import("@/lib/social/cron/discover.js"),
  plan: () => import("@/lib/social/cron/plan.js"),
  generate: () => import("@/lib/social/cron/generate.js"),
  publish: () => import("@/lib/social/cron/publish.js"),
  "generate-ped": () => import("@/lib/social/cron/generate-ped.js"),
  "publish-ped": () => import("@/lib/social/cron/publish-ped.js"),
  "ped-insights": () => import("@/lib/social/cron/ped-insights.js"),
  "monthly-plan": () => import("@/lib/social/cron/monthly-plan.js"),
  "fetch-stats": () => import("@/lib/social/cron/fetch-stats.js"),
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const loader = LOADERS[action];
  if (!loader) {
    return NextResponse.json(
      { error: `Unknown action "${action}"`, valid: Object.keys(LOADERS) },
      { status: 404 }
    );
  }

  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k.toLowerCase()] = v;
  });
  // Self-invoke URLs are built from req.headers.host
  if (!headers.host) headers.host = url.host;

  let statusCode = 200;
  let body: unknown = null;
  const res: ShimRes = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(b: unknown) {
      body = b;
      return this;
    },
    setHeader() {
      return this;
    },
  };

  try {
    const mod = await loader();
    await mod.default({ query, headers }, res);
    return NextResponse.json(body ?? { ok: true }, { status: statusCode });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[social/cron/${action}] error:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
