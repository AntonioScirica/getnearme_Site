'use client';
import { useState } from 'react';

// Calcolatore della provvigione nella guida: prezzo x percentuale per parte, piu' IVA al 22% (la provvigione e' un servizio)
const eur = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`; // 9.150 € (it-IT da solo scrive 9150)
const num = (s: string) => Math.max(0, Number(s.replace(/\./g, '').replace(',', '.')) || 0);

export default function ProvvigioneCalc() {
  const [price, setPrice] = useState('250.000');
  const [seller, setSeller] = useState('3');
  const [buyer, setBuyer] = useState('3');
  const [iva, setIva] = useState(true);
  const p = num(price), k = iva ? 1.22 : 1;
  const s = (p * num(seller)) / 100, b = (p * num(buyer)) / 100;
  const field = 'mt-1.5 h-11 w-full rounded-2xl bg-white px-4 text-[15px] font-semibold text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-brand';
  return (
    <div className="not-prose my-10 rounded-[28px] bg-canvas p-5 ring-1 ring-black/5 sm:p-6">
      <div className="font-display text-xl font-bold">Calcola la provvigione</div>
      <div className="mt-1 text-sm text-muted">Inserisci prezzo e percentuali concordate: il calcolo è indicativo, fa fede l&apos;incarico firmato.</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-muted">Prezzo di vendita (€)<input inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} className={field} /></label>
        <label className="text-sm text-muted">Venditore (%)<input inputMode="decimal" value={seller} onChange={e => setSeller(e.target.value)} className={field} /></label>
        <label className="text-sm text-muted">Acquirente (%)<input inputMode="decimal" value={buyer} onChange={e => setBuyer(e.target.value)} className={field} /></label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={iva} onChange={e => setIva(e.target.checked)} className="h-4 w-4 accent-brand" /> Includi IVA al 22%</label>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {([['Paga il venditore', s * k], ['Paga l\'acquirente', b * k], ['Totale all\'agenzia', (s + b) * k]] as const).map(([l, v], i) => (
          <div key={l} className={`rounded-[20px] p-4 ${i === 2 ? 'bg-ink text-white' : 'bg-white ring-1 ring-black/5'}`}>
            <div className={`text-xs ${i === 2 ? 'text-white/70' : 'text-muted'}`}>{l}</div>
            <div className="mt-1 font-display text-2xl font-extrabold tabular-nums">{eur(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
