import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// To-do del team per la dashboard Metrics (pagina Tasks). Stesso pattern di
// /api/crm: service role + x-metrics-key, la tabella non ha policy client.
// action:"notify" manda una mail (Resend) alle persone taggate sul task.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const METRICS_KEY = "ZuoQ6k*_6wmBbUQQim!B";

const FIELDS = ["title", "notes", "assignee", "status", "due_date", "tagged_emails"];
const STATUSES = new Set(["todo", "doing", "done"]);

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
  if ("status" in out && !STATUSES.has(String(out.status))) delete out.status;
  if ("tagged_emails" in out && !Array.isArray(out.tagged_emails)) delete out.tagged_emails;
  return out;
}

type TaskRow = {
  id: string; title: string; notes: string | null; assignee: string | null;
  status: string; due_date: string | null; tagged_emails: string[] | null;
};

async function notifyTagged(task: TaskRow): Promise<number> {
  const apiKey = process.env.RESEND_API_KEY;
  const emails = (task.tagged_emails || []).filter((e) => /.+@.+\..+/.test(e));
  if (!apiKey || emails.length === 0) return 0;
  const due = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let sent = 0;
  for (const to of emails) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "GetNearMe <noreply@getnearme.it>",
          to,
          subject: `Sei stato taggato su una task: ${task.title}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px">
              <h2 style="margin:0 0 8px">${esc(task.title)}</h2>
              ${task.notes ? `<p style="color:#444;margin:0 0 12px">${esc(task.notes)}</p>` : ""}
              <p style="color:#666;font-size:14px;margin:0 0 4px">Assegnata a: <b>${esc(task.assignee || "—")}</b></p>
              ${due ? `<p style="color:#666;font-size:14px;margin:0 0 4px">Scadenza: <b>${due}</b></p>` : ""}
              <p style="color:#666;font-size:14px;margin:0 0 16px">Stato: <b>${task.status === "todo" ? "Da fare" : task.status === "doing" ? "In corso" : "Fatto"}</b></p>
              <a href="https://www.getnearme.it/metrics" style="color:#3B83F6">Apri la board →</a>
            </div>`,
        }),
      });
      if (res.ok) sent++;
      else console.error("tasks notify error:", res.status, await res.text().catch(() => ""));
    } catch (e) {
      console.error("tasks notify exception:", (e as Error)?.message);
    }
  }
  return sent;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await admin()
    .from("matrix_tasks").select("*")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data || [] });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Rimanda la mail alle persone taggate su un task esistente.
  if (body.action === "notify") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { data: task, error } = await admin().from("matrix_tasks").select("*").eq("id", body.id).single();
    if (error || !task) return NextResponse.json({ error: error?.message || "not found" }, { status: 404 });
    const sent = await notifyTagged(task as TaskRow);
    return NextResponse.json({ sent });
  }

  if (!body.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
  const { data, error } = await admin().from("matrix_tasks").insert(pick(body)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Taggare = notificare: chi viene taggato alla creazione riceve subito la mail.
  const sent = (data.tagged_emails?.length ?? 0) > 0 ? await notifyTagged(data as TaskRow) : 0;
  return NextResponse.json({ task: data, sent });
}

export async function PATCH(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const patch = { ...pick(body), updated_at: new Date().toISOString() };
  const { data, error } = await admin().from("matrix_tasks").update(patch).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await admin().from("matrix_tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
