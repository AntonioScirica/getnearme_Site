'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, FileSpreadsheet, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DETAIL_FIELDS, TARGET_FIELDS, aiMapColumns, autoMapColumns, buildImportRows, readSheet, type ImportResult } from '@/lib/propertyImport';
import { authFetch, CARD_SHADOW } from './api';
import Dropdown from '@/components/ui/Dropdown';

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
  const [allDetails, setAllDetails] = useState(false); // campi della scheda: di base solo quelli trovati nel file
  const colOptions = [{ value: '', label: 'Non presente' }, ...cols.map(c => ({ value: c, label: c }))];
  const row = (key: string, label: string, required?: boolean) => (
    <div key={key} className="flex items-center gap-4 px-4 py-2">
      <span className="w-44 shrink-0 text-sm font-medium">{label}{required && ' *'}</span>
      <Dropdown value={mapping[key] ?? ''} options={colOptions} onChange={v => setMapping(m => ({ ...m, [key]: v }))} className="h-10 min-w-0 flex-1 justify-between bg-canvas px-4 text-sm" />
      <span className="hidden w-48 truncate text-xs text-muted md:block">{mapping[key] ? String(rawRows[0][mapping[key]] ?? '') : ''}</span>
    </div>
  );
  const foundDetails = DETAIL_FIELDS.filter(f => mapping[`d:${f.key}`]);
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
        for (const k of [...TARGET_FIELDS.map(f => f.key as string), ...DETAIL_FIELDS.map(f => `d:${f.key}`)]) if (ai[k] && c.includes(ai[k])) m[k] = ai[k];
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
      <a href="#/nuovo" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Nuovo immobile nella tua vetrina</a>
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
          <div className={`divide-y divide-line overflow-hidden rounded-3xl bg-white ${CARD_SHADOW}`}>
            {TARGET_FIELDS.map(f => row(f.key, f.label, f.required))}
          </div>
          {/* campi della scheda (classe energetica, piano, riscaldamento...): valori riconosciuti e normalizzati riga per riga */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold">Altri dati della scheda <span className="font-normal text-muted">{foundDetails.length} trovati</span></span>
              <button onClick={() => setAllDetails(v => !v)} className="rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">{allDetails ? 'Solo quelli trovati' : 'Mostra tutti'}</button>
            </div>
            {(allDetails ? DETAIL_FIELDS : foundDetails).length > 0 && (
              <div className={`divide-y divide-line overflow-hidden rounded-3xl bg-white ${CARD_SHADOW}`}>
                {(allDetails ? DETAIL_FIELDS : foundDetails).map(f => row(`d:${f.key}`, f.label))}
              </div>
            )}
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
