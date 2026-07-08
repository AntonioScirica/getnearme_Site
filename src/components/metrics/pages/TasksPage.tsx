"use client";

// To-do del team: kanban Da fare / In corso / Fatto con drag & drop nativo,
// filtro per persona, scadenze, sottotask con progress, data di inizio
// (auto quando passa in "In corso"), tempo stimato, tag email con dropdown
// (chi viene taggato riceve una mail alla creazione, ri-notificabile dalla
// card). CRUD via /api/tasks.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MONO } from "../types";
import { Plus, Trash2, Pencil, X, RefreshCw, Calendar, Bell, GripVertical, Clock, Play, Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";

const COLUMNS: { id: string; label: string; dot: string }[] = [
  { id: "todo", label: "Da fare", dot: "bg-gray-400" },
  { id: "doing", label: "In corso", dot: "bg-amber-400" },
  { id: "done", label: "Fatto", dot: "bg-green-400" },
];

const PEOPLE = ["Antonio", "Federico", "Matteo"];
// Pill selezionabili nel tag-picker: click diretto invece di scrivere l'email.
const PEOPLE_EMAILS: Record<string, string> = {
  Antonio: "as.scirica@gmail.com",
  Federico: "federicorosati994@gmail.com",
  Matteo: "m.biritognolo30@gmail.com",
};

interface Subtask { id: string; title: string; done: boolean }
interface Task {
  id: string;
  title: string;
  notes: string | null;
  assignee: string | null;
  status: string;
  due_date: string | null;
  tagged_emails: string[] | null;
  subtasks: Subtask[] | null;
  started_at: string | null;
  estimate_hours: number | null;
  sort_order: number | null;
  created_at: string;
}

const fmtDue = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
const fmtStart = (d: string) =>
  new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
const isOverdue = (d: string) => new Date(d + "T23:59:59") < new Date();
const fmtEst = (h: number) => (h < 1 ? `${Math.round(h * 60)}min` : `${h % 1 === 0 ? h : h.toFixed(1)}h`);
// Popover dentro un modale con overflow-y-auto: un dropdown absolute resta
// tagliato dal contenitore. Ancora la posizione al box e porta il contenuto
// fuori nel <body> (fixed), cosi' esce sempre visibile.
function useAnchoredRect(open: boolean, anchorRef: React.RefObject<HTMLElement | null>) {
  const [rect, setRect] = useState<{ top: number; bottom: number; left: number; width: number } | null>(null);
  useEffect(() => {
    if (!open || !anchorRef.current) { setRect(null); return; }
    const update = () => {
      const r = anchorRef.current!.getBoundingClientRect();
      setRect({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);
  return rect;
}

// ── Switch on/off (manda mail si'/no) ──
function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${
        checked ? "bg-indigo-500" : "bg-white/10"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const DAYS_IT = ["L", "M", "M", "G", "V", "S", "D"];
const pad2 = (n: number) => String(n).padStart(2, "0");
const toISODate = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

// ── Calendario custom: sostituisce l'input[type=date] nativo del browser ──
function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const rect = useAnchoredRect(open, anchorRef);
  const today = new Date();
  const initial = value ? new Date(value + "T00:00:00") : today;
  const [viewY, setViewY] = useState(initial.getFullYear());
  const [viewM, setViewM] = useState(initial.getMonth());

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (dropRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openPicker = () => {
    const d = value ? new Date(value + "T00:00:00") : today;
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
    setOpen((o) => !o);
  };

  const firstDow = (new Date(viewY, viewM, 1).getDay() + 6) % 7; // lun=0
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => setViewM((m) => { if (m === 0) { setViewY((y) => y - 1); return 11; } return m - 1; });
  const nextMonth = () => setViewM((m) => { if (m === 11) { setViewY((y) => y + 1); return 0; } return m + 1; });

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={openPicker}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-left outline-none focus:border-indigo-500/50 cursor-pointer flex items-center justify-between gap-2 ${
          value ? "text-gray-200" : "text-gray-600"
        }`}
      >
        <span className="truncate">{value ? fmtDue(value) : "Nessuna"}</span>
        <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
      </button>
      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{ position: "fixed", top: rect.bottom + 4, left: rect.left }}
          className="z-[100] w-64 bg-[#1b1f28] border border-white/10 rounded-lg shadow-xl p-2"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={prevMonth} className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-white/5 cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium text-gray-200">{MONTHS_IT[viewM]} {viewY}</span>
            <button onClick={nextMonth} className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-white/5 cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS_IT.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-gray-600 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (d == null) return <div key={i} />;
              const iso = toISODate(viewY, viewM, d);
              const selected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button
                  key={i}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`aspect-square rounded text-xs cursor-pointer transition-colors ${
                    selected ? "bg-indigo-500 text-white" : isToday ? "text-indigo-300 bg-white/5 hover:bg-white/10" : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          {value && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full mt-2 text-[11px] text-gray-500 hover:text-red-400 cursor-pointer py-1"
            >
              Rimuovi scadenza
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

export default function TasksPage({ authKey }: { authKey: string | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPerson, setFilterPerson] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dropBefore, setDropBefore] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);

  // form (crea/modifica)
  const BLANK = { title: "", notes: "", assignee: PEOPLE[0], due_date: "", estimate_hours: "", status: "todo" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [formNotify, setFormNotify] = useState(true);
  const [formSubs, setFormSubs] = useState<Subtask[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const api = useCallback(
    async (method: string, body?: unknown, qs = "") => {
      const res = await fetch(`/api/tasks${qs}`, {
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
      setTasks(d.tasks || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api, authKey]);

  useEffect(() => { load(); }, [load]);

  // filtro persona + suggerimenti tag (email gia' usate su altre task)
  const people = useMemo(() => {
    const extra = [...new Set(tasks.map((t) => t.assignee).filter(Boolean) as string[])]
      .filter((p) => !PEOPLE.includes(p));
    return [...PEOPLE, ...extra];
  }, [tasks]);
  const visible = filterPerson ? tasks.filter((t) => t.assignee === filterPerson) : tasks;

  // sort_order opzionale: se assente il task si sposta solo di colonna (via
  // "Assegnata a"/edit) mantenendo la posizione; se presente riordina anche
  // dentro la colonna (drag sopra/sotto un'altra card).
  const move = async (id: string, status: string, sortOrder?: number) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status, ...(sortOrder != null ? { sort_order: sortOrder } : {}) } : t))); // ottimistico
    try {
      const d = await api("PATCH", { id, status, ...(sortOrder != null ? { sort_order: sortOrder } : {}) });
      if (d.task) setTasks((ts) => ts.map((t) => (t.id === id ? d.task : t))); // porta started_at dal server
    } catch {
      setTasks(prev); // rollback
      alert("Spostamento fallito, riprova.");
    }
  };

  // Riordino via drag: calcola un sort_order frazionario tra i due vicini
  // nella colonna di destinazione (fractional indexing, niente reindex globale).
  const reorder = (draggedId: string, status: string, beforeId: string | null) => {
    const colItems = visible
      .filter((t) => t.status === status && t.id !== draggedId)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const targetIdx = beforeId ? colItems.findIndex((t) => t.id === beforeId) : colItems.length;
    const prevItem = targetIdx > 0 ? colItems[targetIdx - 1] : null;
    const nextItem = targetIdx >= 0 && targetIdx < colItems.length ? colItems[targetIdx] : null;
    const prevOrder = prevItem?.sort_order ?? null;
    const nextOrder = nextItem?.sort_order ?? null;
    const newOrder =
      prevOrder != null && nextOrder != null ? (prevOrder + nextOrder) / 2 :
      prevOrder != null ? prevOrder + 1000 :
      nextOrder != null ? nextOrder - 1000 :
      Date.now();
    move(draggedId, status, newOrder);
  };

  const toggleSub = async (task: Task, subId: string) => {
    const subs = (task.subtasks || []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, subtasks: subs } : t)));
    try {
      await api("PATCH", { id: task.id, subtasks: subs });
    } catch {
      setTasks(prev);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminare la task?")) return;
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== id));
    try {
      await api("DELETE", undefined, `?id=${id}`);
    } catch {
      setTasks(prev);
    }
  };

  const notify = async (id: string) => {
    setNotifying(id);
    try {
      const d = await api("POST", { action: "notify", id });
      alert(d.sent > 0 ? `Mail inviata a ${d.sent} person${d.sent === 1 ? "a" : "e"}` : "Nessuna email taggata su questa task");
    } catch {
      alert("Invio non riuscito");
    } finally {
      setNotifying(null);
    }
  };

  const openCreate = () => { setEditId(null); setForm(BLANK); setFormNotify(true); setFormSubs([]); setShowForm(true); };
  const openEdit = (t: Task) => {
    setEditId(t.id);
    setForm({
      title: t.title, notes: t.notes || "", assignee: t.assignee || PEOPLE[0],
      due_date: t.due_date || "", estimate_hours: t.estimate_hours != null ? String(t.estimate_hours) : "",
      status: t.status,
    });
    setFormNotify((t.tagged_emails?.length ?? 0) > 0);
    setFormSubs(t.subtasks || []);
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const assigneeEmail = PEOPLE_EMAILS[form.assignee];
      const prevStatus = editId ? tasks.find((t) => t.id === editId)?.status : null;
      // status cambiato (o task nuova): la fa atterrare in fondo alla colonna di destinazione.
      let sortOrder: number | undefined;
      if (!editId || prevStatus !== form.status) {
        const colTasks = tasks.filter((t) => t.status === form.status && t.id !== editId);
        const maxOrder = colTasks.reduce((m, t) => Math.max(m, t.sort_order ?? 0), 0);
        sortOrder = colTasks.length ? maxOrder + 1000 : Date.now();
      }
      const payload = {
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        assignee: form.assignee || null,
        status: form.status,
        due_date: form.due_date || null,
        estimate_hours: form.estimate_hours ? Number(form.estimate_hours.replace(",", ".")) : null,
        tagged_emails: formNotify && assigneeEmail ? [assigneeEmail] : [],
        subtasks: formSubs.filter((s) => s.title.trim()),
        ...(sortOrder != null ? { sort_order: sortOrder } : {}),
      };
      if (editId) {
        const d = await api("PATCH", { ...payload, id: editId });
        if (d.task) setTasks((ts) => ts.map((t) => (t.id === editId ? d.task : t)));
      } else {
        const d = await api("POST", payload);
        if (d.task) setTasks((ts) => [...ts, d.task]);
        if (d.sent > 0) alert(`Task creata, mail inviata a ${d.sent} person${d.sent === 1 ? "a" : "e"}`);
      }
      setShowForm(false);
      setForm(BLANK);
      setFormNotify(true);
      setFormSubs([]);
      setEditId(null);
    } catch {
      alert("Salvataggio non riuscito");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-indigo-500/50";

  return (
    <div className="p-6 max-w-[1200px]">
      {/* header + filtri */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => setFilterPerson("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            !filterPerson ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "text-gray-500 border-white/10 hover:text-gray-300"
          }`}
        >
          Tutti
        </button>
        {people.map((p) => (
          <button
            key={p}
            onClick={() => setFilterPerson(filterPerson === p ? "" : p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              filterPerson === p ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "text-gray-500 border-white/10 hover:text-gray-300"
            }`}
          >
            {p}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={load} className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/5 cursor-pointer" title="Ricarica">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nuova task
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-400">Errore: {error}</div>}

      {/* board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => t.status === col.id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver((o) => (o === col.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) reorder(id, col.id, null); // spazio vuoto sotto le card = fondo colonna
                setDragId(null);
                setDropBefore(null);
              }}
              className={`rounded-xl border p-3 min-h-[300px] transition-colors ${
                dragOver === col.id ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/[0.08] bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-medium text-gray-200">{col.label}</span>
                <span className={`${MONO} text-[11px] text-gray-500 ml-auto`}>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((t, i) => {
                  const subs = t.subtasks || [];
                  const doneN = subs.filter((s) => s.done).length;
                  const nextItem = items[i + 1];
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => { setDragId(t.id); e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragEnd={() => { setDragId(null); setDragOver(null); setDropBefore(null); }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOver(col.id);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const isBefore = e.clientY < rect.top + rect.height / 2;
                        setDropBefore(isBefore ? t.id : (nextItem ? nextItem.id : null));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOver(null);
                        const id = e.dataTransfer.getData("text/plain") || dragId;
                        if (id) reorder(id, col.id, dropBefore);
                        setDragId(null);
                        setDropBefore(null);
                      }}
                      className={`group rounded-lg border border-white/[0.08] bg-[#161920] px-3 py-2.5 transition-colors hover:border-white/[0.16] ${
                        dragId === t.id ? "opacity-40" : ""
                      } ${dragId && dragId !== t.id && dropBefore === t.id ? "border-t-2 border-t-indigo-400" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`text-sm text-gray-100 leading-snug ${t.status === "done" ? "line-through text-gray-500" : ""}`}>{t.title}</div>
                        <GripVertical className="w-3.5 h-3.5 text-gray-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                      </div>
                      {t.notes && <div className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{t.notes}</div>}

                      {/* sottotask: checklist piatta, conteggio come testo (niente barra) */}
                      {subs.length > 0 && (
                        <div className="mt-2.5">
                          <div className={`${MONO} text-[10px] text-gray-600 mb-1`}>{doneN}/{subs.length} completate</div>
                          <div className="space-y-1">
                            {subs.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => toggleSub(t, s.id)}
                                className="w-full flex items-center gap-2 text-left cursor-pointer group/sub"
                              >
                                <span className={`w-3.5 h-3.5 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors ${
                                  s.done ? "bg-indigo-500 border-indigo-500" : "border-gray-500 group-hover/sub:border-indigo-400"
                                }`}>
                                  {s.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                </span>
                                <span className={`text-[12px] leading-tight ${s.done ? "line-through text-gray-600" : "text-gray-300"}`}>{s.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* proprieta': icona + testo piatti, come Notion, niente pillole */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] text-gray-500">
                        {t.assignee && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {t.assignee.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="text-gray-400">{t.assignee}</span>
                            {(t.tagged_emails?.length ?? 0) > 0 && <Mail className="w-3 h-3 text-gray-600" />}
                          </span>
                        )}
                        {t.due_date && (
                          <span className={`inline-flex items-center gap-1 ${t.status !== "done" && isOverdue(t.due_date) ? "text-red-400" : ""}`}>
                            <Calendar className="w-3 h-3" /> {fmtDue(t.due_date)}
                          </span>
                        )}
                        {t.estimate_hours != null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {fmtEst(t.estimate_hours)}
                          </span>
                        )}
                        {t.started_at && (
                          <span className="inline-flex items-center gap-1" title="Iniziata il">
                            <Play className="w-3 h-3" /> {fmtStart(t.started_at)}
                          </span>
                        )}
                      </div>

                      {/* azioni (a comparsa) — lo stato e' gia' visibile dalla colonna, sposta via drag o dal form */}
                      <div className="flex items-center justify-end mt-2 -mx-1.5">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(t.tagged_emails?.length ?? 0) > 0 && (
                            <button onClick={() => notify(t.id)} disabled={notifying === t.id} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-amber-400 hover:bg-white/[0.06] cursor-pointer" title="Rimanda mail">
                              <Bell className={`w-3.5 h-3.5 ${notifying === t.id ? "animate-pulse" : ""}`} />
                            </button>
                          )}
                          <button onClick={() => openEdit(t)} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] cursor-pointer" title="Modifica">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(t.id)} className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-red-400 hover:bg-white/[0.06] cursor-pointer" title="Elimina">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-xs text-gray-600 text-center py-8">Nessuna task</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* modal crea/modifica */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="w-full max-w-md bg-[#1b1f28] border border-white/10 rounded-xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-100">{editId ? "Modifica task" : "Nuova task"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-200 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                {COLUMNS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, status: c.id })}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      form.status === c.id ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" : "text-gray-500 border-white/10 hover:text-gray-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {c.label}
                  </button>
                ))}
              </div>
              <input className={input} placeholder="Titolo *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
              <textarea className={`${input} resize-none`} rows={2} placeholder="Note" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Assegnata a</label>
                  <select className={input} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                    {people.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Scadenza</label>
                  <DatePicker value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Stima (ore)</label>
                  <input type="number" min="0" step="0.5" className={input} placeholder="es. 4" value={form.estimate_hours} onChange={(e) => setForm({ ...form, estimate_hours: e.target.value })} />
                </div>
              </div>

              {/* sottotask */}
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Sottotask</label>
                <div className="space-y-1.5">
                  {formSubs.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <button
                        onClick={() => setFormSubs((ss) => ss.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                          s.done ? "bg-indigo-500 border-indigo-500" : "border-gray-600"
                        }`}
                      >
                        {s.done && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <input
                        className={`${input} py-1.5`}
                        placeholder={`Sottotask ${i + 1}`}
                        value={s.title}
                        onChange={(e) => setFormSubs((ss) => ss.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && s.title.trim() && i === formSubs.length - 1) {
                            setFormSubs((ss) => [...ss, { id: crypto.randomUUID(), title: "", done: false }]);
                          }
                        }}
                      />
                      <button onClick={() => setFormSubs((ss) => ss.filter((x) => x.id !== s.id))} className="text-gray-600 hover:text-red-400 cursor-pointer shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setFormSubs((ss) => [...ss, { id: crypto.randomUUID(), title: "", done: false }])}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-300 cursor-pointer py-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Aggiungi sottotask
                  </button>
                </div>
              </div>

              {/* invio mail: derivata dall'assegnatario, niente tag separati */}
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-300">Manda mail a {form.assignee || "—"}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {PEOPLE_EMAILS[form.assignee] || "Nessuna email associata a questa persona"}
                  </div>
                </div>
                <Switch checked={formNotify} onChange={setFormNotify} disabled={!PEOPLE_EMAILS[form.assignee]} />
              </div>

              <button
                onClick={submit}
                disabled={saving || !form.title.trim()}
                className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                {saving ? "Salvataggio..." : editId ? "Salva modifiche" : "Crea task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
