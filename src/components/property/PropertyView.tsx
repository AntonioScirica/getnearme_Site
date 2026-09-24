import { Bath, BedDouble, Building, ExternalLink, LayoutTemplate, Mail, MapPin, Ruler, Square } from 'lucide-react';
import { ENERGY_COLORS, GROUPS, detailsFrom, groupFacts } from '@/lib/propertyFields';
import Gallery, { ShareButton } from './Gallery';
import ZoneList from './ZoneList';
import ProgressiveBlur from '../ProgressiveBlur';

// Pagina della casa: stessa vista per il portfolio pubblico e per il dettaglio in piattaforma.
// Nessun hook qui: si genera lato server (SEO), solo galleria e condivisione sono client.

export type PropertyViewData = {
  titolo?: string; nome?: string; descrizione?: string; addr?: string; tipologia?: string | null;
  prezzo?: number; mq?: number; locali?: number | null; camere?: number; bagni?: number; cover?: string;
  import_data?: Record<string, unknown> | null;
};
export type PropertyContact = { name: string; email?: string | null; color?: string };

const euro = (n: number) => `€ ${Math.round(n).toLocaleString('it-IT')}`;

// Descrizione: paragrafi, righe "- " diventano elenco.
function Description({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-4 text-[16px] leading-relaxed text-ink/85">
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        const items = lines.filter(l => /^\s*[-•]\s+/.test(l));
        if (items.length && items.length >= lines.length - 1) {
          const head = lines.find(l => !/^\s*[-•]\s+/.test(l));
          return (
            <div key={i}>
              {head && <p className="font-medium text-ink">{head}</p>}
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {items.map(l => <li key={l} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{l.replace(/^\s*[-•]\s+/, '')}</li>)}
              </ul>
            </div>
          );
        }
        return <p key={i} className="whitespace-pre-line">{b}</p>;
      })}
    </div>
  );
}

export default function PropertyView({ p, contact }: { p: PropertyViewData; contact?: PropertyContact }) {
  const imp = (p.import_data ?? {}) as { photos?: string[] };
  const d = detailsFrom(p.import_data);
  const photos = imp.photos?.length ? imp.photos : p.cover ? [p.cover] : [];
  const title = p.titolo || p.nome || 'Immobile';
  const showAddr = d.mostra_indirizzo !== false;
  const place = showAddr ? p.addr : p.addr?.split(',').slice(-1)[0]?.trim();
  const rent = d.contratto === 'Affitto';
  const price = d.trattativa_riservata || !p.prezzo ? 'Trattativa riservata' : `${euro(p.prezzo)}${rent ? '/mese' : ''}`;
  const perSqm = !rent && p.prezzo && p.mq && !d.trattativa_riservata ? `${euro(p.prezzo / p.mq)}/m²` : null;
  const energy = typeof d.classe_energetica === 'string' ? d.classe_energetica : null;

  const facts = [
    { icon: Ruler, label: 'Superficie', value: p.mq ? `${p.mq} m²` : null },
    { icon: Square, label: 'Locali', value: p.locali || null },
    { icon: BedDouble, label: 'Camere', value: p.camere || null },
    { icon: Bath, label: 'Bagni', value: p.bagni || null },
    { icon: Building, label: 'Piano', value: d.piano ? String(d.piano) : null },
  ].filter(f => f.value);

  const groups = GROUPS.map(g => ({ g, facts: groupFacts(g, d) })).filter(x => x.facts.length);
  const mailto = contact?.email ? `mailto:${contact.email}?subject=${encodeURIComponent(`Informazioni: ${title}`)}` : null;

  return (
    <article className="pb-24 md:pb-0">
      <Gallery photos={photos} title={title} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            {[d.contratto, p.tipologia || d.tipologia, d.stato].filter(Boolean).map(t => (
              <span key={String(t)} className="rounded-full bg-white px-3 py-1 ring-1 ring-line">{String(t)}</span>
            ))}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>
          {place && <p className="mt-2 flex items-center gap-1.5 text-muted"><MapPin size={16} /> {place}</p>}

          {!!facts.length && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="card p-4">
                  <Icon size={18} className="text-brand" />
                  <div className="mt-2 font-display text-lg font-semibold">{value}</div>
                  <div className="text-xs text-muted">{label}</div>
                </div>
              ))}
            </div>
          )}

          {p.descrizione && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold">Descrizione</h2>
              <Description text={p.descrizione} />
            </section>
          )}

          {energy && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold">Efficienza energetica</h2>
              <div className="flex flex-wrap items-end gap-1">
                {Object.keys(ENERGY_COLORS).map(k => (
                  <div key={k} className={`flex w-10 items-center justify-center rounded-md text-xs font-bold text-white transition-all ${k === energy ? 'h-12 ring-2 ring-ink ring-offset-2' : 'h-7 opacity-35'}`} style={{ background: ENERGY_COLORS[k] }}>{k}</div>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted">Classe {energy}{d.ipe ? ` · IPE ${d.ipe} kWh/m²a` : ''}</p>
            </section>
          )}

          {!!groups.length && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold">Caratteristiche</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {groups.map(({ g, facts: gf }) => (
                  <div key={g.id} className="card p-5">
                    <h3 className="text-sm font-semibold">{g.title}</h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      {gf.map(f => (
                        <div key={f.label} className="flex justify-between gap-4"><dt className="text-muted">{f.label}</dt><dd className="text-right font-medium">{f.value}</dd></div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}

          {typeof d.planimetria === 'string' && d.planimetria && (
            <section className="mt-10">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"><LayoutTemplate size={20} /> Planimetria</h2>
              <a href={d.planimetria} target="_blank" rel="noreferrer" className="block overflow-hidden card p-4">
                <img src={d.planimetria} alt="Planimetria" loading="lazy" className="mx-auto max-h-[520px] object-contain" />
              </a>
            </section>
          )}

          {Array.isArray(d.zona) && d.zona.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold">Nella zona</h2>
              <ZoneList all={d.zona as string[]} featured={Array.isArray(d.zona_evidenza) ? (d.zona_evidenza as string[]) : []} withCta={!!contact} />
            </section>
          )}

          {showAddr && p.addr && (
            <section className="mt-10">
              <h2 className="mb-4 font-display text-xl font-semibold">Dove si trova</h2>
              <div className="overflow-hidden rounded-2xl ring-1 ring-line">
                <iframe title="Mappa" loading="lazy" className="h-80 w-full" src={`https://maps.google.com/maps?q=${encodeURIComponent(p.addr)}&z=15&output=embed`} />
              </div>
            </section>
          )}
        </div>

        {/* Box prezzo */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="card ring-gradient rounded-3xl p-6">
            <div className="font-display text-3xl font-bold tracking-tight">{price}</div>
            {perSqm && <div className="mt-1 text-sm text-muted">{perSqm}</div>}
            <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
              {d.spese_condominiali ? <Row k="Spese condominiali" v={`${euro(Number(d.spese_condominiali))}/mese${d.spese_incluse ? ' (incluse)' : ''}`} /> : null}
              {rent && d.cauzione ? <Row k="Cauzione" v={`${d.cauzione} mensilità`} /> : null}
              {rent && d.contratto_affitto ? <Row k="Contratto" v={String(d.contratto_affitto)} /> : null}
              {d.disponibilita ? <Row k="Disponibilità" v={String(d.disponibilita)} /> : null}
              {energy ? <Row k="Classe energetica" v={energy} /> : null}
              {d.riferimento ? <Row k="Riferimento" v={String(d.riferimento)} /> : null}
            </dl>
            {mailto && (
              <a href={mailto} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white" style={{ background: contact?.color || '#15181f' }}>
                <Mail size={16} /> Richiedi informazioni
              </a>
            )}
            <div className="mt-3 flex gap-2">
              <ShareButton title={title} />
              {typeof d.virtual_tour === 'string' && /^https?:\/\//.test(d.virtual_tour) && (
                <a href={d.virtual_tour} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 btn-ghost rounded-xl px-4 py-2 text-sm font-medium"><ExternalLink size={16} /> Virtual tour</a>
              )}
            </div>
          </div>
          {contact && (
            <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-line">
              <div className="text-xs text-muted">Proposto da</div>
              <div className="mt-1 font-semibold">{contact.name}</div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile: barra fissa prezzo + contatto */}
      {mailto && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-5 py-3 md:hidden">
          <ProgressiveBlur side="bottom" />
          <div className="min-w-0"><div className="truncate font-display text-lg font-bold">{price}</div>{place && <div className="truncate text-xs text-muted">{place}</div>}</div>
          <a href={mailto} className="shrink-0 rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: contact?.color || '#15181f' }}>Contatta</a>
        </div>
      )}
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>;
}
