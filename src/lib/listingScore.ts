// Criteri dello score di un annuncio (somma = 100). L'AI da' i punti per criterio, ora e
// dopo aver applicato tutte le correzioni; lo score e il potenziale sono le somme, calcolate
// qui e non dal modello, cosi' tornano sempre con i criteri mostrati.
export const CRITERI = [
  { key: 'foto', label: 'Foto', max: 30, desc: 'Qualità, luce, ordine, prima foto, stanze mostrate' },
  { key: 'dati', label: 'Dati della scheda', max: 25, desc: 'Campi che l\'acquirente cerca: spese, classe, piano, riscaldamento' },
  { key: 'descrizione', label: 'Descrizione', max: 20, desc: 'Completa, chiara, ben scritta, senza refusi né maiuscolo' },
  { key: 'coerenza', label: 'Affidabilità', max: 15, desc: 'Dati coerenti con foto e testo, niente contatti nel testo' },
  { key: 'titolo', label: 'Titolo', max: 10, desc: 'Tipologia, punto di forza e zona, niente aggettivi vuoti' },
] as const;

export type CriterioKey = (typeof CRITERI)[number]['key'];
export type Criterio = { punti: number; punti_dopo: number; nota: string };
export type Criteri = Record<CriterioKey, Criterio>;

// Schema JSON per l'output strutturato dell'AI.
export const CRITERI_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(CRITERI.map(c => [c.key, {
    type: 'object',
    properties: { punti: { type: 'integer' }, punti_dopo: { type: 'integer' }, nota: { type: 'string' } },
    required: ['punti', 'punti_dopo', 'nota'],
    additionalProperties: false,
  }])),
  required: CRITERI.map(c => c.key),
  additionalProperties: false,
};

export const CRITERI_PROMPT = CRITERI.map(c => `  - ${c.key} (max ${c.max}): ${c.desc}`).join('\n');

// Punti dentro 0..max, "dopo" mai sotto "ora"; score e potenziale = somme.
export function withScores<T extends { criteri?: Partial<Criteri> }>(a: T): T & { criteri: Criteri; score: number; score_potenziale: number } {
  const criteri = {} as Criteri;
  for (const c of CRITERI) {
    const x = a.criteri?.[c.key];
    const punti = Math.max(0, Math.min(c.max, Math.round(Number(x?.punti) || 0)));
    const dopo = Math.max(punti, Math.min(c.max, Math.round(Number(x?.punti_dopo) || 0)));
    criteri[c.key] = { punti, punti_dopo: dopo, nota: String(x?.nota ?? '') };
  }
  const sum = (k: 'punti' | 'punti_dopo') => CRITERI.reduce((s, c) => s + criteri[c.key][k], 0);
  return { ...a, criteri, score: sum('punti'), score_potenziale: sum('punti_dopo') };
}

// ponytail: controllo minimo, `npx tsx src/lib/listingScore.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('listingScore.ts')) {
  const r = withScores({ criteri: { foto: { punti: 40, punti_dopo: 10, nota: '' }, titolo: { punti: 5, punti_dopo: 9, nota: '' } } });
  console.assert(r.criteri.foto.punti === 30 && r.criteri.foto.punti_dopo === 30, 'clamp e dopo >= ora');
  console.assert(r.score === 35 && r.score_potenziale === 39, 'somme');
  console.log('ok', r.score, r.score_potenziale);
}
