// Shared helper for Edge Functions that send email through Resend.
//
// Edge Functions used to inline the full HTML; now they fetch the current
// version from `email_templates` so the metrics dashboard can edit them
// without a redeploy. We keep an in-memory cache per Function instance to
// avoid one DB round trip per email in cron loops.

const CACHE_TTL_MS = 5 * 60 * 1000

interface CachedTemplate {
  template: EmailTemplate
  fetchedAt: number
}

export interface EmailTemplate {
  id: string
  subject: string
  preheader: string | null
  html_body: string
  updated_at: string
}

const cache = new Map<string, CachedTemplate>()

export async function loadTemplate(
  id: string,
  supabaseUrl: string,
  serviceRoleKey: string,
  opts: { skipCache?: boolean } = {},
): Promise<EmailTemplate> {
  if (!opts.skipCache) {
    const hit = cache.get(id)
    if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
      return hit.template
    }
  }

  const url = `${supabaseUrl}/rest/v1/email_templates?id=eq.${encodeURIComponent(id)}&select=id,subject,preheader,html_body,updated_at`
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Template fetch failed (${id}): HTTP ${res.status}`)
  }

  const rows = (await res.json()) as EmailTemplate[]
  if (!rows.length) {
    throw new Error(`Email template not found: ${id}`)
  }

  const template = rows[0]
  cache.set(id, { template, fetchedAt: Date.now() })
  return template
}

// Replace `{{var}}` placeholders. Values are NOT html-escaped here:
// the caller is responsible for escaping anything user-supplied. Static
// templates that include user content already escape via their own helpers.
export function renderString(input: string, vars: Record<string, string | number | null | undefined>): string {
  let out = input
  for (const [key, value] of Object.entries(vars)) {
    const safe = value == null ? '' : String(value)
    out = out.split(`{{${key}}}`).join(safe)
  }
  return out
}

export function renderTemplate(
  template: EmailTemplate,
  vars: Record<string, string | number | null | undefined>,
): { subject: string; html: string; preheader: string } {
  return {
    subject: renderString(template.subject, vars),
    html: renderString(template.html_body, vars),
    preheader: template.preheader ? renderString(template.preheader, vars) : '',
  }
}

// Helper used by callers that need to escape user-controlled data before
// substituting it into the HTML.
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
