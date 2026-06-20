"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MONO } from "../types";
import { Plus, Trash2, Search, RefreshCw, X } from "lucide-react";

// ── Pipeline + option sets ──────────────────────────────────────────
const STATUSES: { id: string; label: string; cls: string; dot: string }[] = [
  { id: "da_contattare", label: "Da contattare", cls: "bg-gray-500/15 text-gray-300 border-gray-500/30", dot: "bg-gray-400" },
  { id: "contattato", label: "Contattato", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  { id: "demo", label: "Demo fatta", cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30", dot: "bg-indigo-400" },
  { id: "trattativa", label: "In trattativa", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  { id: "vinto", label: "Chiuso vinto", cls: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-400" },
  { id: "perso", label: "Chiuso perso", cls: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-400" },
  { id: "non_interessato", label: "Non interessato", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", dot: "bg-zinc-500" },
];
const STATUS_BY = Object.fromEntries(STATUSES.map((s) => [s.id, s]));
const OWNERS = ["Francesco", "Alan", "Filippo"];
const SOURCES = ["Chiamata a freddo", "Referral", "Instagram", "Fiera", "Sito", "Altro"];
const PLANS = ["", "individual", "agency"];

interface Contact {
  id: string;
  owner: string | null;
  contact_name: string;
  agency: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  next_action_at: string | null;
  plan: string | null;
  value_eur: number | null;
  updated_at: string;
}

export default function CrmPage({ authKey }: { authKey: string | null }) {
  const [rows, setRows] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  // add form
  const BLANK = { contact_name: "", owner: "Francesco", status: "da_contattare", agency: "", phone: "", email: "", city: "", source: "", plan: "", value_eur: "", notes: "", next_action_at: "" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [saving, setSaving] = useState(false);

  const api = useCallback(
    async (method: string, body?: unknown, qs = "") => {
      const res = await fetch(`/api/crm${qs}`, {
        method,
        headers: { "Content-Type": "application/json", "x-metrics-key": authKey || "" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [authKey]
  );

  const load = useCallback(async () => {
    if (!authKey) return;
    setLoading(true);
    setError(null);
    try {
      const d = await api("GET");
      setRows(d.contacts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api, authKey]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.contact_name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, value_eur: form.value_eur ? Number(form.value_eur) : null };
      const d = await api("POST", payload);
      if (d.contact) setRows((r) => [d.contact, ...r]);
      setForm(BLANK);
      setShowForm(false);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  // Patch a single field, optimistic.
  const patch = async (id: string, field: keyof Contact, value: unknown) => {
    setRows((r) => r.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    try { await api("PATCH", { id, [field]: value }); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); load(); }
  };

  const remove = async (id: string) => {
    setRows((r) => r.filter((c) => c.id !== id));
    try { await api("DELETE", undefined, `?id=${id}`); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); load(); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((c) =>
      (!filterOwner || c.owner === filterOwner) &&
      (!filterStatus || c.status === filterStatus) &&
      (!q || [c.contact_name, c.agency, c.phone, c.email, c.city, c.notes].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [rows, filterOwner, filterStatus, search]);

  // KPIs
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of rows) m[c.status] = (m[c.status] || 0) + 1;
    return m;
  }, [rows]);
  const wonValue = useMemo(
    () => rows.filter((c) => c.status === "vinto").reduce((s, c) => s + (Number(c.value_eur) || 0), 0),
    [rows]
  );
  // Remembered values for autocomplete (cities/agencies already used).
  const cityOptions = useMemo(() => [...new Set(rows.map((c) => c.city).filter(Boolean))].sort() as string[], [rows]);
  const agencyOptions = useMemo(() => [...new Set(rows.map((c) => c.agency).filter(Boolean))].sort() as string[], [rows]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-gray-100">CRM Vendite</h1>
        <button onClick={load} disabled={loading} className="p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200 disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className={`${MONO} text-xs text-gray-500 mb-5`}>Contatti dei sales (Francesco, Alan, Filippo) — pipeline, esito, follow-up.</p>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
        {STATUSES.map((s) => (
          <button key={s.id} onClick={() => setFilterStatus(filterStatus === s.id ? "" : s.id)}
            className={`text-left px-3 py-2 rounded-lg border ${filterStatus === s.id ? s.cls : "bg-white/[0.02] border-white/[0.06]"}`}>
            <div className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
            </div>
            <div className="text-xl font-semibold text-gray-100 mt-0.5">{counts[s.id] || 0}</div>
          </button>
        ))}
        <div className="px-3 py-2 rounded-lg border bg-green-500/[0.06] border-green-500/20">
          <div className={`${MONO} text-[10px] uppercase tracking-wider text-green-500/80`}>Valore vinto</div>
          <div className="text-xl font-semibold text-green-400 mt-0.5">€{wonValue.toLocaleString("it-IT")}</div>
        </div>
      </div>

      {/* Toolbar: add button + filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={() => { setForm(BLANK); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/90 text-white hover:bg-indigo-500">
          <Plus className="w-4 h-4" /> Aggiungi contatto
        </button>
        <div className="relative ml-1">
          <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca…" className={`${MONO} text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-gray-300 w-48`} />
        </div>
        <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className={`${MONO} text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 py-2 text-gray-300`}>
          <option value="">Tutti gli owner</option>
          {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className={`${MONO} text-xs text-gray-600`}>{filtered.length} contatti</span>
        {error && <span className={`${MONO} text-xs text-red-400`}>⚠ {error}</span>}
      </div>

      {showForm && (
        <ContactForm form={form} setForm={setForm} onSubmit={submit} onClose={() => setShowForm(false)}
          saving={saving} cityOptions={cityOptions} agencyOptions={agencyOptions} />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 bg-white/[0.02]`}>
              {["Owner", "Nome", "Agenzia", "Stato", "Fonte", "Telefono", "Email", "Città", "Follow-up", "Piano", "Valore €", "Note", ""].map((h) => (
                <th key={h} className="text-left font-normal px-3 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const st = STATUS_BY[c.status] || STATUSES[0];
              return (
                <tr key={c.id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                  <Td><Sel v={c.owner || ""} opts={["", ...OWNERS]} onChange={(v) => patch(c.id, "owner", v)} /></Td>
                  <Td><Txt v={c.contact_name} onSave={(v) => patch(c.id, "contact_name", v)} bold /></Td>
                  <Td><Txt v={c.agency} onSave={(v) => patch(c.id, "agency", v)} /></Td>
                  <Td>
                    <select value={c.status} onChange={(e) => patch(c.id, "status", e.target.value)}
                      className={`${MONO} text-[11px] rounded-md px-1.5 py-1 border ${st.cls} focus:outline-none`}>
                      {STATUSES.map((s) => <option key={s.id} value={s.id} className="bg-[#161920] text-gray-200">{s.label}</option>)}
                    </select>
                  </Td>
                  <Td><Sel v={c.source || ""} opts={["", ...SOURCES]} onChange={(v) => patch(c.id, "source", v)} /></Td>
                  <Td><Txt v={c.phone} onSave={(v) => patch(c.id, "phone", v)} /></Td>
                  <Td><Txt v={c.email} onSave={(v) => patch(c.id, "email", v)} /></Td>
                  <Td><Txt v={c.city} onSave={(v) => patch(c.id, "city", v)} /></Td>
                  <Td>
                    <input type="date" value={c.next_action_at || ""} onChange={(e) => patch(c.id, "next_action_at", e.target.value || null)}
                      className={`${MONO} text-[11px] bg-transparent text-gray-300 focus:outline-none`} />
                  </Td>
                  <Td><Sel v={c.plan || ""} opts={PLANS} onChange={(v) => patch(c.id, "plan", v)} /></Td>
                  <Td><Txt v={c.value_eur != null ? String(c.value_eur) : ""} onSave={(v) => patch(c.id, "value_eur", v ? Number(v) : null)} num /></Td>
                  <Td><Txt v={c.notes} onSave={(v) => patch(c.id, "notes", v)} wide /></Td>
                  <Td>
                    <button onClick={() => remove(c.id)} className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={13} className={`${MONO} text-sm text-gray-600 text-center py-8`}>Nessun contatto. Aggiungine uno sopra.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-1.5 align-middle whitespace-nowrap">{children}</td>;
}

// Inline-editable text cell: looks like text, becomes editable on focus, saves on blur.
function Txt({ v, onSave, bold, wide, num }: { v: string | null; onSave: (v: string) => void; bold?: boolean; wide?: boolean; num?: boolean }) {
  const [val, setVal] = useState(v ?? "");
  useEffect(() => { setVal(v ?? ""); }, [v]);
  return (
    <input
      value={val}
      type={num ? "number" : "text"}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if ((val ?? "") !== (v ?? "")) onSave(val); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      placeholder="—"
      className={`${MONO} text-[12px] bg-transparent rounded px-1.5 py-1 text-gray-200 placeholder:text-gray-700 focus:outline-none focus:bg-white/[0.06] ${bold ? "font-medium text-gray-100" : ""} ${wide ? "w-56" : num ? "w-20" : "w-32"}`}
    />
  );
}

// Small select that saves on change.
function Sel({ v, opts, onChange }: { v: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <select value={v} onChange={(e) => onChange(e.target.value)}
      className={`${MONO} text-[11px] bg-transparent text-gray-300 rounded px-1 py-1 focus:outline-none focus:bg-white/[0.06]`}>
      {opts.map((o) => <option key={o} value={o} className="bg-[#161920] text-gray-200">{o || "—"}</option>)}
    </select>
  );
}

// Module-level so it keeps a stable identity across renders (otherwise inputs
// remount on every keystroke and focus jumps to the autoFocus field).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 mb-1 block`}>{label}</label>
      {children}
    </div>
  );
}

// ── Add-contact modal form ──────────────────────────────────────────
function ContactForm({ form, setForm, onSubmit, onClose, saving, cityOptions, agencyOptions }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSubmit: () => void;
  onClose: () => void;
  saving: boolean;
  cityOptions: string[];
  agencyOptions: string[];
}) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const inputCls = `${MONO} w-full text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div className="bg-[#161920] border border-white/[0.1] rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] sticky top-0 bg-[#161920] z-10">
          <h2 className="text-base font-semibold text-gray-100">Nuovo contatto</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome contatto *">
            <input autoFocus value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()} placeholder="Mario Rossi" className={inputCls} />
          </Field>
          <Field label="Agenzia">
            <input list="crm-agencies" value={form.agency} onChange={(e) => set("agency", e.target.value)} placeholder="Immobiliare…" className={inputCls} />
            <datalist id="crm-agencies">{agencyOptions.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          <Field label="Owner">
            <select value={form.owner} onChange={(e) => set("owner", e.target.value)} className={inputCls}>
              {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Stato">
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Città">
            <input list="crm-cities" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Milano" className={inputCls} />
            <datalist id="crm-cities">{cityOptions.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Fonte">
            <select value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls}>
              <option value="">—</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Telefono">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="333…" className={inputCls} />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nome@agenzia.it" className={inputCls} />
          </Field>
          <Field label="Prossimo follow-up">
            <input type="date" value={form.next_action_at} onChange={(e) => set("next_action_at", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Piano (se chiuso)">
            <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={inputCls}>
              {PLANS.map((p) => <option key={p} value={p}>{p || "—"}</option>)}
            </select>
          </Field>
          <Field label="Valore € (se chiuso)">
            <input type="number" value={form.value_eur} onChange={(e) => set("value_eur", e.target.value)} placeholder="0" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note">
              <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Cosa vi siete detti, prossimi passi…" className={inputCls} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-white/[0.08] sticky bottom-0 bg-[#161920]">
          <button onClick={onClose} className={`${MONO} px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5`}>Annulla</button>
          <button onClick={onSubmit} disabled={saving || !form.contact_name.trim()} className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-500/90 text-white hover:bg-indigo-500 disabled:opacity-40">
            {saving ? "Salvo…" : "Crea contatto"}
          </button>
        </div>
      </div>
    </div>
  );
}
