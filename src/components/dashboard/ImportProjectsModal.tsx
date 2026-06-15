'use client';

import React, { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { s, Box, Icon } from './ui';
import { supabase } from '@/lib/supabase';

// Contratto API concordato col backend.
type ImportRow = {
  riferimento?: string;
  nome: string;
  addr?: string;
  prezzo?: number;
  mq?: number;
  locali?: number;
  camere?: number;
  bagni?: number;
  descrizione?: string;
  titolo?: string;
  tipologia?: string;
  photoUrl?: string;
  photoUrls?: string[]; // piu' URL nella cella foto: il server usa la prima raggiungibile
  _raw?: Record<string, unknown>; // riga originale completa (salvata per report futuri)
};

type ImportResult = { created: number; updated: number; skipped: number; errors: string[] };

// Campi target -> etichetta UI + sinonimi header (IT/EN, case-insensitive).
type TargetKey = keyof ImportRow;
// Sinonimi in ORDINE DI PRIORITA' (il primo che matcha vince). Coprono i formati
// reali: Agenzia generico, GestIm, Getrix (header con underscore, typo "meti", ecc.)
const TARGET_FIELDS: { key: TargetKey; label: string; required?: boolean; synonyms: string[] }[] = [
  { key: 'riferimento', label: 'Riferimento', synonyms: ['rif_interno', 'codice_agenzia', 'codice_getrix', 'id_gestim', 'id_annuncio', 'cod_procedura', 'riferimento', 'codice annuncio', 'codice', 'rif', 'ref', 'id'] },
  { key: 'nome', label: 'Nome', required: true, synonyms: ['nome', 'denominazione', 'name', 'titolo breve', 'immobile'] },
  { key: 'addr', label: 'Indirizzo', synonyms: ['indirizzo', 'via', 'dove si trova', 'ubicazione', 'localita', 'località', 'comune', 'città', 'citta', 'address'] },
  { key: 'prezzo', label: 'Prezzo', synonyms: ['prezzo_attuale', 'prezzo_euro', 'prezzo richiesto', 'prezzo_richiesto', 'prezzo_base', 'prezzo', 'soldi', 'price', 'importo'] },
  { key: 'mq', label: 'Superficie (mq)', synonyms: ['superficie_mq', 'meti_quadri', 'metri_quadri', 'metri quadri', 'superficie commerciale', 'superficie', 'mq', 'quadri', 'sqm', 'size'] },
  { key: 'locali', label: 'Locali', synonyms: ['numero_vani', 'numero vani', 'locali', 'vani', 'rooms'] },
  { key: 'camere', label: 'Camere', synonyms: ['numero_camere', 'camere da letto', 'camere', 'bedrooms'] },
  { key: 'bagni', label: 'Bagni', synonyms: ['numero_bagni', 'numero bagni', 'bagni', 'bathrooms', 'wc'] },
  { key: 'descrizione', label: 'Descrizione', synonyms: ['descrizione_it', 'descrizione per i clienti', 'descrizione', 'testo_annuncio', 'testo annuncio', 'description'] },
  { key: 'titolo', label: 'Titolo', synonyms: ['titolo', 'title', 'headline'] },
  { key: 'tipologia', label: 'Tipologia', synonyms: ['tipo_immobile', 'tipologia', 'tipo immobile', 'cosa è', 'cosa e', 'tipo', 'category', 'typology'] },
  { key: 'photoUrl', label: 'Foto / URL', synonyms: ['url foto', 'foto url', 'foto', 'immagine', 'photo', 'image', 'cover', 'foto1', 'immagine1'] },
];

const NUMERIC_FIELDS: TargetKey[] = ['prezzo', 'mq', 'locali', 'camere', 'bagni'];

// "€ 350.000" -> 350000 ; "95 m²" -> 95
function parseNumeric(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

function cleanString(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

type Step = 'upload' | 'mapping' | 'done';

export function ImportProjectsModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (res: { created: number; updated: number; skipped: number }) => void;
}) {
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  // Mappatura: target field key -> header colonna (o '' = nessuna).
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Auto-map iniziale per nome header (case-insensitive su sinonimi).
  const buildAutoMap = useCallback((cols: string[]): Record<string, string> => {
    const norm = (v: string) => v.trim().toLowerCase();
    const tokens = (v: string) => norm(v).split(/[^a-z0-9²]+/).filter(Boolean);
    // Match header<->sinonimo: esatto, o parola intera, o substring per sinonimi
    // lunghi (>=4) cosi "Prezzo richiesto"/"Superficie commerciale mq"/"Camere da
    // letto" vengono riconosciuti senza che "id" matchi dentro "indirizzo".
    const matchSyn = (col: string, syn: string) => {
      const n = norm(col);
      return n === syn || tokens(col).includes(syn) || (syn.length >= 4 && n.includes(syn));
    };
    const map: Record<string, string> = {};
    const used = new Set<string>();
    for (const field of TARGET_FIELDS) {
      let found = '';
      // Sinonimi in ordine di priorita': il primo che trova una colonna vince.
      for (const syn of field.synonyms) {
        const col = cols.find((c) => !used.has(c) && matchSyn(c, syn));
        if (col) { found = col; break; }
      }
      map[field.key] = found;
      if (found) used.add(found);
    }
    // I file agenzia raramente hanno una colonna "Nome": fallback su titolo,
    // indirizzo o riferimento (puo' condividere la colonna con quei campi).
    if (!map['nome']) {
      map['nome'] = map['titolo'] || map['addr'] || map['riferimento'] || cols[0] || '';
    }
    return map;
  }, []);

  const handleFile = useCallback(
    (file?: File | null) => {
      if (!file) return;
      setParseError('');
      setFileName(file.name);
      const reader = new FileReader();
      const isCsv = /\.csv$/i.test(file.name);
      reader.onload = () => {
        try {
          const buf = reader.result as ArrayBuffer;
          // CSV italiano usa ';' come separatore: leggo come testo e lascio che
          // SheetJS rilevi il delimitatore (type:'string'). xlsx resta binario.
          const wb = isCsv
            ? XLSX.read(new TextDecoder('utf-8').decode(new Uint8Array(buf)), { type: 'string' })
            : XLSX.read(buf, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          if (!sheet) throw new Error('empty');
          const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
          if (!json.length) {
            setParseError('Il file non contiene righe.');
            return;
          }
          const cols = Object.keys(json[0]);
          setRawRows(json);
          setMapping(buildAutoMap(cols));
          setStep('mapping');
          // Affina la mappatura con Claude Haiku (solo gli header + 1 riga:
          // costo ~zero). Se fallisce, resta l'auto-map euristico.
          (async () => {
            setAiLoading(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const h: Record<string, string> = { 'Content-Type': 'application/json' };
              if (session) h['Authorization'] = `Bearer ${session.access_token}`;
              const res = await fetch('/api/projects/map-columns', {
                method: 'POST', headers: h,
                body: JSON.stringify({ headers: cols, sample: json[0] }),
              });
              if (!res.ok) return;
              const { mapping: ai } = (await res.json()) as { mapping: Record<string, string> };
              setMapping((prev) => {
                const merged = { ...prev };
                for (const f of TARGET_FIELDS) if (ai[f.key]) merged[f.key] = ai[f.key];
                if (!merged['nome']) merged['nome'] = merged['titolo'] || merged['addr'] || merged['riferimento'] || cols[0] || '';
                return merged;
              });
            } catch { /* fallback euristico */ } finally {
              setAiLoading(false);
            }
          })();
        } catch (err) {
          console.error('parse error', err);
          setParseError('Impossibile leggere il file. Verifica che sia un .xlsx, .xls o .csv valido.');
        }
      };
      reader.onerror = () => setParseError('Errore nella lettura del file.');
      reader.readAsArrayBuffer(file);
    },
    [buildAutoMap]
  );

  // Costruisce le ImportRow valide e conta quelle scartate (senza nome).
  const { rows, skippedClient } = useMemo(() => {
    const nameCol = mapping['nome'];
    if (!nameCol) return { rows: [] as ImportRow[], skippedClient: 0 };
    const built: ImportRow[] = [];
    let skipped = 0;
    for (const r of rawRows) {
      const nome = cleanString(r[nameCol]);
      if (!nome) {
        skipped++;
        continue;
      }
      const row: ImportRow = { nome, _raw: r };
      for (const field of TARGET_FIELDS) {
        if (field.key === 'nome') continue;
        const col = mapping[field.key];
        if (!col) continue;
        const val = r[col];
        if (field.key === 'photoUrl') {
          // La cella foto puo' contenere piu' URL (separati da , ; | spazio): li
          // estraggo tutti; il server prova in ordine e tiene il primo raggiungibile.
          const urls = String(val ?? '').match(/https?:\/\/[^\s,;|]+/g);
          if (urls && urls.length) row.photoUrls = urls;
        } else if (NUMERIC_FIELDS.includes(field.key)) {
          const num = parseNumeric(val);
          if (num !== undefined) (row as Record<string, unknown>)[field.key] = num;
        } else {
          const str = cleanString(val);
          if (str) (row as Record<string, unknown>)[field.key] = str;
        }
      }
      built.push(row);
    }
    return { rows: built, skippedClient: skipped };
  }, [rawRows, mapping]);

  // Etichette dei campi riconosciuti dall'auto-map (per il riepilogo).
  const recognized = useMemo(
    () => TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => f.label),
    [mapping]
  );

  const handleImport = async () => {
    if (!mapping['nome']) {
      setFetchError('Mappa il campo Nome (obbligatorio) prima di importare.');
      return;
    }
    if (!rows.length) {
      setFetchError('Nessuna riga valida da importare.');
      return;
    }
    setFetchError('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headersReq: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) headersReq['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: headersReq,
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error('import API error', errJson);
        setFetchError('Errore durante l\'import. Riprova più tardi.');
        setLoading(false);
        return;
      }
      const json = (await res.json()) as ImportResult;
      const merged: ImportResult = {
        created: json.created ?? 0,
        updated: json.updated ?? 0,
        skipped: (json.skipped ?? 0) + skippedClient,
        errors: json.errors ?? [],
      };
      setResult(merged);
      setStep('done');
      onDone({ created: merged.created, updated: merged.updated, skipped: merged.skipped });
    } catch (err) {
      console.error('import fetch error', err);
      setFetchError('Errore di rete durante l\'import.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(24, 21, 17, 0.4)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 560, background: '#fff', borderRadius: 24, boxShadow: '0 24px 64px rgba(20, 18, 15, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="max-md:!p-4" style={{ padding: '24px 32px 20px', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>Importa immobili</h2>
            <div style={{ fontSize: 13, color: '#8c867d', marginTop: 4 }}>
              {step === 'upload' && 'Carica un file Excel o CSV'}
              {step === 'mapping' && 'Abbina le colonne del file ai campi'}
              {step === 'done' && 'Import completato'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }} className="hover:bg-gray-100">
            <Icon name="x" size={20} color="#8c867d" />
          </button>
        </div>

        {/* Body */}
        <div className="max-md:!p-4" style={{ padding: '20px 32px 24px', overflowY: 'auto' }}>

          {/* STEP UPLOAD */}
          {step === 'upload' && (
            <>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
                style={{
                  display: 'block',
                  border: `2px dashed ${dragOver ? '#3B83F6' : '#d8d4cb'}`,
                  borderRadius: 16,
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: dragOver ? '#eff6ff' : '#fcfcfb',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <Icon name="upload" size={22} color={dragOver ? '#3B83F6' : '#8c867d'} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: dragOver ? '#3B83F6' : '#57534c' }}>Trascina o clicca qui</div>
                <div style={{ fontSize: 13, color: '#8c867d', marginTop: 6 }}>Formati supportati: .xlsx, .xls, .csv</div>
              </label>
              {parseError && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
                  <Icon name="alert-triangle" size={16} color="#dc2626" />
                  {parseError}
                </div>
              )}
            </>
          )}

          {/* STEP MAPPING */}
          {step === 'mapping' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f6f4f0', padding: '12px 16px', borderRadius: 12, marginBottom: 20 }}>
                <Icon name="file-text" size={18} color="#57534c" />
                <div style={{ fontSize: 13, color: '#57534c', lineHeight: 1.4 }}>
                  <strong style={{ color: '#211f1c' }}>{fileName || 'File'}</strong>
                  {' — '}{rawRows.length} righe rilevate
                  {skippedClient > 0 && (
                    <span style={{ color: '#b3760c' }}>{`, ${skippedClient} senza nome verranno saltate`}</span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '20px 12px 8px' }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#211f1c', lineHeight: 1 }}>{rows.length}</div>
                <div style={{ fontSize: 14, color: '#57534c', marginTop: 6 }}>{rows.length === 1 ? 'immobile pronto per l\'import' : 'immobili pronti per l\'import'}</div>
                {skippedClient > 0 && (
                  <div style={{ fontSize: 12.5, color: '#b3760c', marginTop: 6 }}>{`${skippedClient} righe senza dati verranno saltate`}</div>
                )}
              </div>
              {aiLoading && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12.5, color: '#8c867d' }}>
                  <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}><Icon name="loader-circle" size={14} color="#8c867d" /></span>
                  Riconoscimento colonne con AI…
                </div>
              )}
              {recognized.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {recognized.map((lbl) => (
                    <span key={lbl} style={{ fontSize: 12, fontWeight: 600, color: '#16734a', background: '#eef9f0', border: '1px solid #cce8d6', borderRadius: 99, padding: '4px 10px' }}>{lbl}</span>
                  ))}
                </div>
              )}

              {fetchError && (
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
                  <Icon name="alert-triangle" size={16} color="#dc2626" />
                  {fetchError}
                </div>
              )}
            </>
          )}

          {/* STEP DONE */}
          {step === 'done' && result && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef9f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={22} color="#16a34a" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#211f1c' }}>Import completato</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Creati', value: result.created },
                  { label: 'Aggiornati', value: result.updated },
                  { label: 'Saltati', value: result.skipped },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: '#f6f4f0', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#211f1c' }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: '#8c867d', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {result.errors.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#b3760c', marginBottom: 8 }}>
                    <Icon name="alert-triangle" size={16} color="#b3760c" />
                    {`${result.errors.length} avvisi`}
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', background: '#fdf8ef', border: '1px solid #f0e4cc', borderRadius: 10, padding: 12 }}>
                    {result.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: '#7a5a16', lineHeight: 1.5 }}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="max-md:!p-4" style={{ padding: '20px 32px', borderTop: '1px solid #f0ede7', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          {step === 'upload' && (
            <Box as="button" onClick={onClose} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
              Annulla
            </Box>
          )}

          {step === 'mapping' && (
            <>
              <Box as="button" onClick={() => { setStep('upload'); setFetchError(''); }} disabled={loading} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                Indietro
              </Box>
              <Box
                as="button"
                onClick={handleImport}
                disabled={loading || !rows.length}
                style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(59,131,246,0.25);cursor:' + (loading || !rows.length ? 'default' : 'pointer') + ';opacity:' + (loading || !rows.length ? 0.45 : 1))}
                hover={loading || !rows.length ? undefined : s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                      <Icon name="loader-circle" size={16} color="#fff" />
                    </span>
                    Importazione...
                  </>
                ) : (
                  `Importa ${rows.length} immobili`
                )}
              </Box>
            </>
          )}

          {step === 'done' && (
            <Box as="button" onClick={onClose} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer;box-shadow:0 4px 12px rgba(59,131,246,0.25)')} hover={s('background:#2563EB')}>
              Chiudi
            </Box>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
