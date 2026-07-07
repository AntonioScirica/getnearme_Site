"use client";

// To-do del team: kanban Da fare / In corso / Fatto con drag & drop nativo,
// filtro per persona, scadenze, tag email (chi viene taggato riceve una mail
// alla creazione, ri-notificabile dalla card). CRUD via /api/tasks.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MONO } from "../types";
import { Plus, Trash2, Pencil, X, RefreshCw, Calendar, Bell, GripVertical } from "lucide-react";

const COLUMNS: { id: string; label: string; dot: string }[] = [
  { id: "todo", label: "Da fare", dot: "bg-gray-400" },
  { id: "doing", label: "In corso", dot: "bg-amber-400" },
  { id: "done", label: "Fatto", dot: "bg-green-400" },
];

const PEOPLE = ["Antonio", "Federico", "Matteo"];

interface Task {
  id: string;
  title: string;
  notes: string | null;
  assignee: string | null;
  status: string;
  due_date: string | null;
  tagged_emails: string[] | null;
  created_at: string;
}

const fmtDue = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
const isOverdue = (d: string) => new Date(d + "T23:59:59") < new Date();

export default function TasksPage({ authKey }: { authKey: string | null }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPerson, setFilterPerson] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);

  // form (crea/modifica)
  const BLANK = { title: "", notes: "", assignee: PEOPLE[0], due_date: "", tagged_emails: "" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(BLANK);
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

  // filtro persona: chips da PEOPLE + eventuali assegnatari fuori lista
  const people = useMemo(() => {
    const extra = [...new Set(tasks.map((t) => t.assignee).filter(Boolean) as string[])]
      .filter((p) => !PEOPLE.includes(p));
    return [...PEOPLE, ...extra];
  }, [tasks]);

  const visible = filterPerson ? tasks.filter((t) => t.assignee === filterPerson) : tasks;

  const move = async (id: string, status: string) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t))); // ottimistico
    try {
      await api("PATCH", { id, status });
    } catch {
      setTasks(prev); // rollback
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

  const openCreate = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
  const openEdit = (t: Task) => {
    setEditId(t.id);
    setForm({
      title: t.title, notes: t.notes || "", assignee: t.assignee || PEOPLE[0],
      due_date: t.due_date || "", tagged_emails: (t.tagged_emails || []).join(", "),
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        assignee: form.assignee || null,
        due_date: form.due_date || null,
        tagged_emails: form.tagged_emails.split(/[,;\s]+/).map((e) => e.trim()).filter((e) => /.+@.+\..+/.test(e)),
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
          const items = visible.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver((o) => (o === col.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) move(id, col.id);
                setDragId(null);
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
                {items.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => { setDragId(t.id); e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    className={`group rounded-lg border border-white/[0.08] bg-[#161920] p-3 cursor-grab active:cursor-grabbing ${
                      dragId === t.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-3.5 h-3.5 text-gray-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm text-gray-200 leading-snug ${t.status === "done" ? "line-through text-gray-500" : ""}`}>{t.title}</div>
                        {t.notes && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.notes}</div>}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {t.assignee && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                              <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
                                {t.assignee.slice(0, 1).toUpperCase()}
                              </span>
                              {t.assignee}
                            </span>
                          )}
                          {t.due_date && (
                            <span className={`inline-flex items-center gap-1 text-[11px] ${
                              t.status !== "done" && isOverdue(t.due_date) ? "text-red-400" : "text-gray-500"
                            }`}>
                              <Calendar className="w-3 h-3" /> {fmtDue(t.due_date)}
                            </span>
                          )}
                          {(t.tagged_emails?.length ?? 0) > 0 && (
                            <span className={`${MONO} text-[10px] text-gray-600`}>@{t.tagged_emails!.length}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {(t.tagged_emails?.length ?? 0) > 0 && (
                          <button onClick={() => notify(t.id)} disabled={notifying === t.id} className="p-1 text-gray-500 hover:text-amber-400 cursor-pointer" title="Notifica i taggati via mail">
                            <Bell className={`w-3.5 h-3.5 ${notifying === t.id ? "animate-pulse" : ""}`} />
                          </button>
                        )}
                        <button onClick={() => openEdit(t)} className="p-1 text-gray-500 hover:text-gray-200 cursor-pointer" title="Modifica">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(t.id)} className="p-1 text-gray-500 hover:text-red-400 cursor-pointer" title="Elimina">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
          <div className="w-full max-w-md bg-[#1b1f28] border border-white/10 rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-100">{editId ? "Modifica task" : "Nuova task"}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-200 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input className={input} placeholder="Titolo *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
              <textarea className={`${input} resize-none`} rows={3} placeholder="Note" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Assegnata a</label>
                  <select className={input} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                    {people.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Scadenza</label>
                  <input type="date" className={input} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 block mb-1">Tagga persone (email, separate da virgola) — riceveranno una mail</label>
                <input className={input} placeholder="nome@esempio.it, altro@esempio.it" value={form.tagged_emails} onChange={(e) => setForm({ ...form, tagged_emails: e.target.value })} />
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
