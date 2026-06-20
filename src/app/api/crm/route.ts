import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const METRICS_KEY = "ZuoQ6k*_6wmBbUQQim!B";
const ACCOUNT = "getnearme";

// Columns a client may write. Server controls id/account/timestamps.
const FIELDS = [
  "owner", "contact_name", "agency", "phone", "email", "city",
  "status", "source", "notes", "next_action_at", "plan", "value_eur",
];

function admin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
function authed(req: NextRequest) {
  return req.headers.get("x-metrics-key") === METRICS_KEY;
}
function pick(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of FIELDS) if (k in obj) out[k] = obj[k] === "" ? null : obj[k];
  return out;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("crm_contacts").select("*").eq("account_id", ACCOUNT)
    .order("updated_at", { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data || [] });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.contact_name?.trim()) return NextResponse.json({ error: "contact_name required" }, { status: 400 });
  const row = { ...pick(body), account_id: ACCOUNT };
  const { data, error } = await admin().from("crm_contacts").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}

export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const patch = { ...pick(body), updated_at: new Date().toISOString() };
  const { data, error } = await admin().from("crm_contacts").update(patch).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contact: data });
}

export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await admin().from("crm_contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
