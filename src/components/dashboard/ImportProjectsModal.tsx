'use client';

import React, { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { s, Box, Icon } from './ui';
import { supabase } from '@/lib/supabase';
import { TARGET_FIELDS, autoMapColumns, buildImportRows, type ImportResult } from '@/lib/propertyImport';

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

  const buildAutoMap = useCallback((cols: string[]) => autoMapColumns(cols), []);

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

  const { rows, skippedClient } = useMemo(() => buildImportRows(rawRows, mapping), [rawRows, mapping]);

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(24, 21, 17, 0.4)', backdropFilter: 'blur(4px)' }}
      />

      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 504, background: '#fff', borderRadius: 22, boxShadow: '0 24px 64px rgba(20, 18, 15, 0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="max-md:!p-4" style={{ padding: '22px 29px 18px', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>Importa immobili</h2>
            <div style={{ fontSize: 11.5, color: '#8c867d', marginTop: 4 }}>
              {step === 'upload' && 'Carica un file Excel o CSV'}
              {step === 'mapping' && 'Abbina le colonne del file ai campi'}
              {step === 'done' && 'Import completato'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 7 }} className="hover:bg-gray-100">
            <Icon name="x" size={18} color="#8c867d" />
          </button>
        </div>

        {/* Body */}
        <div className="max-md:!p-4" style={{ padding: '18px 29px 22px', overflowY: 'auto' }}>

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
                  borderRadius: 14,
                  padding: '36px 18px',
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
                <div style={{ width: 43, height: 43, borderRadius: 11, background: '#fff', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 13px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <Icon name="upload" size={20} color={dragOver ? '#3B83F6' : '#8c867d'} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: dragOver ? '#3B83F6' : '#57534c' }}>Trascina o clicca qui</div>
                <div style={{ fontSize: 11.5, color: '#8c867d', marginTop: 5 }}>Formati supportati: .xlsx, .xls, .csv</div>
              </label>
              {parseError && (
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#dc2626' }}>
                  <Icon name="alert-triangle" size={14} color="#dc2626" />
                  {parseError}
                </div>
              )}
            </>
          )}

          {/* STEP MAPPING */}
          {step === 'mapping' && (
            <>
              {/* File banner */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#faf9f7', border: '1px solid #f0ede7', padding: '11px 13px', borderRadius: 13, marginBottom: 18 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="file-spreadsheet" size={16} color="#57534c" />
                </div>
                <div style={{ minWidth: 0, fontSize: 11.5, color: '#8c867d', lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 700, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fileName || 'File'}</div>
                  <div>{rawRows.length} righe rilevate{skippedClient > 0 && <span style={{ color: '#b3760c' }}>{` · ${skippedClient} senza nome saltate`}</span>}</div>
                </div>
              </div>

              {/* Count hero */}
              <div style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 14, padding: '22px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#211f1c', lineHeight: 1, letterSpacing: '-0.5px' }}>{rows.length}</div>
                <div style={{ fontSize: 12.5, color: '#57534c', marginTop: 7 }}>{rows.length === 1 ? 'immobile pronto per l\'import' : 'immobili pronti per l\'import'}</div>
              </div>

              {/* Recognized fields */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.04em' }}>Campi riconosciuti</span>
                  {aiLoading && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4.5, fontSize: 10.5, color: '#3B83F6', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}><Icon name="loader-circle" size={12} color="#3B83F6" /></span>
                      AI…
                    </span>
                  )}
                </div>
                {recognized.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {recognized.map((lbl) => (
                      <span key={lbl} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: '#16734a', background: '#eef9f0', border: '1px solid #cce8d6', borderRadius: 99, padding: '5px 11px' }}>
                        <Icon name="check" size={12} color="#16a34a" />{lbl}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: '#8c867d' }}>Nessun campo riconosciuto automaticamente.</div>
                )}
              </div>

              {fetchError && (
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#dc2626' }}>
                  <Icon name="alert-triangle" size={14} color="#dc2626" />
                  {fetchError}
                </div>
              )}
            </>
          )}

          {/* STEP DONE */}
          {step === 'done' && result && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#eef9f0', border: '1px solid #cce8d6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="circle-check" size={22} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#211f1c', letterSpacing: '-0.2px' }}>Import completato</div>
                  <div style={{ fontSize: 11.5, color: '#8c867d', marginTop: 2 }}>I tuoi immobili sono pronti. Li trovi in Tutti gli immobili.</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 11 }}>
                {[
                  { label: 'Creati', value: result.created, icon: 'plus', color: '#16a34a', bg: '#eef9f0', bd: '#cce8d6' },
                  { label: 'Aggiornati', value: result.updated, icon: 'refresh-cw', color: '#3B83F6', bg: '#eff4fe', bd: '#d3e3fc' },
                  { label: 'Saltati', value: result.skipped, icon: 'minus', color: '#b3760c', bg: '#fdf8ef', bd: '#f0e4cc' },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 13, padding: '14px 11px', textAlign: 'center' }}>
                    <div style={{ width: 29, height: 29, borderRadius: 8, background: stat.bg, border: `1px solid ${stat.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 9px' }}>
                      <Icon name={stat.icon} size={14} color={stat.color} />
                    </div>
                    <div style={{ fontSize: 23, fontWeight: 800, color: '#211f1c', lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: '#8c867d', marginTop: 4.5 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {result.errors.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 700, color: '#b3760c', marginBottom: 7 }}>
                    <Icon name="alert-triangle" size={14} color="#b3760c" />
                    {result.errors.length === 1 ? '1 avviso' : `${result.errors.length} avvisi`}
                  </div>
                  <div style={{ maxHeight: 144, overflowY: 'auto', background: '#fdf8ef', border: '1px solid #f0e4cc', borderRadius: 11, padding: '7px 11px' }}>
                    {result.errors.map((err, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11.5, color: '#7a5a16', lineHeight: 1.5, padding: '4.5px 0', borderBottom: i === result.errors.length - 1 ? 'none' : '1px solid #f0e4cc' }}>
                        <span style={{ marginTop: 4.5, width: 4, height: 4, borderRadius: 99, background: '#b3760c', flexShrink: 0 }} />
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="max-md:!p-4" style={{ padding: '18px 29px', borderTop: '1px solid #f0ede7', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 11 }}>
          {step === 'upload' && (
            <Box as="button" onClick={onClose} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:12.5px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:pointer')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
              Annulla
            </Box>
          )}

          {step === 'mapping' && (
            <>
              <Box as="button" onClick={() => { setStep('upload'); setFetchError(''); }} disabled={loading} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:12.5px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:pointer')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                Indietro
              </Box>
              <Box
                as="button"
                onClick={handleImport}
                disabled={loading || aiLoading || !rows.length}
                style={s('border:none;background:#3B83F6;color:#fff;font-size:12.5px;font-weight:700;padding:11px 18px;border-radius:11px;display:inline-flex;align-items:center;gap:7px;box-shadow:0 4px 12px rgba(59,131,246,0.25);cursor:' + (loading || aiLoading || !rows.length ? 'default' : 'pointer') + ';opacity:' + (loading || aiLoading || !rows.length ? 0.45 : 1))}
                hover={loading || aiLoading || !rows.length ? undefined : s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}
              >
                {loading || aiLoading ? (
                  <>
                    <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}>
                      <Icon name="loader-circle" size={14} color="#fff" />
                    </span>
                    {aiLoading ? 'Analisi colonne...' : 'Importazione...'}
                  </>
                ) : (
                  `Importa ${rows.length} immobili`
                )}
              </Box>
            </>
          )}

          {step === 'done' && (
            <Box as="button" onClick={onClose} style={s('border:none;background:#3B83F6;color:#fff;font-size:12.5px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:pointer;box-shadow:0 4px 12px rgba(59,131,246,0.25);display:inline-flex;align-items:center;gap:7px')} hover={s('background:#2563EB')}>
              Avanti
              <Icon name="arrow-right" size={14} color="#fff" />
            </Box>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
