'use client';

import { VIDEO_SAMPLES } from '@/lib/videoSamples';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { createPortal } from 'react-dom';
import { Anvil, Minus, Plus, UserRound, Video as VideoIcon, ChevronsLeftRight, Coins, WandSparkles, Film, HardHat, MoonStar, ArrowUp, Search, Check, ChevronLeft, Clapperboard, SquareSplitHorizontal, Image as ImageIcon, Palette, Sofa, Sparkles, Download, ExternalLink, ImagePlus, Lasso, Shuffle, LayoutGrid, Loader2, Monitor, RotateCcw, SquareDashed, SquareDashedMousePointer, X } from 'lucide-react';
import { fileToResizedDataUrl } from '@/lib/staging';
import { AI_MOCK } from '@/lib/aiMock';
import { AiPhotoStage, Elapsed, type EditRequest, type Region, type Reveal, type Suggestion } from './AiPhoto';
import { authFetch, CARD_SHADOW, portfolioUrl } from './api';
import { useCredits } from './PlanView';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import Dropdown, { type DropdownOption } from '@/components/ui/Dropdown';
import Tooltip from '@/components/ui/Tooltip';
import LightSwap from '@/components/ui/LightSwap';
import AutoSize from '@/components/ui/AutoSize';
import { MorphTarget } from '@/components/ui/Morph';
import PhotoViewer from '@/components/ui/PhotoViewer';
import LibraryPicker from './LibraryPicker';
import { fetchMedia } from './MediaView';
import { fetchProjects, type ProjectData } from '@/lib/projects';
import { tiltMove, tiltReset } from '@/components/ui/tilt';
import { uploadDataUrl } from '@/lib/imageUpload';
import { videoDuration, videoFrame, videoGrid, videoThumbs } from '@/lib/videoFrames';
import { CREDIT_COST, FREE_EDITS } from '@/lib/pricing';
import { isFurnishing, isRestyle } from '@/lib/stagingPrompts';

// Home staging come chat: l'agente carica una foto nella conversazione, scrive cosa vuole (in italiano,
// il servizio traduce), riceve il prima/dopo e continua a chiedere sull'ultimo risultato. Caricare
// un'altra foto riparte da quella. "Continua da qui" su un risultato vecchio lo rende la base.

type Scene = 'interno' | 'esterno' | 'giardino' | 'planimetria';
const ROOM_LABEL: Record<string, string> = { openspace: 'un soggiorno con cucina', soggiorno: 'un soggiorno', cucina: 'una cucina', camera: 'una camera da letto', cameretta: 'una cameretta', bagno: 'un bagno', sala: 'una sala da pranzo', studio: 'uno studio', ingresso: 'un ingresso', corridoio: 'un corridoio', balcone: 'un balcone', cantina: 'una cantina', box: 'un box' };
const SCENE_LABEL: Record<Scene, string> = { interno: 'un interno', esterno: 'una facciata', giardino: 'un giardino', planimetria: 'una planimetria' };
const AGENT_ROOMS: [string, string][] = [['soggiorno', 'Soggiorno'], ['openspace', 'Soggiorno con cucina'], ['cucina', 'Cucina'], ['camera', 'Camera da letto'], ['cameretta', 'Cameretta'], ['studio', 'Studio'], ['sala', 'Sala da pranzo'], ['bagno', 'Bagno'], ['ingresso', 'Ingresso']];
// Cosa sembra la foto: correggibile dal menu nel messaggio ("room:cucina" oppure "scene:esterno")
const SEEN_OPTIONS: DropdownOption<string>[] = [
  ...['openspace', 'soggiorno', 'cucina', 'camera', 'cameretta', 'bagno', 'sala', 'studio', 'ingresso', 'corridoio', 'balcone', 'cantina', 'box'].map(r => ({ value: `room:${r}`, label: ROOM_LABEL[r], group: 'Interno' })),
  ...(['esterno', 'giardino', 'planimetria'] as const).map(x => ({ value: `scene:${x}`, label: SCENE_LABEL[x], group: 'Altro' })),
  { value: 'other', label: 'Altro, lo scrivo io', group: 'Altro' },
];
// Suggerimenti in base a cosa c'e' nella foto (la cucina non ha "Arreda nordico", la facciata non ha "Svuota la stanza")
const S = (id: string, label: string, req: Suggestion['req']): Suggestion => ({ id, label, req });
const EMPTY = S('empty', 'Svuota la stanza', { style: 'empty' }), LIGHT = S('day', 'Luminoso', { angle: 'day' });
// Interni: gli stessi veri stili per ogni stanza (Moderno, Nordico, Luxury, Boho: ogni chip porta la descrizione completa
// dello stile e il piano di Claude la adatta alla stanza). I chip "a parole" per stanza (letto, comodini, armadio...) davano
// arredi poveri e incoerenti (27/09). Esterni e giardini hanno i loro.
// interni (balcone compreso): solo questi quattro, in quest'ordine dopo Crea video (27/09). Nordico, Boho e disordine si chiedono scrivendo.
const INDOOR: Suggestion[] = [EMPTY, S('modern', 'Moderno', { style: 'modern' }), S('industrial', 'Luxury', { style: 'industrial' }), LIGHT];
function suggestionsFor(kind: string | null): Suggestion[] {
  switch (kind) {
    case 'scene:esterno': return [S('f-renew', 'Rinnova la facciata', { style: 'empty' }), S('f-modern', 'Facciata moderna', { style: 'modern' }), S('f-sky', 'Cielo azzurro', { prompt: 'Cielo azzurro limpido e luce di sole, senza cambiare l’edificio' }), S('f-garden', 'Giardino curato', { prompt: 'Prato curato e piante ordinate intorno alla casa, senza cambiare l’edificio' })];
    case 'scene:giardino': return [S('g-renew', 'Giardino curato', { style: 'empty' }), S('g-furnish', 'Arreda il giardino', { prompt: 'Aggiungi un tavolo con sedie da esterno e un ombrellone, lascia prato e piante' }), S('g-modern', 'Giardino moderno', { style: 'modern' }), LIGHT];
    // planimetria: stile dell'arredo (pianta 2D a colori), 3D dall'alto oppure in bianco e nero, da stampa
    case 'scene:planimetria': { const PLAN = { planimetria: true }; return [S('p-modern', 'Moderno', PLAN), S('p-nordic', 'Nordico', PLAN), S('p-lux', 'Luxury', PLAN), S('p-boho', 'Boho', PLAN), S('p-3d', '3D dall’alto', PLAN), S('p-bw', 'Bianco e nero', PLAN)]; }
    default: return INDOOR;
  }
}
// "custom:..." = scritto dall'agente quando nessuna voce va bene
const seenLabel = (k: string) => (k.startsWith('custom:') ? k.slice(7) : SEEN_OPTIONS.find(o => o.value === k)?.label ?? 'un interno');

// Crediti finiti: la chat lo dice nel messaggio (niente finestra sopra) e porta ai piani
const NO_CREDITS = 'no_credits';
const QUIET = { 'x-no-modal': '1' };
function ErrLine({ err, className = '' }: { err: string; className?: string }) {
  if (err !== NO_CREDITS) return <p className={`blur-in px-2 text-sm text-rose-600 ${className}`}>{err}</p>;
  return (
    <p className={`blur-in flex flex-wrap items-center gap-x-3 gap-y-2 px-2 text-sm ${className}`}>
      <span>Hai finito i crediti: per arredare foto e creare video scegli un piano.</span>
      <a href="#/piano?cambia=1" className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white">Vedi i piani</a>
    </p>
  );
}

type Msg =
  | { id: string; role: 'divider'; image: string }
  | { id: string; role: 'note'; text: string } // risposta fissa della chat, senza AI (saluti, foto da riconoscere)
  | { id: string; role: 'user'; text?: string; image?: string; video?: string; seen?: string | null; region?: Region; style?: { src: string; author?: string; authorUrl?: string } }
  | { id: string; role: 'ai'; before: string; out: string | null; busy: boolean; reveal: Reveal; err?: string; text: string; req?: EditRequest; at?: number; recover?: boolean }
  // video in chat: UN messaggio che si trasforma a ogni scelta (template, arredo, due anteprime, video)
  | { id: string; role: 'video'; step: 'template' | 'anim' | 'upload' | 'vchoice' | 'exit' | 'room' | 'mode' | 'previews' | 'frames' | 'render'; photo: string; anim?: VideoAnim; picks: VideoPick[]; previews?: (string | null)[]; frames?: { token: string; before: string; after: string; src: string; styled?: string }; url?: string; err?: string; job?: string; restyle?: { label: string; req: { style?: string; prompt?: string } }; redone?: boolean; agent?: { busy?: string; up?: string; token?: string; video?: string; room?: string; at?: number; duration?: number; exit?: boolean; steady?: boolean; styled?: string; landscape?: boolean; kind?: string } }; // kind: stanza scelta dall'agente (room:...), per il video con lui dentro

// Macro template video, ognuno con i suoi stili di animazione (card con anteprima in loop)
type VideoAnim = 'popup' | 'gravity' | 'particles' | 'stopmotion' | 'cantiere' | 'daynight' | 'camera' | 'agent' | 'walk' | 'fpv';
// scelta gia' fatta: etichetta con icona (o la foto scelta) sopra la domanda
type VideoPick = { label: string; icon: 'split' | 'pop' | 'drop' | 'dust' | 'steps' | 'build' | 'moon' | 'cam' | 'agent' | 'style' | 'keep' | 'photo'; src?: string };
const PICK_ICON = { split: SquareSplitHorizontal, pop: Sparkles, drop: Anvil, dust: WandSparkles, steps: Film, build: HardHat, moon: MoonStar, cam: VideoIcon, agent: UserRound, style: Palette, keep: Sofa, photo: ImageIcon };
const ANIM_ICON: Record<VideoAnim, VideoPick['icon']> = { popup: 'pop', gravity: 'drop', particles: 'dust', stopmotion: 'steps', cantiere: 'build', fpv: 'build', daynight: 'moon', camera: 'cam', agent: 'agent', walk: 'cam' };
type VideoCard = { id: string; label: string; desc: string; sample: string };
const VIDEO_TEMPLATES: (VideoCard & { anims: (VideoCard & { id: VideoAnim })[] })[] = [
  { id: 'prima-dopo', label: 'Prima e dopo', desc: 'Dalla stanza vuota a quella arredata', sample: VIDEO_SAMPLES.popup, anims: [
    { id: 'popup', label: 'Popup', desc: 'I mobili spuntano uno alla volta', sample: VIDEO_SAMPLES.popup },
    { id: 'gravity', label: 'Dall’alto', desc: 'I mobili cadono dall’alto e si posano', sample: VIDEO_SAMPLES.gravity },
  ] },
  // un'animazione sola: dal template si passa subito alla scelta della stanza
  { id: 'cantiere', label: 'Cantiere', desc: 'Dal cantiere alla casa finita', sample: VIDEO_SAMPLES.cantiere, anims: [
    { id: 'cantiere', label: 'Cantiere', desc: 'Dal cantiere alla casa finita', sample: VIDEO_SAMPLES.cantiere },
  ] },
  { id: 'volo-cantiere', label: 'Volo nel cantiere', desc: 'Un volo tra le fondamenta, poi il palazzo si svela finito', sample: VIDEO_SAMPLES.fpv, anims: [
    { id: 'fpv', label: 'Volo nel cantiere', desc: 'Un volo tra le fondamenta, poi il palazzo si svela finito', sample: VIDEO_SAMPLES.fpv },
  ] },
  { id: 'giorno-notte', label: 'Giorno e notte', desc: 'Scende la sera e si accendono le luci', sample: VIDEO_SAMPLES.daynight, anims: [
    { id: 'daynight', label: 'Giorno e notte', desc: 'Scende la sera e si accendono le luci', sample: VIDEO_SAMPLES.daynight },
  ] },
  { id: 'agente', label: 'Con te in video', desc: 'Parli in camera, esci e la stanza si arreda', sample: VIDEO_SAMPLES.agent, anims: [
    { id: 'agent', label: 'Con te in video', desc: 'Parli in camera, esci e la stanza si arreda', sample: VIDEO_SAMPLES.agent },
  ] },
  { id: 'camera', label: 'Camminata', desc: 'Entri nella stanza con una ripresa lenta', sample: VIDEO_SAMPLES.camera, anims: [
    { id: 'camera', label: 'Camminata', desc: 'Entri nella stanza con una ripresa lenta', sample: VIDEO_SAMPLES.camera },
  ] },
];
// anteprime degli stili per stanza (30/09, da foto Unsplash in public/staging/stili/<stanza>/); le altre stanze: il soggiorno
const STYLE_ROOMS = new Set(['camera', 'cameretta', 'cucina', 'bagno', 'openspace']);
const styleThumb = (style: string, kind?: string | null) => { const r = kind?.startsWith('room:') ? kind.slice(5) : ''; return STYLE_ROOMS.has(r) ? `/staging/stili/${r}/${style}.jpg` : `/staging/stili/${style}.jpg`; };
const VIDEO_STYLES = [{ id: 'modern', label: 'Moderno' }, { id: 'nordic', label: 'Nordico' }, { id: 'industrial', label: 'Luxury' }, { id: 'boho', label: 'Boho' }];

// Crediti di un'azione, stessa regola del server (api/platform/photo-edit): luce gratis, svuota e arredo 5, modifica gratis
// per le prime FREE_EDITS su una foto poi 1. Etichetta piccola accanto a ogni pulsante, cosi' l'agente sa cosa spende.
// arreda davvero (non Svuota ne' Luminoso, che costano uguale): serve per chiedere "Quanto arredo?"
const furnishes = (req: Partial<EditRequest>) => req.angle !== 'day' && req.style !== 'empty'
  && (isFurnishing({ style: req.style, customPrompt: req.prompt, angle: req.angle, planimetria: req.planimetria, scene: req.scene as 'interno' | undefined, restyle: isRestyle(req.prompt ?? '') }) || !!req.styleRef);
// crediti di un video per animazione; Cantiere e Giorno/notte partono subito dopo la scelta (niente passo Prima/Dopo)
// Prima e dopo: 99 per il video (1 credito si scala gia' al Prima/Dopo)
const videoCr = (anim?: VideoAnim) => anim === 'fpv' ? CREDIT_COST.video_fpv : anim === 'cantiere' ? CREDIT_COST.video_cantiere : anim === 'daynight' ? CREDIT_COST.video_daynight : anim === 'camera' ? CREDIT_COST.video_camera : anim === 'agent' ? CREDIT_COST.video_agent : anim === 'walk' ? CREDIT_COST.video_walk : CREDIT_COST.video_render;
// attesa tipica del video, misurata sulle prove del 29-30/09 (generazione su fal + foto GPT + montaggio, coda compresa)
const waitFor = (anim?: VideoAnim) => anim === 'cantiere' ? '4-8 min' : anim === 'camera' ? '2-5 min' : anim === 'fpv' || anim === 'daynight' || anim === 'agent' ? '2-4 min' : anim === 'walk' ? '10-15 min' : 'circa 2 min';
const directVideo = (anim?: VideoAnim) => anim === 'cantiere' || anim === 'daynight' || anim === 'camera' || anim === 'fpv';
// crediti per arrivare al video finito (Veo: foto di partenza + montaggio), senza lo stile
const fullCr = (anim?: VideoAnim) => videoCr(anim) + (directVideo(anim) || anim === 'agent' || anim === 'walk' ? 0 : CREDIT_COST.video_prep);
const creditsOf = (req: Partial<EditRequest>, editsDone: number): number => req.angle === 'day' ? CREDIT_COST.luminoso
  : req.planimetria ? CREDIT_COST.arreda
  : req.style === 'empty' ? CREDIT_COST.svuota
  : isFurnishing({ style: req.style, customPrompt: req.prompt, angle: req.angle, planimetria: req.planimetria, scene: req.scene as 'interno' | undefined, restyle: isRestyle(req.prompt ?? '') }) || !!req.styleRef ? CREDIT_COST.arreda
  : editsDone >= FREE_EDITS ? CREDIT_COST.modifica_extra : CREDIT_COST.modifica;
function Cr({ n, dark, tight, still }: { n: number; dark?: boolean; tight?: boolean; still?: boolean }) {
  // icona moneta: i crediti si spendono (Sparkles e' gia' l'icona dell'AI); gratis: niente pill
  if (n === 0) return null;
  return <span title={`${n} crediti`} className={`${tight ? '' : 'ml-1.5'} inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold leading-4 ${dark ? 'bg-white/20 text-white' : still ? 'bg-black/[.06] text-muted' : 'bg-black/[.06] text-muted ease-smooth transition-colors group-hover:bg-white/20 group-hover:text-white'}`}><Coins size={10} className="shrink-0" />{n}</span>;
}
const uid = () => Math.random().toString(36).slice(2, 10);
// messaggio che non chiede niente sulla foto (saluto, grazie, domanda generica): nessuna parola da modifica o da stanza.
// ponytail: regole semplici; nel dubbio il messaggio va a GPT come prima
const EDIT_WORDS = /\b(togl|rimuov|elimin|lev[ai]|mett|aggiung|inser|arred|svuot|cambi|sostitu|spost|dipin|color|rend|fa[ir]|rifa|trasform|stil|modern|nordic|scandinav|luxury|luss|boho|industr|classic|minimal|paret|paviment|parquet|soffitt|luc|lumin|divan|lett|tavol|sedi|cucin|bagn|tend|quadr|piant|tappet|mobil|armad|finestr|port|bianc|ner|grig|legn|marm)\w*/i;
const CHAT_WORDS = /^(ciao|salve|buongiorno|buonasera|hey|ehi|hello|hi|grazie|ok|okay|perfetto|bene|come va|chi sei|cosa sai fare|aiuto|help|test|prova)\b/i;
// 1-2 parole senza parole da modifica ("cicaooo", tasti a caso) = non e' una richiesta; da 3 parole in su nel dubbio parte
const isChatter = (t: string) => !EDIT_WORDS.test(t) && (CHAT_WORDS.test(t) || /\?\s*$/.test(t) || t.split(/\s+/).length <= 2);
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
// planimetria: rendering con regole sue, dal testo prendo solo lo stile dell'arredo
// esempi del campo: il primo per tipo di stanza, poi ritocchi sul risultato (a rotazione)
// Modifica di una zona: esempio nel campo secondo la stanza riconosciuta (cosa si trova di solito in quella foto)
const ZONE_EX: Record<string, string> = {
  openspace: 'togli la tv', soggiorno: 'togli la tv', cucina: 'cambia il colore delle ante', camera: 'cambia la testiera del letto',
  cameretta: 'togli i giochi', bagno: 'togli il box doccia', sala: 'metti un lampadario', studio: 'togli la scrivania',
  ingresso: 'metti una consolle', corridoio: 'appendi dei quadri', balcone: 'metti delle piante', cantina: 'togli gli scatoloni',
  box: 'togli gli attrezzi', esterno: 'ridipingi la facciata', giardino: 'metti un prato curato', planimetria: 'togli le scritte',
};
// Quantita' di arredo capita dalle parole della richiesta scritta (null = non detto: Normale)
const detectDensity = (t: string): 'poco' | 'ricco' | null =>
  /\b(poch[ie]|pochissim[ie]|essenzial[ei]|minimal[ei]?|minimalist[aie]?|ariosa?|arios[io]|spoglia?|leggero|sobri[oa]|il minimo|solo l'essenziale)\b/i.test(t) ? 'poco'
  : /\b(ricc[oa]|ricchissim[oa]|pien[oa]|tanti|tantissim[ie]|molt[ie] (mobili|oggetti)|da rivista|arredatissim[oa]|completo|completa|piena di)\b/i.test(t) ? 'ricco' : null
const FIRST: Record<string, string> = {
  openspace: 'cucina bianca e zona giorno con divano', soggiorno: 'arreda con un divano grigio e un tavolino', cucina: 'ante bianche e piano in legno chiaro', camera: 'letto matrimoniale e comodini in rovere',
  cameretta: 'lettino, scrivania e colori tenui', bagno: 'piastrelle chiare e doccia in vetro', sala: 'tavolo da pranzo per sei persone',
  studio: 'scrivania e libreria bianca', ingresso: 'mobile scarpiera e specchio', corridoio: 'pareti bianche e luci a soffitto',
  balcone: 'tavolino con due sedie e piante', cantina: 'scaffali ordinati e luce', box: 'pavimento pulito e scaffali',
  esterno: 'facciata ridipinta bianca', giardino: 'prato curato e un tavolo da esterno', planimetria: 'arredala in stile moderno',
};
// mentre genera: una frase a caso per ogni foto (scelta dall'id del messaggio, resta la stessa finche' lavora)
const BUSY_HINTS = [
  'Sto creando la foto, intanto scrivi la prossima modifica',
  'Ci lavoro su, tu pensa già al prossimo ritocco',
  'Qualche secondo e arriva, intanto dimmi cosa cambiare dopo',
  'Sto sistemando la stanza, scrivi pure la prossima idea',
  'Quasi pronta, cosa vuoi toccare subito dopo?',
  'Sto arredando, intanto annota il prossimo dettaglio',
  'La foto è in lavorazione, prepara la prossima richiesta',
  'Un attimo e te la mostro, poi cosa facciamo?',
  'Sto dando forma alla stanza, tu pensa al passo dopo',
  'In arrivo, nel frattempo scrivi cosa migliorare',
  'Sto mettendo a posto ogni dettaglio, poi tocca a te',
  'Lavoro in corso, scrivi già il prossimo cambio',
  'Sto rifinendo la foto, cosa aggiungiamo dopo?',
  'Ancora un momento, intanto dimmi il prossimo desiderio',
  'Sto preparando la nuova versione, pensa al ritocco successivo',
  'La stanza sta cambiando, scrivi cosa vuoi dopo',
  'Sto posizionando i mobili, intanto scrivi la prossima idea',
  'Quasi fatto, vuoi già cambiare qualcos’altro?',
  'Sto curando luce e dettagli, tu scrivi il prossimo passo',
  'Un momento ancora, poi possiamo ritoccarla',
  'Sto componendo la foto, intanto pensa ai colori',
  'La nuova versione arriva, scrivi pure cosa sistemare',
  'Sto lavorando alla foto, prepara il prossimo ritocco',
  'Ci siamo quasi, intanto dimmi cosa non ti convince',
  'Sto trasformando la stanza, pensa già al dettaglio dopo',
  'Tra poco la vedi, intanto scrivi la prossima modifica',
  'Sto scegliendo i mobili giusti, tu scrivi cosa cambiare',
  'Foto in preparazione, qual è il prossimo tocco?',
  'Sto sistemando gli ultimi dettagli, poi continuiamo',
  'Ancora qualche secondo, intanto pensa a tende e tappeti',
  'Sto mettendo in ordine la stanza, poi cosa facciamo?',
  'In lavorazione, scrivi già cosa vuoi vedere dopo',
  'Sto rendendo la foto più bella, tu pensa al prossimo passo',
  'Quasi pronta, intanto scegli cosa ritoccare',
  'Sto arredando con calma, scrivi la prossima richiesta',
  'La foto sta nascendo, intanto dimmi cosa aggiungere',
  'Sto bilanciando colori e luce, poi tocca a te',
  'Un istante e arriva, cosa cambiamo dopo?',
  'Sto rifinendo la stanza, scrivi il prossimo dettaglio',
  'Lavoro sulla foto, tu pensa a come migliorarla ancora',
  'Sto preparando il risultato, intanto scrivi un’altra idea',
  'Quasi finito, vuoi provare un altro stile dopo?',
  'Sto creando la versione nuova, annota cosa sistemare',
  'La stanza prende forma, scrivi pure il prossimo cambio',
  'Sto aggiungendo gli ultimi tocchi, poi continuiamo insieme',
  'Ancora poco, intanto pensa a pareti e pavimento',
  'Sto lavorando per te, scrivi già la prossima modifica',
  'Foto quasi pronta, cosa vuoi ritoccare dopo?',
  'Sto sistemando tutto, intanto scrivi cosa ti piacerebbe',
  'Qualche istante e ci siamo, pensa al prossimo ritocco',
];
const AFTER = ['cuscini verdi sul divano', 'togli il quadro', 'pavimento in rovere chiaro', 'più luce naturale', 'tende di lino bianche', 'una pianta vicino alla finestra'];
const planStyle = (t: string) => (/nordic|scandinav/i.test(t) ? 'nordic' : /lusso|luxury|elegan/i.test(t) ? 'industrial' : /boho/i.test(t) ? 'boho' : 'modern');


// Conversazione salvata nella memoria della scheda (sessionStorage): se Chrome ricarica una scheda rimasta in background
// (risparmio memoria) la chat torna com'era. Cambiando pagina della piattaforma si cancella (la chat riparte vuota, come prima).
// Legata all'account (uid): nella stessa scheda un altro account (o uno nuovo dopo l'eliminazione) parte da vuota.
const SAVE_KEY = 'gnm-staging-chat';
type Saved = { uid?: string; chatId?: string; msgs: Msg[]; base: string | null; kind: string | null; scene: Scene; roomState: string | null; project: string | null; origin: string | null; emptyFrom?: string | null };
function loadSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Saved;
    // lavori interrotti dalla ricarica: la foto non si puo' riprendere (e' comunque nella Galleria), il video si' (job)
    // foto interrotta dalla ricarica: resta in lavorazione e si va a riprendere il risultato dalla Galleria (vedi recover)
    d.msgs = d.msgs.map(m => (m.role === 'ai' && m.busy ? { ...m, recover: true }
      : m.role === 'video' && m.previews?.some(p => !p) ? { ...m, previews: m.previews.map(p => p ?? 'err') } : m));
    return d;
  } catch { return null; }
}

export default function StagingChat({ onMany, initial }: { onMany: (files: FileList | File[]) => void; initial?: { photo?: string; project?: string } }) {
  const [saved] = useState(loadSaved);
  const [library, setLibrary] = useState(false); // scelta foto: vetrina o computer
  const [project, setProject] = useState<string | null>(saved?.project ?? null); // immobile della foto (se scelta dalla vetrina): la Galleria raggruppa per casa
  const [origin, setOrigin] = useState<string | null>(saved?.origin ?? null); // foto originale dell'immobile da cui si e' partiti (per il prima/dopo)
  // quantita' di arredo (Essenziale / Normale / Ricco), ricordata tra una foto e l'altra
  const [density, setDensityState] = useState<'poco' | 'normale' | 'ricco'>(() => { try { const d = localStorage.getItem('gnm-density'); return d === 'poco' || d === 'ricco' ? d : 'normale'; } catch { return 'normale'; } });
  const densityRef = useRef(density);
  useEffect(() => { densityRef.current = density; }, [density]);
  // richiesta scritta: Normale se non dice niente, la pill si accende da sola se le parole la indicano; un clic la sceglie a mano
  const [textDensity, setTextDensity] = useState<'poco' | 'normale' | 'ricco' | null>(null);
  const setDensity = (d: 'poco' | 'normale' | 'ricco') => { densityRef.current = d; setDensityState(d); try { localStorage.setItem('gnm-density', d); } catch { /* niente */ } };
  // popup "Quanto arredo?" sopra il suggerimento di stile cliccato (posizione del pulsante sullo schermo)
  const [densityAsk, setDensityAsk] = useState<{ sug: Suggestion; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!densityAsk) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as HTMLElement).closest('[data-density-pop], [data-density-chip]')) setDensityAsk(null); };
    document.addEventListener('keydown', close); document.addEventListener('pointerdown', close); window.addEventListener('resize', close as EventListener);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close); window.removeEventListener('resize', close as EventListener); };
  }, [densityAsk]);
  const [saveOpen, setSaveOpen] = useState<string | null>(null); // risultato con il pannello "Salva nell'immobile" aperto
  // com'e' la stanza nella foto di lavoro (vuota, disordinata, datata, arredata): cambia suggerimento e proposte
  const [roomState, setRoomState] = useState<string | null>(saved?.roomState ?? null);
  // foto caricata che era una stanza vuota: nel video niente "Tieni la stanza com'e'", si sceglie solo lo stile
  const [emptyFrom, setEmptyFrom] = useState<string | null>(saved?.emptyFrom ?? null);
  const [otherFor, setOtherFor] = useState<string | null>(null); // messaggio in cui l'agente scrive a mano cos'e' la foto
  const [roomOther, setRoomOther] = useState<{ id: string; v: string } | null>(null); // pill "Altro" della stanza, diventa un campo
  // campo "Altro, lo scrivo io" sotto la foto: si chiude solo se resta vuoto e il cursore e' uscito davvero
  // (mentre il messaggio si riscrive con l'animazione ci sono due copie del campo: la seconda rubava il cursore)
  const otherInput = (id: string) => (
    <input autoFocus placeholder="es. una mansarda" maxLength={40} className="w-40 border-b border-ink/30 bg-transparent font-bold outline-none placeholder:font-normal placeholder:text-muted/60"
      onKeyDown={e => {
        if (e.key === 'Escape') setOtherFor(null);
        if (e.key !== 'Enter') return;
        const v = e.currentTarget.value.trim();
        if (v) { setMsgs(ms => ms.map(x => (x.id === id && x.role === 'user' ? { ...x, seen: `custom:${v}` } : x))); setScene('interno'); setKind(null); }
        setOtherFor(null);
      }}
      onBlur={e => { const el = e.currentTarget; setTimeout(() => { if (!el.value.trim() && !(document.activeElement as HTMLElement | null)?.matches?.('input[placeholder="es. una mansarda"]')) setOtherFor(null); }, 0); }} />
  );
  // chiusura di Modifica: 300 ms in cui selezione e campo sfumano mentre il pulsante torna Scarica e il divisore rientra
  const [zoneClosing, setZoneClosing] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(saved?.msgs ?? []);
  const [chatId, setChatId] = useState(() => saved?.chatId ?? crypto.randomUUID()); // id della chat nello storico
  const credits = useCredits();
  const [base, setBase] = useState<string | null>(saved?.base ?? null); // immagine su cui lavora la prossima richiesta
  const [viewer, setViewer] = useState<{ src: string; before?: string } | null>(null); // foto a tutto schermo
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const [text, setTextState] = useState('');
  const setText = (v: string) => { setTextState(v); if (!v.trim()) setTextDensity(null); }; // testo vuoto: la densita' letta dalle parole si azzera
  // foto di riferimento per lo stile: scelta (Unsplash o dal computer) = richiesta inviata subito
  const [inspo, setInspo] = useState(false); // pannello "Cerca ispirazione" (Unsplash)
  const styleInput = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Suggestion | null>(null);
  const [scene, setScene] = useState<Scene>(saved?.scene ?? 'interno');
  const [kind, setKind] = useState<string | null>(saved?.kind ?? null); // es. "room:cucina", "scene:giardino": decide i suggerimenti
  const [tick, setTick] = useState(0); // messaggi a rotazione durante la generazione
  const [drag, setDrag] = useState(false);
  const [faded, setFaded] = useState<Set<string>>(new Set()); // messaggi dopo un "Ricomincia da qui"
  const [selecting, setSelecting] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const clearZone = () => setRegion(null);
  const scroller = useRef<HTMLDivElement>(null);
  // in fondo davvero (padding compreso), cosi' l'ultimo messaggio non resta sotto il campo
  // scorrimento in fondo con ease-in-out (600 ms); il fondo si rilegge a ogni fotogramma, cosi' segue la card che cresce
  const scrollAnim = useRef(0);
  const toBottom = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    cancelAnimationFrame(scrollAnim.current);
    const from = el.scrollTop, t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 600), e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      el.scrollTop = from + (el.scrollHeight - el.clientHeight - from) * e;
      if (k < 1) scrollAnim.current = requestAnimationFrame(step);
    };
    scrollAnim.current = requestAnimationFrame(step);
  }, []);
  const busy = msgs.some(m => m.role === 'ai' && m.busy);
  // foto reale caricata per ultima (la stanza vera): va con ogni richiesta, cosi' dopo "Svuota" si sa ancora che era una cucina
  const sourcePhoto = [...msgs].reverse().find((m): m is Extract<Msg, { role: 'user' }> => m.role === 'user' && !!m.image)?.image ?? null;

  // GPU: si accende appena entri nella chat e resta accesa finche' la usi (segnale ogni 50 s, spegnimento
  // a 60 s). Dopo 2 minuti senza scrivere, caricare o generare non la teniamo piu' accesa; uscendo dalla
  // pagina si spegne da sola. Qualsiasi attivita' la riaccende.
  const lastActive = useRef(0);
  const touch = useCallback(() => { lastActive.current = Date.now(); }, []);

  useEffect(() => { toBottom(); }, [msgs.length, selecting, toBottom]);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick(x => x + 1), 3500);
    return () => clearInterval(t);
  }, [busy]);

  useEffect(() => {
    try { sessionStorage.setItem(SAVE_KEY, JSON.stringify({ uid: owner.current, chatId, msgs, base, kind, scene, roomState, project, origin, emptyFrom })); } catch { /* troppo grande: si salva al prossimo cambio */ }
  }, [chatId, msgs, base, kind, scene, roomState, project, origin, emptyFrom]);
  // Storico (api/platform/chats): la chat si salva anche sul server 2,5 s dopo l'ultimo cambio, a lavori finiti.
  // Titolo = prima richiesta scritta, anteprima = ultima foto. Oltre ~4 MB (tante foto caricate) non si salva.
  const lastSaved = useRef('');
  useEffect(() => {
    if (!msgs.length || busy) return;
    const data = { msgs, base, kind, scene, roomState, project, origin, emptyFrom };
    const json = JSON.stringify(data);
    if (json === lastSaved.current || json.length > 3_900_000) return;
    const t = setTimeout(() => {
      const first = msgs.find(m => m.role === 'user' && m.text?.trim()) as { text?: string } | undefined;
      const imgs = json.match(/https:\/\/[^"\s]+?\.(?:jpe?g|png|webp)/gi);
      const title = first?.text?.trim().slice(0, 80) || `Foto del ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}`;
      authFetch('/api/platform/chats', { method: 'PUT', body: JSON.stringify({ id: chatId, title, thumb: imgs?.[imgs.length - 1] ?? null, data }) })
        .then(r => { if (r.ok) lastSaved.current = json; }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [chatId, msgs, base, kind, scene, roomState, project, origin, emptyFrom, busy]);
  // chat riaperta dallo storico (PlatformApp): si ricarica com'era e si continua da li'
  useEffect(() => {
    const open = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      authFetch(`/api/platform/chats?id=${encodeURIComponent(id)}`).then(r => (r.ok ? r.json() : null)).then((d: Omit<Saved, 'uid' | 'chatId'> | null) => {
        if (!d) return;
        lastSaved.current = JSON.stringify(d);
        setChatId(id); setMsgs(d.msgs ?? []); setBase(d.base ?? null); setKind(d.kind ?? null); setScene(d.scene ?? 'interno'); setRoomState(d.roomState ?? null);
        setProject(d.project ?? null); setOrigin(d.origin ?? null); setEmptyFrom(d.emptyFrom ?? null); clearZone(); setSelecting(false); setText('');
      }).catch(() => {});
    };
    window.addEventListener('agenteimmo:open-chat', open);
    return () => window.removeEventListener('agenteimmo:open-chat', open);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // chat di un altro account nella stessa scheda: si riparte da vuota
  const owner = useRef(saved?.uid);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      const me = session?.user.id;
      if (saved && saved.uid !== me) window.dispatchEvent(new Event('agenteimmo:new-chat')); // anche le chat salvate prima dell'uid
      owner.current = me;
    });
  }, [saved]);
  // Nuova chat (pulsante in alto, PlatformApp): si ricomincia da zero; foto e video fatti restano nella Galleria
  useEffect(() => {
    const reset = () => {
      setMsgs([]); setBase(null); setKind(null); setScene('interno'); setRoomState(null); setProject(null); setOrigin(null); setEmptyFrom(null);
      clearZone(); setSelecting(false); setText(''); setChatId(crypto.randomUUID()); lastSaved.current = '';
      try { sessionStorage.removeItem(SAVE_KEY); } catch { /* niente */ }
    };
    window.addEventListener('agenteimmo:new-chat', reset);
    return () => window.removeEventListener('agenteimmo:new-chat', reset);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // uscita dalla chat (altra pagina della piattaforma): conversazione chiusa. Una ricarica della scheda non passa di qui.
  // la conversazione resta finche' la scheda e' aperta: tornando da un'altra pagina si ritrova (28/09, prima si perdeva all'uscita)
  const patch = (id: string, p: Partial<Extract<Msg, { role: 'ai' }>>) => setMsgs(ms => ms.map(m => (m.id === id && m.role === 'ai' ? { ...m, ...p } : m)));
  // Ricarica a meta' lavoro: il server finisce lo stesso e salva la foto in Galleria. Si controlla la Galleria ogni 4 s
  // (fino a 2 minuti) e la prima foto nuova fatta dopo la richiesta torna al suo posto in chat; se non arriva, l'avviso.
  useEffect(() => {
    const lost = msgs.filter((m): m is Extract<Msg, { role: 'ai' }> => m.role === 'ai' && !!m.recover);
    if (!lost.length) return;
    let stop = false, tries = 0;
    const tick = async () => {
      if (stop) return;
      const items = await fetchMedia().catch(() => []);
      const used = new Set(msgs.map(m => (m.role === 'ai' ? m.out : null)));
      for (const m of lost) {
        const hit = items.filter(it => !it.video && !used.has(it.dopo) && it.at >= (m.at ?? 0) - 10_000).sort((a, b) => a.at - b.at)[0];
        if (hit) { used.add(hit.dopo); patch(m.id, { out: hit.dopo, busy: false, recover: false }); if (m.id === lost[lost.length - 1].id) setBase(hit.dopo); }
      }
      if (++tries >= 30) { lost.forEach(m => patch(m.id, { busy: false, recover: false, err: 'La pagina si è ricaricata mentre lavorava: trovi il risultato nella Galleria.' })); return; }
      if (!stop) setTimeout(tick, 4000);
    };
    void tick();
    return () => { stop = true; };
  }, [msgs.some(m => m.role === 'ai' && m.recover)]); // eslint-disable-line react-hooks/exhaustive-deps

  const upload = async (files: FileList | File[] | null, projectId?: string | null, sourceUrl?: string, early?: Promise<Response | null>) => {
    if (!files?.length) return;
    setProject(projectId ?? null); setOrigin(sourceUrl ?? null);
    touch();
    if (files.length > 1) { onMany(files); return; } // piu' foto insieme: vista a griglia
    const f = files[0];
    // un video: si carica e si sceglie il template video (la stanza si arreda quando esci / cammina e cambia stile)
    if (f.type.startsWith('video/') || /\.(mov|mp4)$/i.test(f.name)) {
      const vm: VideoMsg = { id: uid(), role: 'video', step: 'vchoice', photo: '', picks: [] };
      const um = uid();
      const waiting = [...msgs].reverse().find((x): x is VideoMsg => x.role === 'video' && x.step === 'upload');
      if (waiting) {
        // "Con te in video" aspettava il video: il messaggio d'attesa lascia il posto al video e alla scelta del momento
        const next: VideoMsg = { ...waiting, id: uid(), step: waiting.anim === 'walk' ? 'upload' : 'exit', err: undefined };
        setMsgs(ms => [...ms.filter(x => x.id !== waiting.id), { id: um, role: 'user', video: URL.createObjectURL(f) }, next]);
        toBottom();
        void agentUpload(next, f, um);
        return;
      }
      setMsgs(ms => [...ms, { id: um, role: 'user', video: URL.createObjectURL(f) }, vm]);
      toBottom();
      void agentUpload(vm, f, um);
      return;
    }
    if (!f.type.startsWith('image/')) return;
    // Riconoscimento su una copia piccola (448 px): parte subito, carica poco e il modello la legge in un terzo del tempo
    const small = await fileToResizedDataUrl(f, 448);
    // foto di un immobile: il server risponde dalla memoria dell'immobile se l'ha gia' riconosciuta
    const classified = early ?? authFetch('/api/platform/photo-classify', { method: 'POST', body: JSON.stringify({ imageBase64: small, ...(projectId && sourceUrl ? { projectId, photoUrl: sourceUrl } : {}) }) }).catch(() => null);
    const img = await fileToResizedDataUrl(f, 1500);
    const id = uid();
    setMsgs(ms => [...ms, { id, role: 'user', image: img, seen: null }]);
    setKind(null); // nuova foto: suggerimenti generici finche' non la riconosce
    setRoomState(null); setEmptyFrom(null);
    setBase(img);
    await applySeen(id, classified, img);
  };
  // Tipo di foto e stanza: imposta il tipo da solo e lo dice nel messaggio guida
  const applySeen = async (id: string, classified: Promise<Response | null>, photo: string) => {
    try {
      const r = await classified;
      const c = r?.ok ? await r.json() : null;
      // stanza non riconosciuta (o riconoscimento fallito): niente tipo inventato, lo sceglie l'agente dal menu in evidenza
      const unknown = !c?.scene || (c.scene === 'interno' && (!ROOM_LABEL[c.room] || c.room === 'altro'))
      if (unknown) { if (c?.scene) setScene(c.scene); setMsgs(ms => ms.map(m => (m.id === id && m.role === 'user' ? { ...m, seen: 'unknown' } : m))); return; }
      if (c?.scene) {
        setScene(c.scene);
        const what = c.scene === 'interno' ? `room:${c.room}` : `scene:${c.scene}`;
        setMsgs(ms => ms.map(m => (m.id === id && m.role === 'user' ? { ...m, seen: what } : m)));
        setKind(what);
        setRoomState(c.state || null);
        setEmptyFrom(c.scene === 'interno' && c.state === 'vuota' ? photo : null);
      }
    } catch { setMsgs(ms => ms.map(m => (m.id === id && m.role === 'user' ? { ...m, seen: 'unknown' } : m))); }
  };

  const send = async (given?: string, sug?: Suggestion | null, style?: { src: string; author?: string; authorUrl?: string }) => {
    const styleRef = style?.src;
    const t = (given ?? text).trim();
    const pk = given ? sug ?? null : picked;
    if (!t || !base || busy) return;
    // niente AI quando non serve (29/09): saluti e domande senza una richiesta sulla foto partivano verso GPT e pagavamo
    // una foto inutile; con la foto non riconosciuta si sceglie prima cos'e' (non si arreda uno sfondo del desktop)
    const note = (n: string) => { setText(''); setMsgs(ms => [...ms, { id: uid(), role: 'user', text: t }, { id: uid(), role: 'note', text: n }]); toBottom(); };
    const lastPhoto = [...msgs].reverse().find((x): x is Extract<Msg, { role: 'user' }> => x.role === 'user' && !!x.image);
    if (lastPhoto?.seen === 'unknown') { note('Prima dimmi che stanza è dal menu qui sopra, così la arredo giusta.'); return; }
    if (!region && !styleRef && !pk && isChatter(t)) { note('Scrivimi cosa cambiare nella foto, per esempio: togli il divano, pareti bianche, arredala in stile nordico.'); return; }
    // stile da una foto: sempre Normale; scritta: quella delle pill sopra il campo; stili: l'ultima scelta nel popup
    const dens = styleRef ? 'normale' : given === undefined ? typedDensity : densityRef.current;
    setTextDensity(null);
    touch();
    const id = uid();
    const before = base;
    const zone = region;
    setText(''); setPicked(null); clearZone(); setSelecting(false);
    const req: EditRequest = {
      edits: msgs.filter(x => x.role === 'ai' && !!x.out).length, // modifiche gia' fatte su questa foto: le prime 3 gratis, poi 1 credito
      ...(project ? { projectId: project } : {}),
      ...(sourcePhoto && sourcePhoto !== before ? { reference: sourcePhoto } : {}),
      ...(styleRef ? { styleRef } : {}),
      ...(scene === 'interno' && dens !== 'normale' ? { density: dens } : {}),
      ...(kind ? { room: seenLabel(kind) } : {}),
      ...(before.startsWith('data:') ? { imageBase64: before } : { imageUrl: before }),
      ...(scene === 'planimetria'
        ? { planimetria: true, style: planStyle(t), ...(/bianco e nero|b\/n|in bianco/i.test(t) ? { plan: 'bw' as const } : /\b3d\b|tridimensional/i.test(t) ? { plan: '3d' as const } : {}) }
        : { scene, ...(zone ? { prompt: pk?.req.prompt && t === pk.label ? pk.req.prompt : t, region: zone } : pk && t === pk.label && !pk.req.prompt ? pk.req : { prompt: pk?.req.prompt && t === pk.label ? pk.req.prompt : t }) }),
    };
    setMsgs(ms => [...ms, { id: uid(), role: 'user', text: t, region: zone ?? undefined, ...(style ? { style } : {}) }, { id, role: 'ai', before, out: null, busy: true, at: Date.now(), reveal: null, text: t, req }]);
    await run(id, req, before);
  };
  // Stesso stile ma diverso: stessa richiesta sulla stessa foto di partenza, nuovo seme (lo sceglie il server)
  const variant = async (m: Extract<Msg, { role: 'ai' }>) => {
    if (!m.req || busy) return;
    touch();
    const id = uid();
    setMsgs(ms => [...ms, { id: uid(), role: 'user', text: 'Stesso stile, un’altra versione' }, { id, role: 'ai', before: m.before, out: null, busy: true, at: Date.now(), reveal: null, text: m.text, req: m.req }]);
    // variante: palette e materiali diversi nello stesso stile, la sceglie il server (vedi variantText)
    await run(id, { ...m.req, variant: -1 }, m.before);
  };
  // Video: il server svuota la foto, fa partire Veo e poi monta; qui si controlla ogni 6 s (circa 2 minuti in tutto)
  const askVideo = (photo: string) => { touch(); setMsgs(ms => [...ms, { id: uid(), role: 'user', text: 'Crea un video' }, { id: uid(), role: 'video', step: 'template', photo, picks: [] }]); toBottom(); };
  type VideoMsg = Extract<Msg, { role: 'video' }>;
  const patchV = (id: string, p: Partial<VideoMsg> | ((m: VideoMsg) => Partial<VideoMsg>)) =>
    setMsgs(ms => ms.map(m => (m.id === id && m.role === 'video' ? { ...m, ...(typeof p === 'function' ? p(m) : p) } : m)));
  // crediti non bastano per finire il video: si dice subito e si resta fermi (niente soldi spesi a meta')
  const short = (m: VideoMsg, need: number) => {
    if (!credits || credits.unlimited || credits.balance >= need) return false;
    patchV(m.id, { err: `Per questo video servono ${need} crediti, ne hai ${credits.balance}. Ricarica per continuare.` });
    window.dispatchEvent(new Event('agenteimmo:no-credits'));
    return true;
  };
  // Stile scelto: dietro le quinte si crea UNA foto arredata nello stile (non si mostra), poi il video parte da quella.
  // Il video va dalla foto com'era a quella nuova (Veo, primo e ultimo fotogramma). Come su GetNearMe: niente proposte.
  // redo: "Rifai lo stile" dal passo Prima/Dopo, una volta sola (le scelte restano quelle, si rifa' la foto nel nuovo stile)
  const styleVideo = async (m: VideoMsg, label: string, req: { style?: string; prompt?: string }, redo = false) => {
    touch();
    const picks = redo ? m.picks : [...m.picks, { label, icon: 'style' as const }];
    // intanto il passo Prima/Dopo in attesa (prima mostrava "Creo il video" e sembrava saltare l'approvazione)
    patchV(m.id, { step: 'render', frames: undefined, picks, err: undefined, restyle: { label, req }, redone: redo });
    // quantita' di arredo: quella scelta per la foto da cui parte il video (se era un arredo), altrimenti Normale
    const dens = msgs.find((x): x is Extract<Msg, { role: 'ai' }> => x.role === 'ai' && x.out === m.photo)?.req?.density;
    const body = { ...(project ? { projectId: project } : {}), ...(m.agent?.kind ? { room: seenLabel(m.agent.kind) } : kind && !m.agent ? { room: seenLabel(kind) } : {}), ...(m.photo.startsWith('data:') ? { imageBase64: m.photo } : { imageUrl: m.photo }), scene: 'interno', ...(dens ? { density: dens } : {}), ...req, variant: -1, preview: true, ...(sourcePhoto && sourcePhoto !== m.photo ? { reference: sourcePhoto } : {}) };
    const r = await authFetch('/api/platform/photo-edit', { method: 'POST', headers: QUIET, body: JSON.stringify(body) }).catch(() => null);
    const d = r?.ok ? await r.json().catch(() => ({})) as { url?: string } : null;
    if (r?.status === 402) { patchV(m.id, { err: NO_CREDITS }); return; }
    if (!d?.url) { patchV(m.id, { err: 'Non sono riuscito ad arredare la stanza, riprova.' }); return; }
    await makeVideo({ ...m, picks }, m.photo, label, d.url);
  };
  // Video in due fasi (28/09): 1) il server fa Prima (stanza vuota, Nano Banana) e Dopo (foto vera o nel nuovo stile)
  // e la chat li mostra; 2) l'agente approva e parte Veo (la parte cara), poi il montaggio; qui si controlla ogni 6 s.
  // styled: foto nel nuovo stile (fatta dietro le quinte): il Dopo e' quella
  const makeVideo = async (m: VideoMsg, photo: string, pick: string, styled?: string) => {
    touch();
    const picks: VideoPick[] = styled ? m.picks : [...m.picks, pick === 'Stanza com’è' ? { label: pick, icon: 'keep' } : { label: pick, icon: 'photo', src: photo }];
    if (m.anim === 'walk' && m.agent?.up && styled) {
      patchV(m.id, { step: 'render', picks, err: undefined, agent: { ...m.agent, styled } });
      const token = m.agent.token ?? await (agentUps.current.get(m.agent.up) ?? Promise.resolve(null));
      if (!token) { patchV(m.id, { err: 'Il video non si è caricato, riprova.' }); return; }
      const d = await authFetch('/api/platform/agent-video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'walk', token, styled }) }).then(r => r.json()).catch(() => ({}));
      if (!d.job) { patchV(m.id, { err: d.error === 'no_credits' ? NO_CREDITS : 'Video non riuscito, riprova.' }); return; }
      patchV(m.id, { job: d.job });
      await pollVideo(m.id, d.job);
      return;
    }
    if (m.anim === 'agent' && m.agent?.up && styled) {
      patchV(m.id, { step: 'render', picks, err: undefined, agent: { ...m.agent, styled } });
      // token del video convertito: gia' nel messaggio (anche dopo una ricarica) o dal caricamento in corso
      const token = m.agent.token ?? await (agentUps.current.get(m.agent.up) ?? Promise.resolve(null));
      if (!token) { patchV(m.id, { err: 'Il video non si è caricato, riprova.' }); return; }
      const d = await authFetch('/api/platform/agent-video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'render', token, at: m.agent.at, styled, room: m.agent.room }) }).then(r => r.json()).catch(() => ({}));
      if (!d.job) { patchV(m.id, { err: d.error === 'no_credits' ? NO_CREDITS : 'Video non riuscito, riprova.' }); return; }
      patchV(m.id, { job: d.job });
      await pollVideo(m.id, d.job);
      return;
    }
    // Cantiere, Giorno/notte e Movimento camera (Kling): niente Prima/Dopo da approvare, parte subito. Con uno stile il
    // video parte dalla foto nel nuovo stile; interior: Giorno e notte di una stanza (luci della stanza, non la facciata)
    if (directVideo(m.anim)) {
      const src = styled ?? photo;
      patchV(m.id, { step: 'render', anim: m.anim, photo, picks, err: undefined });
      const res = await authFetch('/api/platform/video', { method: 'POST', headers: QUIET, body: JSON.stringify({ ...(src.startsWith('data:') ? { imageBase64: src } : { imageUrl: src }), anim: m.anim, ...(kind?.startsWith('room:') ? { interior: true } : {}), ...(project ? { projectId: project } : {}) }) }).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) : {};
      if (!d.job) { patchV(m.id, { err: d.error === 'no_credits' ? NO_CREDITS : 'Video non riuscito, riprova.' }); return; }
      patchV(m.id, { job: d.job });
      await pollVideo(m.id, d.job);
      return;
    }
    // foto nel nuovo stile: resta dietro le quinte (la scelta "Moderno" e' gia' tra le scelte, niente miniatura)
    patchV(m.id, { step: 'render', frames: undefined, ...(styled ? {} : { photo }), picks, err: undefined });
    const res = await authFetch('/api/platform/video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'frames', ...(photo.startsWith('data:') ? { imageBase64: photo } : { imageUrl: photo }), ...(styled ? { styled } : {}), anim: m.anim, ...(project ? { projectId: project } : {}) }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (!d.frames) { patchV(m.id, { err: d.error === 'no_credits' ? NO_CREDITS : d.error === 'timeout' ? 'La GPU si sta avviando, riprova tra un minuto.' : 'Non sono riuscito a preparare la stanza vuota, riprova.' }); return; }
    // Prima e Dopo pronti: il video parte subito, senza chiedere conferma (29/09)
    const frames = { token: d.frames, before: d.before, after: d.after, src: photo, styled };
    patchV(m.id, { frames });
    await renderVideo({ ...m, frames, anim: m.anim });
  };
  // fase 2: Veo e montaggio
  // Con te in video: il video pesa (decine di MB) e si carica in sottofondo (URL firmato + conversione sul server) mentre
  // l'agente sceglie; il momento in cui esce e la foto della stanza li fa il browser dal video che ha gia'. Solo il
  // montaggio aspetta il caricamento. agentUps: caricamenti in corso, per id (agent.up), con il token del video pronto.
  const agentUps = useRef(new Map<string, Promise<string | null>>());
  // miniature della striscia per ogni video (per agent.up), fatte nel browser; si rifanno se mancano (dopo una ricarica)
  const [thumbs, setThumbs] = useState<Record<string, string[]>>({});
  useEffect(() => {
    for (const x of msgs) if (x.role === 'video' && x.step === 'exit' && x.agent?.video && !thumbs[x.agent.video]) {
      const up = x.agent.video;
      setThumbs(t => ({ ...t, [up]: [] }));
      void videoThumbs(x.agent.video).then(list => setThumbs(t => ({ ...t, [up]: list }))).catch(() => {
        // video del browser perso con una ricarica: se il caricamento era finito, il messaggio dell'agente ha gia' quello sul server
        const k = msgs.indexOf(x), server = [...msgs.slice(0, k)].reverse().find(y => y.role === 'user' && !!y.video && !y.video.startsWith('blob:'));
        if (server && server.role === 'user' && server.video) patchV(x.id, { agent: { ...x.agent, video: server.video } });
        else setThumbs(t => ({ ...t, [up]: ['dead'] }));
      });
    }
  }, [msgs, thumbs]);
  const agentUpload = async (m: VideoMsg, f: File, userMsg?: string) => {
    touch();
    const local = URL.createObjectURL(f);
    const um = userMsg ?? uid();
    if (!userMsg) setMsgs(ms => { const k = ms.findIndex(x => x.id === m.id); const copy = [...ms]; copy.splice(k < 0 ? copy.length : k, 0, { id: um, role: 'user', video: local }); return copy; });
    const up = uid();
    const type = f.type || (f.name.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4');
    agentUps.current.set(up, (async () => {
      const u = await authFetch('/api/platform/agent-video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'upload', type }) }).then(r => r.json()).catch(() => ({}));
      if (!u.url) return null;
      const put = await fetch(u.url, { method: 'PUT', headers: { 'Content-Type': type }, body: f }).catch(() => null);
      if (!put?.ok) return null;
      const p = await authFetch('/api/platform/agent-video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'prepare', key: u.key, ...(project ? { projectId: project } : {}) }) }).then(r => r.json()).catch(() => ({}));
      // il video locale (blob) non sopravvive a una ricarica: messaggio dell'agente e anteprima passano a quello sul server
      if (p.video) setMsgs(ms => ms.map(x => (x.id === um && x.role === 'user' ? { ...x, video: p.video } : x.role === 'video' && x.agent?.up === up ? { ...x, agent: { ...x.agent, token: p.token, ...(x.agent.video?.startsWith('blob:') ? { video: p.video } : {}) } } : x)));
      return (p.token as string) ?? null;
    })());
    const ag = { up, video: local };
    // video mandato in chat senza template: si sceglie quale (la stanza si arreda quando esci / cammina e cambia stile)
    if (!m.anim) { patchV(m.id, { step: 'vchoice', err: undefined, agent: ag }); return; }
    await agentContinue({ ...m, agent: ag }, m.anim);
  };
  // dopo il caricamento, secondo il template scelto: cammina -> stanza a meta' e stile; con te -> momento dell'uscita
  const agentContinue = async (m: VideoMsg, anim: VideoAnim) => {
    const ag = m.agent;
    if (!ag?.video) return;
    const pick: VideoPick = anim === 'walk' ? { label: 'Cammina e cambia stile', icon: 'cam' } : { label: 'Con te in video', icon: 'agent' };
    const picks = m.picks.length ? m.picks : [pick];
    if (anim === 'walk') {
      patchV(m.id, { step: 'upload', anim, picks, err: undefined, agent: { ...ag, busy: 'Preparo la stanza…' } });
      const dur = await videoDuration(ag.video).catch(() => 0);
      if (dur < 3) { patchV(m.id, { agent: undefined, err: 'Il video è troppo corto: cammina almeno 4-5 secondi.' }); return; }
      const nm: VideoMsg = { ...m, anim, picks, agent: { ...ag, at: Math.min(dur, 15) / 2, duration: dur } };
      if (await agentRoom(nm)) patchV(m.id, { step: 'room' });
      return;
    }
    patchV(m.id, { step: 'exit', anim, picks, err: undefined, agent: { ...ag, busy: 'Riconosco il punto di uscita…' } });
    try {
      const g = await videoGrid(ag.video);
      const e = await authFetch('/api/platform/agent-video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'exit', ...g }) }).then(r => r.json()).catch(() => ({}));
      if (e.at === undefined) throw new Error(e.error);
      if (!e.exit) { patchV(m.id, { step: 'upload', agent: undefined, err: 'Non vedo il momento in cui esci dall’inquadratura: alla fine del video esci e lascia la stanza sola per 2-3 secondi.' }); return; }
      patchV(m.id, { agent: { ...ag, at: e.at, duration: e.duration, exit: e.exit, steady: e.steady, landscape: g.tw > g.th } });
      setTimeout(toBottom, 80); // compare la timeline: la si porta in vista
    } catch {
      patchV(m.id, { step: 'upload', agent: undefined, err: 'Non sono riuscito a leggere il video, riprova.' });
    }
  };
  // foto della stanza all'istante scelto, dal video che ha il browser (poi caricata come le altre foto)
  const agentRoom = async (m: VideoMsg): Promise<string | null> => {
    if (!m.agent?.video || m.agent.at === undefined) return null;
    patchV(m.id, { agent: { ...m.agent, busy: 'Preparo la foto della stanza…' } });
    const url = await videoFrame(m.agent.video, m.agent.at).then(d => uploadDataUrl(d, 'properties')).catch(() => '');
    patchV(m.id, { ...(url ? { photo: url } : {}), agent: { ...m.agent, room: url || undefined, busy: undefined } });
    return url || null;
  };
  const renderVideo = async (m: VideoMsg) => {
    if (!m.frames) return;
    touch();
    patchV(m.id, { step: 'render', err: undefined });
    const fail = 'Video non riuscito, riprova.';
    const res = await authFetch('/api/platform/video', { method: 'POST', headers: QUIET, body: JSON.stringify({ phase: 'render', frames: m.frames.token, anim: m.anim }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    if (!d.job) { patchV(m.id, { err: d.error === 'no_credits' ? NO_CREDITS : d.error === 'nothing_to_animate' ? 'Nella foto non ci sono mobili da animare.' : fail }); return; }
    patchV(m.id, { job: d.job });
    await pollVideo(m.id, d.job);
  };
  const pollVideo = async (id: string, job: string) => {
    const fail = 'Video non riuscito, riprova.';
    // Kling ci mette ~9 min (prove del 28/09/2026), la camminata di 15 s anche di piu': si aspetta fino a 25
    for (let k = 0; k < 250; k++) {
      await wait(6000);
      const r = await authFetch(`/api/platform/video?job=${encodeURIComponent(job)}`).catch(() => null);
      const v = r ? await r.json().catch(() => ({})) : {};
      if (v.url) {
        patchV(id, { url: v.url });
        toBottom(); return;
      }
      if (v.error) { patchV(id, { err: fail }); return; }
    }
    patchV(id, { err: fail });
  };
  // dopo una ricarica della scheda: i video che stavano lavorando riprendono il controllo
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    for (const m of saved?.msgs ?? []) if (m.role === 'video' && m.job && !m.url && !m.err) void pollVideo(m.id, m.job);
    // pagina ricaricata a meta' (prima che il video partisse): niente lavoro da seguire, si ferma e si puo' riprovare
    for (const m of saved?.msgs ?? []) if (m.role === 'video' && !m.job && !m.url && !m.err && (m.step === 'render' || m.agent?.busy))
      patchV(m.id, { err: 'La pagina si è ricaricata prima che il video partisse, riprova.', agent: m.agent && { ...m.agent, busy: undefined } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (id: string, req: EditRequest, before: string) => {
    const res = await authFetch('/api/platform/photo-edit', { method: 'POST', headers: QUIET, body: JSON.stringify(req) }).catch(() => null);
    let d = res ? await res.json().catch(() => ({})) : {};
    if (d.error === 'no_credits') { patch(id, { busy: false, err: NO_CREDITS }); return; }
    if (d.error === 'daily_limit') { patch(id, { busy: false, err: 'Hai raggiunto il limite di modifiche di oggi, riprova domani.' }); return; }
    if (AI_MOCK && res?.status === 401) { await wait(4000); d = { url: before }; } // anteprima senza login
    if (!d.url) { patch(id, { busy: false, err: d.error === 'timeout' ? 'La GPU si sta avviando, riprova tra un minuto.' : 'Modifica non riuscita, riprova.' }); return; }
    patch(id, { busy: false, out: d.url, reveal: 'burst' });
    setBase(d.url); // la prossima richiesta continua da qui
    // stato della stanza dopo la modifica: subito una stima dalla richiesta, poi lo guarda il modello sul risultato
    setRoomState(req.style === 'empty' ? 'vuota' : req.style ? 'arredata' : null);
    authFetch('/api/platform/photo-classify', { method: 'POST', body: JSON.stringify({ imageUrl: d.url }) })
      .then(r => (r.ok ? r.json() : null)).then(c => { if (c?.state) setRoomState(c.state); }).catch(() => {});
    setTimeout(() => patch(id, { reveal: 'line' }), 600);
    setTimeout(() => patch(id, { reveal: 'slider' }), 1450);
    // foto pronta: si scorre in fondo per vederla tutta, compresa la riga sotto (arriva con lo slider)
    toBottom(); setTimeout(toBottom, 1500);
  };

  // Ricomincia da qui: i messaggi successivi restano (si puo' ripartire anche da li') ma sbiaditi,
  // e in fondo un divisore con la versione da cui si riparte
  const restartFrom = (i: number, url: string) => {
    setFaded(f => new Set([...f, ...msgs.slice(i + 1).map(x => x.id)]));
    // divisore e poi una copia del risultato come messaggio dell'AI: si riparte da li' come se fosse appena arrivato
    const src = msgs[i];
    setMsgs(ms => [...ms, { id: uid(), role: 'divider', image: url }, ...(src?.role === 'ai' ? [{ ...src, id: uid(), busy: false, reveal: 'slider' as const, err: undefined }] : [])]);
    setBase(url); clearZone(); setSelecting(false);
  };
  // Suggerimento nel campo: segue quello che sta succedendo (foto, stanza riconosciuta, lavoro in corso, esito)
  const lastAi = [...msgs].reverse().find((m): m is Extract<Msg, { role: 'ai' }> => m.role === 'ai');
  const done = msgs.filter(m => m.role === 'ai' && m.out && !m.busy).length;
  const hint = !base ? 'Prima carica una foto, poi scrivi qui cosa cambiare'
    : busy && lastAi ? BUSY_HINTS[[...lastAi.id].reduce((h, c) => h + c.charCodeAt(0), 0) % BUSY_HINTS.length]
    : lastAi?.err === NO_CREDITS ? 'Per continuare scegli un piano'
    : lastAi?.err ? 'Non è andata: riprova o chiedilo in un altro modo'
    : roomState === 'vuota' ? `La stanza è vuota: arredala? Es. ${(kind && FIRST[kind.replace(/^(room|scene):/, '')]) || 'arreda in stile moderno'}`
    : roomState === 'disordinata' ? 'Es. togli il disordine e gli oggetti personali, lascia i mobili'
    : roomState === 'datata' ? 'Es. rinnova pavimento, pareti e mobili in stile moderno'
    : done ? `Vuoi ritoccare qualcosa? Es. ${AFTER[(done - 1) % AFTER.length]}`
    : `Cosa vuoi cambiare? Es. ${(kind && FIRST[kind.replace(/^(room|scene):/, '')]) || 'togli il divano e metti un tavolo da pranzo'}`;
  // arrivo da un immobile (#/staging?photo=...&project=...): la foto entra subito in chat
  // ricarica della scheda: la foto dell'indirizzo e' gia' nella chat salvata, non si rimette. Se la chat salvata e' un'altra,
  // la foto dell'immobile apre una chat nuova (prima veniva ignorata e sembrava che il clic non facesse niente)
  const started = useRef(!!saved && !!initial?.photo && JSON.stringify(saved.msgs).includes(JSON.stringify(initial.photo)));
  useEffect(() => {
    if (started.current || !initial?.photo) return;
    started.current = true;
    if (msgs.length) window.dispatchEvent(new Event('agenteimmo:new-chat')); // chat vecchia aperta: si riparte da una nuova con questa foto
    // riconoscimento subito, in parallelo al download della foto (spesso e' gia' in memoria dell'immobile)
    const early = authFetch('/api/platform/photo-classify', { method: 'POST', body: JSON.stringify({ imageUrl: initial.photo, ...(initial.project ? { projectId: initial.project, photoUrl: initial.photo } : {}) }) }).catch(() => null);
    // la foto dell'immobile e' gia' online: entra subito in chat con il suo indirizzo, senza scaricarla e ridimensionarla
    const id = uid(), photo = initial.photo;
    queueMicrotask(() => {
      setProject(initial.project ?? null); setOrigin(photo); touch();
      setMsgs(ms => [...ms, { id, role: 'user', image: photo, seen: null }]);
      setKind(null); setRoomState(null); setEmptyFrom(null); setBase(photo);
      applySeen(id, early, photo);
    });
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeLibrary = useCallback(() => setLibrary(false), []);
  const closeSave = useCallback(() => setSaveOpen(null), []);
  const empty = msgs.length === 0;
  const picker = <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { upload(e.target.files); e.target.value = ''; }} />;
  // i suggerimenti partono subito, senza passare dal campo
  // modifiche scritte gia' fatte sulla foto di partenza (le prime 3 gratis per foto: lo conta il server, qui solo per le pill)
  const editsDone = msgs.filter(x => x.role === 'ai' && !!x.out && !!x.req && x.req.angle !== 'day' && creditsOf(x.req, 0) === CREDIT_COST.modifica && (x.req.reference ?? x.req.imageUrl ?? x.req.imageBase64) === sourcePhoto).length;
  // template non disponibile per questa foto. Cantiere e Volo nel cantiere nascono per foto della casa vista da fuori
  // (su una stanza lo scavo non torna); Prima e dopo e' per le stanze; Giorno e notte e Camminata vanno dentro e fuori.
  // Tipo di foto non ancora noto: tutto aperto.
  const templateOff = (id: string) => {
    const outside = id === 'cantiere' || id === 'volo-cantiere' || id === 'fpv'
    const both = id === 'giorno-notte' || id === 'camera' || id === 'daynight'
    return outside ? kind?.startsWith('room:') : !both && (kind === 'scene:esterno' || kind === 'scene:giardino')
  };
  // video anche da facciata e giardino (Cantiere, Giorno e notte, Camminata); non dalla planimetria
  const videoChip = base && scene !== 'planimetria' ? [
    <button key="video" disabled={busy} onClick={() => askVideo(base)}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-medium text-white shadow-sm ease-smooth transition-colors hover:bg-brand disabled:opacity-40"><Clapperboard size={13} /> Crea video</button>,
  ] : [];
  // interni: "Svuota la stanza" sempre primo, subito dopo Crea video (esterni e giardini hanno i loro "Rinnova")
  const sugs = suggestionsFor(kind);
  const typedDensity = textDensity ?? detectDensity(text) ?? 'normale';
  const typingFurnish = !!base && scene === 'interno' && !!text.trim() && furnishes({ prompt: text, scene });
  const densityPills = ([['poco', 'Essenziale'], ['normale', 'Normale'], ['ricco', 'Ricco']] as const).map(([d, l]) => (
    <button key={d} role="radio" aria-checked={typedDensity === d} onClick={() => setTextDensity(d)}
      className={`flex h-8 shrink-0 items-center rounded-full px-3.5 pb-px text-[13px] font-medium leading-none shadow-sm ease-smooth transition-colors ${typedDensity === d ? 'bg-ink text-white' : 'bg-white text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-canvas'}`}>{l}</button>
  ));
  const chips = [...videoChip, ...sugs.filter(x => roomState !== 'vuota' || (x.id !== 'empty' && x.id !== 'tidy')).map(x => (
    <button key={x.id} data-density-chip disabled={busy} onClick={e => {
      if (!furnishes(x.req) || scene !== 'interno') { void send(x.label, x); return; }
      const r = e.currentTarget.getBoundingClientRect();
      setDensityAsk(v => (v?.sug.id === x.id ? null : { sug: x, x: r.left + r.width / 2, y: r.top }));
    }}
      className={`group flex shrink-0 items-center whitespace-nowrap rounded-full bg-white py-1.5 ${creditsOf(x.req, editsDone) ? 'pl-3.5 pr-1.5' : 'px-3.5'} text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-brand hover:text-white disabled:opacity-40`}>{x.label}<Cr n={creditsOf(x.req, editsDone)} /></button>
  ))];

  // proporzioni vere delle foto: il risultato segue la foto (verticale resta verticale)
  const [ratios, setRatios] = useState<Record<string, number>>({});
  // si misura la foto di lavoro appena scelta: quando arriva il messaggio del risultato ha gia' la forma giusta (niente saltino)
  useEffect(() => {
    const srcs = [base, ...msgs.map(m => (m.role === 'ai' ? m.before : m.role === 'video' ? m.photo : null))].filter((x): x is string => !!x && !ratios[x]);
    for (const src of new Set(srcs)) {
      const img = new Image();
      img.onload = () => setRatios(r => ({ ...r, [src]: img.naturalWidth / img.naturalHeight }));
      img.src = src;
    }
  }, [base, msgs, ratios]);

  // selezione zona: prende il posto del messaggio che contiene la foto di lavoro, cosi' la card si trasforma sul posto
  // card del risultato stretta (foto verticale): i pulsanti diventano solo icone
  const isNarrow = (src: string) => (ratios[src] ?? 1.5) < 1;
  const zoneOwner = selecting && base ? msgs.findLastIndex(m => (m.role === 'ai' && m.out === base) || (m.role === 'user' && m.image === base)) : -1;
  const cancelZone = () => {
    setZoneClosing(true);
    setTimeout(() => { clearZone(); setSelecting(false); setZoneClosing(false); }, 300);
  };
  const zonePicker = (inline?: number) => selecting && base ? <ZonePicker example={(kind && ZONE_EX[kind.replace(/^(room|scene):/, '')]) || undefined} inline={inline} src={base} region={region} onChange={setRegion} onLoad={toBottom} busy={busy} onSubmit={t => send(t)} closing={zoneClosing} onCancel={inline ? cancelZone : () => { clearZone(); setSelecting(false); }} /> : null;

  return (
    // Tutta l'altezza disponibile: la conversazione scorre da sola, il campo e' sempre in fondo alla pagina
    <div className="relative -mx-6 h-full" onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}>
      <div ref={scroller} className="absolute inset-0 overflow-y-auto overflow-x-hidden px-6 pb-48 pt-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Vuota: un solo invito, grande e al centro, per caricare la foto */}
          {empty && (
            <div className="flex min-h-[calc(100vh-22rem)] flex-col items-center justify-center">
              <h1 className="text-center font-display text-4xl font-bold leading-[1.2] tracking-tight md:text-5xl md:leading-[1.2]">
                <span className="blur-in inline-block">Home staging</span>
                <span className="blur-in block text-muted/70" style={{ animationDelay: '.1s' }}>Carica una foto e chiedi.</span>
              </h1>
              <label className={`rise mt-10 flex w-full max-w-xl cursor-pointer flex-col items-center gap-4 rounded-[28px] border-2 border-dashed bg-white px-8 py-12 text-center ease-smooth transition-colors ${drag ? 'border-brand bg-brand/5' : 'border-line hover:border-brand/60'} ${CARD_SHADOW}`} style={{ animationDelay: '.2s' }}>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand"><ImagePlus size={30} /></span>
                <span className="text-lg font-semibold">Carica la foto della stanza</span>
                <span className="text-sm text-muted">Trascinala qui oppure clicca il pulsante. Va bene anche una facciata, un giardino o una planimetria: la riconosco da solo. Oppure un tuo video: parli, esci e la stanza si arreda.</span>
                {/* il campo file deve stare prima del pulsante vetrina: la label attiva il primo controllo che contiene, e un <button> lo e' */}
                {picker}
                <span className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <span className="flex h-11 items-center gap-2 rounded-full bg-canvas px-6 text-sm font-semibold text-ink ease-smooth transition-colors hover:bg-line"><Monitor size={16} /> Dal computer</span>
                  {/* dentro la label: senza preventDefault aprirebbe anche la scelta file */}
                  <button type="button" onClick={e => { e.preventDefault(); setLibrary(true); }} className="flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white ease-smooth transition-transform hover:scale-[1.03]"><LayoutGrid size={16} /> Dalla tua vetrina</button>
                </span>
              </label>
            </div>
          )}

          {/* Conversazione: le foto sono messaggi, quelle di AgenteImmo a sinistra e piu' piccole */}
          {msgs.map((m, i) => i === zoneOwner && m.role === 'user' ? (
            // il messaggio con la foto su cui si lavora diventa lui stesso la selezione della zona (niente messaggio nuovo)
            <div key={m.id} className="flex justify-start">{zonePicker()}</div>
          ) : m.role === 'divider' ? (
            <div key={m.id} className="blur-in flex items-center gap-3 py-2 text-xs font-medium text-muted">
              <span className="h-px flex-1 bg-line" />
              Ripreso da questa versione
              <span className="h-px flex-1 bg-line" />
            </div>
          ) : m.role === 'note' ? (
            <div key={m.id} className="blur-in flex justify-start"><p className="max-w-[85%] rounded-3xl rounded-bl-2xl bg-canvas px-4 py-3 text-sm">{m.text}</p></div>
          ) : m.role === 'video' ? (
            // video: tutta la larghezza, un solo contenitore che cambia contenuto a ogni scelta (le scelte fatte restano in alto)
            <div key={m.id} className="blur-in">
              {/* sfondo grigio da messaggio solo nel passo in cui si scrive; card, anteprime e video stanno sul foglio */}
              {/* AutoSize taglia cio' che esce: la sua area si allarga con margini negativi e lo stesso padding dentro,
                  cosi' l'ombra delle card in hover (fino a ~60 px sotto, ~30 ai lati) resta visibile e l'impaginazione non cambia */}
              <AutoSize className="-mx-8 -mb-16"><div className="px-8 pb-16">
              <div className={`rounded-[32px] ease-smooth transition-colors duration-[600ms] ${m.step === 'mode' ? 'bg-canvas' : 'bg-transparent'}`}>
                <div className="p-4 pb-6">
                  {/* passo nuovo: il vecchio sfuma, il contenitore cambia altezza (AutoSize), poi il nuovo appare */}
                  {/* scelte fatte: miniature sopra la domanda; restano ferme tra un passo e l'altro, entra solo l'ultima */}
                  {m.picks.length > 0 && m.step !== 'anim' && m.step !== 'render' && (
                    <div className="flex flex-wrap gap-2 px-2 pb-4">
                      {m.picks.map(p => {
                        const Icon = PICK_ICON[p.icon];
                        return (
                          <span key={p.label} className="blur-in flex items-center gap-2 rounded-2xl bg-white py-1.5 pl-1.5 pr-3 text-xs font-medium shadow-sm ring-1 ring-black/5">
                            {p.src
                              ? <img src={p.src} alt="" className="h-7 w-7 rounded-xl object-cover" />
                              : <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/10 text-brand"><Icon size={15} /></span>}
                            {p.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <StepSwap step={m.step}>
                  <div className="flex w-full items-center gap-1 px-2 pb-4 text-sm">
                    {/* indietro di un passo (non a video partito) */}
                    {m.step !== 'template' && m.step !== 'render' && m.step !== 'vchoice' && (
                      <button aria-label="Indietro" onClick={() => patchV(m.id, m.step === 'upload' ? { step: 'template', anim: undefined, picks: [], err: undefined } : m.step === 'exit' ? (m.agent?.up ? { step: 'vchoice', anim: undefined, picks: [], agent: { up: m.agent.up, video: m.agent.video, token: m.agent.token } } : { step: 'upload', agent: undefined, err: undefined }) : m.step === 'mode' && m.anim === 'walk' ? (m.agent?.up ? { step: 'vchoice', anim: undefined, picks: [], agent: { up: m.agent.up, video: m.agent.video, token: m.agent.token } } : { step: 'upload', agent: undefined, picks: m.picks.slice(0, 1) }) : m.step === 'mode' && m.anim === 'agent' ? { step: 'room' } : m.step === 'room' ? { step: 'exit', picks: m.picks.slice(0, 1) } : m.step === 'anim' ? { step: 'template', picks: [] } : m.step === 'mode' && (m.anim === 'cantiere' || m.anim === 'daynight' || m.anim === 'camera') ? { step: 'template', anim: undefined, picks: [] } : m.step === 'mode' ? { step: 'anim', anim: undefined, picks: m.picks.slice(0, 1) } : { step: 'mode', picks: m.picks.slice(0, m.anim === 'cantiere' || m.anim === 'daynight' ? 1 : 2), previews: undefined, frames: undefined, err: undefined })}
                        className="-ml-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-black/5 hover:text-ink"><ChevronLeft size={18} /></button>
                    )}
                    <span className="font-medium">{m.step === 'template' ? 'Che video vuoi creare?' : m.step === 'upload' ? 'Aspetto il tuo video' : m.step === 'vchoice' ? 'Che video facciamo?' : m.step === 'exit' ? (m.agent?.busy ?? 'Da qui la stanza si trasforma') : m.step === 'room' ? 'Che stanza è?' : m.step === 'anim' ? 'Con quale animazione?' : m.step === 'mode' ? ((emptyFrom && emptyFrom === m.photo) || m.anim === 'agent' || m.anim === 'walk' ? 'In che stile la arredo?' : 'Com’è ora o in un nuovo stile?') : m.step === 'previews' ? (m.previews?.some(p => !p) ? 'Preparo due proposte…' : 'Scegli quella per il video') : m.step === 'frames' ? (m.err ? '' : m.frames ? 'Ecco prima e dopo. Creo il video?' : 'Preparo prima e dopo…') : m.url ? 'Ecco il video' : m.err ? '' : (m.anim === 'popup' || m.anim === 'gravity') ? 'Creo il video, circa 2 minuti' : 'Creo il video, qualche minuto'}</span>
                    {/* annulla: via il messaggio del video (e il "Crea un video" prima), si torna alle foto; non a video mandato */}
                    {m.step !== 'render' && (
                      <button onClick={() => setMsgs(ms => { const k = ms.findIndex(x => x.id === m.id); return ms.filter((x, n) => n !== k && !(n === k - 1 && x.role === 'user' && x.text === 'Crea un video')); })}
                        className="ml-auto h-8 shrink-0 rounded-full px-3 text-[13px] font-medium text-muted ease-smooth transition-colors hover:bg-black/5 hover:text-ink">Annulla</button>
                    )}
                  </div>
                    {(m.step === 'template' || m.step === 'anim') && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {(m.step === 'template' ? VIDEO_TEMPLATES.filter(t => t.id !== 'agente') /* Con te in video: solo dopo aver mandato un video */ : VIDEO_TEMPLATES.find(t => t.label === m.picks[0]?.label)?.anims ?? []).slice().sort((a, b) => Number(!!templateOff(a.id)) - Number(!!templateOff(b.id))).map((t, k) => {
                          const off = templateOff(t.id) // i disponibili prima, i non disponibili in fondo
                          return (
                          <div key={t.id} className="rise" style={{ animationDelay: `${0.05 + k * 0.06}s` }}>
                            <button disabled={!!off} onClick={() => { const one = m.step === 'template' ? (t as (typeof VIDEO_TEMPLATES)[number]).anims : null; if (short(m, Math.min(...(one ?? [t as { id: VideoAnim }]).map(a => fullCr(a.id))))) return; const solo = one?.length === 1 ? one[0].id : m.step === 'anim' ? t.id as VideoAnim : undefined; if (solo && directVideo(solo) && (kind === 'scene:esterno' || kind === 'scene:giardino')) { patchV(m.id, { anim: solo }); void makeVideo({ ...m, anim: solo, picks: m.step === 'anim' ? [...m.picks, { label: t.label, icon: ANIM_ICON[solo] }] : [{ label: t.label, icon: ANIM_ICON[solo] }] }, m.photo, '', m.photo); return; } /* facciate e giardini: c'e' solo "Com'e' ora", niente passo dello stile */ const prev = one?.length === 1 && one[0].id === 'agent' ? [...msgs].reverse().find((x): x is VideoMsg => x.role === 'video' && !!x.agent?.up && x.agent.at !== undefined && x.agent.exit !== false)?.agent : undefined; patchV(m.id, { err: undefined, ...(prev ? { step: 'exit', anim: 'agent', photo: prev.room ?? m.photo, agent: { ...prev, busy: undefined, styled: undefined }, picks: [{ label: t.label, icon: 'agent' }] } : one?.length === 1 && (one[0].id === 'agent' || one[0].id === 'walk') ? { step: 'upload', anim: one[0].id, picks: [{ label: t.label, icon: ANIM_ICON[one[0].id] }] } : one?.length === 1 ? { step: 'mode', anim: one[0].id, picks: [{ label: t.label, icon: ANIM_ICON[one[0].id] }] } : m.step === 'template' ? { step: 'anim', picks: [{ label: t.label, icon: 'split' }] } : { step: 'mode', anim: t.id as VideoAnim, picks: [...m.picks, { label: t.label, icon: ANIM_ICON[t.id as VideoAnim] }] }) }); }}
                              onMouseMove={tiltMove} onMouseLeave={e => tiltReset(e.currentTarget)} className="tilt group relative flex w-full flex-col overflow-hidden rounded-[28px] bg-white p-2 text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/5 hover:shadow-[0_2px_4px_rgba(0,0,0,.04),0_30px_50px_-20px_rgba(0,0,0,.25)] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 disabled:grayscale">
                              <span className="sheen pointer-events-none absolute inset-0 z-20" />
                              <video src={t.sample} autoPlay loop muted playsInline className={`aspect-video w-full rounded-[20px] object-cover ${t.sample === VIDEO_SAMPLES.popup ? 'object-bottom' : ''}`} />
                              <span className="absolute right-4 top-4 z-30 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm inline-flex items-center gap-1">{/* prezzo intero del video: Prima e dopo 100 (1 alle foto + 99 al video) */}{m.step === 'template' ? Math.min(...(t as (typeof VIDEO_TEMPLATES)[number]).anims.map(a => fullCr(a.id))) : fullCr(t.id as VideoAnim)}<Coins size={12} className="shrink-0" aria-label="crediti" /></span>
                              <span className="block px-3 pt-3 font-semibold">{t.label}</span>
                              <span className="block px-3 pb-3 text-xs text-muted">{t.desc}</span>
                              {off && <span className="absolute left-4 top-4 z-30 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink shadow-sm">{t.id === 'cantiere' || t.id === 'volo-cantiere' || t.id === 'fpv' ? 'Solo foto esterne' : 'Solo stanze'}</span>}
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                    {m.step === 'upload' && (
                      // messaggio: come girare il video, poi lo si manda in chat come una foto (trascinato o con il pulsante)
                      <div className="px-1">
                        <div className="max-w-xl rounded-3xl rounded-bl-2xl bg-canvas px-4 py-3 text-sm leading-relaxed">
                          <p>{m.agent?.busy ?? 'Mandami un tuo video, qui in chat come una foto. Giralo così:'}</p>
                          {!m.agent?.busy && (m.anim === 'walk'
                            ? <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
                                <li><b className="font-semibold text-ink">Telefono in mano</b>, in verticale, senza inquadrarti</li>
                                <li><b className="font-semibold text-ink">Cammina piano</b> nella stanza o gira lentamente su te stesso</li>
                                <li><b className="font-semibold text-ink">Da 5 a 15 secondi</b>: oltre i 15 si usa solo l’inizio</li>
                              </ol>
                            : <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
                                <li><b className="font-semibold text-ink">Telefono fermo</b>, appoggiato o su un cavalletto, con la stanza intera</li>
                                <li><b className="font-semibold text-ink">Parla in camera</b>, anche pochi secondi</li>
                                <li><b className="font-semibold text-ink">Esci dall’inquadratura</b> e lascia la stanza sola 2-3 secondi: da lì si arreda</li>
                              </ol>)}
                        </div>
                        {m.err && <ErrLine err={m.err} className="pt-3" />}
                      </div>
                    )}
                    {m.step === 'vchoice' && (
                      // video appena mandato: quale template video (il caricamento continua in sottofondo)
                      <div className="grid gap-3 px-1 sm:grid-cols-2">
                        {VIDEO_TEMPLATES.filter(t => t.anims[0].id === 'agent' || t.anims[0].id === 'walk').map((t, k) => (
                          <div key={t.id} className="rise" style={{ animationDelay: `${0.05 + k * 0.06}s` }}>
                            <button onClick={() => { if (!short(m, fullCr(t.anims[0].id))) void agentContinue({ ...m, err: undefined }, t.anims[0].id); }} onMouseMove={tiltMove} onMouseLeave={e => tiltReset(e.currentTarget)}
                              className="tilt group relative flex w-full flex-col overflow-hidden rounded-[28px] bg-white p-2 text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/5 hover:shadow-[0_2px_4px_rgba(0,0,0,.04),0_30px_50px_-20px_rgba(0,0,0,.25)] active:scale-[0.985]">
                              <span className="sheen pointer-events-none absolute inset-0 z-20" />
                              <video src={t.sample} autoPlay loop muted playsInline className={`aspect-video w-full rounded-[20px] object-cover ${t.sample === VIDEO_SAMPLES.popup ? 'object-bottom' : ''}`} />
                              <span className="absolute right-4 top-4 z-30 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm inline-flex items-center gap-1">{videoCr(t.anims[0].id)}<Coins size={12} className="shrink-0" aria-label="crediti" /></span>
                              <span className="block px-3 pt-3 font-semibold">{t.label}</span>
                              <span className="block px-3 pb-3 text-xs text-muted">{t.desc}</span>
                            </button>
                          </div>
                        ))}
                        {m.err && <ErrLine err={m.err} className="pt-1 sm:col-span-2" />}
                      </div>
                    )}
                    {m.step === 'exit' && (() => {
                      // come la scelta della copertina sul telefono: striscia di fotogrammi con una "lente" sul momento scelto,
                      // la parte prima scurita (li' c'e' l'agente), sotto - tempo + e il pulsante; a destra l'anteprima grande
                      const a = m.agent, raw = a?.video ? thumbs[a.video] ?? [] : [], dead = raw[0] === 'dead', list = dead ? [] : raw, dur = a?.duration ?? 10, at = a?.at ?? 0;
                      const pos = Math.min(100, Math.max(0, (at / dur) * 100));
                      const step = (d: number) => patchV(m.id, { agent: { ...a, at: Math.min(dur, Math.max(0, Math.round((at + d) * 100) / 100)) } });
                      // passo a parte mentre si cerca l'uscita: solo cosa sta succedendo (poi la scelta del momento)
                      if (a?.busy && a.at === undefined) return (
                        <div className="mx-auto max-w-2xl px-1">
                          <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] bg-white px-6 py-10 text-center shadow-sm ring-1 ring-black/5">
                            <Loader2 size={24} className="animate-spin text-brand" />
                            <p className="text-[15px] font-semibold">Sto riconoscendo il momento in cui esci dall’inquadratura</p>
                            <p className="text-xs text-muted">Ci vogliono pochi secondi, poi potrai correggerlo</p>
                          </div>
                        </div>
                      );
                      return (
                        // anteprima sempre sopra in un riquadro 16:9 (il verticale intero, con lo sfondo sfocato), sotto la card
                        <div className="mx-auto grid max-w-2xl gap-4 px-1">
                          {m.step === 'exit' && a?.exit === false && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Non ti vedo uscire dall’inquadratura in questo video: la stanza si arreda solo dopo che esci. Puoi usare una foto del video (freccia indietro) o mandarne un altro.</p>}
                          {dead && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Il video non è più disponibile (la pagina è stata ricaricata mentre si caricava): premi Nuova chat e rimandalo.</p>}
                          <div className="min-w-0 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-black/5">
                            <div className="relative h-20 select-none">
                              <div className="absolute inset-0 flex overflow-hidden rounded-2xl bg-canvas">
                                {list.map((src, i) => <img key={i} src={src} alt="" draggable={false} className="h-full min-w-0 flex-1 object-cover" />)}
                              </div>
                              <div className="pointer-events-none absolute inset-y-0 left-0 rounded-l-2xl bg-white/50" style={{ width: `${pos}%` }} />
                              {/* linea della timeline: si trascina sulla striscia, con la maniglia in alto e in basso */}
                              <div className="pointer-events-none absolute -inset-y-1.5 -translate-x-1/2" style={{ left: `${pos}%` }}>
                                <div className="mx-auto h-full w-[3px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,.2),0_2px_8px_rgba(0,0,0,.35)]" />
                                <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,.2)]" />
                                <div className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,.2)]" />
                              </div>
                              {a?.at !== undefined && <input type="range" min={0} max={dur} step={1 / 30} value={at} aria-label="Momento in cui esci"
                                onChange={e => patchV(m.id, { agent: { ...a, at: Number(e.target.value) } })} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />}
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex items-center rounded-full bg-canvas p-1">
                                <button type="button" aria-label="Fotogramma prima" onClick={() => step(-1 / 30)} className="flex h-8 w-8 items-center justify-center rounded-full ease-smooth transition-colors hover:bg-white"><Minus size={14} /></button>
                                <span className="flex h-8 min-w-16 items-center justify-center px-1 pb-px text-sm font-semibold leading-none tabular-nums">{at.toFixed(2).replace('.', ',')} s</span>
                                <button type="button" aria-label="Fotogramma dopo" onClick={() => step(1 / 30)} className="flex h-8 w-8 items-center justify-center rounded-full ease-smooth transition-colors hover:bg-white"><Plus size={14} /></button>
                              </div>
                              <span className="hidden min-w-0 flex-1 truncate text-xs text-muted sm:block">Da qui la stanza si trasforma: non devi più vederti</span>
                              <button disabled={!!a?.busy || a?.at === undefined || (m.step === 'exit' && a?.exit === false)} onClick={async () => { if (await agentRoom(m)) patchV(m.id, { step: 'room' }); }}
                                className="ml-auto flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-5 text-[13px] font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40">{a?.busy && <Loader2 size={14} className="animate-spin" />}Avanti</button>
                            </div>
                            {m.step === 'exit' && a?.steady === false && <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Il telefono si muove nel video: la trasformazione può venire male.</p>}
                          </div>
                          <div className="relative -order-1 aspect-video w-full overflow-hidden rounded-3xl bg-ink shadow-sm ring-1 ring-black/5">
                            {list.length > 0 && <img src={list[Math.min(list.length - 1, Math.floor((pos / 100) * list.length))]} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />}
                            {a?.video && <video key={a.video} src={a.video} muted playsInline preload="auto" crossOrigin={a.video.startsWith('blob:') ? undefined : 'anonymous'} className="absolute inset-0 h-full w-full object-contain"
                              ref={el => { if (el && Math.abs(el.currentTime - at) > 0.02) el.currentTime = at; }} />}
                            {(!a?.video || a.busy) && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><Loader2 className="animate-spin text-white" /></div>}
                          </div>
                        </div>
                      );
                    })()}
                    {m.step === 'room' && (
                      // video con l'agente dentro: la stanza la sceglie lui (il fotogramma vuoto puo' ingannare il modello)
                      <div className="flex flex-wrap gap-2 px-1">
                        {AGENT_ROOMS.map(([r, label], k) => (
                          <button key={r} onClick={() => patchV(m.id, { step: 'mode', agent: { ...m.agent, kind: `room:${r}` } })}
                            className="rise rounded-full bg-white px-4 py-2 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-ink hover:text-white" style={{ animationDelay: `${0.03 + k * 0.03}s` }}>{label}</button>
                        ))}
                        {roomOther?.id === m.id ? (
                          // "Altro": la pill diventa il campo e si allunga col testo; Invio conferma, Esc annulla
                          <input autoFocus value={roomOther.v} placeholder="es. mansarda" maxLength={40} size={Math.max(24, roomOther.v.length + 2)}
                            onChange={e => setRoomOther({ id: m.id, v: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Escape') setRoomOther(null);
                              if (e.key !== 'Enter' || !roomOther.v.trim()) return;
                              patchV(m.id, { step: 'mode', agent: { ...m.agent, kind: `custom:${roomOther.v.trim()}` } }); setRoomOther(null);
                            }}
                            onBlur={() => { if (!roomOther.v.trim()) setRoomOther(null); }}
                            className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-ink shadow-sm outline-none ring-2 ring-inset ring-brand/50 placeholder:text-muted/60" />
                        ) : (
                          <button onClick={() => setRoomOther({ id: m.id, v: '' })}
                            className="rise rounded-full bg-white px-4 py-2 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-ink hover:text-white" style={{ animationDelay: `${0.03 + AGENT_ROOMS.length * 0.03}s` }}>Altro</button>
                        )}
                      </div>
                    )}
                    {m.step === 'mode' && (
                        // scelta dello stile come le card dei modelli: foto vera per "Com'è ora", un soggiorno d'esempio per ogni stile
                        <div className="px-1">
                          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${m.anim === 'agent' || m.anim === 'walk' || (emptyFrom && emptyFrom === m.photo) ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
                            {[...(!(emptyFrom && emptyFrom === m.photo) && m.anim !== 'agent' && m.anim !== 'walk' ? [{ id: 'keep', label: 'Com’è ora', src: m.photo }] : []), ...(!m.agent && (kind === 'scene:esterno' || kind === 'scene:giardino') ? [] : VIDEO_STYLES.map(x => ({ ...x, src: styleThumb(x.id, m.agent ? m.agent.kind : kind) })))].map((o, k) => (
                              <button key={o.id} onClick={() => { if (short(m, fullCr(m.anim) + (o.id === 'keep' ? 0 : CREDIT_COST.arreda))) return; if (o.id === 'keep') void makeVideo(m, m.photo, 'Stanza com’è'); else void styleVideo(m, o.label, { style: o.id }); }} className="rise group relative flex flex-col overflow-hidden rounded-3xl bg-white p-1.5 text-left shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ring-1 ring-black/5 ease-smooth transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,.04),0_24px_40px_-18px_rgba(0,0,0,.25)] active:scale-[0.985]" style={{ animationDelay: `${0.04 + k * 0.05}s` }}>
                                <span className="block aspect-[4/3] overflow-hidden rounded-[18px] bg-canvas"><img src={o.src} alt="" className="h-full w-full object-cover ease-smooth transition-transform duration-500 group-hover:scale-[1.04]" /></span>
                                <span className="flex items-center justify-between gap-2 px-2 pb-1 pt-2.5 text-[13px] font-semibold">{o.label}<Cr n={(o.id === 'keep' ? 0 : CREDIT_COST.arreda) + (directVideo(m.anim) || m.anim === 'agent' || m.anim === 'walk' ? videoCr(m.anim) : CREDIT_COST.video_prep)} tight still /></span>
                              </button>
                            ))}
                          </div>
                          <form className={`mt-3 flex h-12 items-center gap-2 rounded-full bg-white pl-5 pr-1.5 ring-1 ring-inset ring-black/10 focus-within:ring-brand`}
                            onSubmit={e => { e.preventDefault(); const v = (new FormData(e.currentTarget).get('stile') as string ?? '').trim(); if (v) styleVideo(m, v, { prompt: `Arreda la stanza in stile ${v}` }); }}>
                            <Palette size={16} className="shrink-0 text-muted" />
                            <input name="stile" placeholder="Un altro stile, es. classico con legno scuro" maxLength={200} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
                            <button aria-label="Usa questo stile" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white ease-smooth transition-colors hover:bg-brand/90"><ArrowUp size={16} /></button>
                          </form>
                        </div>
                    )}
                    {m.step === 'frames' && (
                      <div className="mx-auto" style={{ maxWidth: (ratios[m.photo] ?? 1.5) >= 1 ? 720 : 480 }}>
                        <div className="grid grid-cols-2 gap-2">
                          {(['before', 'after'] as const).map(k => (
                            <div key={k} className="relative overflow-hidden rounded-[20px] bg-white" style={{ aspectRatio: (ratios[m.photo] ?? 1.5) >= 1 ? 16 / 9 : 9 / 16 }}>
                              {m.frames
                                ? <img src={m.frames[k]} alt="" className="blur-in absolute inset-0 h-full w-full object-cover" />
                                : <>
                                  {/* in attesa: il Dopo e' gia' la foto (nitida se la stanza resta com'e', sfocata finche' non c'e' quella nello stile), il Prima si prepara */}
                                  {/* Con te in video: il Prima e' gia' la stanza del video, nitida; si prepara solo il Dopo */}
                                  <img src={m.photo} alt="" className={`absolute inset-0 h-full w-full object-cover ${m.err ? 'opacity-40' : (k === 'after' && !m.picks.some(p => p.icon === 'style')) || (k === 'before' && m.anim === 'agent') ? '' : 'scale-105 blur-md'}`} />
                                  {!m.err && ((k === 'before' && m.anim !== 'agent') || (k === 'after' && m.picks.some(p => p.icon === 'style'))) && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><Loader2 size={22} className="animate-spin" /></div>}
                                </>}
                              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">{k === 'before' ? 'Prima' : 'Dopo'}</span>
                            </div>
                          ))}
                        </div>
                        {m.err && <ErrLine err={m.err} className="pt-3" />}
                        {/* approvazione: Veo (la parte cara) parte solo da qui; la stanza vuota si puo' rifare (costa come una foto) */}
                        {m.frames && (
                          <div className="flex flex-wrap items-center gap-2 pt-3">
                            <button onClick={() => { if (!short(m, videoCr(m.anim))) void renderVideo(m); }} className="flex items-center rounded-full bg-ink pl-4 pr-2 py-2 text-[13px] font-medium text-white shadow-sm ease-smooth transition-colors hover:bg-brand">Crea il video<Cr n={videoCr(m.anim)} dark /></button>
                            {/* una sola seconda possibilita' sullo stile (poi si torna indietro): costa come una foto */}
                            {m.restyle && !m.redone && <button onClick={() => { if (!short(m, CREDIT_COST.arreda + CREDIT_COST.video_prep + videoCr(m.anim))) void styleVideo(m, m.restyle!.label, m.restyle!.req, true); }} className="flex items-center rounded-full bg-white py-2 pl-4 pr-2 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 ease-smooth transition-colors hover:bg-canvas">Rifai lo stile<Cr n={CREDIT_COST.arreda + CREDIT_COST.video_prep} /></button>}
                          </div>
                        )}
                        {m.err && !m.frames && (
                          <div className="pt-3"><button onClick={() => patchV(m.id, { step: 'mode', picks: m.picks.slice(0, 2), err: undefined })} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 hover:bg-canvas">Riprova</button></div>
                        )}
                      </div>
                    )}
                    {m.step === 'render' && (
                      // sempre un riquadro 16:9 a tutta larghezza, come un video orizzontale: il verticale sta intero al centro, ai lati la sua foto sfocata
                      <div className="w-full">
                        <div className="relative aspect-video overflow-hidden rounded-[20px] bg-ink">
                          {(ratios[m.photo] ?? 1.5) < 1 && <img src={m.photo} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />}
                          {m.url
                            ? <video src={m.url} autoPlay loop muted playsInline controls className="blur-in absolute inset-0 h-full w-full object-contain" />
                            : <>
                              <img src={m.photo} alt="" className={`absolute inset-0 h-full w-full scale-105 ${(ratios[m.photo] ?? 1.5) < 1 ? 'object-contain' : 'object-cover'} ${m.err ? 'opacity-40' : 'blur-md'}`} />
                              {!m.err && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 text-white">
                                  <Loader2 size={22} className="animate-spin" />
                                  {/* tempo passato e quanto ci vuole di solito (Kling molto piu' lento di Veo) */}
                                  <span className="text-xs font-medium text-white/85"><Elapsed className="text-white" /> · di solito {waitFor(m.anim)}</span>
                                </div>
                              )}
                            </>}
                        </div>
                        {m.err && <div className="flex flex-wrap items-center gap-3 pt-3"><ErrLine err={m.err} />{/* foto nello stile gia' fatta (e pagata): Riprova rilancia solo il video */}<button onClick={() => { const st = m.anim === 'walk' || m.anim === 'agent' ? m.agent?.styled : undefined; if (st) { if (!short(m, videoCr(m.anim))) void makeVideo(m, m.photo, '', st); } else patchV(m.id, { step: 'mode', err: undefined, frames: undefined, job: undefined, picks: m.picks.filter(p => p.icon !== 'style') }); }} className="rounded-full bg-white px-4 py-2 text-[13px] font-medium text-ink/80 shadow-sm ring-1 ring-inset ring-black/10 hover:bg-canvas">Riprova</button></div>}
                        {/* scelte fatte sotto il video, Scarica a destra: si attiva quando il video e' pronto */}
                        <div className="flex items-center gap-2 pt-3">
                          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                            {m.picks.map(p => {
                              const Icon = PICK_ICON[p.icon];
                              return (
                                <span key={p.label} className="flex items-center gap-2 rounded-2xl bg-white py-1.5 pl-1.5 pr-3 text-xs font-medium shadow-sm ring-1 ring-black/5">
                                  {p.src ? <img src={p.src} alt="" className="h-7 w-7 rounded-xl object-cover" /> : <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/10 text-brand"><Icon size={15} /></span>}
                                  {p.label}
                                </span>
                              );
                            })}
                          </div>
                          <a href={m.url || undefined} download target="_blank" rel="noopener noreferrer" aria-disabled={!m.url}
                            className={`flex shrink-0 items-center gap-2 rounded-2xl bg-white py-1.5 pl-1.5 pr-3 text-xs font-medium text-ink shadow-sm ring-1 ring-black/5 ease-smooth transition-opacity hover:bg-canvas ${m.url ? '' : 'pointer-events-none opacity-40'}`}><span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/10 text-brand"><Download size={15} /></span> Scarica</a>
                        </div>
                      </div>
                    )}
                  </StepSwap>
                </div>
              </div>
              </div></AutoSize>
            </div>
          ) : m.role === 'user' ? (
            <div key={m.id} className={`blur-in ease-smooth transition-opacity ${faded.has(m.id) ? 'opacity-35 hover:opacity-80' : ''}`}>
              <div className="flex justify-end">
                {m.video
                  ? <video src={m.video} autoPlay muted loop playsInline className={`max-h-56 max-w-[60%] rounded-3xl object-cover ${CARD_SHADOW}`} />
                  : m.image
                  ? <button type="button" onClick={() => setViewer({ src: m.image! })} className="max-w-[60%] cursor-zoom-in"><img src={m.image} alt="Foto caricata" data-base-photo={base === m.image ? '' : undefined} className={`max-h-56 rounded-3xl object-cover ${CARD_SHADOW} ease-smooth transition-transform hover:scale-[1.01]`} /></button>
                  : m.style
                    // stile da una foto: la foto di riferimento a tutta larghezza (raggio 18 = 24 - 6 di margine), sotto cosa si fa; il credito Unsplash (obbligatorio) sta nel tooltip della foto
                    ? <div className="w-64 max-w-[75%] rounded-3xl rounded-br-2xl bg-ink p-1.5 text-sm text-white">
                        <img src={m.style.src} alt="Foto di stile" title={m.style.author ? `Foto di ${m.style.author} su Unsplash` : undefined} className="block aspect-[4/3] w-full rounded-[18px] object-cover" />
                        <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-2.5"><Palette size={15} className="shrink-0 opacity-70" /><span className="min-w-0 flex-1">{m.text}</span></div>
                      </div>
                  : <div className="max-w-[75%] rounded-3xl rounded-br-2xl bg-ink px-4 py-2.5 text-sm text-white">{m.region && <span className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px]"><SquareDashedMousePointer size={11} /> zona</span>}{m.text}</div>}
              </div>
              {m.image && i === msgs.length - 1 && !busy && (
                <div className="blur-in mt-6 w-fit max-w-[85%] rounded-3xl rounded-bl-2xl bg-canvas px-4 py-3 text-sm" style={{ animationDelay: '.3s' }}>
                  {/* quando riconosce la foto il messaggio si riscrive parola per parola (key = cosa ha visto) */}
                  <AutoSize><LightSwap swapKey={m.seen ?? 'caricata'}>
                    <p>{m.seen === 'unknown' ? <>Non riesco a capire che stanza è:{' '}
                      {otherFor === m.id ? otherInput(m.id) : <Dropdown value="" options={SEEN_OPTIONS} className="font-bold text-brand" onChange={v => {
                        if (v === 'other') { setOtherFor(m.id); return; }
                        setMsgs(ms => ms.map(x => (x.id === m.id && x.role === 'user' ? { ...x, seen: v } : x)));
                        setScene(v.startsWith('scene:') ? (v.slice(6) as Scene) : 'interno'); setKind(v);
                      }}>sceglila tu</Dropdown>}, così la arredo giusta.</> : m.seen ? <>Sembra{' '}
                      {otherFor === m.id ? (
                        // "Altro": campo al posto della voce, Invio conferma, Esc annulla
                        otherInput(m.id)
                      ) : (
                      <Dropdown value={m.seen} options={SEEN_OPTIONS} className="font-bold" onChange={v => {
                        if (v === 'other') { setOtherFor(m.id); return; }
                        setMsgs(ms => ms.map(x => (x.id === m.id && x.role === 'user' ? { ...x, seen: v } : x)));
                        setScene(v.startsWith('scene:') ? (v.slice(6) as Scene) : 'interno'); setKind(v);
                      }}>{seenLabel(m.seen)}</Dropdown>
                      )}. </> : 'Foto caricata. '}{m.seen === 'unknown' ? '' : 'Cosa vuoi cambiare?'}</p>
                  </LightSwap></AutoSize>
                </div>
              )}
            </div>
          ) : (
            <div key={m.id} className={`blur-in flex justify-start ease-smooth transition-opacity ${faded.has(m.id) ? 'opacity-35 hover:opacity-80' : ''}`}>
              <div className={`w-full rounded-3xl bg-white p-2 ${CARD_SHADOW}`} style={{ maxWidth: `min(560px, calc(60vh * ${ratios[m.before] ?? 1.5} + 16px))` }}><AutoSize>
                {/* Modifica: la foto resta dov'e' e diventa selezionabile, sotto cambiano solo i pulsanti */}
                {/* card con foto: angoli tutti uguali (24), foto 16 = 24 - padding 8; la coda resta solo sui fumetti di testo */}
                {/* clic sulla foto = a tutto schermo con prima/dopo (non se trascini il cursore prima/dopo o premi Scarica) */}
                <div className={`relative ${m.out && !m.busy ? 'cursor-zoom-in' : ''}`} style={{ aspectRatio: ratios[m.before] ?? 1.5 }} data-base-photo={m.out && m.out === base ? '' : undefined}
                  onPointerDown={e => { downAt.current = { x: e.clientX, y: e.clientY }; }}
                  onClick={e => {
                    const d = downAt.current;
                    if (!m.out || m.busy || (e.target as HTMLElement).closest('button, a')) return;
                    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
                    setViewer({ src: m.out, before: m.before });
                  }}><AiPhotoStage parked={i === zoneOwner && !zoneClosing} onUnpark={cancelZone} src={m.before} busy={m.busy} out={m.out} reveal={m.reveal} msg={tick % 5} fileName="home-staging.jpg" className="h-full" onSave={() => setSaveOpen(v => (v === m.id ? null : m.id))} saveActive={saveOpen === m.id} />
                </div>
                {/* Modifica: la foto sotto resta montata e ferma, la selezione ci si appoggia sopra; sotto cambiano solo i controlli */}
                {i === zoneOwner ? zonePicker(ratios[m.before] ?? 1.5) : <>
                {m.err && <ErrLine err={m.err} className="pt-2" />}
                {m.out && !m.busy && (
                  <div className={`blur-in flex min-h-12 items-center gap-3 px-2 pt-2 text-xs text-muted ${isNarrow(m.before) ? 'justify-center' : 'justify-end'}`}>
                    {/* alta quanto il campo di Modifica (8 + 40): aprendo e chiudendo la card non cambia altezza.
                        Niente didascalia: la richiesta e' gia' nel messaggio sopra. Foto verticale (card stretta): icona sopra e nome sotto */}
                                        {/* a destra: Modifica (zona su questa foto) e Ricomincia da qui; "Si continua da qui" solo dopo esserci tornati */}
                    <div className={`flex w-full items-center gap-1 ${isNarrow(m.before) ? '' : 'justify-start'}`}>
                      <Act narrow={isNarrow(m.before)} icon={<SquareDashedMousePointer size={14} className="translate-y-px" />} label="Modifica" onClick={() => { if (base !== m.out) restartFrom(i, m.out!); setSelecting(true); }} />
                      {!isNarrow(m.before) && <span className="mx-1 h-4 w-px bg-line" aria-hidden />}
                      {/* dalla planimetria nessun video (nessun modello adatto) */}
                      {!m.req?.planimetria && <Act narrow={isNarrow(m.before)} icon={<Clapperboard size={14} className="translate-y-px" />} label="Crea video" tip="I mobili compaiono uno alla volta" disabled={busy} onClick={() => askVideo(m.out!)} />}
                      {m.req && !isNarrow(m.before) && <span className="mx-1 h-4 w-px bg-line" aria-hidden />}
                      {m.req && <Act narrow={isNarrow(m.before)} icon={<Shuffle size={14} className="translate-y-px" />} label="Rifai" tip="Stesso stile, un'altra versione" disabled={busy} onClick={() => variant(m)} cr={creditsOf(m.req, editsDone)} />}
                      {base !== m.out && (
                        <>
                          <span className="ml-auto mr-1 h-4 w-px bg-line" aria-hidden />
                          <Tooltip label="Ricomincia da qui">
                            <button onClick={() => restartFrom(i, m.out!)} aria-label="Ricomincia da qui" className="flex h-8 w-8 items-center justify-center rounded-full text-brand hover:bg-brand/5"><RotateCcw size={15} /></button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {m.out && !m.busy && saveOpen === m.id && (
                  <SaveToProperty key={m.id} before={m.before} after={m.out} projectId={project} origin={origin} onClose={closeSave} />
                )}
                </>}
              </AutoSize></div>
            </div>
          ))}
          {/* Selezione di una zona: e' un messaggio della chat come gli altri, con i pulsanti sotto la foto */}
          {zoneOwner < 0 && zonePicker()}

        </div>
      </div>

      {library && <LibraryPicker onFiles={upload} onClose={closeLibrary} />}
      {viewer && <PhotoViewer src={viewer.src} before={viewer.before} onClose={() => setViewer(null)} />}
      {/* Sfumatura progressiva in alto e in basso: la conversazione scorre sotto */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6"><ProgressiveBlur side="top" fade={24} /></div>

      {/* Campo della chat: sempre in fondo alla pagina, sopra la conversazione */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-5 pt-10">
        <div className="pointer-events-none absolute inset-0"><ProgressiveBlur side="bottom" fade={24} /></div>
        <div className="relative mx-auto max-w-3xl">
          {/* Suggerimenti: una riga sola sopra il campo, scorre di lato; toccati partono subito */}
          {densityAsk && !busy && createPortal(
            <div data-density-pop className="blur-in fixed z-[250] -translate-x-1/2 -translate-y-full pb-2" style={{ left: densityAsk.x, top: densityAsk.y }}>
              <div className={`rounded-3xl bg-white p-1.5 ${CARD_SHADOW}`}>
                <div className="px-2 pb-1.5 pt-1 text-xs font-medium text-muted">Quanto arredo?</div>
                <div className="flex gap-1" role="radiogroup" aria-label="Quantità di arredo">
                  {([['poco', 'Essenziale'], ['normale', 'Normale'], ['ricco', 'Ricco']] as const).map(([d, l]) => (
                    <button key={d} role="radio" aria-checked={density === d} onClick={() => { const sg = densityAsk.sug; setDensity(d); setDensityAsk(null); void send(sg.label, sg); }}
                      className={`flex h-8 min-w-[84px] items-center justify-center rounded-full px-3 pb-px text-[13px] font-medium leading-none ease-smooth transition-colors ${density === d ? 'bg-ink text-white hover:bg-brand' : 'bg-canvas text-ink/80 hover:bg-brand hover:text-white'}`}>{l}</button>
                  ))}
                </div>
              </div>
            </div>, document.body)}
          {/* dopo un video niente pill: non si capirebbe che valgono per la foto sopra */}
          {/* foto appena caricata, non ancora riconosciuta: pill finte al posto dei suggerimenti (Crea video su una planimetria arrivava prima di sapere che non si puo') */}
          {base && !busy && msgs[msgs.length - 1]?.role !== 'video' && [...msgs].reverse().find((x): x is Extract<Msg, { role: 'user' }> => x.role === 'user' && !!x.image)?.seen === null && (
            <div className="-mx-1 mb-2 flex gap-1.5 overflow-hidden px-1 pb-1">
              {[104, 88, 120, 96].map((w, k) => <span key={k} className="h-8 shrink-0 animate-pulse rounded-full bg-black/[.06]" style={{ width: w }} />)}
            </div>
          )}
          {base && !busy && msgs[msgs.length - 1]?.role !== 'video' && [...msgs].reverse().find((x): x is Extract<Msg, { role: 'user' }> => x.role === 'user' && !!x.image)?.seen !== null && (
            <div className="blur-in -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ maskImage: 'linear-gradient(90deg, #000 90%, transparent)' }}>{typingFurnish ? <><span className="self-center pl-1 pr-1 text-xs text-muted">Quanto arredo?</span><span role="radiogroup" aria-label="Quantità di arredo" className="flex gap-1.5">{densityPills}</span></> : chips}</div>
          )}
          <input ref={styleInput} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void send('Arreda nello stile della foto', null, { src: await fileToResizedDataUrl(f, 1024) }); }} />
          {inspo && <Inspiration room={kind} onClose={() => setInspo(false)} onUpload={() => { setInspo(false); styleInput.current?.click(); }} onPick={(url, credit) => { setInspo(false); void send('Arreda nello stile della foto', null, { src: url, author: credit.author, authorUrl: credit.url }); }} />}
          <div className={`flex items-center gap-1.5 rounded-[26px] bg-white p-2 pl-2.5 ${CARD_SHADOW} ${drag ? 'ring-2 ring-brand' : ''}`}>
            {/* foto e zona vicine, come un gruppo di strumenti */}
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => setLibrary(true)} title={base ? 'Carica un\'altra foto' : 'Carica una foto'} className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">
                <ImagePlus size={20} />
              </button>
              <Tooltip label="Stile da una foto: cerca o carica dal computer">
                <button type="button" onClick={() => setInspo(true)} disabled={!base || busy} aria-label="Stile da una foto" className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-muted ease-smooth transition-colors enabled:hover:bg-canvas enabled:hover:text-ink disabled:opacity-40">
                  <Palette size={19} />
                </button>
              </Tooltip>
            </div>
            <textarea rows={1} value={text} onChange={e => { setText(e.target.value); touch(); }} disabled={!base}
              placeholder={hint}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="block h-10 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-muted/60 disabled:cursor-not-allowed" />
            <button onClick={() => send()} disabled={!text.trim() || !base || busy} aria-label="Invia"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-95 disabled:opacity-40">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Zona sulla foto corrente: clic su un oggetto = lo seleziona (maschera rossa), trascinare = rettangolo.
// Zona sulla foto: due strumenti. Rettangolo (di partenza): trascina. Oggetti: clicca; fermando il mouse
// su un oggetto compare l'anteprima di cosa verrebbe selezionato.
type Tool = 'rect' | 'lasso';
// Zona: rettangolo trascinato o forma libera (lazo) disegnata col mouse; la forma libera arriva come
// poligono (poly) con il suo rettangolo di ingombro, cosi' il resto del flusso resta quello del rettangolo.
function ZonePicker({ inline, closing = false, src, region, onChange, onLoad, busy, onSubmit, onCancel, example = 'togli la tv' }: { example?: string; inline?: number; closing?: boolean; src: string; region: Region | null; onChange: (r: Region | null) => void; onLoad: () => void; busy: boolean; onSubmit: (text: string) => void; onCancel: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<Tool>('rect');
  const [path, setPath] = useState<{ x: number; y: number }[] | null>(null); // lazo mentre lo disegni
  const at = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  // Forma: trascinando si disegna a mano libera; cliccando si mettono punti uniti da linee dritte,
  // e si chiude cliccando sul primo punto o con doppio clic.
  const [clicks, setClicks] = useState<{ x: number; y: number }[]>([]);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const pressed = useRef<{ x: number; y: number } | null>(null);
  const finish = (ps: { x: number; y: number }[]) => {
    setPath(null); setClicks([]);
    if (ps.length < 3) return;
    const poly = ps.length > 200 ? ps.filter((_, i) => i % Math.ceil(ps.length / 200) === 0) : ps;
    const xs = poly.map(p => p.x), ys = poly.map(p => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    onChange({ x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y, poly });
  };
  const pickTool = (t: Tool) => { setTool(t); setPath(null); setClicks([]); onChange(null); };
  const down = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = at(e);
    if (tool === 'lasso') { pressed.current = p; if (!clicks.length) onChange(null); return; }
    start.current = p;
  };
  const move = (e: React.PointerEvent) => {
    const p = at(e);
    if (tool === 'lasso') {
      setCursor(p);
      const s0 = pressed.current;
      if (!s0 || clicks.length) return; // a punti: nessun disegno trascinando
      // un punto ogni ~0.6% di foto: forma fedele senza migliaia di punti
      setPath(ps => (!ps ? (Math.hypot(p.x - s0.x, p.y - s0.y) > 0.01 ? [s0, p] : null) : Math.hypot(p.x - ps[ps.length - 1].x, p.y - ps[ps.length - 1].y) > 0.006 ? [...ps, p] : ps));
      return;
    }
    if (!start.current) return;
    const s = start.current;
    if (Math.hypot(p.x - s.x, p.y - s.y) < 0.02) return;
    onChange({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const up = () => {
    start.current = null;
    if (tool !== 'lasso') return;
    const p = pressed.current; pressed.current = null;
    if (path) { finish(path); return; } // mano libera
    if (!p) return;
    // clic: nuovo punto, oppure chiusura se sei vicino al primo
    if (clicks.length >= 3 && Math.hypot(p.x - clicks[0].x, p.y - clicks[0].y) < 0.025) { finish(clicks); return; }
    setClicks(cs => [...cs, p]);
  };
  const dbl = () => { if (tool === 'lasso' && clicks.length >= 3) finish(clicks); };
  const [text, setText] = useState('');
  // fuoco sul campo senza far scorrere la chat (autoFocus e onLoad->in fondo facevano il saltino)
  const focused = useRef(false);
  const ready = !!region && region.w > 0.02 && region.h > 0.02;
  const drawing = !!path || clicks.length > 0;
  const shape = path ?? (clicks.length ? [...clicks, ...(cursor ? [cursor] : [])] : region?.poly ?? null);
  const pts = (ps: { x: number; y: number }[]) => ps.map(p => `${p.x * 100},${p.y * 100}`).join(' ');
  // X della selezione a parte (nella card del risultato la X e' il pulsante Scarica stesso, in AiPhotoStage)
  const closeBtn = (
    <button type="button" onPointerDown={e => e.stopPropagation()} onClick={onCancel} aria-label="Annulla selezione" title="Annulla"
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur-md ease-smooth transition-colors hover:bg-white"><X size={16} /></button>
  );
  const photo = (
      <div ref={box} className={`touch-none ${inline ? `absolute inset-x-0 bottom-full z-20 ease-smooth transition-opacity ${closing ? 'pointer-events-none' : ''}` : 'relative mx-auto max-h-[calc(100vh-24rem)] w-fit'} select-none overflow-hidden rounded-2xl cursor-crosshair`}
        style={inline ? { aspectRatio: inline, ...(closing ? { opacity: 0, transitionDuration: '300ms' } : { animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) .45s both' }) } : undefined}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onDoubleClick={dbl} onPointerLeave={() => setCursor(null)}>
        <img src={src} alt="" draggable={false} onLoad={inline ? undefined : onLoad} className={inline ? 'block h-full w-full object-cover' : 'block max-h-[calc(100vh-24rem)] w-auto max-w-full'} />
        {!inline && closeBtn}
        {region && !region.poly && !drawing && (
          <div className="pointer-events-none absolute border-2 border-dashed border-rose-500 bg-rose-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,.35)]"
            style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.w * 100}%`, height: `${region.h * 100}%` }} />
        )}
        {shape && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* fuori dalla forma chiusa si scurisce, come per il rettangolo */}
            {!drawing && <path d={`M0 0H100V100H0Z M${pts(shape)}Z`} fill="rgba(0,0,0,.35)" fillRule="evenodd" />}
            {drawing
              ? <polyline points={pts(shape)} fill="none" stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
              : <polygon points={pts(shape)} fill="rgba(244,63,94,.1)" stroke="#f43f5e" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
          </svg>
        )}
        {/* punti messi a clic: il primo piu' grande, cliccandolo si chiude la forma */}
        {clicks.map((p, i) => (
          <span key={i} className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-rose-500 ${i === 0 && clicks.length >= 3 ? 'h-4 w-4' : 'h-2.5 w-2.5'}`}
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
        ))}
      </div>
  );
  // Richiesta direttamente qui: scrivi cosa fare nella zona e Modifica
  const form = (
      <form onSubmit={e => { e.preventDefault(); if (ready && text.trim() && !busy) onSubmit(text.trim()); }} className="flex w-0 min-w-full items-center gap-2 pt-2">
        {/* campo con dentro, a destra, gli strumenti di selezione (solo icone, nome nel tooltip) */}
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-transparent bg-canvas pl-4 pr-1 ease-smooth transition-colors focus-within:border-ink/15 focus-within:bg-white">
          <input ref={el => { if (el && !focused.current) { focused.current = true; el.focus({ preventScroll: true }); } }} value={text} onChange={e => setText(e.target.value)}
            placeholder={ready ? `Cosa cambio qui? Es. ${example}` : tool === 'rect' ? 'Disegna sulla foto' : clicks.length ? 'Doppio clic per chiudere' : 'Disegna il contorno'}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
          {([['rect', 'Rettangolo: trascina per disegnare la zona', SquareDashed], ['lasso', 'Forma: disegna il contorno o clicca i punti', Lasso]] as const).map(([id, l, I]) => (
            <Tooltip key={id} label={l}>
              <button type="button" onClick={() => pickTool(id)} aria-label={l} aria-pressed={tool === id}
                className={`flex h-8 w-8 items-center justify-center rounded-full ease-smooth transition-colors ${tool === id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}><I size={15} /></button>
            </Tooltip>
          ))}
        </div>
        <button type="submit" disabled={!ready || !text.trim() || busy}
          className="h-10 shrink-0 rounded-full bg-brand px-5 text-[13px] font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40">Modifica</button>
      </form>
  );
  // dentro la card del risultato: stessa foto, stesso posto, cambiano solo i controlli sotto
  // prima la card si allunga (AutoSize), poi il campo compare: solo dissolvenza, uno spostamento verso il basso finiva tagliato dal bordo
  if (inline) return (
    <div className="relative">
      {photo}
      {/* in chiusura l'animazione d'ingresso va tolta, altrimenti il suo "both" tiene l'opacita' a 1 e il campo sparisce di colpo */}
      <div className="duration-300 ease-smooth transition-opacity" style={closing ? { opacity: 0 } : { animation: 'gnm-fade var(--gnm-dur) var(--gnm-ease) .25s both' }}>{form}</div>
    </div>
  );
  return (
    <div className="flex justify-start">
    <MorphTarget id="zone" className={`w-fit max-w-[min(640px,100%)] rounded-3xl bg-white p-2 ${CARD_SHADOW}`}>
      <div className="w-fit max-w-full">
      {photo}
      {form}
      </div>
    </MorphTarget>
    </div>
  );
}

// Salva un risultato in un immobile, in una finestra con due scelte animate con le foto vere:
// - Prima e dopo: la foto nuova si aggiunge; l'animazione mostra il cursore che scorre tra originale e nuova;
// - Sostituisci: l'animazione mostra la nuova che scende e prende il posto dell'originale
//   (solo se la foto di partenza era gia' di quell'immobile).
// Vale anche per foto caricate dal computer: si sceglie l'immobile, l'originale va online solo per il prima/dopo.
const SAVE_ANIM = `
@property --sv-p { syntax: '<percentage>'; inherits: true; initial-value: 50% }
@keyframes gnm-sv-p { 0%,10% { --sv-p: 50% } 36%,46% { --sv-p: 12% } 72%,82% { --sv-p: 88% } 100% { --sv-p: 50% } }
@keyframes gnm-sv-drop { 0%,14% { transform: translateY(-104%); opacity: 1 } 42%,86% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(0); opacity: 0 } }
@keyframes gnm-sv-old { 0%,14% { transform: scale(1); filter: brightness(1) } 42%,86% { transform: scale(.9); filter: brightness(.6) } 100% { transform: scale(1); filter: brightness(1) } }
@keyframes gnm-sv-tag { 0%,40% { opacity: 0 } 50%,84% { opacity: 1 } 96%,100% { opacity: 0 } }
@keyframes gnm-sv-tagold { 0%,22% { opacity: 1 } 34%,92% { opacity: 0 } 100% { opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .gnm-sv * { animation: none !important } }
`;
function SaveToProperty({ before, after, projectId, origin, onClose }: { before: string; after: string; projectId: string | null; origin: string | null; onClose: () => void }) {
  const [projects, setProjects] = useState<ProjectData[] | null>(null);
  const [pid, setPid] = useState<string>(projectId ?? '');
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  // un solo immobile: scelto da solo, senza menu
  // indirizzo del sito: "Vedi l'immobile" apre la casa online se e' pubblica
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => { authFetch('/api/platform/site').then(r => r.json()).then(d => setSlug(d.slug ?? null)).catch(() => {}); }, []);
  useEffect(() => { fetchProjects().then(ps => { setProjects(ps); if (ps?.length === 1) setPid(v => v || ps[0].id); }); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  const p = projects?.find(x => x.id === pid);
  const photosOf = (x?: ProjectData) => { const d = (x?.import_data ?? {}) as { photos?: unknown }; return Array.isArray(d.photos) ? d.photos as string[] : x?.cover ? [x.cover] : []; };
  const canReplace = !!origin && photosOf(p).includes(origin);
  const chosen = canReplace ? mode : 'add';
  const save = async () => {
    if (!pid) return;
    setState('busy');
    const beforeUrl = canReplace ? origin! : before.startsWith('data:') ? await uploadDataUrl(before, 'properties') : before;
    const r = await authFetch('/api/platform/property-photo', { method: 'POST', body: JSON.stringify({ projectId: pid, mode: chosen, before: beforeUrl || undefined, after }) }).catch(() => null);
    setState(r?.ok ? 'ok' : 'err');
  };
  const tag = 'absolute bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white';
  const option = (id: 'add' | 'replace', title: string, text: string, visual: React.ReactNode, off?: boolean) => (
    <button type="button" onClick={() => setMode(id)} aria-pressed={chosen === id} disabled={off}
      className={`flex min-w-0 flex-1 flex-col rounded-3xl bg-white p-2 text-left ring-1 ease-smooth transition-shadow disabled:cursor-not-allowed disabled:opacity-45 ${chosen === id ? 'ring-2 ring-brand' : 'ring-line enabled:hover:ring-ink/20'}`}>
      <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-canvas">{visual}</span>
      <span className="block px-1.5 pb-1 pt-2.5"><span className="block text-sm font-semibold">{title}</span><span className="block text-xs leading-snug text-muted">{text}</span></span>
    </button>
  );
  return createPortal(
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => state !== 'busy' && onClose()}>
      <style>{SAVE_ANIM}</style>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl">
        {state === 'ok' ? (
          <div className="blur-in flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check size={26} /></span>
            <div className="text-lg font-semibold">Salvata in {p?.titolo || p?.nome || 'immobile'}</div>
            <p className="text-sm text-muted">{chosen === 'add' ? 'Sul sito la trovi con l’etichetta Prima / Dopo.' : 'Ha preso il posto della foto originale.'}</p>
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="h-10 rounded-full px-5 text-sm font-medium hover:bg-canvas">Chiudi</button>
              {p?.is_public && slug
                ? <a href={`${portfolioUrl(slug)}/${pid}`} target="_blank" rel="noopener" className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand/90">Vedi sul sito <ExternalLink size={14} /></a>
                : <a href={`#/immobile/${pid}`} className="flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand/90">Vedi l’immobile</a>}
            </div>
          </div>
        ) : <>
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Salva nell’immobile</h2><p className="text-sm text-muted">{projects?.length === 1 ? `In ${p?.titolo || p?.nome || 'immobile'}, scegli come.` : 'Scegli dove metterla e come.'}</p></div>
            <button onClick={onClose} aria-label="Chiudi" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
          </div>
          {projects?.length !== 1 && <div className="mt-4">
            {projects === null ? <div className="h-11 animate-pulse rounded-full bg-canvas" /> : (
              <Dropdown value={pid} options={[{ value: '', label: 'Scegli l’immobile' }, ...projects.map(x => ({ value: x.id, label: x.titolo || x.nome || x.addr }))]}
                onChange={setPid} className="h-11 w-full justify-between rounded-full bg-canvas px-4 text-sm font-medium" />
            )}
          </div>}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {option('add', 'Prima e dopo', 'Aggiunge la foto nuova: sul sito si confronta con l’originale.', <>
              {/* un solo valore animato (--sv-p) muove insieme taglio, linea e maniglia; la vecchia in bianco e nero */}
              <span className="gnm-sv absolute inset-0" style={{ animation: 'gnm-sv-p 7s cubic-bezier(.65,0,.35,1) infinite' }}>
                <img src={before} alt="" className="absolute inset-0 h-full w-full object-cover grayscale" />
                <img src={after} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: 'inset(0 0 0 var(--sv-p))' }} />
                <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_8px_rgba(0,0,0,.35)]" style={{ left: 'var(--sv-p)' }} />
                <span className="absolute top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md" style={{ left: 'var(--sv-p)' }}><ChevronsLeftRight size={14} /></span>
              </span>
              <span className={`${tag} left-2`}>Prima</span><span className={`${tag} right-2`}>Dopo</span>
            </>)}
            {/* sempre visibile, spenta quando la foto di partenza non e' di quell'immobile: si capisce che esiste */}
            {option('replace', 'Sostituisci', canReplace ? 'La foto nuova prende il posto dell’originale.' : 'Solo se parti da una foto di questo immobile.', <>
              {/* la nuova scende dall'alto e copre l'originale, che arretra e si scurisce; poi ricomincia */}
              <span className="gnm-sv absolute inset-0">
                <img src={before} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ animation: 'gnm-sv-old 7s cubic-bezier(.65,0,.35,1) infinite' }} />
                <img src={after} alt="" className="absolute inset-0 h-full w-full rounded-2xl object-cover shadow-[0_-8px_24px_rgba(0,0,0,.25)]" style={{ animation: 'gnm-sv-drop 7s cubic-bezier(.65,0,.35,1) infinite' }} />
                <span className={`${tag} left-2`} style={{ animation: 'gnm-sv-tagold 7s ease infinite' }}>Originale</span>
                <span className={`${tag} right-2`} style={{ animation: 'gnm-sv-tag 7s ease infinite' }}>Nuova</span>
              </span>
            </>, !canReplace)}
          </div>
          <div className="flex items-center justify-end gap-2 pt-5">
            {state === 'err' && <span className="mr-auto text-xs text-rose-600">Non sono riuscito a salvarla, riprova.</span>}
            <button onClick={onClose} className="h-10 rounded-full px-4 text-sm font-medium text-muted hover:bg-canvas hover:text-ink">Annulla</button>
            <button onClick={save} disabled={!pid || state === 'busy'} className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-40">{state === 'busy' && <Loader2 size={14} className="animate-spin" />} Salva</button>
          </div>
        </>}
      </div>
    </div>,
    document.body,
  );
}

// Cambio di passo nello stesso contenitore: il contenuto vecchio sfuma (200 ms), poi entra il nuovo
// (AutoSize intanto porta il contenitore alla nuova altezza). Stesso passo: il contenuto si aggiorna e basta.
function StepSwap({ step, children }: { step: string; children: React.ReactNode }) {
  const [cur, setCur] = useState(step);
  const [old, setOld] = useState<React.ReactNode>(children);
  const leaving = step !== cur;
  if (!leaving && old !== children) setOld(children); // ultimo contenuto del passo corrente, per la dissolvenza in uscita
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => setCur(step), 200);
    return () => clearTimeout(t);
  }, [leaving, step]);
  // stesso elemento (key = passo corrente): in uscita cambia solo la classe, cosi' sfuma invece di sparire
  return <div key={cur} className={leaving ? 'opacity-0 transition-opacity duration-200 ease-smooth' : 'blur-in'} style={leaving ? undefined : { animationDelay: '.05s' }}>{leaving ? old : children}</div>;
}

// Pulsante della card del risultato: icona e nome in riga, oppure (card stretta, foto verticale) icona sopra e nome corto sotto
function Act({ icon, label, short, tip, narrow, active, disabled, onClick, cr }: { icon: React.ReactNode; label: string; short?: string; tip?: string; narrow: boolean; active?: boolean; disabled?: boolean; onClick: () => void; cr?: number }) {
  const tone = active ? 'bg-canvas text-ink' : 'text-ink hover:bg-canvas';
  const btn = narrow
    ? <button onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium leading-none disabled:opacity-40 ${tone}`}>{icon}<span className="truncate">{short ?? label}</span></button>
    : <button onClick={onClick} disabled={disabled} aria-pressed={active} className={`flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 font-medium leading-none disabled:opacity-40 ${tone}`}>{icon}{label}{cr !== undefined && <Cr n={cr} tight />}</button>;
  return tip && !narrow ? <Tooltip label={tip}>{btn}</Tooltip> : btn;
}

// foto della griglia pronta: via lo scheletro, dentro la foto (anche se era gia' in cache e l'evento load e' passato prima)
const showImg = (el: HTMLImageElement) => { el.style.opacity = '1'; if (el.previousElementSibling?.classList.contains('animate-pulse')) el.previousElementSibling.remove(); };
// "Cerca ispirazione": foto d'interni da Unsplash (ricerca sul server, /api/platform/inspiration). Scelta = foto di stile.
type InspoPhoto = { id: string; thumb: string; url: string; author: string; authorUrl: string; download: string; alt: string };
// ricerca di partenza: la stanza riconosciuta nella foto caricata
const ROOM_QUERY: Record<string, string> = { openspace: 'cucina e soggiorno', soggiorno: 'soggiorno moderno', cucina: 'cucina moderna', camera: 'camera da letto moderna', cameretta: 'cameretta', bagno: 'bagno moderno', sala: 'sala da pranzo moderna', studio: 'studio in casa', ingresso: 'ingresso casa', corridoio: 'corridoio casa', balcone: 'balcone arredato' };
function Inspiration({ room, onPick, onUpload, onClose }: { room: string | null; onPick: (url: string, credit: { author: string; url: string }) => void; onUpload: () => void; onClose: () => void }) {
  const base = ROOM_QUERY[room?.replace(/^room:/, '') ?? ''] ?? 'soggiorno moderno'
  const [q, setQ] = useState(''); // vuoto: la stanza riconosciuta e' il segnaposto, e si apre gia' con quei risultati
  const [items, setItems] = useState<InspoPhoto[] | null>(null);
  const [loading, setLoading] = useState(true); // si apre gia' cercando
  const fetchInspo = async (query: string) => {
    const r = await authFetch(`/api/platform/inspiration?q=${encodeURIComponent(query.trim())}`).catch(() => null);
    return ((r?.ok ? await r.json() : { results: [] }).results ?? []) as InspoPhoto[];
  };
  // ricerca mentre si scrive: 400 ms dopo l'ultima lettera; campo vuoto = soggiorni. Conta solo l'ultima ricerca partita.
  const lastQuery = useRef('')
  const runSearch = async (query: string) => {
    lastQuery.current = query
    const r = await fetchInspo(query)
    if (lastQuery.current === query) { setItems(r); setLoading(false) }
  };
  useEffect(() => {
    const query = q.trim() || base
    const t = setTimeout(() => { void runSearch(query) }, q ? 400 : 0)
    return () => clearTimeout(t)
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className="blur-in fixed inset-0 z-[240] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-[32px] bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">Stile da una foto</h3>
            <p className="text-sm text-muted">Scegli una foto che ti piace: la stanza verrà arredata con quello stile.</p>
          </div>
          <button onClick={onClose} aria-label="Chiudi" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-canvas px-4">
            <Search size={16} className="shrink-0 text-muted" />
            <input autoFocus value={q} onChange={e => { setQ(e.target.value); setLoading(true); }}
              placeholder={base} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/60" />
          </label>
          <button onClick={onUpload} className="flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-inset ring-line hover:bg-canvas"><ImagePlus size={16} /> Carica dal computer</button>
        </div>
        <div className="mt-4 h-[55vh] overflow-y-auto">
          {/* scheletro della griglia mentre cerca */}
          {loading && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{Array.from({ length: 12 }, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-canvas" />)}</div>}
          {!loading && items && !items.length && <p className="py-10 text-center text-sm text-muted">Nessuna foto, prova con altre parole.</p>}
          {!loading && !!items?.length && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {items.map(p => (
                <button key={p.id} title={`Foto di ${p.author}`} className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-canvas"
                  onClick={() => { authFetch('/api/platform/inspiration', { method: 'POST', body: JSON.stringify({ download: p.download }) }).catch(() => {}); onPick(p.url, { author: p.author, url: p.authorUrl }); }}>
                  {/* scheletro finche' la foto non e' scaricata, poi entra in dissolvenza */}
                  <span className="absolute inset-0 animate-pulse bg-canvas" />
                  <img src={p.thumb} alt={p.alt} loading="lazy" onLoad={e => showImg(e.currentTarget)} ref={el => { if (el?.complete && el.naturalWidth) showImg(el); }} style={{ opacity: 0 }}
                    className="relative h-full w-full object-cover ease-smooth transition-[opacity,transform] duration-[600ms] group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-4 text-[10px] text-white opacity-0 ease-smooth transition-opacity group-hover:opacity-100">{p.author}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {!!items?.length && <p className="pt-3 text-[11px] text-muted">Foto da <a href="https://unsplash.com/?utm_source=agenteimmo&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a></p>}
      </div>
    </div>,
    document.body,
  );
}
