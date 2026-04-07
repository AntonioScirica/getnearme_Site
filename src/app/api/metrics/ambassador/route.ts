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
    .select("user_id, email, subscription_type")
    .eq("email", email)
    .single();

  if (fetchError || !creditRow) {
    return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
  }

  const newSubscriptionType = ambassador ? "ambassador" : "free";

  const { error: updateError } = await admin
    .from("user_credits")
    .update({ subscription_type: newSubscriptionType })
    .eq("user_id", creditRow.user_id);

  if (updateError) {
    console.error("Ambassador update error:", updateError);
    return NextResponse.json({ error: "Aggiornamento fallito" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email,
    subscription_type: newSubscriptionType,
  });
}
