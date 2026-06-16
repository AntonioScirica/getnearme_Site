import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectData } from './projects';

// Colonne fisse (core). Header riconosciuti dall'auto-map di ImportProjectsModal
// (così un export resta ri-importabile senza rimappare).
const FIXED_HEADERS = ['Riferimento', 'Nome', 'Indirizzo', 'Tipologia', 'Prezzo', 'MQ', 'Camere', 'Bagni', 'Locali', 'Titolo', 'Descrizione', 'Cover'];
// Normalizzazione per non duplicare una colonna dinamica gia' coperta da una fissa.
const normH = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const FIXED_NORMS = new Set([...FIXED_HEADERS, 'mq', 'metratura', 'superficie', 'indirizzo', 'addr', 'prezzorichiesta'].map(normH));

function fixedRow(p: ProjectData): Record<string, unknown> {
  return {
    Riferimento: p.riferimento ?? '',
    Nome: p.nome ?? '',
    Indirizzo: p.addr ?? '',
    Tipologia: p.tipologia ?? '',
    Prezzo: typeof p.prezzo === 'number' ? p.prezzo : '',
    MQ: typeof p.mq === 'number' ? p.mq : '',
    Camere: typeof p.camere === 'number' ? p.camere : '',
    Bagni: typeof p.bagni === 'number' ? p.bagni : '',
    Locali: typeof p.locali === 'number' ? p.locali : '',
    Titolo: p.titolo ?? '',
    Descrizione: p.descrizione ?? '',
    Cover: p.cover ?? '',
  };
}

// Unione ordinata (prima apparizione) delle chiavi extra (import_data) di tutti
// gli immobili, escluse quelle gia' coperte dalle colonne fisse.
function dynamicHeaders(projects: ProjectData[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of projects) {
    const data = p.import_data;
    if (!data || typeof data !== 'object') continue;
    for (const k of Object.keys(data)) {
      const v = (data as Record<string, unknown>)[k];
      if (v === '' || v == null) continue;
      const nk = normH(k);
      if (FIXED_NORMS.has(nk) || seen.has(nk)) continue;
      seen.add(nk);
      out.push(k);
    }
  }
  return out;
}

// Righe complete: colonne fisse + tutte le colonne dinamiche create nel tempo.
function buildRows(projects: ProjectData[]) {
  const dyn = dynamicHeaders(projects);
  return projects.map((p) => {
    const row = fixedRow(p);
    const data = (p.import_data && typeof p.import_data === 'object') ? p.import_data as Record<string, unknown> : {};
    // match per chiave normalizzata (le chiavi possono variare di formato tra immobili)
    const byNorm = new Map<string, unknown>();
    for (const [k, v] of Object.entries(data)) byNorm.set(normH(k), v);
    for (const h of dyn) {
      const v = byNorm.get(normH(h));
      row[h] = v == null ? '' : String(v);
    }
    return row;
  });
}

function allHeaders(projects: ProjectData[]): string[] {
  return [...FIXED_HEADERS, ...dynamicHeaders(projects)];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Excel (.xlsx)
export function exportProjectsXLSX(projects: ProjectData[], filename = 'immobili') {
  const sheet = XLSX.utils.json_to_sheet(buildRows(projects), { header: allHeaders(projects) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Immobili');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Alias storico
export const exportProjectsToFile = exportProjectsXLSX;

// CSV (delimitatore ';' come gli export dei gestionali italiani)
export function exportProjectsCSV(projects: ProjectData[], filename = 'immobili') {
  const sheet = XLSX.utils.json_to_sheet(buildRows(projects), { header: allHeaders(projects) });
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
  // BOM per accenti corretti in Excel
  triggerDownload(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

// PDF (tabella leggibile, orizzontale)
export function exportProjectsPDF(projects: ProjectData[], filename = 'immobili') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text('Portafoglio immobili', 40, 40);
  doc.setFontSize(10);
  doc.text(`${projects.length} immobili · ${new Date().toLocaleDateString('it-IT')}`, 40, 58);

  // Tutte le colonne (core + dinamiche create nel tempo). Cover esclusa dal PDF
  // (e' un URL/data lungo, illeggibile in tabella).
  const headers = allHeaders(projects).filter(h => h !== 'Cover');
  const rows = buildRows(projects);
  const fmt = (h: string, v: unknown) => {
    if (v == null || v === '') return '';
    if (h === 'Prezzo' && typeof v === 'number') return '€ ' + v.toLocaleString('it-IT');
    return String(v);
  };
  autoTable(doc, {
    startY: 74,
    head: [headers],
    body: rows.map((r) => headers.map((h) => fmt(h, r[h]))),
    styles: { fontSize: headers.length > 10 ? 7 : 9, cellPadding: 4, overflow: 'ellipsize' },
    headStyles: { fillColor: [59, 131, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 244, 240] },
    margin: { left: 40, right: 40 },
  });
  doc.save(`${filename}.pdf`);
}
