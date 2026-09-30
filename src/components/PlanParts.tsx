import { Globe, MessageCircle, Pencil, Search, Sparkles } from 'lucide-react';
import { photosFor, videosFor } from '@/lib/pricing';

// Pezzi delle card dei piani, uguali su landing e piattaforma: crediti in grande con cosa ci fai, e il sito (Plus e Pro dal 28/09).
const thousands = (n: number, en?: boolean) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');

export function Credits({ n, en }: { n: number; en?: boolean }) {
  return (
    <div className="mt-6 border-t border-line pt-6">
      <div className="font-display text-xl font-extrabold tracking-tight">{thousands(n, en)} {en ? 'credits a month' : 'crediti al mese'}</div>
      <div className="mt-2 space-y-1 text-[15px] text-muted">
        <div>= {photosFor(n)} {en ? 'staged photos' : 'foto arredate'}</div>
        <div>~ {videosFor(n)} {en ? 'videos' : 'video'}</div>
      </div>
    </div>
  );
}

const SITE_PERKS: [typeof Globe, string, string][] = [[Search, 'SEO: ti trovano su Google nella tua zona', 'SEO: found on Google in your area'], [Pencil, 'Modifichi tutto: colori, testi, foto, sezioni', 'Edit everything: colors, text, photos, sections'], [MessageCircle, 'Le richieste arrivano a te, non al portale', 'Inquiries come to you, not to a portal'], [Sparkles, 'Ogni casa che carichi va online da sola', 'Every listing you upload goes live on its own']];
// slug: nella piattaforma l'indirizzo vero dell'agente al posto di "tuonome"
export function SiteIncluded({ en, slug }: { en?: boolean; slug?: string | null }) {
  return (
    <div className="mt-6 border-t border-line pt-6">
      <div className="font-display text-xl font-extrabold tracking-tight">{en ? 'Your website included' : 'Il tuo sito incluso'}</div>
      <div className="mt-1 text-[15px] text-muted">agenteimmo.me/<span className="text-ink">{slug || (en ? 'yourname' : 'tuonome')}</span>, {en ? 'ready-made with our templates' : 'già fatto con i nostri modelli'}</div>
      <ul className="mt-4 space-y-2.5 text-[15px]">
        {SITE_PERKS.map(([, l, e]) => <li key={l}>{en ? e : l}</li>)}
      </ul>
    </div>
  );
}

