import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectData } from './projects';

// Righe esportabili: stessi header riconosciuti dall'auto-map di ImportProjectsModal
// (così un export è ri-importabile senza rimappare).
function buildRows(projects: ProjectData[]) {
  return projects.map((p) => ({
    Riferimento: p.riferimento ?? '',
    Nome: p.nome ?? '',
    Indirizzo: p.addr ?? '',
    Tipologia: p.tipologia ?? '',
    Prezzo: typeof p.prezzo === 'number' ? p.prezzo : '',
    MQ: typeof p.mq === 'number' ? p.mq : '',
    Camere: typeof p.camere === 'number' ? p.camere : '',
    Bagni: typeof p.bagni === 'number' ? p.bagni : '',
    Titolo: p.titolo ?? '',
    Descrizione: p.descrizione ?? '',
    Cover: p.cover ?? '',
  }));
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
  const sheet = XLSX.utils.json_to_sheet(buildRows(projects));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Immobili');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Alias storico
export const exportProjectsToFile = exportProjectsXLSX;

// CSV (delimitatore ';' come gli export dei gestionali italiani)
export function exportProjectsCSV(projects: ProjectData[], filename = 'immobili') {
  const sheet = XLSX.utils.json_to_sheet(buildRows(projects));
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

  const fmtPrezzo = (v: number | undefined) => (typeof v === 'number' && v > 0 ? '€ ' + v.toLocaleString('it-IT') : '');
  autoTable(doc, {
    startY: 74,
    head: [['Riferimento', 'Nome', 'Indirizzo', 'Tipologia', 'Prezzo', 'MQ', 'Camere', 'Bagni']],
    body: projects.map((p) => [
      p.riferimento ?? '',
      p.nome ?? '',
      p.addr ?? '',
      p.tipologia ?? '',
      fmtPrezzo(p.prezzo),
      typeof p.mq === 'number' && p.mq > 0 ? String(p.mq) : '',
      typeof p.camere === 'number' && p.camere > 0 ? String(p.camere) : '',
      typeof p.bagni === 'number' && p.bagni > 0 ? String(p.bagni) : '',
    ]),
    styles: { fontSize: 9, cellPadding: 5, overflow: 'ellipsize' },
    headStyles: { fillColor: [59, 131, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 244, 240] },
    columnStyles: { 1: { cellWidth: 120 }, 2: { cellWidth: 160 } },
    margin: { left: 40, right: 40 },
  });
  doc.save(`${filename}.pdf`);
}
