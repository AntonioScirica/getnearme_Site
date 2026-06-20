"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MONO } from "../types";
import { Plus, Trash2, Pencil, Search, RefreshCw, X, ChevronDown, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

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
const PLANS: { id: string; label: string; price: number }[] = [
  { id: "", label: "—", price: 0 },
  { id: "lite", label: "Lite — €4,99/mese", price: 4.99 },
  { id: "agency_starter", label: "Agency Starter — €24/mese", price: 24 },
  { id: "agency", label: "Agency — €99/mese", price: 99 },
  { id: "agency_pro", label: "Agency Pro — €149/mese", price: 149 },
  { id: "agency_annual", label: "Agency Annuale — €300/anno", price: 300 },
];
const PLAN_PRICE: Record<string, number> = Object.fromEntries(PLANS.map((p) => [p.id, p.price]));

interface Contact {
  id: string;
  owner: string | null;
  contact_name: string;
  agency: string | null;
  agency_owner: string | null;
  website: string | null;
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
  const BLANK = { contact_name: "", owner: "Francesco", status: "da_contattare", agency: "", agency_owner: "", website: "", phone: "", email: "", city: "", source: "", plan: "", value_eur: "", notes: "", next_action_at: "" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
  const openEdit = (c: Contact) => {
    setEditId(c.id);
    setForm({
      contact_name: c.contact_name || "", owner: c.owner || "Francesco", status: c.status || "da_contattare",
      agency: c.agency || "", agency_owner: c.agency_owner || "", website: c.website || "",
      phone: c.phone || "", email: c.email || "", city: c.city || "", source: c.source || "",
      plan: c.plan || "", value_eur: c.value_eur != null ? String(c.value_eur) : "",
      notes: c.notes || "", next_action_at: c.next_action_at || "",
    });
    setShowForm(true);
  };

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
      const autoVal = form.plan && !form.value_eur ? PLAN_PRICE[form.plan] : null;
      const payload = { ...form, value_eur: form.value_eur ? Number(form.value_eur) : autoVal };
      if (editId) {
        const d = await api("PATCH", { ...payload, id: editId });
        if (d.contact) setRows((r) => r.map((c) => (c.id === editId ? d.contact : c)));
      } else {
        const d = await api("POST", payload);
        if (d.contact) setRows((r) => [d.contact, ...r]);
      }
      setForm(BLANK);
      setEditId(null);
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

  // Follow-up within 2 days (or overdue) = urgent → floated to the top + flagged.
  const dueLimit = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59, 999); d.setDate(d.getDate() + 2); return d.getTime(); }, []);
  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = rows.filter((c) =>
      (!filterOwner || c.owner === filterOwner) &&
      (!filterStatus || c.status === filterStatus) &&
      (!q || [c.contact_name, c.agency, c.agency_owner, c.phone, c.email, c.city, c.notes].some((v) => (v || "").toLowerCase().includes(q)))
    );
    // Imminent/overdue follow-ups (≤ 2 days) float to the top, soonest first;
    // everyone else by most-recently-updated.
    const due = (c: Contact) => (c.next_action_at ? new Date(c.next_action_at + "T00:00:00").getTime() : Infinity);
    const urgent = (c: Contact) => due(c) <= dueLimit;
    return list.sort((a, b) => {
      const ua = urgent(a), ub = urgent(b);
      if (ua !== ub) return ua ? -1 : 1;
      if (ua && ub) return due(a) - due(b);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
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
  const urgency = (c: Contact): "overdue" | "soon" | null => {
    if (!c.next_action_at || c.status === "vinto" || c.status === "perso" || c.status === "non_interessato") return null;
    const t = new Date(c.next_action_at + "T00:00:00").getTime();
    if (t < todayStart) return "overdue";
    if (t <= dueLimit) return "soon";
    return null;
  };

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
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-500/90 text-white hover:bg-indigo-500">
          <Plus className="w-4 h-4" /> Aggiungi contatto
        </button>
        <div className="relative ml-1">
          <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca…" className={`${MONO} text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-gray-300 w-48`} />
        </div>
        <SelectBox value={filterOwner} onChange={setFilterOwner} className={`${MONO} text-xs bg-white/[0.03] border border-white/[0.08] rounded-lg pl-3 py-2 text-gray-300`}>
          <option value="">Tutti gli owner</option>
          {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
        </SelectBox>
        <span className={`${MONO} text-xs text-gray-600`}>{filtered.length} contatti</span>
        {error && <span className={`${MONO} text-xs text-red-400`}>⚠ {error}</span>}
      </div>

      {showForm && (
        <ContactForm form={form} setForm={setForm} onSubmit={submit} onClose={() => { setShowForm(false); setEditId(null); }}
          saving={saving} isEdit={!!editId} cityOptions={cityOptions} agencyOptions={agencyOptions} />
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`${MONO} text-[10px] uppercase tracking-wider text-gray-500 bg-white/[0.02]`}>
              {["Owner", "Proprietario", "Agenzia", "Sito", "Stato", "Fonte", "Telefono", "Email", "Città", "Follow-up", "Piano", "Valore €", "Note", ""].map((h) => (
                <th key={h} className="text-left font-normal px-3 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const st = STATUS_BY[c.status] || STATUSES[0];
              const u = urgency(c);
              return (
                <tr key={c.id} className={`border-t border-white/[0.05] hover:bg-white/[0.04] ${u === "overdue" ? "bg-red-500/[0.07]" : u === "soon" ? "bg-amber-500/[0.06]" : ""}`}>
                  <Td><Sel v={c.owner || ""} opts={["", ...OWNERS]} onChange={(v) => patch(c.id, "owner", v)} /></Td>
                  <Td><Txt v={c.contact_name} onSave={(v) => patch(c.id, "contact_name", v)} bold /></Td>
                  <Td><Txt v={c.agency} onSave={(v) => patch(c.id, "agency", v)} /></Td>
                  <Td><Txt v={c.website} onSave={(v) => patch(c.id, "website", v)} /></Td>
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
                    <div className="flex items-center gap-1.5">
                      {u && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u === "overdue" ? "bg-red-400" : "bg-amber-400"}`} title={u === "overdue" ? "Follow-up scaduto" : "Follow-up imminente"} />}
                      <DateField compact value={c.next_action_at} onChange={(v) => patch(c.id, "next_action_at", v)} />
                    </div>
                  </Td>
                  <Td>
                    <select value={c.plan || ""} onChange={(e) => { const v = e.target.value; patch(c.id, "plan", v); if (v && (c.value_eur == null || c.value_eur === 0)) patch(c.id, "value_eur", PLAN_PRICE[v]); }}
                      className={`${MONO} text-[11px] bg-transparent text-gray-300 rounded px-1 py-1 focus:outline-none focus:bg-white/[0.06]`}>
                      {PLANS.map((p) => <option key={p.id} value={p.id} className="bg-[#161920] text-gray-200">{p.label}</option>)}
                    </select>
                  </Td>
                  <Td><Txt v={c.value_eur != null ? String(c.value_eur) : ""} onSave={(v) => patch(c.id, "value_eur", v ? Number(v) : null)} num /></Td>
                  <Td><Txt v={c.notes} onSave={(v) => patch(c.id, "notes", v)} wide /></Td>
                  <Td>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => openEdit(c)} title="Modifica" className="p-1 rounded text-gray-600 hover:text-indigo-400 hover:bg-indigo-500/10">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(c.id)} title="Elimina" className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={14} className={`${MONO} text-sm text-gray-600 text-center py-8`}>Nessun contatto. Aggiungine uno sopra.</td></tr>
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

// Select with a properly-spaced custom chevron (native one sits cramped at the edge).
function SelectBox({ value, onChange, children, className = "", full }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string; full?: boolean;
}) {
  return (
    <div className={`relative ${full ? "block w-full" : "inline-block"}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pr-8 ${className}`}>{children}</select>
      <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const DOW_IT = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtDate = (s: string | null) => {
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS_IT[m - 1]?.slice(0, 3).toLowerCase()} ${String(y).slice(2)}`;
};

// Custom date picker: a button + a month-grid popover. Easier than native input.
function DateField({ value, onChange, compact }: { value: string | null; onChange: (v: string | null) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (value ? new Date(value + "T12:00:00") : new Date()));
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayISO = toISO(new Date());

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`${MONO} flex items-center gap-1.5 ${compact ? "text-[11px] text-gray-300 px-1.5 py-1 hover:bg-white/[0.06] rounded" : "w-full text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-gray-200"}`}>
        <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className={value ? "" : "text-gray-600"}>{value ? fmtDate(value) : "—"}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-60 p-2 rounded-xl bg-[#1b1e26] border border-white/[0.1] shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setView(new Date(y, m - 1, 1))} className="p-1 rounded text-gray-400 hover:bg-white/5"><ChevronLeft className="w-4 h-4" /></button>
            <span className={`${MONO} text-xs text-gray-200`}>{MONTHS_IT[m]} {y}</span>
            <button type="button" onClick={() => setView(new Date(y, m + 1, 1))} className="p-1 rounded text-gray-400 hover:bg-white/5"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DOW_IT.map((d) => <div key={d} className={`${MONO} text-[9px] text-gray-600 text-center`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = toISO(new Date(y, m, day));
              const sel = iso === value, today = iso === todayISO;
              return (
                <button key={i} type="button" onClick={() => { onChange(iso); setOpen(false); }}
                  className={`${MONO} text-[11px] h-7 rounded ${sel ? "bg-indigo-500 text-white" : today ? "text-indigo-400 hover:bg-white/5" : "text-gray-300 hover:bg-white/5"}`}>{day}</button>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-white/[0.06]">
            <button type="button" onClick={() => { onChange(todayISO); setOpen(false); }} className={`${MONO} text-[11px] text-indigo-400 hover:underline`}>Oggi</button>
            <button type="button" onClick={() => { onChange(null); setOpen(false); }} className={`${MONO} text-[11px] text-gray-500 hover:underline`}>Pulisci</button>
          </div>
        </div>
      )}
    </div>
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
function ContactForm({ form, setForm, onSubmit, onClose, saving, isEdit, cityOptions, agencyOptions }: {
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onSubmit: () => void;
  onClose: () => void;
  saving: boolean;
  isEdit: boolean;
  cityOptions: string[];
  agencyOptions: string[];
}) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const inputCls = `${MONO} w-full text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#161920] border border-white/[0.1] rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] sticky top-0 bg-[#161920] z-10">
          <h2 className="text-base font-semibold text-gray-100">{isEdit ? "Modifica contatto" : "Nuovo contatto"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Proprietario agenzia *">
            <input autoFocus value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSubmit()} placeholder="Nome titolare" className={inputCls} />
          </Field>
          <Field label="Agenzia">
            <input list="crm-agencies" value={form.agency} onChange={(e) => set("agency", e.target.value)} placeholder="Immobiliare…" className={inputCls} />
            <datalist id="crm-agencies">{agencyOptions.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          <Field label="Sito web">
            <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="agenzia.it" className={inputCls} />
          </Field>
          <Field label="Owner">
            <SelectBox full value={form.owner} onChange={(v) => set("owner", v)} className={inputCls}>
              {OWNERS.map((o) => <option key={o} value={o}>{o}</option>)}
            </SelectBox>
          </Field>
          <Field label="Stato">
            <SelectBox full value={form.status} onChange={(v) => set("status", v)} className={inputCls}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </SelectBox>
          </Field>
          <Field label="Città">
            <input list="crm-cities" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Milano" className={inputCls} />
            <datalist id="crm-cities">{cityOptions.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Fonte">
            <SelectBox full value={form.source} onChange={(v) => set("source", v)} className={inputCls}>
              <option value="">—</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectBox>
          </Field>
          <Field label="Telefono">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="333…" className={inputCls} />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nome@agenzia.it" className={inputCls} />
          </Field>
          <Field label="Prossimo follow-up">
            <DateField value={form.next_action_at || null} onChange={(v) => set("next_action_at", v || "")} />
          </Field>
          <Field label="Piano (se chiuso)">
            <SelectBox full value={form.plan} onChange={(v) => set("plan", v)} className={inputCls}>
              {PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </SelectBox>
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
            {saving ? "Salvo…" : isEdit ? "Salva modifiche" : "Crea contatto"}
          </button>
        </div>
      </div>
    </div>
  );
}
