'use client';

// Report builder: barra sinistra con toggle (sezioni + colonne tabella),
// preview reale a destra via <iframe srcDoc> con l'HTML identico all'estensione.
// Stampa via iframe.contentWindow.print().

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { s, Box, Icon } from './ui';
import type { Project } from './types';
import type { BrandSettings } from '@/lib/brand';
import {
  buildReportHtml,
  calculateTotalCosts,
  generateProsCons,
  type ReportProperty,
  type ReportColumnKey,
  type ProsConsEdits,
} from '@/lib/reportHtml';
import { supabase } from '@/lib/supabase';

type SectionId = 'cover' | 'table' | 'prosCons' | 'costs' | 'poi' | 'legal' | 'thanks';

// Sezioni sempre incluse (non rimovibili). POI off finché non abbiamo le coordinate.
const SECTIONS_ON: Record<SectionId, boolean> = { cover: true, table: true, prosCons: true, costs: true, poi: false, legal: true, thanks: true };

const MAX_VISIBLE_COLS = 14;

const COLUMNS: { id: ReportColumnKey; label: string; icon: string; defaultOn?: boolean }[] = [
  { id: 'address', label: 'Indirizzo', icon: 'map-pin' },
  { id: 'price', label: 'Prezzo', icon: 'euro' },
  { id: 'eurmq', label: 'Prezzo al m²', icon: 'euro' },
  { id: 'surface', label: 'Superficie', icon: 'maximize-2' },
  { id: 'rooms', label: 'Locali', icon: 'layout-grid' },
  { id: 'bedrooms', label: 'Camere', icon: 'bed' },
  { id: 'bathrooms', label: 'Bagni', icon: 'bath' },
  { id: 'floor', label: 'Piano', icon: 'layers' },
  { id: 'elevator', label: 'Ascensore', icon: 'arrow-up-down' },
  { id: 'type', label: 'Tipologia', icon: 'building-2' },
  { id: 'condition', label: 'Stato', icon: 'settings' },
  { id: 'energy', label: 'Classe energetica', icon: 'zap' },
  { id: 'monthly', label: 'Spese mensili', icon: 'coins' },
  { id: 'total', label: 'Totale stimato', icon: 'coins' },
  { id: 'yearBuilt', label: 'Anno costruzione', icon: 'calendar', defaultOn: false },
  { id: 'heating', label: 'Riscaldamento', icon: 'zap', defaultOn: false },
  { id: 'parking', label: 'Parcheggio', icon: 'car', defaultOn: false },
  { id: 'furnished', label: 'Arredato', icon: 'sofa', defaultOn: false },
  { id: 'balcony', label: 'Balcone', icon: 'fence', defaultOn: false },
  { id: 'terrace', label: 'Terrazzo', icon: 'sun', defaultOn: false },
  { id: 'garden', label: 'Giardino', icon: 'trees', defaultOn: false },
  { id: 'cellar', label: 'Cantina', icon: 'warehouse', defaultOn: false },
  { id: 'ac', label: 'Climatizzazione', icon: 'snowflake', defaultOn: false },
  { id: 'contract', label: 'Contratto', icon: 'file-text', defaultOn: false },
];

// Estrae un valore stringa da import_data cercando chiavi alternative.
function pick(src: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!src) return undefined;
  const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = keys.map(norm);
  for (const [k, v] of Object.entries(src)) {
    if (v === '' || v == null) continue;
    if (wanted.includes(norm(k))) return String(v);
  }
  return undefined;
}

function mapProject(p: Project): ReportProperty {
  const price = p.prezzo || 0;
  const surface = p.mq || 0;
  const pricePerSqm = surface > 0 ? Math.round(price / surface) : 0;
  const totalCosts = calculateTotalCosts(price, surface);
  return {
    title: p.nome,
    address: p.addr || '',
    price,
    surface,
    rooms: p.locali ?? 'N/A',
    bedrooms: p.camere ?? 'N/A',
    bathrooms: p.bagni ?? 'N/A',
    floor: pick(p.import_data, ['floor', 'piano']) || 'N/A',
    elevator: pick(p.import_data, ['elevator', 'ascensore']) || 'N/A',
    type: p.tipologia || 'N/A',
    stato: pick(p.import_data, ['stato', 'condizione', 'condition']) || 'N/A',
    energyClass: pick(p.import_data, ['energyClass', 'classe_energetica', 'classeEnergetica', 'energia']) || 'N/A',
    condominium: pick(p.import_data, ['condominium', 'spese_condominiali', 'speseCondominiali', 'condominio', 'spese']) || 'N/A',
    pricePerSqm,
    totalCosts,
    yearBuilt: pick(p.import_data, ['yearBuilt', 'anno_costruzione', 'annoCostruzione', 'anno']) || 'N/A',
    heating: pick(p.import_data, ['riscaldamento', 'heating']) || 'N/A',
    parking: pick(p.import_data, ['parking', 'parcheggio', 'garage', 'box', 'postoAuto']) || 'N/A',
    furnished: pick(p.import_data, ['furnished', 'arredato', 'arredamento']) || 'N/A',
    balcony: pick(p.import_data, ['balcone', 'balcony', 'balconata']) || 'N/A',
    terrace: pick(p.import_data, ['terrace', 'terrazzo', 'terrazza']) || 'N/A',
    garden: pick(p.import_data, ['giardino', 'garden']) || 'N/A',
    cellar: pick(p.import_data, ['cantina', 'cellar']) || 'N/A',
    ac: pick(p.import_data, ['climatizzazione', 'ac', 'ariaCondizionata', 'aria_condizionata']) || 'N/A',
    contract: pick(p.import_data, ['contract', 'contratto', 'tipoContratto']) || 'N/A',
  };
}

// Dati mockup per anteprima piano Free (report riservato ai piani Agency).
// import_data completo così la tabella non mostra N/A.
const REPORT_DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-r1', nome: 'Attico Brera', addr: 'Via Fiori Chiari 12, Milano', prezzo: 1250000, mq: 145,
    locali: 4, camere: 3, bagni: 2, tipologia: 'Attico', titolo: 'Attico con terrazza nel cuore di Brera',
    cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=1000&fit=crop&q=80',
    import_data: { piano: '4° con ascensore', ascensore: 'Sì', stato: 'Ristrutturato', classe_energetica: 'A', spese_condominiali: '320 €/mese', anno_costruzione: '2018', riscaldamento: 'Autonomo', parcheggio: 'Box auto', arredato: 'Parzialmente', balcone: 'Sì', terrazzo: 'Sì, 40 m²', giardino: 'No', cantina: 'Sì', climatizzazione: 'Sì', contratto: 'Vendita' },
  },
  {
    id: 'demo-r2', nome: 'Trilocale Isola', addr: 'Via Borsieri 28, Milano', prezzo: 545000, mq: 95,
    locali: 3, camere: 2, bagni: 1, tipologia: 'Appartamento', titolo: 'Trilocale ristrutturato a Isola',
    cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1000&fit=crop&q=80',
    import_data: { piano: '2° con ascensore', ascensore: 'Sì', stato: 'Buono', classe_energetica: 'C', spese_condominiali: '140 €/mese', anno_costruzione: '1995', riscaldamento: 'Centralizzato', parcheggio: 'Posto auto', arredato: 'No', balcone: 'Sì', terrazzo: 'No', giardino: 'No', cantina: 'Sì', climatizzazione: 'No', contratto: 'Vendita' },
  },
  {
    id: 'demo-r3', nome: 'Appartamento Trastevere', addr: 'Vicolo del Cedro 9, Roma', prezzo: 690000, mq: 110,
    locali: 3, camere: 2, bagni: 2, tipologia: 'Appartamento', titolo: 'Charme romano con travi a vista',
    cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1000&fit=crop&q=80',
    import_data: { piano: '1° senza ascensore', ascensore: 'No', stato: 'Da ristrutturare', classe_energetica: 'E', spese_condominiali: '90 €/mese', anno_costruzione: '1920', riscaldamento: 'Autonomo', parcheggio: 'No', arredato: 'Sì', balcone: 'No', terrazzo: 'No', giardino: 'Cortile comune', cantina: 'No', climatizzazione: 'Sì', contratto: 'Vendita' },
  },
  {
    id: 'demo-r4', nome: 'Bilocale Crocetta', addr: 'Corso Re Umberto 44, Torino', prezzo: 295000, mq: 68,
    locali: 2, camere: 1, bagni: 1, tipologia: 'Appartamento', titolo: 'Bilocale elegante in zona Crocetta',
    cover: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=1000&fit=crop&q=80',
    import_data: { piano: '3° con ascensore', ascensore: 'Sì', stato: 'Ottimo', classe_energetica: 'B', spese_condominiali: '110 €/mese', anno_costruzione: '2008', riscaldamento: 'Autonomo', parcheggio: 'Posto auto', arredato: 'Sì', balcone: 'Sì', terrazzo: 'No', giardino: 'No', cantina: 'Sì', climatizzazione: 'Sì', contratto: 'Vendita' },
  },
];

export default function ReportScreen({
  project,
  projects = [],
  brand,
  toast,
  locked = false,
  go,
}: {
  project?: Project;
  projects?: Project[];
  brand: BrandSettings;
  toast: (msg: string, icon?: string) => void;
  locked?: boolean;
  go?: (r: string) => void;
}) {
  // Colore UI della pagina Report: fisso (app), NON il brand. Il brand.primaryColor
  // colora solo il PDF generato (passato a buildReportHtml).
  const accent = '#3B83F6';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollPos = useRef(0);

  // Lista immobili selezionabili: piano Free → sempre mockup; altrimenti reali.
  const allProjects = useMemo(
    () => (locked ? REPORT_DEMO_PROJECTS : (projects.length ? projects : (project ? [project] : []))),
    [locked, projects, project]
  );

  // Selezione immobili da includere/confrontare. Default: immobile attivo (o il primo).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const init = new Set<string>();
    if (locked) { REPORT_DEMO_PROJECTS.slice(0, 2).forEach((p) => init.add(p.id)); return init; }
    if (project?.id) init.add(project.id);
    else if (allProjects[0]?.id) init.add(allProjects[0].id);
    return init;
  });
  // Quando si passa al set mockup (locked) o cambiano gli immobili, scarta gli id
  // non più presenti; se non resta nulla, riparti dai default (2 in locked, 1 reale).
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set([...prev].filter((id) => allProjects.some((p) => p.id === id)));
      if (valid.size > 0) return valid.size === prev.size ? prev : valid;
      const next = new Set<string>();
      (locked ? allProjects.slice(0, 2) : allProjects.slice(0, 1)).forEach((p) => next.add(p.id));
      return next;
    });
  }, [allProjects, locked]);

  const MAX_COMPARE = 4;
  const toggleProject = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) { if (next.size > 1) next.delete(id); } // almeno 1 selezionato
    else {
      if (next.size >= MAX_COMPARE) { toast(`Massimo ${MAX_COMPARE} immobili da confrontare`, 'x'); return prev; }
      next.add(id);
    }
    return next;
  });

  // Ricerca immobili (la lista può essere lunghissima).
  const [q, setQ] = useState('');
  const filteredProjects = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return allProjects;
    return allProjects.filter((p) => `${p.nome} ${p.addr || ''}`.toLowerCase().includes(t));
  }, [allProjects, q]);

  const mappedProperties = useMemo<ReportProperty[]>(
    () => allProjects.filter((p) => selectedIds.has(p.id)).map(mapProject),
    [allProjects, selectedIds]
  );
  const hasProperties = mappedProperties.length > 0;

  // Chiave per-account: le preferenze colonne NON devono sbordare tra account
  // sullo stesso browser. La chiave generica resta solo come fallback pre-login.
  const colsKeyRef = useRef('gnm-report-cols');

  const defaultColOn = useCallback(() => {
    const init = {} as Record<ReportColumnKey, boolean>;
    for (const c of COLUMNS) init[c.id] = c.defaultOn !== false;
    return init;
  }, []);

  const [colOn, setColOn] = useState<Record<ReportColumnKey, boolean>>(defaultColOn);

  // Carica le preferenze salvate per l'account corrente (o default per nuovo account).
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const key = user?.id ? `gnm-report-cols:${user.id}` : 'gnm-report-cols';
      colsKeyRef.current = key;
      if (!alive) return;
      const init = defaultColOn();
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          for (const c of COLUMNS) if (typeof parsed[c.id] === 'boolean') init[c.id] = parsed[c.id];
        }
      } catch { /* ignore */ }
      setColOn(init);
    })();
    return () => { alive = false; };
  }, [defaultColOn]);

  const activeCount = Object.values(colOn).filter(Boolean).length;

  const toggleCol = (id: ReportColumnKey) => {
    if (!colOn[id] && activeCount >= MAX_VISIBLE_COLS) {
      toast(`Massimo ${MAX_VISIBLE_COLS} colonne visibili`, 'x');
      return;
    }
    setColOn((p) => {
      const next = { ...p, [id]: !p[id] };
      try { localStorage.setItem(colsKeyRef.current, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const editsRef = useRef(edits);
  useEffect(() => { editsRef.current = edits; }, [edits]);
  const [pcEdits, setPcEdits] = useState<ProsConsEdits>({});
  const snapshotRef = useRef<{ edits: Record<string, string>; pcEdits: ProsConsEdits; selectedLogo: string | undefined } | null>(null);
  const pendingFocusRef = useRef<{ title: string; pcType: string } | null>(null);

  const LOGO_LABELS: Record<string, string> = {
    logo_colored_h: 'Icona + Nome, Colore',
    logo_colored_v: 'Icona, Colore',
    logo_black_h: 'Icona + Nome, Nero',
    logo_black_v: 'Icona, Nero',
    logo_white_h: 'Icona + Nome, Bianco',
    logo_white_v: 'Icona, Bianco',
  };
  const availableLogos = useMemo(() => {
    const items: { url: string; label: string }[] = [];
    for (const [k, v] of Object.entries(brand.logos)) {
      if (v) items.push({ url: v, label: LOGO_LABELS[k] || k });
    }
    return items;
  }, [brand.logos]);
  const defaultLogo = brand.logos.logo_colored_h || brand.logos.logo_black_h || brand.logos.logo_colored_v || brand.logos.logo_black_v || undefined;
  const [selectedLogo, setSelectedLogo] = useState<string | undefined>(defaultLogo);

  const startEditing = () => {
    snapshotRef.current = { edits: { ...edits }, pcEdits: JSON.parse(JSON.stringify(pcEdits)), selectedLogo };
    setEditing(true);
  };
  const cancelEditing = () => {
    if (snapshotRef.current) {
      setEdits(snapshotRef.current.edits);
      setPcEdits(snapshotRef.current.pcEdits);
      setSelectedLogo(snapshotRef.current.selectedLogo);
    }
    setEditing(false);
  };
  const saveEditing = () => {
    snapshotRef.current = null;
    setEditing(false);
  };

  const getOrInitPc = useCallback((title: string, prev: ProsConsEdits): { pros: string[]; cons: string[] } => {
    if (prev[title]) return { pros: [...prev[title].pros], cons: [...prev[title].cons] };
    const gen = generateProsCons(mappedProperties).find((x) => x.title === title);
    return { pros: gen ? [...gen.pros] : [], cons: gen ? [...gen.cons] : [] };
  }, [mappedProperties]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d.type !== 'string') return;

      if (d.type === 'gnm-nav-brand') {
        go?.('brand');
        return;
      } else if (d.type === 'gnm-edit') {
        setEdits((prev) => (prev[d.key] === d.text ? prev : { ...prev, [d.key]: d.text }));
      } else if (d.type === 'gnm-pc-edit') {
        const parts = (d.key as string).split(':');
        if (parts.length !== 4) return;
        const [, title, pcType, idxStr] = parts;
        const idx = parseInt(idxStr);
        setPcEdits((prev) => {
          const entry = getOrInitPc(title, prev);
          const arr = pcType === 'pros' ? entry.pros : entry.cons;
          if (idx >= 0 && idx < arr.length) arr[idx] = d.text;
          return { ...prev, [title]: entry };
        });
      } else if (d.type === 'gnm-pc-del') {
        setPcEdits((prev) => {
          const entry = getOrInitPc(d.title, prev);
          const arr = d.pcType === 'pros' ? entry.pros : entry.cons;
          arr.splice(d.idx, 1);
          return { ...prev, [d.title]: entry };
        });
      } else if (d.type === 'gnm-logo-change') {
        setSelectedLogo(d.logo);
        return;
      } else if (d.type === 'gnm-pc-add') {
        pendingFocusRef.current = { title: d.title, pcType: d.pcType };
        setPcEdits((prev) => {
          const entry = getOrInitPc(d.title, prev);
          const arr = d.pcType === 'pros' ? entry.pros : entry.cons;
          if (arr.length >= 4) return prev;
          arr.push('Nuovo punto');
          return { ...prev, [d.title]: entry };
        });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [mappedProperties, getOrInitPc, go]);

  const buildHtml = useCallback(() => {
    if (!hasProperties) return '';
    return buildReportHtml({
      properties: mappedProperties,
      brand: {
        primaryColor: brand.primaryColor,
        companyName: brand.companyName || undefined,
        companyWebsite: brand.companyWebsite || undefined,
        companyEmail: brand.companyEmail || undefined,
        logo: selectedLogo,
        allLogos: availableLogos.length > 1 ? availableLogos : [],
        reportFinalTitle: brand.reportFinalTitle || undefined,
        reportFinalDesc: brand.reportFinalDesc || undefined,
      },
      options: { sections: SECTIONS_ON, columns: colOn, edits: editsRef.current, prosConsEdits: pcEdits, editable: editing },
    });
  }, [mappedProperties, hasProperties, brand, colOn, pcEdits, editing, selectedLogo, availableLogos]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !hasProperties) return;
    const html = buildHtml();
    if (!html) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    const savedScroll = scrollPos.current;
    doc.open();
    doc.write(html);
    doc.close();
    const win = iframe.contentWindow;
    if (win) {
      win.scrollTo(0, savedScroll);
      win.addEventListener('scroll', () => { scrollPos.current = win.scrollY; }, { passive: true });
    }
    if (pendingFocusRef.current && doc) {
      const { title, pcType } = pendingFocusRef.current;
      pendingFocusRef.current = null;
      const items = doc.querySelectorAll(`.gnm-pc-item[data-pc-title="${title}"][data-pc-type="${pcType}"]`);
      const last = items[items.length - 1];
      const span = last?.querySelector('.gnm-pc-text');
      if (span instanceof HTMLElement) {
        span.setAttribute('contenteditable', 'true');
        span.focus();
        const r = doc.createRange(); r.selectNodeContents(span);
        const sel = win?.getSelection(); if (sel) { sel.removeAllRanges(); sel.addRange(r); }
        span.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [buildHtml, hasProperties]);

  const handlePrint = () => {
    if (!hasProperties) { toast('Crea o seleziona un immobile', 'x'); return; }
    iframeRef.current?.contentWindow?.print();
  };

  const labelStyle = s('display:block;font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:0 0 10px');

  return (
    <div className="gnm-report-wrap" style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 64px)' }}>
      {/* LEFT: control bar */}
      <div className="gnm-report-rail max-md:!hidden" style={{ width: 330, flexShrink: 0, borderRight: '1px solid #ece9e2', background: '#faf9f7', overflowY: 'auto', padding: '24px 18px 40px' }}>
        <h1 style={s('margin:0 0 4px;font-size:20px;font-weight:800;letter-spacing:-.3px')}>Report</h1>
        <div style={s('color:#8c867d;font-size:13px;margin-bottom:22px')}>Scegli cosa includere nel dossier.</div>

        {locked && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 10, padding: '10px 12px', marginBottom: 18 }}>
            <Icon name="info" size={15} color="#1d5fd0" style={{ marginTop: 1 }} />
            <div style={{ fontSize: 12, lineHeight: 1.45, color: '#1d5fd0', fontWeight: 600 }}>Questi sono immobili di esempio. Passa a un piano Agency per generare il Report con i tuoi immobili reali.</div>
          </div>
        )}

        <div style={labelStyle}>Immobili da confrontare {selectedIds.size > 0 && <span style={{ color: accent }}>({selectedIds.size})</span>}</div>
        {allProjects.length > 6 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e4e1da', borderRadius: 10, padding: '8px 10px', marginBottom: 8 }}>
            <Icon name="search" size={14} color="#b3aca1" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca immobile…" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#211f1c' }} />
            {q && <span onClick={() => setQ('')} style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={14} color="#b3aca1" /></span>}
          </div>
        )}
        <div style={{ marginBottom: 24, maxHeight: 280, overflowY: 'auto', background: '#fff', border: '1px solid #e4e1da', borderRadius: 12 }}>
          {allProjects.length === 0 && <div style={{ fontSize: 13, color: '#b3aca1', padding: '12px 14px' }}>Nessun immobile disponibile.</div>}
          {allProjects.length > 0 && filteredProjects.length === 0 && <div style={{ fontSize: 13, color: '#b3aca1', padding: '12px 14px' }}>Nessun risultato per “{q}”.</div>}
          {filteredProjects.map((p, i) => {
            const on = selectedIds.has(p.id);
            return (
              <Box key={p.id} onClick={() => toggleProject(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: '#fff', borderBottom: i === filteredProjects.length - 1 ? 'none' : '1px solid #f0ede7' }} hover={{ background: '#faf9f7' }}>
                <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${on ? accent : '#cfcabf'}`, background: on ? accent : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" size={12} color="#fff" />}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: on ? accent : '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nome}</div>
                  {p.addr && <div style={{ fontSize: 11.5, color: '#b3aca1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.addr}</div>}
                </div>
              </Box>
            );
          })}
        </div>

        <div style={labelStyle}>Dati in tabella <span style={{ color: '#b3aca1' }}>({activeCount}/{MAX_VISIBLE_COLS})</span></div>
        <div style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 12, overflow: 'hidden' }}>
          {COLUMNS.map((c, i) => {
            const on = !!colOn[c.id];
            return (
              <Box key={c.id} onClick={() => toggleCol(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: '#fff', borderBottom: i === COLUMNS.length - 1 ? 'none' : '1px solid #f0ede7' }} hover={{ background: '#faf9f7' }}>
                <Icon name={c.icon} size={15} color={on ? '#211f1c' : '#b3aca1'} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: on ? '#211f1c' : '#8c867d' }}>{c.label}</div>
                <div style={{ width: 36, height: 20, borderRadius: 99, background: on ? accent : '#d8d4cb', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                  <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
              </Box>
            );
          })}
        </div>
      </div>

      {/* RIGHT: preview */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#f1efe9' }}>
        {/* Toolbar */}
        <div className="gnm-report-toolbar" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid #e4e1da', background: '#fff' }}>
          {locked ? (
            <>
              <div style={{ fontSize: 13, color: '#8c867d', flex: 1 }}>Anteprima · A4 · esempio</div>
              <div onClick={() => go?.('account')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 12, padding: '9px 16px', cursor: go ? 'pointer' : 'default' }}>
                <Icon name="lock" size={15} color="#1d5fd0" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1d5fd0' }}>Il Report è riservato ai piani Agency. <span style={{ textDecoration: 'underline', fontWeight: 800 }}>Passa a un piano</span> per usarlo con i tuoi immobili.</span>
              </div>
              <div style={{ flex: 1 }} />
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#8c867d', flex: 1 }}>Anteprima · A4 · {mappedProperties.length > 1 ? `${mappedProperties.length} immobili a confronto` : (mappedProperties[0] ? allProjects.find(p => selectedIds.has(p.id))?.nome : 'Nessun immobile')}</div>
              {hasProperties && !editing && (
                <Box as="button" onClick={startEditing} style={{ border: '1.5px solid #d8d4cb', background: '#fff', color: '#8c867d', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }} hover={{ borderColor: accent, color: accent }}>
                  <Icon name="pencil" size={14} color="currentColor" />Modifica testi
                </Box>
              )}
              {hasProperties && editing && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Box as="button" onClick={cancelEditing} style={{ border: '1.5px solid #d8d4cb', background: '#fff', color: '#8c867d', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 10, cursor: 'pointer' }} hover={{ borderColor: '#ef4444', color: '#ef4444' }}>
                    Annulla
                  </Box>
                  <Box as="button" onClick={saveEditing} style={{ border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 10, cursor: 'pointer' }} hover={{ background: '#2563EB' }}>
                    Salva Modifiche
                  </Box>
                </div>
              )}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Box as="button" onClick={handlePrint} style={s('border:none;background:#3B83F6;color:#fff;font-size:13.5px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(59,131,246,.25)')} hover={s('background:#2563EB')}>
                  <Icon name="download" size={16} color="#fff" />Scarica PDF
                </Box>
              </div>
            </>
          )}
        </div>

        {/* Preview iframe */}
        <div className="gnm-report-scroll" style={{ flex: 1, overflow: 'hidden', padding: 0, position: 'relative' }}>
          {!hasProperties ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={s('background:#fff;border:1.5px dashed #d8d4cb;border-radius:14px;padding:56px;text-align:center;max-width:520px')}>
                <div style={s('width:52px;height:52px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}><Icon name="file-text" size={24} color="#3B83F6" /></div>
                <div style={s('font-size:15px;font-weight:800;margin-bottom:6px')}>Nessun immobile</div>
                <div style={s('color:#8c867d;font-size:13.5px')}>Crea o seleziona un immobile per generare il report.</div>
              </div>
            </div>
          ) : (
            <iframe ref={iframeRef} title="report" style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
          )}
        </div>
      </div>
    </div>
  );
}
