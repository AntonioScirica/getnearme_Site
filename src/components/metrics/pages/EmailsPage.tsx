"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail,
  ArrowLeft,
  ExternalLink,
  Search,
  Loader2,
  Save,
  Eye,
  Pencil,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { MONO } from "../types";

type EmailAudience = "user" | "internal";

interface EmailTemplateMeta {
  id: string;
  audience: EmailAudience;
  title: string;
  subject: string;
  preheader: string | null;
  variables: string[];
  trigger_note: string | null;
  source_note: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface EmailTemplateFull extends EmailTemplateMeta {
  html_body: string;
}

const AUDIENCE_LABEL: Record<EmailAudience, string> = {
  user: "Email all'utente",
  internal: "Notifiche interne (info@getnearme.it)",
};

const BADGE_STYLES: Record<EmailAudience, string> = {
  user: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  internal: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

function authHeader(): HeadersInit | undefined {
  if (typeof window === "undefined") return undefined;
  const key = sessionStorage.getItem("metrics_key");
  return key ? { "x-metrics-key": key } : undefined;
}

export default function EmailsPage() {
  const [list, setList] = useState<EmailTemplateMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);

  const fetchList = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/email-templates", {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { templates: EmailTemplateMeta[] };
      setList(json.templates);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!list) return [];
    if (!q) return list;
    return list.filter((e) =>
      [e.title, e.subject, e.id, e.source_note ?? "", e.trigger_note ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [list, q]);

  if (activeId) {
    return (
      <EmailDetail
        id={activeId}
        meta={list?.find((t) => t.id === activeId) ?? null}
        onBack={() => setActiveId(null)}
        onSaved={fetchList}
      />
    );
  }

  const grouped: Record<EmailAudience, EmailTemplateMeta[]> = {
    user: filtered.filter((e) => e.audience === "user"),
    internal: filtered.filter((e) => e.audience === "internal"),
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 mb-1">Email</h1>
          <p className={`${MONO} text-xs text-gray-500`}>
            Template inviati da Edge Functions e Lambda · modifica live qui →
            riflessa in produzione al prossimo invio
          </p>
        </div>
        <button
          onClick={fetchList}
          className={`${MONO} inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161920] border border-white/[0.08] text-xs text-gray-300 hover:border-indigo-500/40 transition-colors`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Aggiorna
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca email per titolo, oggetto, trigger…"
          className={`${MONO} w-full bg-[#161920] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors`}
        />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-red-300">
          {error}
        </div>
      )}

      {list === null && !error && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      )}

      {list && list.length === 0 && (
        <div className="rounded-xl bg-[#161920] border border-white/[0.08] p-8 text-center">
          <Mail className="w-8 h-8 mx-auto text-gray-600 mb-3" />
          <p className="text-sm text-gray-300 mb-1">
            Nessun template ancora caricato.
          </p>
          <p className={`${MONO} text-xs text-gray-500 mb-4`}>
            Importa i 7 template di default da public/email-previews.
          </p>
          <button
            onClick={seed}
            disabled={seeding}
            className={`${MONO} inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50`}
          >
            {seeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Importa default
          </button>
        </div>
      )}

      {list && list.length > 0 && (
        <>
          {(["user", "internal"] as EmailAudience[]).map((aud) =>
            grouped[aud].length === 0 ? null : (
              <div key={aud} className="mb-8">
                <p
                  className={`${MONO} text-[10px] font-semibold uppercase tracking-[0.6px] text-gray-500 mb-3`}
                >
                  {AUDIENCE_LABEL[aud]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grouped[aud].map((e) => (
                    <EmailCard
                      key={e.id}
                      email={e}
                      onClick={() => setActiveId(e.id)}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </>
      )}
    </div>
  );
}

function EmailCard({
  email,
  onClick,
}: {
  email: EmailTemplateMeta;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-[#161920] rounded-xl border border-white/[0.08] p-4 hover:border-indigo-500/40 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`${MONO} inline-flex items-center px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${BADGE_STYLES[email.audience]}`}
        >
          {email.audience === "user" ? "Utente" : "Interna"}
        </span>
        <span className={`${MONO} text-[10px] text-gray-600`}>
          {new Date(email.updated_at).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-100 mb-1 truncate">
        {email.title}
      </h3>
      <p
        className={`${MONO} text-[11px] text-gray-500 mb-3 line-clamp-2 leading-relaxed`}
      >
        {email.subject}
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
        <span className={`${MONO} text-[10px] text-gray-600 truncate pr-2`}>
          {email.id}
        </span>
        <span className="text-indigo-400 text-[11px] shrink-0 group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
    </button>
  );
}

function EmailDetail({
  id,
  meta,
  onBack,
  onSaved,
}: {
  id: string;
  meta: EmailTemplateMeta | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [tpl, setTpl] = useState<EmailTemplateFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"preview" | "edit">("preview");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [html, setHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(`/api/email-templates/${id}`, {
          headers: authHeader(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { template: EmailTemplateFull };
        if (cancel) return;
        setTpl(json.template);
        setSubject(json.template.subject);
        setPreheader(json.template.preheader ?? "");
        setHtml(json.template.html_body);
      } catch (e: unknown) {
        if (!cancel)
          setError(e instanceof Error ? e.message : "Fetch failed");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const dirty =
    tpl !== null &&
    (subject !== tpl.subject ||
      preheader !== (tpl.preheader ?? "") ||
      html !== tpl.html_body);

  const save = async () => {
    if (!tpl) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/email-templates/${id}`, {
        method: "PUT",
        headers: { ...authHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          preheader: preheader || null,
          html_body: html,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setTpl(json.template);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Preheader injected so live preview matches what Gmail will show.
  const previewSrcDoc = useMemo(() => {
    if (!html) return "";
    if (!preheader) return html;
    const phSpan = `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4f5f7;">${escapeHtml(
      preheader,
    )}</span>`;
    if (/<body[^>]*>/i.test(html)) {
      return html.replace(/<body([^>]*)>/i, `<body$1>${phSpan}`);
    }
    return phSpan + html;
  }, [html, preheader]);

  return (
    <div>
      <button
        onClick={onBack}
        className={`${MONO} inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-100 transition-colors mb-4`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Tutte le email
      </button>

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="min-w-0">
          {meta && (
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`${MONO} inline-flex items-center px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${BADGE_STYLES[meta.audience]}`}
              >
                {meta.audience === "user" ? "Utente" : "Interna"}
              </span>
              {meta.source_note && (
                <span className={`${MONO} text-[10px] text-gray-600`}>
                  {meta.source_note}
                </span>
              )}
            </div>
          )}
          <h1 className="text-2xl font-semibold text-gray-100 mb-1 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            {meta?.title ?? id}
          </h1>
          <p className={`${MONO} text-xs text-gray-500`}>
            {meta?.trigger_note ?? "—"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === "edit" && (
            <button
              onClick={save}
              disabled={!dirty || saving}
              className={`${MONO} inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                dirty
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              } disabled:opacity-60`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {savedFlash ? "Salvato" : "Salva"}
            </button>
          )}
          <a
            href={`/api/email-templates/${id}/preview-link`}
            onClick={(e) => {
              e.preventDefault();
              const w = window.open("", "_blank");
              if (w) {
                w.document.open();
                w.document.write(previewSrcDoc || html);
                w.document.close();
              }
            }}
            className={`${MONO} inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161920] border border-white/[0.08] text-xs text-gray-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-colors`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Apri
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] mb-4">
        <TabButton
          active={tab === "preview"}
          onClick={() => setTab("preview")}
          icon={<Eye className="w-3.5 h-3.5" />}
        >
          Anteprima
        </TabButton>
        <TabButton
          active={tab === "edit"}
          onClick={() => setTab("edit")}
          icon={<Pencil className="w-3.5 h-3.5" />}
        >
          Modifica {dirty && <span className="text-amber-400 ml-1">·</span>}
        </TabButton>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!tpl ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : tab === "preview" ? (
        <PreviewView
          subject={subject}
          preheader={preheader}
          srcDoc={previewSrcDoc}
          meta={meta}
          variables={tpl.variables}
        />
      ) : (
        <EditView
          subject={subject}
          setSubject={setSubject}
          preheader={preheader}
          setPreheader={setPreheader}
          html={html}
          setHtml={setHtml}
          srcDoc={previewSrcDoc}
          variables={tpl.variables}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`${MONO} inline-flex items-center gap-2 px-4 py-2.5 text-xs border-b-2 transition-colors ${
        active
          ? "border-indigo-500 text-indigo-300"
          : "border-transparent text-gray-500 hover:text-gray-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function PreviewView({
  subject,
  preheader,
  srcDoc,
  meta,
  variables,
}: {
  subject: string;
  preheader: string;
  srcDoc: string;
  meta: EmailTemplateMeta | null;
  variables: string[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-4">
      <div className="bg-[#161920] rounded-xl border border-white/[0.08] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          <span
            className={`${MONO} ml-3 text-[10px] uppercase tracking-wider text-gray-600 truncate`}
          >
            {subject}
          </span>
        </div>
        <iframe
          srcDoc={srcDoc}
          title={subject}
          sandbox=""
          className="w-full bg-white"
          style={{ height: "780px", border: 0 }}
        />
      </div>

      <div className="space-y-4">
        <MetaCard title="Header email">
          <MetaRow label="Oggetto" value={subject} mono />
          {preheader && <MetaRow label="Preheader" value={preheader} />}
          {meta?.updated_at && (
            <MetaRow
              label="Ultimo update"
              value={new Date(meta.updated_at).toLocaleString("it-IT")}
            />
          )}
          {meta?.updated_by && (
            <MetaRow label="Modificato da" value={meta.updated_by} mono />
          )}
        </MetaCard>

        {variables.length > 0 && (
          <MetaCard title="Placeholder disponibili">
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <code
                  key={v}
                  className={`${MONO} text-[11px] bg-black/30 text-gray-300 px-2 py-1 rounded border border-white/[0.06]`}
                >
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </MetaCard>
        )}
      </div>
    </div>
  );
}

function EditView({
  subject,
  setSubject,
  preheader,
  setPreheader,
  html,
  setHtml,
  srcDoc,
  variables,
}: {
  subject: string;
  setSubject: (v: string) => void;
  preheader: string;
  setPreheader: (v: string) => void;
  html: string;
  setHtml: (v: string) => void;
  srcDoc: string;
  variables: string[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Editor */}
      <div className="space-y-3">
        <Field label="Oggetto" hint="Una sola riga, max 250 caratteri">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={250}
            className={`${MONO} w-full bg-[#0d0f14] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500/50`}
          />
        </Field>
        <Field
          label="Preheader"
          hint="Testo nascosto mostrato in inbox preview, max 250 caratteri"
        >
          <input
            type="text"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            maxLength={250}
            className={`${MONO} w-full bg-[#0d0f14] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-indigo-500/50`}
          />
        </Field>
        <Field
          label="HTML body"
          hint={`Placeholder: ${variables.map((v) => `{{${v}}}`).join(", ") || "nessuno"}`}
        >
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            spellCheck={false}
            className={`${MONO} w-full bg-[#0d0f14] border border-white/[0.08] rounded-lg p-3 text-[12px] text-gray-100 focus:outline-none focus:border-indigo-500/50 leading-relaxed`}
            style={{ height: "640px", resize: "vertical" }}
          />
        </Field>
      </div>

      {/* Live preview */}
      <div>
        <p
          className={`${MONO} text-[10px] uppercase tracking-wider text-gray-600 mb-2`}
        >
          Anteprima live
        </p>
        <div className="bg-[#161920] rounded-xl border border-white/[0.08] overflow-hidden sticky top-4">
          <iframe
            srcDoc={srcDoc}
            title="Live preview"
            sandbox=""
            className="w-full bg-white"
            style={{ height: "740px", border: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-1 block`}
      >
        {label}
      </label>
      {children}
      {hint && <p className={`${MONO} text-[10px] text-gray-600 mt-1`}>{hint}</p>}
    </div>
  );
}

function MetaCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#161920] rounded-xl border border-white/[0.08] p-4">
      <p
        className={`${MONO} text-[10px] font-semibold uppercase tracking-[0.6px] text-gray-500 mb-3`}
      >
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p
        className={`${MONO} text-[10px] uppercase tracking-wider text-gray-600 mb-0.5`}
      >
        {label}
      </p>
      <p
        className={`${mono ? MONO : ""} text-[12px] text-gray-200 leading-snug break-words`}
      >
        {value}
      </p>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
