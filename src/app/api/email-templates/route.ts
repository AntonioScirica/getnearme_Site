import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";

const METRICS_KEY = "ZuoQ6k*_6wmBbUQQim!B";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function authed(req: NextRequest): boolean {
  return req.headers.get("x-metrics-key") === METRICS_KEY;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = getAdmin();
  const { data, error } = await admin
    .from("email_templates")
    .select(
      "id, audience, title, subject, preheader, variables, trigger_note, source_note, updated_at, updated_by",
    )
    .order("audience", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ templates: data ?? [] });
}

// POST /api/email-templates  → seed table from public/email-previews/*.html
// Run once, or after a redeploy that ships new defaults.
export async function POST(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const admin = getAdmin();

  if (!force) {
    const { count } = await admin
      .from("email_templates")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return NextResponse.json({
        message: "Already seeded. Pass ?force=1 to overwrite.",
        count,
      });
    }
  }

  const seeds = await loadSeedTemplates();

  const { error } = await admin
    .from("email_templates")
    .upsert(seeds, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ seeded: seeds.length, ids: seeds.map((s) => s.id) });
}

async function loadSeedTemplates() {
  const dir = path.join(process.cwd(), "public", "email-previews");

  const defs: SeedDef[] = [
    {
      id: "welcome",
      file: "01-welcome.html",
      audience: "user",
      title: "Welcome · estensione",
      subject: "Il tuo account GetNearMe è attivo",
      preheader: "Account attivo. Tutto pronto per iniziare.",
      variables: ["user_name"],
      trigger_note: "Email confermata · signup_source=extension (default)",
      source_note: "supabase/functions/welcome-email",
    },
    {
      id: "daily-bonus-it",
      file: "02-daily-bonus.html",
      audience: "user",
      title: "Promemoria giornaliero (IT)",
      subject: "Promemoria account · Giorno {{streak_day}}",
      preheader: "Il bonus crediti di oggi è disponibile fino a mezzanotte.",
      variables: ["streak_day", "credits", "claim_url", "unsubscribe_url"],
      trigger_note: "Cron giornaliero (CRON_SECRET)",
      source_note: "supabase/functions/send-daily-bonus-emails",
    },
    {
      id: "team-invite",
      file: "03-team-invite.html",
      audience: "user",
      title: "Invito al team",
      subject: "{{owner_name}} ti invita nel team {{team_name}}",
      preheader:
        "Accetta l'invito installando GetNearMe e accedendo con questa email.",
      variables: ["owner_name", "team_name", "invitee_email"],
      trigger_note: "Owner crea invito da pannello agenzia",
      source_note: "supabase/functions/manage-team",
    },
    {
      id: "ai-video-ready",
      file: "04-ai-video-ready.html",
      audience: "user",
      title: "Video AI pronto",
      subject: "Il tuo video è pronto · {{property_address_short}}",
      preheader: "Scarica il video in MP4. Link valido 7 giorni.",
      variables: [
        "user_name",
        "property_address",
        "property_address_short",
        "video_download_url",
        "aspect_ratio",
        "duration_seconds",
      ],
      trigger_note: "Lambda render-ai-video-final completa il job",
      source_note: "AWS Lambda (render-ai-video-final)",
    },
    {
      id: "support-internal",
      file: "05-support-internal.html",
      audience: "internal",
      title: "Richiesta supporto",
      subject: "[Supporto] {{type_label}} · {{user_email}}",
      preheader: null,
      variables: [
        "type_label",
        "timestamp",
        "user_name",
        "user_email",
        "user_id",
        "message",
      ],
      trigger_note: "send-support-email (POST dal pannello)",
      source_note: "supabase/functions/send-support-email",
    },
    {
      id: "account-deleted",
      file: "06-account-deleted-internal.html",
      audience: "internal",
      title: "Account eliminato",
      subject: "[Account eliminato] {{user_email}}",
      preheader: null,
      variables: [
        "user_id",
        "user_email",
        "user_name",
        "created_at",
        "deleted_at",
        "credits",
        "subscription_type",
        "stripe_sub_id",
        "stripe_status",
        "referral_code",
        "properties_count",
        "referrals_count",
      ],
      trigger_note: "delete-account (utente cancella il proprio account)",
      source_note: "supabase/functions/delete-account",
    },
    {
      id: "selector-alert",
      file: "07-selector-alert-internal.html",
      audience: "internal",
      title: "Alert selettore CSS",
      subject: "[Alert] Selettore non funzionante · {{nome}}",
      preheader: null,
      variables: [
        "nome",
        "url",
        "failure_count",
        "timestamp",
        "selector_failed_1",
        "selector_failed_2",
        "selector_failed_3",
        "selector_ok_1",
        "selector_ok_2",
      ],
      trigger_note:
        "2 fallimenti CSS consecutivi → Edge Function selector-health-alert",
      source_note: "supabase/functions/selector-health-alert",
    },
    {
      id: "purchase-confirmed",
      file: "08-purchase-confirmed.html",
      audience: "user",
      title: "Acquisto confermato",
      subject: "Acquisto confermato · {{plan_name}}",
      preheader: "Il tuo piano {{plan_name}} è attivo.",
      variables: ["user_name", "plan_name"],
      trigger_note: "checkout.session.completed (Stripe webhook, agency tier)",
      source_note: "supabase/functions/stripe-webhook",
    },
    {
      id: "subscription-updated",
      file: "09-subscription-updated.html",
      audience: "user",
      title: "Piano aggiornato",
      subject: "Piano aggiornato · {{new_plan_name}}",
      preheader: "Il tuo piano è stato aggiornato a {{new_plan_name}}.",
      variables: ["user_name", "new_plan_name"],
      trigger_note: "customer.subscription.updated (cambio tier)",
      source_note: "supabase/functions/stripe-webhook",
    },
    {
      id: "subscription-cancelled",
      file: "10-subscription-cancelled.html",
      audience: "user",
      title: "Abbonamento cancellato",
      subject: "Abbonamento cancellato · {{plan_name}}",
      preheader: "Il tuo abbonamento GetNearMe è stato cancellato.",
      variables: ["user_name", "plan_name"],
      trigger_note: "customer.subscription.updated (cancel_at_period_end)",
      source_note: "supabase/functions/stripe-webhook",
    },
  ];

  return Promise.all(
    defs.map(async (d) => {
      const html = await fs.readFile(path.join(dir, d.file), "utf-8");
      return {
        id: d.id,
        audience: d.audience,
        title: d.title,
        subject: d.subject,
        preheader: d.preheader,
        html_body: html,
        variables: d.variables,
        trigger_note: d.trigger_note,
        source_note: d.source_note,
        updated_by: "seed",
      };
    }),
  );
}

interface SeedDef {
  id: string;
  file: string;
  audience: "user" | "internal";
  title: string;
  subject: string;
  preheader: string | null;
  variables: string[];
  trigger_note: string;
  source_note: string;
}
