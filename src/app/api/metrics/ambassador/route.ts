import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  const authKey = request.headers.get("x-metrics-key");
  if (authKey !== "ZuoQ6k*_6wmBbUQQim!B") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; ambassador?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, ambassador } = body;

  if (!email || typeof email !== "string" || email.length > 255) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (typeof ambassador !== "boolean") {
    return NextResponse.json({ error: "ambassador must be boolean" }, { status: 400 });
  }

  const admin = getAdmin();

  // Find user_id via user_credits.email first, fallback to auth.users scan
  let userId: string;
  let userEmail: string = email;
  let stripeCustomerId: string | null = null;
  let stripeSubId: string | null = null;
  let hasCreditRow = false;

  const { data: creditRow } = await admin
    .from("user_credits")
    .select("user_id, email, stripe_customer_id, stripe_agency_subscription_id")
    .eq("email", email)
    .maybeSingle();

  if (creditRow) {
    userId = creditRow.user_id;
    userEmail = creditRow.email ?? email;
    stripeCustomerId = creditRow.stripe_customer_id ?? null;
    stripeSubId = creditRow.stripe_agency_subscription_id ?? null;
    hasCreditRow = true;
  } else {
    // Fallback: search auth.users by email (paginate to handle >1000 users)
    let found = false;
    let page = 1;
    while (!found) {
      const { data: authList, error: authErr } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (authErr || !authList?.users?.length) break;
      const authUser = authList.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (authUser) {
        userId = authUser.id;
        userEmail = authUser.email ?? email;
        found = true;

        // Try to fetch user_credits by user_id
        const { data: cr2 } = await admin
          .from("user_credits")
          .select("user_id, email, stripe_customer_id, stripe_agency_subscription_id")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (cr2) {
          stripeCustomerId = cr2.stripe_customer_id ?? null;
          stripeSubId = cr2.stripe_agency_subscription_id ?? null;
          hasCreditRow = true;
        }
      }
      if (authList.users.length < 1000) break;
      page++;
    }
    if (!found) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    }
  }

  const newSubscriptionType = ambassador ? "ambassador" : "free";

  // Cancel all Stripe subscriptions when promoting to ambassador
  if (ambassador) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeCustomerId) {
      try {
        const subsResp = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${stripeCustomerId}&status=active&limit=100`,
          { headers: { Authorization: `Bearer ${stripeKey}` } }
        );
        if (subsResp.ok) {
          const subsData = await subsResp.json();
          for (const sub of (subsData.data ?? [])) {
            await fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${stripeKey}` },
            });
          }
        }
      } catch (err) {
        console.error("Stripe cancellation error:", err);
      }
    }
  }

  // Upsert user_credits (handles both existing and new rows)
  const upsertPayload: Record<string, unknown> = {
    user_id: userId!,
    email: userEmail,
    subscription_type: newSubscriptionType,
    stripe_agency_subscription_id: ambassador ? null : stripeSubId,
  };
  if (ambassador) {
    upsertPayload.credits = 15;
    upsertPayload.total_earned = 15;
    upsertPayload.total_spent = 0;
  }

  const { error: upsertError } = await admin
    .from("user_credits")
    .upsert(upsertPayload, { onConflict: "user_id" });

  if (upsertError) {
    console.error("Ambassador upsert error:", upsertError);
    return NextResponse.json({ error: "Aggiornamento fallito" }, { status: 500 });
  }

  // Ensure ambassador_accounts row exists (required for quota tracking)
  if (ambassador) {
    await admin.from("ambassador_accounts").upsert(
      {
        user_id: userId!,
        email: userEmail,
        photos_used: 0,
        videos_used: 0,
        posts_used: 0,
        reports_used: 0,
        quota_month: "",
        monthly_limit: 15,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );

    await admin.from("credit_transactions").insert({
      user_id: userId!,
      transaction_type: "earn",
      reason: "ambassador_welcome",
      amount: 15,
      created_at: new Date().toISOString(),
    });
  }

  void hasCreditRow;

  return NextResponse.json({
    success: true,
    email,
    subscription_type: newSubscriptionType,
  });
}
