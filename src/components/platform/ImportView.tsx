'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TARGET_FIELDS, aiMapColumns, autoMapColumns, buildImportRows, readSheet, type ImportResult } from '@/lib/propertyImport';
import { authFetch } from './api';

// Import immobili da CSV/Excel (logica condivisa con la vecchia dashboard in lib/propertyImport).
export default function ImportView({ onDone }: { onDone: () => void }) {
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [aiBusy, setAiBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cols = rawRows.length ? Object.keys(rawRows[0]) : [];
  const { rows, skippedClient } = useMemo(() => buildImportRows(rawRows, mapping), [rawRows, mapping]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null); setResult(null);
    try {
      const json = await readSheet(file);
      if (!json.length) return setError('Il file non contiene righe.');
      const c = Object.keys(json[0]);
      setFileName(file.name); setRawRows(json); setMapping(autoMapColumns(c));
      setAiBusy(true);
      const { data: { session } } = await supabase.auth.getSession();
      const ai = await aiMapColumns(c, json[0], session?.access_token);
      if (ai) setMapping(prev => {
        const m = { ...prev };
        for (const f of TARGET_FIELDS) if (ai[f.key] && c.includes(ai[f.key])) m[f.key] = ai[f.key];
        return m;
      });
    } catch {
      setError('Impossibile leggere il file. Usa un .csv, .xlsx o .xls valido.');
    } finally { setAiBusy(false); }
  };

  const runImport = async () => {
    setImporting(true); setError(null);
    try {
      const res = await authFetch('/api/projects/import', { method: 'POST', body: JSON.stringify({ rows }) });
      if (!res.ok) throw new Error();
      const r = (await res.json()) as ImportResult;
      setResult({ ...r, skipped: (r.skipped ?? 0) + skippedClient });
      onDone();
    } catch {
      setError("Errore durante l'import, riprova.");
    } finally { setImporting(false); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <a href="#/nuovo" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Crea da zero</a>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Importa da CSV o Excel</h1>
      <p className="mt-1 text-muted">Carica l&apos;export del tuo gestionale: riconosciamo le colonne da soli, tu controlli e confermi.</p>

      {result ? (
        <div className="mt-8 card p-6">
          <h2 className="font-display text-xl font-semibold">Import completato</h2>
          <p className="mt-2 text-sm">{result.created} nuovi, {result.updated} aggiornati{result.skipped ? `, ${result.skipped} saltati` : ''}.</p>
          <div className="mt-5 flex gap-3">
            <a href="#/immobili" className="btn-ink rounded-xl px-5 py-2.5 text-sm font-semibold">Vedi immobili</a>
            <button onClick={() => { setResult(null); setRawRows([]); setFileName(''); }} className="btn-ghost rounded-lg px-5 py-2.5 text-sm font-medium">Importa altro file</button>
          </div>
        </div>
      ) : !rawRows.length ? (
        <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          className="mt-8 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white py-14 text-muted hover:border-brand hover:text-brand">
          <FileSpreadsheet size={30} />
          <span className="text-sm font-medium">Trascina qui il file o clicca per sceglierlo</span>
          <span className="text-xs">.csv, .xlsx, .xls</span>
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      ) : (
        <div className="mt-8 space-y-5">
          <div className="flex items-center justify-between text-sm">
            <span><span className="font-medium">{fileName}</span> · {rawRows.length} righe</span>
            {aiBusy && <span className="flex items-center gap-1.5 text-ai"><Sparkles size={14} /> L&apos;AI sta riconoscendo le colonne...</span>}
          </div>
          <div className="divide-y divide-line overflow-hidden card">
            {TARGET_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-4 px-4 py-2.5">
                <span className="w-40 shrink-0 text-sm font-medium">{f.label}{f.required && ' *'}</span>
                <select value={mapping[f.key] ?? ''} onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                  <option value="">Non presente</option>
                  {cols.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="hidden w-48 truncate text-xs text-muted md:block">{mapping[f.key] ? String(rawRows[0][mapping[f.key]] ?? '') : ''}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between">
            <button onClick={() => { setRawRows([]); setFileName(''); }} className="text-sm text-muted hover:text-ink">Cambia file</button>
            <button onClick={runImport} disabled={importing || !rows.length} className="flex items-center gap-2 btn-ink rounded-xl px-6 py-2.5 text-sm font-semibold">
              {importing && <Loader2 size={16} className="animate-spin" />}
              {importing ? 'Importo... (le foto richiedono qualche secondo)' : `Importa ${rows.length} immobili`}
            </button>
          </div>
        </div>
      )}
      {error && !rawRows.length && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
