import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const METRICS_KEY = "ZuoQ6k*_6wmBbUQQim!B";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MAX_HTML_BYTES = 200_000;
const MAX_SUBJECT_LEN = 250;
const MAX_PREHEADER_LEN = 250;

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authed(req: NextRequest): boolean {
  return req.headers.get("x-metrics-key") === METRICS_KEY;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = getAdmin();
  const { data, error } = await admin
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ template: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: {
    subject?: string;
    preheader?: string | null;
    html_body?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_by: "dashboard" };

  if (typeof body.subject === "string") {
    if (body.subject.length > MAX_SUBJECT_LEN) {
      return NextResponse.json({ error: "Subject too long" }, { status: 400 });
    }
    update.subject = body.subject;
  }

  if (body.preheader === null || typeof body.preheader === "string") {
    if (body.preheader && body.preheader.length > MAX_PREHEADER_LEN) {
      return NextResponse.json(
        { error: "Preheader too long" },
        { status: 400 },
      );
    }
    update.preheader = body.preheader;
  }

  if (typeof body.html_body === "string") {
    if (Buffer.byteLength(body.html_body, "utf-8") > MAX_HTML_BYTES) {
      return NextResponse.json({ error: "HTML too large" }, { status: 400 });
    }
    if (/<script\b/i.test(body.html_body)) {
      return NextResponse.json(
        { error: "<script> tags are not allowed in email templates" },
        { status: 400 },
      );
    }
    update.html_body = body.html_body;
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const admin = getAdmin();
  const { data, error } = await admin
    .from("email_templates")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ template: data });
}
