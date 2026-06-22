import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Current month in Europe/Rome, format YYYY-MM (matches quota_month convention).
function romeMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

// Reset a single user's AI quotas back to their max (full availability):
//   - Video   (user_ai_video_quota)                 → used=0 + extra_credits=extra_total
//             remaining = max(0, monthly_limit - used) + extra_credits, so free users
//             (monthly_limit=0, max in extra_credits) need extra_credits restored too.
//   - Foto AI (user_staging_quota.photo_credits)    → monthly_limit (paid) or 5 (free)
//   - Post    (user_staging_quota.post_credits)     → max(current, 5)
//   - Montaggio (user_staging_quota.montaggio_credits) → max(current, 5)
export async function POST(request: NextRequest) {
  const authKey = request.headers.get("x-metrics-key");
  if (authKey !== "ZuoQ6k*_6wmBbUQQim!B") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { user_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const userId = (body.user_id || "").trim();
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const admin = getAdmin();
  const month = romeMonth();
  const now = new Date().toISOString();
  const result: Record<string, unknown> = {};

  // 1) Video quota — used counter back to 0
  try {
    const { data: vq } = await admin
      .from("user_ai_video_quota")
      .select("extra_total")
      .eq("user_id", userId)
      .maybeSingle();
    if (vq) {
      const { error } = await admin
        .from("user_ai_video_quota")
        .update({
          used: 0,
          extra_credits: vq.extra_total ?? 0,
          quota_month: month,
          updated_at: now,
        })
        .eq("user_id", userId);
      result.video = error ? `error: ${error.message}` : "reset";
    } else {
      result.video = "no_row";
    }
  } catch (e) {
    result.video = `error: ${(e as Error).message}`;
  }

  // 2) Staging quota — photo / post / montaggio remaining counters back to max
  try {
    const { data: sq } = await admin
      .from("user_staging_quota")
      .select("monthly_limit, photo_credits, post_credits, montaggio_credits")
      .eq("user_id", userId)
      .maybeSingle();
    if (sq) {
      const photoMax = sq.monthly_limit != null ? sq.monthly_limit : 5;
      const postMax = Math.max(sq.post_credits ?? 0, 5);
      const montMax = Math.max(sq.montaggio_credits ?? 0, 5);
      const { error } = await admin
        .from("user_staging_quota")
        .update({
          photo_credits: photoMax,
          post_credits: postMax,
          montaggio_credits: montMax,
          quota_month: month,
          updated_at: now,
        })
        .eq("user_id", userId);
      result.staging = error
        ? `error: ${error.message}`
        : { photo: photoMax, post: postMax, montaggio: montMax };
    } else {
      result.staging = "no_row";
    }
  } catch (e) {
    result.staging = `error: ${(e as Error).message}`;
  }

  return NextResponse.json({ ok: true, user_id: userId, month, result });
}
