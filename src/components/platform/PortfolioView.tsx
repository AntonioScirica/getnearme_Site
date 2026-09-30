'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, MessageCircle, ChevronDown, Copy, Eye, EyeOff, ExternalLink, Globe, ImagePlus, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import Tooltip from '@/components/ui/Tooltip';
import Dropdown from '@/components/ui/Dropdown';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';
import { FIELD_LABELS, FONTS, fontCss, PAGE_SECTIONS, PLACEHOLDERS, withPlaceholders, TEMPLATES, TEXTS, zoneSlug, type PageId, type SiteConfig, type SiteProperty, type TemplateId } from '@/lib/siteTemplates';
import { SitePage, SiteThumb } from '@/components/site/pages';
import type { Page } from '@/components/site/ui';
import { fileToResizedDataUrl } from '@/lib/staging';
import { useCredits } from './PlanView';
import { uploadDataUrl } from '@/lib/imageUpload';
import { authFetch, CARD_SHADOW, formatPrice, go, portfolioUrl, setPublic } from './api';
import { MorphTarget, morphFrom } from '@/components/ui/Morph';
import ImmoLoader from '@/components/ui/ImmoLoader';

// Vetrina: l'agente sceglie uno dei 5 template e modifica colori, testi, foto, contatti e sezioni,
// con l'anteprima dal vivo accanto (stesse pagine del sito pubblico, con i suoi immobili).

type Site = { slug: string | null; name: string; email: string; logo: string | null; published: boolean; config: SiteConfig };
const PAGES = [['home', 'Home'], ['immobili', 'Immobili'], ['immobile', 'Scheda'], ['agente', 'Profilo'], ['servizi', 'Servizi'], ['contatti', 'Contatti'], ['zona', 'Zona']] as const;
const pageOf = (id: PageId, firstId?: string, zone?: string): Page => id === 'immobile' ? { page: 'immobile', id: firstId ?? '' } : id === 'zona' ? { page: 'zona', slug: zone ?? '' } : { page: id } as Page;
const COLORS = ['#1d5b3c', '#4d7a2c', '#2a2b7c', '#1f6feb', '#111111', '#ff6a2b', '#be185d', '#8a6a4f'];

// immobile della piattaforma -> immobile del sito
export const toSite = (p: ProjectData): SiteProperty => {
      const d = (p.import_data ?? {}) as { photos?: string[]; zona?: string[]; contratto?: string };
      return { id: p.id, titolo: p.titolo || p.nome, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, locali: p.locali, tipologia: p.tipologia, cover: p.cover,
        descrizione: p.descrizione, riferimento: p.riferimento, createdAt: p.createdAt, details: (d as { details?: Record<string, unknown> }).details, photos: Array.isArray(d.photos) && d.photos.length ? d.photos : [p.cover], zona: Array.isArray(d.zona) ? d.zona : [], contratto: d.contratto ?? '' };
};

export default function PortfolioView({ projects, onChange }: { projects: ProjectData[] | null; onChange: () => void }) {
  const [tab, setTab] = useState<'sito' | 'immobili'>('sito');
  const [site, setSite] = useState<Site | null>(null);
  const [cfg, setCfg] = useState<SiteConfig | null>(null);
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok'>('idle');
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState<Page>({ page: 'home' });
  // testi che l'anteprima del modello aperto legge davvero: l'editor mostra solo quei campi.
  // ponytail: insieme che cresce finche' non cambi modello; se una variante smette di usare un testo resta visibile fino al cambio
  const usedTexts = useRef(new Set<string>());
  const usedTpl = useRef('');
  const getUsed = () => usedTexts.current;
  const noteText = (k: string) => {
    if (usedTpl.current !== cfg?.template) { usedTpl.current = cfg?.template ?? ''; usedTexts.current = new Set(); }
    usedTexts.current.add(k);
  };
  // null = galleria dei modelli; altrimenti editor del modello scelto
  const [editing, setEditing] = useState<TemplateId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false); // di base Naviga: si guarda il sito, Modifica per cambiarlo

  // tour: apre l'editor del modello attuale e ne cambia il colore ogni poco, per far vedere che si modifica.
  // Solo in anteprima: il tour finisce in home, la pagina si smonta e le modifiche non salvate si perdono.
  const tpl = cfg?.template;
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    const on = () => {
      if (!tpl) return;
      setTab('sito'); setDemo(true);
      // come un clic su "Scegli template": le altre card escono e la miniatura diventa l'editor (pick ignora i doppi)
      const b = document.querySelector<HTMLButtonElement>(`[data-pick="${tpl}"]`);
      if (b) b.click(); else setEditing(e => e ?? tpl);
    };
    window.addEventListener('agenteimmo:tour-edit', on);
    return () => window.removeEventListener('agenteimmo:tour-edit', on);
  }, [tpl]);
  useEffect(() => {
    if (!demo) return;
    let k = 0;
    const t = setInterval(() => setCfg(c => c && { ...c, primary: TEMPLATES[k++ % TEMPLATES.length].primary }), 1400);
    return () => clearInterval(t);
  }, [demo]);
  const credits = useCredits();
  useEffect(() => {
    authFetch('/api/platform/site').then(r => r.json()).then((d: Site) => { setSite(d); setCfg(d.config); setEditing(d.config.template); }); // si entra dritti nell'editor del modello in uso (scelto nell'onboarding); Tutti i modelli per cambiarlo
  }, []);

  // caricamento: scheletro con la stessa forma della pagina (titolo, indirizzo, schede, card dei modelli)
  if (!site || !cfg) return (
    <div aria-busy className="animate-pulse">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-6">
        <div><div className="h-9 w-48 rounded-full bg-line/70" /><div className="mt-3 h-4 w-72 rounded-full bg-line/50" /></div>
        <div className="h-10 w-72 rounded-full bg-line/50" />
      </div>
      {/* si apre l'editor del modello in uso: lo scheletro e' quello dell'editor, non della galleria dei modelli */}
      <div className="mt-6 flex items-center justify-between"><div className="h-10 w-40 rounded-full bg-line/50" /><div className="h-10 w-44 rounded-full bg-line/50" /></div>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="h-[520px] rounded-[28px] bg-white ring-1 ring-black/5" />
        <div className="aspect-[16/10] rounded-[28px] bg-white ring-1 ring-black/5" />
      </div>
    </div>
  );
  const url = site.slug ? portfolioUrl(site.slug) : null;
  // il sito pubblico e' nei piani Plus e Pro: con Starter si prepara tutto ma non va online (il server rifiuta comunque)
  const sitePlan = !credits || credits.unlimited || credits.plan === 'plus' || credits.plan === 'pro';
  // il sito va online solo quando l'agente accende lo switch (spento: la pagina pubblica risponde 404)
  // senza piano col sito lo switch e' sempre spento (anche se in passato era stato acceso: la pagina pubblica risponde 404)
  const online = site.published && sitePlan;
  const publish = async () => {
    if (!sitePlan) { go('/piano'); return; }
    const next = !site.published;
    setSite(s => ({ ...s!, published: next }));
    const d = await authFetch('/api/platform/site', { method: 'PATCH', body: JSON.stringify({ published: next }) }).then(r => r.json()).catch(() => ({}));
    if (d.published !== next) setSite(s => ({ ...s!, published: !next }));
  };
  const dirty = JSON.stringify(cfg) !== JSON.stringify(site.config);
  const set = (p: Partial<SiteConfig>) => setCfg(c => ({ ...c!, ...p }));
  const save = async () => {
    setSaved('saving');
    const d = await authFetch('/api/platform/site', { method: 'PUT', body: JSON.stringify(cfg) }).then(r => r.json()).catch(() => ({}));
    if (d.config) { setSite(s => ({ ...s!, config: d.config })); setCfg(d.config); setSaved('ok'); setTimeout(() => setSaved('idle'), 1800); } else setSaved('idle');
  };

  const pub = (projects ?? []).filter(p => p.is_public);
  // anteprima: senza case in vetrina (o durante il tour) il sito si vede con le case d'esempio a Roma. Solo anteprima:
  // online vanno le case vere, e le foto proponibili come copertina restano solo quelle dell'agente
  const props: SiteProperty[] = (pub.length && !demo ? pub : FAKE_PROPERTIES).map(toSite);
  // miniature dei modelli: sempre piene di case, le tue piu' quelle di esempio fino a 9 (solo anteprima, non va online)
  const showcase = [...props, ...FAKE_PROPERTIES.filter(f => !props.some(p => p.id === f.id)).map(toSite)].slice(0, Math.max(9, props.length));
  const covers = [...new Set(pub.map(toSite).map(p => p.cover).filter(Boolean))].slice(0, 12);

  return (
    <>
      {/* intestazione come la Galleria: titolo e una riga a sinistra, indirizzo del sito a destra; sotto il divisore
          le schede e Pubblica */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Il mio sito</h1>
          <p className="pt-1 text-sm text-muted">Scegli un template, modificalo e pubblica il tuo sito in 5 minuti.</p>
          {credits && !sitePlan && <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm text-amber-800 ring-1 ring-amber-200">Il sito pubblico è nei piani Plus e Pro. <button type="button" onClick={() => go('/piano')} className="font-semibold underline underline-offset-2">Passa a Pro</button></p>}
        </div>
        {url && (
          <div data-tour="site-link" className="flex min-w-0 items-center gap-4">
          {/* interruttore solo con un piano che include il sito (senza, c'e' l'avviso Plus e Pro) */}
          {credits && sitePlan && <PublicSwitch on={online} onClick={publish} labels={['Pubblico', 'Non pubblico']} right />}
          <div className={`flex h-10 min-w-0 items-center gap-1 rounded-full bg-white pl-4 pr-1 text-sm ring-1 ring-line ease-smooth transition-opacity ${online ? '' : 'pointer-events-none select-none opacity-50'}`} aria-disabled={!online}>{/* sito non online: indirizzo solo da vedere, niente link, copia o apri */}
            <Globe size={15} className="shrink-0 text-muted" />
            <a href={url} target="_blank" rel="noreferrer" className="min-w-0 truncate px-1.5 font-medium hover:text-brand">{url.replace(/^https?:\/\//, '')}</a>
            <Tooltip label={copied ? 'Copiato' : 'Copia il link'}>
              <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} aria-label="Copia il link"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
            </Tooltip>
            <Tooltip label="Apri il sito">
              <a href={url} target="_blank" rel="noreferrer" aria-label="Apri il sito" className="flex h-8 w-8 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink"><ExternalLink size={15} /></a>
            </Tooltip>
          </div>
          </div>
        )}
      </div>
      {/* dentro l'editor di un modello le schede spariscono: si torna con "Tutti i modelli" */}
      {!(tab === 'sito' && editing) && (
        <div className="flex h-10 w-fit items-center rounded-full bg-white p-1 ring-1 ring-black/10 mt-6">
          {([['sito', 'Aspetto del sito'], ['immobili', 'Immobili']] as const).map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex h-8 items-center rounded-full px-4 text-[13px] font-medium ease-smooth transition-colors ${tab === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      )}

      {tab === 'immobili' ? <PropertiesTab projects={projects} onChange={onChange} /> : !editing ? (
        <Gallery cfg={site.config} name={site.name || 'La tua agenzia'} logo={site.logo} props={showcase}
          onPick={id => { if (id !== cfg.template) set({ template: id, primary: TEMPLATES.find(t => t.id === id)!.primary, font: TEMPLATES.find(t => t.id === id)!.font }); setPage({ page: 'home' }); setEditing(id); }} />
      ) : (
        <div className="mt-6">
          {/* a sinistra si torna ai modelli, a destra si pubblica */}
          <div className="blur-in mb-5 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: '.2s' }}>
          <div className="flex h-10 w-fit items-center rounded-full bg-white p-1 text-sm ring-1 ring-black/10">
            <button onClick={() => { if (!dirty || confirm('Hai modifiche non pubblicate. Tornare ai modelli e scartarle?')) { morphFrom(document.querySelector('[data-morph="preview"]'), `tpl-${cfg.template}`); setCfg(site.config); setEditing(null); } }}
              className="flex h-8 items-center gap-2 rounded-full px-3 font-medium ease-smooth transition-colors hover:bg-canvas"><ArrowLeft size={15} /> Tutti i modelli</button>
          </div>
          {/* Pubblica a destra, sulla stessa riga */}
          <div className="flex items-center gap-3 text-sm">
            <span className={dirty ? 'font-medium' : 'text-muted'}>{saved === 'ok' ? 'Sito aggiornato' : dirty ? 'Modifiche non pubblicate' : ''}</span>
            <button onClick={save} disabled={!dirty || saved === 'saving'}
              className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-[background-color,opacity] hover:bg-brand/90 disabled:opacity-40">
              {saved === 'saving' ? <Loader2 size={15} className="animate-spin" /> : saved === 'ok' ? <Check size={15} /> : null}
              {saved === 'ok' ? 'Pubblicato' : 'Pubblica modifiche'}
            </button>
          </div>
          </div>
        <div data-tour="site-editor" className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Controlli: sezioni della pagina aperta (clic nell'anteprima = apre la sezione) o impostazioni generali */}
          <SideEditor cfg={cfg} set={set} page={page} onPage={setPage} firstId={props[0]?.id} covers={covers} selected={selected} setSelected={setSelected} getUsed={getUsed} />

          {/* Anteprima dal vivo */}
          <Preview zone={zoneSlug(withPlaceholders(cfg).zones[0]?.name ?? '')} wa={cfg.whatsappButton} vtName={`tpl-${cfg.template}`} page={page} onPage={p => { setPage(p); setSelected(null); }} firstId={props[0]?.id} editMode={editMode} setEditMode={setEditMode}>
            <SitePage page={page} ctx={{ cfg: withPlaceholders(cfg), name: site.name || 'La tua agenzia', logo: site.logo, properties: props, base: '', preview: true, go: p => { setPage(p); setSelected(null); }, editMode, selected, onSelect: setSelected, onText: noteText }} />
          </Preview>
        </div>
        </div>
      )}
    </>
  );
}

// Colonna dell'editor: scheda Pagina (sezioni della pagina aperta, nello stesso ordine del sito) e Generale
function SideEditor({ cfg, set, page, onPage, firstId, covers, selected, setSelected, getUsed }: {
  cfg: SiteConfig; set: (p: Partial<SiteConfig>) => void; page: Page; onPage: (p: Page) => void; firstId?: string; covers: string[]; selected: string | null; setSelected: (id: string | null) => void; getUsed: () => Set<string>;
}) {
  const [tab, setTab] = useState<'pagina' | 'generale'>('pagina');
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const scroller = useRef<HTMLDivElement>(null);
  // sezioni nell'ordine in cui compaiono nell'anteprima (ogni modello le dispone a modo suo)
  const [order, setOrder] = useState<string[]>([]);
  const [used, setUsed] = useState<Set<string> | null>(null); // testi che il modello mostra davvero
  useEffect(() => {
    const t = setTimeout(() => { setOrder([...document.querySelectorAll('[data-morph="preview"] [data-sec]')].map(e => e.getAttribute('data-sec')!)); setUsed(new Set(getUsed())); }, 150);
    return () => clearTimeout(t);
  }, [page, cfg.template]); // non su "nascondi": le sezioni nascoste non sono nell'anteprima e finirebbero in fondo
  const rank = (id: string) => { const i = order.indexOf(id); return i < 0 ? 999 : i; };
  const secs = [...(PAGE_SECTIONS[page.page as PageId] ?? [])].sort((a, b) => rank(a.id) - rank(b.id));
  // clic su una sezione nell'anteprima: apri la scheda Pagina e porta la sezione in vista
  useEffect(() => {
    if (!selected) return;
    setTab('pagina'); // eslint-disable-line react-hooks/set-state-in-effect
    // scorre solo la colonna, non la pagina
    setTimeout(() => { const el = refs.current[selected], box = scroller.current; if (el && box) box.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' }); }, 60);
  }, [selected]);
  const hidden = new Set(cfg.hidden);
  const toggleHide = (id: string) => set({ hidden: hidden.has(id) ? cfg.hidden.filter(x => x !== id) : [...cfg.hidden, id] });

  return (
    // compare dopo, mentre l'anteprima si sta ancora trasformando dalla card scelta
    <aside className={`blur-in rounded-[28px] bg-white lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col ${CARD_SHADOW}`} style={{ animationDelay: '.3s' }}>
      <div className="flex gap-1 border-b border-line p-2">
        {([['pagina', 'Pagina'], ['generale', 'Generale']] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-full py-2 text-sm font-medium ease-smooth transition-colors ${tab === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
        ))}
      </div>
      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:none]">
        {tab === 'pagina' ? (
          <>
            <label className="mb-3 block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted">Pagina che stai modificando</span>
              <Dropdown value={page.page as PageId} className="h-10 w-full justify-between bg-canvas px-4 text-sm font-medium"
                options={PAGES.filter(([id]) => !(id === 'immobile' && !firstId)).map(([id, l]) => ({ value: id, label: cfg.hidden.includes(`page:${id}`) ? `${l} (nascosta)` : l }))}
                onChange={v => onPage(pageOf(v, firstId, zoneSlug(withPlaceholders(cfg).zones[0]?.name ?? '')))} />
            </label>
            {/* ogni pagina tranne la Home si puo' togliere dal sito: esce dal menu e il suo indirizzo non si apre piu' */}
            {page.page !== 'home' && (() => {
              const key = `page:${page.page}`, on = !cfg.hidden.includes(key);
              return (
                <div className={`mb-3 flex items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm ${on ? 'bg-canvas' : 'bg-rose-50'}`}>
                  <span>{on ? 'Pagina visibile nel sito' : <span className="text-rose-700">Pagina nascosta: non è nel menu e il suo link non si apre</span>}</span>
                  <button type="button" role="switch" aria-checked={on} onClick={() => set({ hidden: on ? [...cfg.hidden, key] : cfg.hidden.filter(x => x !== key) })}
                    className={`relative h-6 w-10 shrink-0 rounded-full ease-smooth transition-colors ${on ? 'bg-brand' : 'bg-line'}`}>
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ease-smooth transition-transform ${on ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              );
            })()}
            <p className="mb-4 text-xs text-muted">Clicca un elemento nell’anteprima per modificarlo, oppure apri una sezione qui sotto.</p>
            <div className="space-y-2">
              {secs.map(sec => {
                const open = selected === sec.id, off = hidden.has(sec.id);
                return (
                  <div key={sec.id} ref={el => { refs.current[sec.id] = el; }} className={`scroll-mt-2 rounded-2xl ring-1 ease-smooth transition-colors ${open ? 'ring-brand/40' : 'ring-black/10'}`}>
                    <div className="flex items-center gap-2 p-3">
                      <button onClick={() => setSelected(open ? null : sec.id)} className={`flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold ${off ? 'text-muted line-through' : ''}`}>
                        <ChevronDown size={15} className={`shrink-0 ease-smooth transition-transform ${open ? '' : '-rotate-90'}`} />{sec.label}
                      </button>
                      {sec.hideable && <button onClick={() => toggleHide(sec.id)} title={off ? 'Mostra la sezione' : 'Nascondi la sezione'} className="text-muted hover:text-ink">{off ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                    </div>
                    {open && (
                      <div className="space-y-3 border-t border-black/5 p-3">
                        {sec.note && <p className="text-xs text-muted">{sec.note}</p>}
                        {/* campi nell'ordine in cui si vedono nella sezione */}
                        {(sec.order ?? [...(sec.texts ?? []), ...(sec.cfg ?? [])]).filter(k => (sec.cfg as string[] | undefined)?.includes(k) || !used?.size || used.has(k)).map(k => (sec.cfg as string[] | undefined)?.includes(k)
                          ? <CfgField key={k} k={k as keyof SiteConfig} cfg={cfg} set={set} covers={covers} />
                          : <TextField key={k} label={FIELD_LABELS[k] ?? k} value={cfg.texts[k] ?? ''} placeholder={TEXTS[k]} long={TEXTS[k].length > 60}
                              onChange={v => { const next = { ...cfg.texts }; if (v) next[k] = v; else delete next[k]; set({ texts: next }); }} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-7">
            <Group title="Colore e caratteri">
              <div className="flex flex-wrap items-center gap-2">
                {COLORS.map(c => <button key={c} onClick={() => set({ primary: c })} aria-label={c} className={`h-8 w-8 rounded-full ring-offset-2 ease-smooth transition-shadow ${cfg.primary === c ? 'ring-2 ring-ink' : ''}`} style={{ background: c }} />)}
                <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full ring-1 ring-black/10" title="Altro colore" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}>
                  <input type="color" value={cfg.primary} onChange={e => set({ primary: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
            </Group>
            <Group title="Carattere dei titoli"><FontPicker cfg={cfg} set={set} /></Group>
            <Group title="Logo in alto"><LogoField cfg={cfg} set={set} /></Group>
            <Group title="Recapiti">{(['ctaLabel', 'phone', 'whatsapp', 'email', 'address'] as const).map(k => <CfgField key={k} k={k} cfg={cfg} set={set} covers={covers} />)}</Group>
            <Group title="Social e dati legali">{(['instagram', 'facebook', 'legal'] as const).map(k => <CfgField key={k} k={k} cfg={cfg} set={set} covers={covers} />)}</Group>
            <Group title="In tutte le pagine">{(['topBar', 'whatsappButton', 'showPrices', 'showStats'] as const).map(k => <CfgField key={k} k={k} cfg={cfg} set={set} covers={covers} />)}</Group>
          </div>
        )}
      </div>
    </aside>
  );
}

// Testo del sito: vuoto = testo di partenza (mostrato in grigio), con ripristino
function TextField({ label, value, placeholder, long, onChange }: { label: string; value: string; placeholder: string; long?: boolean; onChange: (v: string) => void }) {
  const cls = 'w-full rounded-2xl bg-canvas px-3.5 py-2.5 text-sm outline-none ease-smooth transition-shadow placeholder:text-ink/40 focus:bg-white focus:ring-1 focus:ring-ink/15';
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-ink/70">{label}{value && <button type="button" onClick={() => onChange('')} className="flex items-center gap-1 text-[11px] text-muted hover:text-ink"><RotateCcw size={11} /> Originale</button>}</span>
      {long ? <textarea rows={2} value={value} placeholder={placeholder} maxLength={600} onChange={e => onChange(e.target.value)} className={`${cls} resize-none`} />
        : <input value={value} placeholder={placeholder} maxLength={600} onChange={e => onChange(e.target.value)} className={cls} />}
    </label>
  );
}

// Carattere dei titoli: menu a tendina, ogni voce scritta nel suo carattere (i due del modello e i Google Fonts)
function FontPicker({ cfg, set }: { cfg: SiteConfig; set: (p: Partial<SiteConfig>) => void }) {
  const value = cfg.headingFont || cfg.font;
  const options = [
    { value: 'serif', label: 'Elegante (del modello)', group: 'Del modello', style: { fontFamily: 'var(--font-serif-accent)', fontSize: 17 } },
    { value: 'sans', label: 'Moderno (del modello)', group: 'Del modello', style: { fontWeight: 700 } },
    ...FONTS.map(f => ({ value: f.id, label: f.label, group: f.serif ? 'Con grazie' : 'Senza grazie', style: { fontFamily: `'${f.family}', ${f.serif ? 'serif' : 'sans-serif'}`, fontWeight: f.weight, fontSize: 16 } })),
  ];
  return (
    <>
      {/* tutti i caratteri caricati qui, per vederli nel menu */}
      <link rel="stylesheet" href={fontCss(FONTS.map(f => f.id))} precedence="default" />
      <Dropdown value={value} options={options} className="h-11 w-full justify-between bg-canvas px-4 text-sm"
        onChange={v => (v === 'serif' || v === 'sans' ? set({ font: v, headingFont: '' }) : set({ headingFont: v }))} />
    </>
  );
}

// Logo dell'agenzia: caricalo (PNG trasparente ideale) e scegli quanto e' alto
function LogoField({ cfg, set }: { cfg: SiteConfig; set: (p: Partial<SiteConfig>) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (f?: File) => {
    if (!f?.type.startsWith('image/')) return;
    setBusy(true);
    const url = await uploadDataUrl(await fileToResizedDataUrl(f, 800), 'vetrina');
    setBusy(false);
    if (url) set({ logo: url });
  };
  return (
    <div className="rounded-2xl bg-canvas p-2">
      {/* anteprima: il logo come appare nella barra del sito (fino a 64px qui) */}
      <div className="flex h-24 items-center justify-center rounded-xl bg-white px-4">
        {cfg.logo
          ? <img src={cfg.logo} alt="" style={{ height: Math.min(64, cfg.logoSize) }} className="max-w-full object-contain" />
          : <span className="text-center text-xs text-muted">Nessun logo<br />in alto c’è il tuo nome</span>}
      </div>
      <div className="flex items-center gap-2 px-1 pt-2">
        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium ring-1 ring-black/5 hover:bg-line/40">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} {cfg.logo ? 'Cambia logo' : 'Carica logo'}
          <input type="file" accept="image/*" className="hidden" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {cfg.logo && <button type="button" onClick={() => set({ logo: '' })} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted hover:bg-white hover:text-ink"><Trash2 size={14} /> Togli</button>}
      </div>
      {cfg.logo && (
        <label className="block px-1 pb-1 pt-4">
          <span className="flex items-center justify-between text-xs font-medium text-ink/70">Grandezza <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-muted">{cfg.logoSize}px</span></span>
          <input type="range" min={20} max={96} step={2} value={cfg.logoSize} onChange={e => set({ logoSize: Number(e.target.value) })} className="mt-2 w-full accent-[#2563eb]" />
        </label>
      )}
    </div>
  );
}

// Un campo della configurazione, con il controllo giusto per il tipo
function CfgField({ k, cfg, set, covers }: { k: keyof SiteConfig; cfg: SiteConfig; set: (p: Partial<SiteConfig>) => void; covers: string[] }) {
  const label = FIELD_LABELS[k] ?? k;
  const v = cfg[k];
  if (typeof v === 'boolean') return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm"><span>{label}{k === 'whatsappButton' && v && !cfg.whatsapp && <span className="block text-xs text-rose-600">Compare solo con il numero WhatsApp in Recapiti</span>}</span>
      {/* interruttore: pista 40x24, pallino 20 centrato (2px di margine), scorre di 16 */}
      <button type="button" role="switch" aria-checked={v} onClick={() => set({ [k]: !v })}
        className={`relative h-6 w-10 shrink-0 rounded-full ease-smooth transition-colors ${v ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ease-smooth transition-transform ${v ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
  if (k === 'heroImage') return <Pics label={label} covers={covers} value={cfg.heroImage} onChange={x => set({ heroImage: x })} />;
  if (k === 'aboutImage') return <Pics label={label} covers={[]} value={cfg.aboutImage} onChange={x => set({ aboutImage: x })} />;
  if (k === 'highlights') return <Field label={`${label} (separati da virgola)`} value={cfg.highlights.join(', ')} onChange={x => set({ highlights: x.split(',').map(y => y.trimStart()).slice(0, 6) })} max={320} />;
  if (k === 'services') return <ListEditor items={cfg.services} max={8} addLabel="Aggiungi servizio" onChange={x => set({ services: x })} fields={[['title', 'Nome del servizio', 70, false], ['text', 'Descrizione', 600, true]]} empty={{ title: '', text: '' }} />;
  if (k === 'zones') return <><p className="text-xs text-muted">Una pagina per località (es. “Casa a Sirolo”). Scrivi “## Titolo” per un sottotitolo.</p><ListEditor items={cfg.zones} max={8} addLabel="Aggiungi zona" onChange={x => set({ zones: x })} fields={[['name', 'Località', 40, false], ['text', 'Testo sulla zona', 4000, true]]} empty={{ name: '', text: '' }} /></>;
  if (k === 'reviews') return <ListEditor items={cfg.reviews} max={3} addLabel="Aggiungi recensione" onChange={x => set({ reviews: x })} fields={[['text', 'Cosa ha detto il cliente', 300, true], ['name', 'Nome', 60, false]]} empty={{ text: '', name: '', zone: '' }} />;
  if (k === 'years' || k === 'sold' || k === 'clients') return <Field label={label} value={String(v)} placeholder={PLACEHOLDERS[k]} onChange={x => set({ [k]: x.replace(/\D/g, '') })} max={6} />;
  const long = k === 'aboutText' || k === 'method' || k === 'heroSubtitle';
  return <Field label={label} value={String(v ?? '')} placeholder={PLACEHOLDERS[k]} onChange={x => set({ [k]: x })} max={k === 'aboutText' ? 900 : k === 'method' ? 1500 : 300} area={long} />;
}

// Riporta in cima la pagina (ease-in-out, 600 ms), poi `done`: scegliendo un modello in basso l'editor si apre in alto.
function scrollTopEased(el: HTMLElement, done?: () => void) {
  const from = el.scrollTop, t0 = performance.now();
  let fired = false;
  const finish = () => { if (!fired) { fired = true; done?.(); } };
  setTimeout(() => { el.scrollTop = 0; finish(); }, 800); // sicurezza: con la scheda nascosta i fotogrammi non partono
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / 600), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
    el.scrollTop = from * (1 - e);
    if (k < 1) requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);
}

// Galleria dei modelli: anteprima vera della home (con i dati dell'agente), clic per entrare nell'editor
function Gallery({ cfg, name, logo, props, onPick }: { cfg: SiteConfig; name: string; logo: string | null; props: SiteProperty[]; onPick: (id: TemplateId) => void }) {
  // come in home: al clic le altre card escono (piu' piccole, sfocate), poi la card scelta diventa l'editor
  const [leaving, setLeaving] = useState<TemplateId | null>(null);
  const pick = (id: TemplateId, el: HTMLElement) => {
    if (leaving) return;
    setLeaving(id);
    // prima si torna in cima (mentre le altre card escono), poi la card scelta diventa l'editor:
    // cambiando pagina a meta' scorrimento il browser taglierebbe lo scroll di colpo
    const go = () => { morphFrom(el.querySelector('[data-thumb]'), `tpl-${id}`, true); onPick(id); };
    const main = el.closest('main');
    if (main && main.scrollTop > 0) scrollTopEased(main, go); else setTimeout(go, 260);
  };
  return (
    <div className="mt-6">
      <p className="mb-6 text-sm text-muted">Dieci stili già pronti con i tuoi immobili: scegline uno e personalizzalo. Online cambia solo quando pubblichi.</p>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATES.map((t, i) => {
          const used = cfg.template === t.id;
          const tcfg = used ? cfg : { ...cfg, template: t.id, primary: t.primary, font: t.font };
          return (
            // stessa card delle altre pagine (Galleria): bianca 24 con la miniatura 16 dentro e una riga sotto.
            // Passando sopra: velo leggero sulla miniatura e i due pulsanti che salgono (la miniatura resta ferma,
            // cosi' diventa l'editor dalla stessa immagine)
            // tour: la luce va sulla card del modello in uso, da cui poi nasce l'editor
            <div key={t.id} data-tour={used ? 'site-gallery' : undefined}
              className={`group rise rounded-3xl bg-white p-2 text-left ease-smooth transition-[opacity,transform,filter,box-shadow] ${CARD_SHADOW} ${used ? '!ring-2 !ring-brand' : ''} ${leaving && leaving !== t.id ? 'pointer-events-none scale-90 opacity-0 blur-[8px]' : ''}`} style={{ animationDelay: `${i * 0.04}s`, transitionDelay: leaving ? `${(i % 3) * 40}ms` : undefined }}>
              <div data-thumb className="relative overflow-hidden rounded-2xl bg-canvas">
                <MorphTarget id={`tpl-${t.id}`}><Thumb><SiteThumb ctx={{ cfg: tcfg, name, logo, properties: props, base: '', preview: true }} /></Thumb></MorphTarget>
                {/* in hover (sempre su telefono): anteprima in un'altra scheda o scelta del modello, stessa larghezza */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 ease-smooth transition-opacity duration-[600ms] md:group-hover:opacity-100" />
                <div className="absolute inset-x-3 bottom-3 z-10 grid grid-cols-2 gap-2 ease-smooth transition-[opacity,transform] duration-[600ms] md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
                  <a href={`#/anteprima/${t.id}`} target="_blank" rel="noopener" className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/95 text-sm font-semibold text-ink shadow-lg ring-1 ring-black/5 backdrop-blur hover:bg-white"><Eye size={15} /> Anteprima</a>
                  <button type="button" data-pick={t.id} onClick={e => pick(t.id, e.currentTarget.closest('.group') as HTMLElement)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink text-sm font-semibold text-white shadow-lg hover:bg-black"><Pencil size={14} /> Scegli template</button>
                </div>
              </div>
              <div className="flex min-h-12 items-center gap-3 px-2 pt-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block truncate text-xs text-muted">{t.desc}</span>
                </span>
                {used && <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">In uso</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Miniatura: il sito largo 1280 px rimpicciolito nella card, solo la parte alta, non cliccabile
// Distanza dello scorrimento misurata anche all'ingresso del mouse: se la misura iniziale e' arrivata prima
// che la pagina finisse di caricare (immagini), valeva 0 e alcune card non scorrevano.

// Miniatura della home del modello, in scala sulla larghezza della card
// scroll: la pagina scorre fino in fondo (mouse sopra), come nel mazzo dei modelli della landing
export function Thumb({ children, scroll = false }: { children: ReactNode; scroll?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.3);
  const [h, setH] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => box.current && setK(box.current.clientWidth / 1280));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { if (scroll && page.current) setH(page.current.offsetHeight); }, [scroll]); // misurata all'ingresso: immagini gia' caricate
  const max = Math.max(0, h * k - 1280 * k * 0.75); // quanto la pagina esce dal riquadro 4:3
  return (
    <div ref={box} className="pointer-events-none relative aspect-[4/3] select-none overflow-hidden" aria-hidden>
      <div ref={page} style={{ width: 1280, transform: `translateY(${scroll ? -max : 0}px) scale(${k})`, transformOrigin: 'top left', transition: scroll ? `transform ${Math.max(4, max / 260)}s linear` : 'transform .8s cubic-bezier(.65,0,.35,1)' }}>{children}</div>
    </div>
  );
}

// Menu a tendina delle pagine dell'anteprima: bottone con la pagina aperta, pannello con l'elenco e la spunta.
// Si chiude cliccando fuori o con Esc.
function PageMenu({ current, firstId, onPick }: { current: string; firstId?: string; onPick: (id: PageId) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, [open]);
  const label = PAGES.find(([id]) => id === current)?.[1] ?? 'Pagina';
  return (
    <div ref={box} className="relative ml-3">
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={`flex h-8 items-center gap-2 rounded-full pl-3.5 pr-2.5 text-xs font-semibold ease-smooth transition-colors ${open ? 'bg-ink text-white' : 'bg-canvas text-ink hover:bg-line/60'}`}>
        <span className={open ? 'text-white/60' : 'text-muted'}>Pagina</span>{label}
        <ChevronDown size={14} className={`ease-smooth transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" className="blur-in absolute left-0 top-10 z-30 w-48 rounded-2xl bg-white p-1.5 text-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,.25)] ring-1 ring-black/5">
          {PAGES.map(([id, l]) => {
            const off = id === 'immobile' && !firstId;
            return (
              <li key={id}>
                <button type="button" role="option" aria-selected={current === id} disabled={off} onClick={() => { onPick(id); setOpen(false); }}
                  className={`flex h-9 w-full items-center justify-between rounded-xl px-3 text-left font-medium ease-smooth transition-colors disabled:opacity-40 ${current === id ? 'bg-canvas text-ink' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
                  {l}{current === id && <Check size={14} className="text-brand" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Il sito in scala dentro una finestra "browser": largo 1280 px come su un computer, rimpicciolito.
function Preview({ children, page, onPage, firstId, zone, editMode, setEditMode, vtName, wa }: { children: ReactNode; page: Page; onPage: (p: Page) => void; firstId?: string; zone?: string; editMode: boolean; setEditMode: (v: boolean) => void; vtName?: string; wa?: boolean }) {
  const [hint, setHint] = useState(false); // avviso "Ora puoi modificare" appena si passa a Modifica
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  const [h, setH] = useState(0);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (box.current) setK(box.current.clientWidth / 1280);
      if (inner.current) setH(inner.current.offsetHeight);
    });
    if (box.current) ro.observe(box.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [page]); // cambiando pagina il contenitore si rimonta (key): va osservato quello nuovo, o resta l'altezza della pagina prima
  return (
    // min-w-0: e' la colonna della griglia; senza, il sito largo 1280 px la allargava e l'anteprima usciva dallo schermo
    <MorphTarget id={vtName ?? 'preview'} className="min-w-0">
    <div data-morph="preview" className={`relative overflow-hidden rounded-[28px] bg-white ${CARD_SHADOW}`}>
      {/* pulsante WhatsApp del sito: fisso nell'angolo come sul sito vero */}
      {/* passando a Modifica: avviso sopra il sito per un attimo, poi sparisce */}
      <div className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[2px] ease-smooth transition-opacity duration-[600ms] ${hint ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!hint}>
        <span className={`flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-xl ease-smooth transition-transform duration-[600ms] ${hint ? 'scale-100' : 'scale-90'}`}><Pencil size={15} className="text-brand" /> Ora puoi modificare: clicca su una parte del sito</span>
      </div>
      {wa && <span className="pointer-events-none absolute bottom-4 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-5px_rgba(37,211,102,.6)]"><MessageCircle size={21} fill="currentColor" /></span>}
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-xs text-muted">
        <span className="flex gap-1.5">{[0, 1, 2].map(i => <span key={i} className="h-2.5 w-2.5 rounded-full bg-line" />)}</span>
        {/* pagine del sito: si naviga anche cliccando dentro l'anteprima */}
        {/* menu delle pagine del sito (le pillole non stavano piu' nella barra) */}
        <PageMenu current={page.page} firstId={firstId} onPick={id => onPage(pageOf(id, firstId, zone))} />
        {/* stesse misure di prima, piu' visibile: icone e colore pieno su quello attivo (Modifica in blu) */}
        <div className="ml-auto flex items-center rounded-full bg-canvas p-1">
          {([[false, 'Naviga', Eye], [true, 'Modifica', Pencil]] as const).map(([v, l, I]) => (
            <button key={l} onClick={() => { setEditMode(v); if (v && !editMode) { setHint(true); setTimeout(() => setHint(false), 1800); } }} className={`flex items-center gap-1.5 rounded-full px-4 py-1 font-medium ease-smooth transition-colors ${editMode === v ? (v ? 'bg-brand text-white shadow-sm' : 'bg-ink text-white shadow-sm') : 'text-muted hover:text-ink'}`}><I size={13} /> {l}</button>
          ))}
        </div>
      </div>
      <div ref={box} data-morph-content key={JSON.stringify(page)} className="h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden [scrollbar-width:thin]"
        onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}>
        {/* overflow nascosto: il sito rimpicciolito occupa comunque la sua altezza piena nel layout e sotto restava spazio vuoto */}
        <div style={{ height: h * k, overflow: 'hidden' }}>
          <div ref={inner} style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
        </div>
      </div>
    </div>
    </MorphTarget>
  );
}

// Lista modificabile (servizi, zone): campi per voce, togli, aggiungi
function ListEditor<T extends Record<string, string>>({ items, fields, onChange, max, addLabel, empty }: {
  items: T[]; fields: [keyof T & string, string, number, boolean][]; onChange: (v: T[]) => void; max: number; addLabel: string; empty: T;
}) {
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-2xl bg-canvas p-3">
          {fields.map(([k, label, m, area]) => area
            ? <textarea key={k} rows={4} value={it[k]} maxLength={m} placeholder={label} onChange={e => onChange(items.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} className="w-full resize-y rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            : <input key={k} value={it[k]} maxLength={m} placeholder={label} onChange={e => onChange(items.map((x, j) => j === i ? { ...x, [k]: e.target.value } : x))} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium outline-none" />)}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="flex items-center gap-1 text-xs text-muted hover:text-rose-600"><Trash2 size={13} /> Togli</button>
        </div>
      ))}
      {items.length < max && <button onClick={() => onChange([...items, { ...empty }])} className="flex items-center gap-1.5 text-sm font-medium text-brand"><Plus size={15} /> {addLabel}</button>}
    </>
  );
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div><div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</div><div className="space-y-2.5">{children}</div></div>
);

function Field({ label, value, onChange, max, area, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; area?: boolean; placeholder?: string }) {
  const cls = 'w-full rounded-2xl bg-canvas px-3.5 py-2.5 text-sm outline-none ease-smooth transition-shadow placeholder:text-ink/35 focus:bg-white focus:ring-1 focus:ring-ink/15';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      {area
        ? <textarea rows={3} value={value} placeholder={placeholder} maxLength={max} onChange={e => onChange(e.target.value)} className={`${cls} resize-none`} />
        : <input value={value} placeholder={placeholder} maxLength={max} onChange={e => onChange(e.target.value)} className={cls} />}
    </label>
  );
}


// Foto: carica dal computer, oppure scegli tra quelle degli immobili (Auto = la prima)
function Pics({ label, covers, value, onChange }: { label: string; covers: string[]; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (f?: File) => {
    if (!f?.type.startsWith('image/')) return;
    setBusy(true);
    const url = await uploadDataUrl(await fileToResizedDataUrl(f, 1800), 'vetrina');
    setBusy(false);
    if (url) onChange(url);
  };
  const own = value && !covers.includes(value);
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink/70">{label}</span>
      <div className="grid grid-cols-4 gap-1.5">
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl bg-canvas text-[10px] font-medium text-muted ring-1 ring-dashed ring-black/15 hover:text-ink">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}Carica
          <input type="file" accept="image/*" className="hidden" onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {own && <button onClick={() => onChange(value)} className="aspect-square overflow-hidden rounded-xl ring-2 ring-ink ring-offset-1"><img src={value} alt="" className="h-full w-full object-cover" /></button>}
        {covers.length > 0 && <button onClick={() => onChange('')} className={`flex aspect-square items-center justify-center rounded-xl bg-canvas text-[10px] font-medium text-muted ring-offset-1 ${!value ? 'ring-2 ring-ink' : ''}`}>Auto</button>}
        {covers.map(c => (
          <button key={c} onClick={() => onChange(c)} className={`aspect-square overflow-hidden rounded-xl ring-offset-1 ${value === c ? 'ring-2 ring-ink' : ''}`}>
            <img src={c} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {!covers.length && value && <button onClick={() => onChange('')} className="flex aspect-square items-center justify-center rounded-xl bg-canvas text-[10px] font-medium text-muted">Togli</button>}
      </div>
    </div>
  );
}

function PropertiesTab({ projects, onChange }: { projects: ProjectData[] | null; onChange: () => void }) {
  // nome e indirizzo del sito stanno solo nel Profilo
  const toggle = async (p: ProjectData) => { if (await setPublic(p.id, !p.is_public)) onChange(); };
  return (
    <div className="mt-8">
      <div>
        <h2 className="font-display text-xl font-semibold">Immobili in vetrina</h2>
        {!projects ? <Loader2 className="mt-4 animate-spin text-muted" /> : !projects.length ? (
          <p className="mt-4 text-sm text-muted">Nessun immobile. <a href="#/nuovo" className="text-brand">Mettine uno in vetrina</a>.</p>
        ) : (
          <ul className={`mt-4 divide-y divide-line overflow-hidden rounded-[24px] bg-white ${CARD_SHADOW}`}>
            {projects.map(p => (
              <li key={p.id} className="flex items-center gap-4 p-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-canvas">{p.cover && <img src={p.thumb || p.cover} alt="" className="h-full w-full object-cover" />}</div>
                <a href={`#/immobile/${p.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.titolo || p.nome}</div>
                  <div className="text-xs text-muted">{formatPrice(p.prezzo)} · {p.addr}</div>
                </a>
                <PublicSwitch on={!!p.is_public} onClick={() => toggle(p)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PublicSwitch({ on, onClick, labels = ['Pubblico', 'Privato'], right = false }: { on: boolean; onClick: () => void; labels?: [string, string]; right?: boolean }) {
  const label = <span className={on ? 'text-brand' : 'text-muted'}>{on ? labels[0] : labels[1]}</span>;
  return (
    <button role="switch" aria-checked={on} onClick={onClick} className="flex shrink-0 items-center gap-2 text-sm">
      {!right && label}
      <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      {right && label}
    </button>
  );
}

// Anteprima di un modello in un'altra scheda (#/anteprima/<id>): barra con PC / Tablet / Telefono e il sito in una
// cornice della larghezza scelta. La cornice carica #/anteprima/<id>?solo=1 (solo il sito): cosi' le regole
// responsive del sito vedono davvero la larghezza del telefono, non un sito da computer rimpicciolito.
const DEVICES = [['pc', 'PC', '100%'], ['tablet', 'Tablet', '834px'], ['phone', 'Telefono', '390px']] as const;
// pagina: pagina iniziale della cornice (?pagina=immobili ecc.), per aprire subito una pagina precisa
export function TemplatePreview({ id, projects, solo, pagina }: { id: TemplateId; projects: ProjectData[] | null; solo: boolean; pagina?: string | null }) {
  const [site, setSite] = useState<{ name: string; logo: string | null; config: SiteConfig } | null>(null);
  const [page, setPage] = useState<Page>({ page: 'home' });
  const [opened, setOpened] = useState(false);
  const [device, setDevice] = useState<(typeof DEVICES)[number][0]>('pc');
  useEffect(() => { if (solo) authFetch('/api/platform/site').then(r => r.json()).then(setSite).catch(() => {}); }, [solo]);
  const t = TEMPLATES.find(x => x.id === id) ?? TEMPLATES[0];
  if (solo) {
    if (!site) return <div className="flex h-full items-center justify-center"><ImmoLoader /></div>;
    const pub = (projects ?? []).filter(p => p.is_public).map(toSite);
    const props = [...pub, ...FAKE_PROPERTIES.filter(f => !pub.some(p => p.id === f.id)).map(toSite)].slice(0, Math.max(9, pub.length));
    const cfg = withPlaceholders(site.config.template === t.id ? site.config : { ...site.config, template: t.id, primary: t.primary, font: t.font });
    const start: Page | null = pagina === 'immobile' ? { page: 'immobile', id: props[0]?.id ?? '' } : pagina === 'zona' ? { page: 'zona', slug: zoneSlug(cfg.zones[0]?.name ?? '') }
      : pagina === 'privacy' ? { page: 'legal', doc: 'privacy' } : pagina && ['immobili', 'agente', 'servizi', 'contatti'].includes(pagina) ? { page: pagina } as Page : null;
    if (start && page.page === 'home' && !opened) { setOpened(true); setPage(start); }
    return <div className="h-full overflow-y-auto bg-white"><SitePage page={page} ctx={{ cfg, name: site.name || 'La tua agenzia', logo: site.logo, properties: props, base: '', preview: true, go: setPage }} /></div>;
  }
  const w = DEVICES.find(d => d[0] === device)![2];
  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-white px-4">
        {/* indietro: l'anteprima si apre in un'altra scheda (dal link, con una sola voce di cronologia il browser la lascia chiudere);
            se non si chiude (aperta a mano) si va ai modelli */}
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <button type="button" onClick={() => { window.close(); setTimeout(() => { location.hash = '#/portfolio'; }, 150); }} aria-label="Torna ai modelli"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink"><ArrowLeft size={16} /> Indietro</button>
          <span className="truncate"><span className="text-muted">Anteprima del modello</span> <b>{t.name}</b></span>
        </span>
        <div className="flex rounded-full bg-canvas p-1">
          {DEVICES.map(([k, l]) => <button key={k} type="button" onClick={() => setDevice(k)} className={`h-8 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors ${device === k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</button>)}
        </div>
        <span className="flex-1" />
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden p-4">
        <iframe title={`Anteprima ${t.name}`} src={`${location.pathname}#/anteprima/${t.id}?solo=1`} style={{ width: w, maxWidth: '100%' }}
          className={`h-full bg-white ease-smooth transition-[width] ${device === 'pc' ? 'rounded-2xl' : 'rounded-[32px] shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-8 ring-ink'}`} />
      </div>
    </div>
  );
}
