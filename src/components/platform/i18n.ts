import { FIELD_EN } from '@/lib/fieldsEn';
// Lingua della piattaforma: la dice l'indirizzo (/it/dashboard o /en/dashboard). La piattaforma gira solo nel browser
// (niente SSR) e non cambia lingua senza ricaricare la pagina, quindi basta leggerla da location.
// tr('italiano', 'English'): il testo nella lingua della pagina. Si puo' usare anche fuori dai componenti.
// ponytail: niente file di traduzioni ne' libreria i18n: le due lingue stanno accanto nel codice, come sulla landing (L()).
export type Lang = 'it' | 'en';

export const pageLang = (): Lang => (typeof location !== 'undefined' && /^\/en(\/|$)/.test(location.pathname) ? 'en' : 'it');
export const tr = (it: string, en: string) => (pageLang() === 'en' ? en : it);
// per date e numeri (toLocaleDateString, Intl)
export const pageLocale = () => (pageLang() === 'en' ? 'en-GB' : 'it-IT');
// link alle pagine del sito nella lingua giusta: lp('/termini') -> /it/termini o /en/termini
export const lp = (path: string) => `/${pageLang()}${path}`;
// testi dello schema dell'immobile e del punteggio (etichette, opzioni, suggerimenti): il valore salvato resta italiano
export const trf = (s?: string) => (s && pageLang() === 'en' ? FIELD_EN[s] ?? s : s ?? '');
