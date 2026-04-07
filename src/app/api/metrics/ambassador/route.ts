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

  // Find user in user_credits by email
  const { data: creditRow, error: fetchError } = await admin
    .from("user_credits")
    .select("user_id, email, subscription_type, stripe_customer_id, stripe_agency_subscription_id")
    .eq("email", email)
    .single();

  if (fetchError || !creditRow) {
    return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
  }

  const newSubscriptionType = ambassador ? "ambassador" : "free";

  // Cancel all Stripe subscriptions when promoting to ambassador
  if (ambassador) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const customerId = (creditRow as Record<string, unknown>).stripe_customer_id as string | null;
    const agencySubId = (creditRow as Record<string, unknown>).stripe_agency_subscription_id as string | null;

    if (stripeKey && customerId) {
      try {
        // Fetch all active subscriptions for this customer
        const subsResp = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=100`,
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
        // Non-fatal: proceed with ambassador promotion anyway
      }
    }

    // Clear stripe subscription ID from DB
    await admin
      .from("user_credits")
      .update({ stripe_agency_subscription_id: null })
      .eq("user_id", creditRow.user_id);

    void agencySubId; // already cleared above
  }

  // When promoting to ambassador: reset credits with 15 earned (fresh start)
  const updatePayload: Record<string, unknown> = { subscription_type: newSubscriptionType };
  if (ambassador) {
    updatePayload.credits = 15;
    updatePayload.total_earned = 15;
    updatePayload.total_spent = 0;
  }

  const { error: updateError } = await admin
    .from("user_credits")
    .update(updatePayload)
    .eq("user_id", creditRow.user_id);

  if (updateError) {
    console.error("Ambassador update error:", updateError);
    return NextResponse.json({ error: "Aggiornamento fallito" }, { status: 500 });
  }

  // Ensure ambassador_accounts row exists (required for quota tracking)
  if (ambassador) {
    await admin.from("ambassador_accounts").upsert(
      {
        user_id: creditRow.user_id,
        email: creditRow.email,
        photos_used: 0,
        videos_used: 0,
        posts_used: 0,
        reports_used: 0,
        quota_month: "",
        monthly_limit: 15,
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
  }

  // Log the credit reset as a transaction
  if (ambassador) {
    await admin.from("credit_transactions").insert({
      user_id: creditRow.user_id,
      transaction_type: "earn",
      reason: "ambassador_welcome",
      amount: 15,
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    email,
    subscription_type: newSubscriptionType,
  });
}
