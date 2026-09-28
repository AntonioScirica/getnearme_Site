'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, FileSpreadsheet, Link2, Loader2, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DETAIL_FIELDS, TARGET_FIELDS, aiMapColumns, autoMapColumns, buildImportRows, readSheet, type ImportResult } from '@/lib/propertyImport';
import { authFetch, CARD_SHADOW } from './api';
import Dropdown from '@/components/ui/Dropdown';

// Import immobili: da link degli annunci (immobiliare, idealista, qualsiasi sito: il server legge la pagina con ZenRows,
// api/projects/import-link) o da CSV/Excel (logica condivisa con la vecchia dashboard in lib/propertyImport). Nel file,
// se c'e' la colonna "Link annuncio", ogni riga col link si completa dal portale: dati e tutte le foto.
type LinkState = { url: string; status: 'coda' | 'leggo' | 'ok' | 'esiste' | 'errore'; nome?: string; msg?: string };
const LINK_RE = /https?:\/\/[^\s,;|"'<>]+/g;
const ERR: Record<string, string> = { not_a_listing: 'Non sembra un annuncio (non trovo prezzo e superficie)', blocked: 'Pagina non leggibile (lenta, rimossa o bloccata)', invalid_url: 'Link non valido', daily_limit: 'Limite giornaliero di annunci letti raggiunto' };
// un link alla volta: il server ci mette 15-90 s a pagina (ZenRows), poi copia le foto
async function importLink(url: string, extra: { riferimento?: string; nome?: string } = {}): Promise<{ ok: true; existing: boolean; nome: string } | { ok: false; msg: string }> {
  const res = await authFetch('/api/projects/import-link', { method: 'POST', body: JSON.stringify({ url, ...extra }) }).catch(() => null);
  const d = res ? await res.json().catch(() => ({})) : {};
  if (res?.ok && d?.id) return { ok: true, existing: !!d.existing, nome: d.nome ?? '' };
  return { ok: false, msg: ERR[d?.error] ?? 'Lettura non riuscita, riprova' };
}

export default function ImportView({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'link' | 'file'>('link');
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

  // file: righe col link si leggono dal portale (una alla volta), le altre vanno all'import classico
  const [readLinks, setReadLinks] = useState(true);
  const [progress, setProgress] = useState('');
  const linked = readLinks && !!mapping['url'] ? rows.filter(r => r.url) : [];
  const runImport = async () => {
    setImporting(true); setError(null);
    try {
      const plain = rows.filter(r => !linked.includes(r));
      let created = 0, updated = 0, skipped = skippedClient; const errors: string[] = [];
      for (const [i, r] of linked.entries()) {
        setProgress(`Leggo l'annuncio ${i + 1} di ${linked.length}: ${r.nome}`);
        const out = await importLink(r.url!, { riferimento: r.riferimento, nome: r.nome });
        if (out.ok) { if (out.existing) updated++; else created++; }
        else { skipped++; errors.push(`${r.nome}: ${out.msg}`); }
      }
      if (plain.length) {
        setProgress(plain.length === rows.length ? '' : `Importo le altre ${plain.length} righe`);
        const res = await authFetch('/api/projects/import', { method: 'POST', body: JSON.stringify({ rows: plain }) });
        if (!res.ok) throw new Error();
        const r = (await res.json()) as ImportResult;
        created += r.created; updated += r.updated; skipped += r.skipped ?? 0; errors.push(...(r.errors ?? []));
      }
      setResult({ created, updated, skipped, errors });
      onDone();
    } catch {
      setError("Errore durante l'import, riprova.");
    } finally { setImporting(false); setProgress(''); }
  };

  // da link: uno per riga, letti in fila con lo stato di ognuno
  const [text, setText] = useState('');
  const [links, setLinks] = useState<LinkState[]>([]);
  const running = useRef(false);
  const urls = useMemo(() => [...new Set(text.match(LINK_RE) ?? [])].slice(0, 50), [text]);
  const runLinks = async () => {
    if (running.current || !urls.length) return;
    running.current = true; setError(null);
    const list: LinkState[] = urls.map(url => ({ url, status: 'coda' }));
    setLinks(list);
    const patch = (i: number, p: Partial<LinkState>) => setLinks(l => l.map((x, k) => (k === i ? { ...x, ...p } : x)));
    for (const [i, l] of list.entries()) {
      patch(i, { status: 'leggo' });
      const out = await importLink(l.url);
      patch(i, out.ok ? { status: out.existing ? 'esiste' : 'ok', nome: out.nome } : { status: 'errore', msg: out.msg });
      if (out.ok) onDone();
    }
    running.current = false;
  };
  const linksDone = links.length > 0 && links.every(l => l.status === 'ok' || l.status === 'esiste' || l.status === 'errore');
  const linksBusy = links.length > 0 && !linksDone;

  return (
    <div className="mx-auto max-w-3xl">
      <a href="#/nuovo" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Nuovo immobile nella tua vetrina</a>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Importa i tuoi immobili</h1>
      <p className="mt-1 text-muted">{mode === 'link' ? 'Incolla i link degli annunci: leggiamo dati e foto dal portale e li mettiamo in vetrina.' : 'Carica l\u2019export del tuo gestionale: riconosciamo le colonne da soli, tu controlli e confermi.'}</p>
      <div className="mt-5 flex w-fit rounded-full bg-canvas p-1">
        {([['link', 'Da link', Link2], ['file', 'Da CSV o Excel', FileSpreadsheet]] as const).map(([m, l, Icon]) => (
          <button key={m} type="button" disabled={linksBusy || importing} onClick={() => setMode(m)} className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors ${mode === m ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}><Icon size={14} /> {l}</button>
        ))}
      </div>

      {mode === 'link' ? (
        <div className="mt-6 space-y-4">
          {!links.length ? (
            <>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder={'https://www.immobiliare.it/annunci/...\nhttps://www.idealista.it/immobile/...\nUn link per riga, anche 50 alla volta.'}
                className="w-full resize-none rounded-2xl bg-white p-4 text-sm leading-relaxed outline-none ring-1 ring-line focus:ring-ink/20" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">{urls.length ? `${urls.length} link trovati` : 'Immobiliare, Idealista, Casa.it e gli altri portali.'} Ogni annuncio richiede da 30 secondi a 2 minuti.</span>
                <button onClick={runLinks} disabled={!urls.length} className="btn-ink rounded-xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50">Importa {urls.length || ''} {urls.length === 1 ? 'annuncio' : 'annunci'}</button>
              </div>
            </>
          ) : (
            <>
              <ul className={`divide-y divide-line overflow-hidden rounded-3xl bg-white ${CARD_SHADOW}`}>
                {links.map(l => (
                  <li key={l.url} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas">
                      {l.status === 'leggo' ? <Loader2 size={14} className="animate-spin text-ai" /> : l.status === 'ok' || l.status === 'esiste' ? <Check size={14} className="text-emerald-600" /> : l.status === 'errore' ? <X size={14} className="text-rose-600" /> : <span className="h-1.5 w-1.5 rounded-full bg-line" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{l.nome || l.url}</span>
                    <span className="shrink-0 text-xs text-muted">{l.status === 'coda' ? 'In coda' : l.status === 'leggo' ? 'Leggo l\u2019annuncio…' : l.status === 'ok' ? 'In vetrina' : l.status === 'esiste' ? 'Già in vetrina' : l.msg}</span>
                  </li>
                ))}
              </ul>
              {linksDone && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm">{links.filter(l => l.status === 'ok').length} importati{links.some(l => l.status === 'esiste') ? `, ${links.filter(l => l.status === 'esiste').length} già presenti` : ''}{links.some(l => l.status === 'errore') ? `, ${links.filter(l => l.status === 'errore').length} non letti` : ''}.</span>
                  <div className="flex gap-3">
                    <button onClick={() => { setLinks([]); setText(''); }} className="btn-ghost rounded-lg px-5 py-2.5 text-sm font-medium">Altri link</button>
                    <a href="#/immobili" className="btn-ink rounded-xl px-5 py-2.5 text-sm font-semibold">Vedi immobili</a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : result ? (
        <div className="mt-8 card p-6">
          <h2 className="font-display text-xl font-semibold">Import completato</h2>
          <p className="mt-2 text-sm">{result.created} nuovi, {result.updated} aggiornati{result.skipped ? `, ${result.skipped} saltati` : ''}.</p>
          {result.errors?.length > 0 && <ul className="mt-3 max-h-40 space-y-1 overflow-auto text-xs text-muted">{result.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}</ul>}
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
          {!!mapping['url'] && (
            <label className={`flex cursor-pointer items-start gap-3 rounded-3xl bg-white p-4 text-sm ${CARD_SHADOW}`}>
              <input type="checkbox" checked={readLinks} onChange={e => setReadLinks(e.target.checked)} className="mt-0.5 accent-ink" />
              <span><span className="font-medium">Completa dal portale le {rows.filter(r => r.url).length} righe con il link</span><br /><span className="text-muted">Leggiamo l&apos;annuncio: descrizione, scheda e tutte le foto. Da 30 secondi a 2 minuti a immobile, uno alla volta.</span></span>
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => { setRawRows([]); setFileName(''); }} className="text-sm text-muted hover:text-ink">Cambia file</button>
            <span className="min-w-0 flex-1 truncate text-right text-xs text-muted">{progress}</span>
            <button onClick={runImport} disabled={importing || !rows.length} className="flex shrink-0 items-center gap-2 btn-ink rounded-xl px-6 py-2.5 text-sm font-semibold">
              {importing && <Loader2 size={16} className="animate-spin" />}
              {importing ? (linked.length ? 'Importo…' : 'Importo... (le foto richiedono qualche secondo)') : `Importa ${rows.length} immobili`}
            </button>
          </div>
        </div>
      )}
      {error && mode === 'file' && !rawRows.length && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
