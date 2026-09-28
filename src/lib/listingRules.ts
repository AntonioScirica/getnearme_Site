import { CRITERI, withScores, type Criteri } from '@/lib/listingScore'

// Verdetto di "Miglioralo" senza AI: punteggio, problemi e dati mancanti calcolati a regole dai campi dell'annuncio
// (letti dall'estensione o dal server, vedi listingExtract). Gratis e istantaneo. La riscrittura del testo e' a parte
// (api/platform/rewrite). Le foto a regole si giudicano solo per numero e presenza della planimetria: la qualita'
// (luce, ordine) resta fuori, per questo il potenziale delle foto non arriva mai al massimo.

export type Fields = {
  titolo: string; descrizione: string; prezzo: string; mq: string; locali: string; camere: string; bagni: string
  piano: string; classe_energetica: string; riscaldamento: string; spese_condominiali: string; anno_costruzione: string
  stato: string; box_posto_auto: string; esposizione: string; ascensore: string; balcone_terrazzo: string
  arredato: string; disponibilita: string; zona: string; contratto: string; planimetria: boolean; foto: number
}
export const EMPTY_FIELDS: Fields = {
  titolo: '', descrizione: '', prezzo: '', mq: '', locali: '', camere: '', bagni: '', piano: '', classe_energetica: '', riscaldamento: '',
  spese_condominiali: '', anno_costruzione: '', stato: '', box_posto_auto: '', esposizione: '', ascensore: '', balcone_terrazzo: '',
  arredato: '', disponibilita: '', zona: '', contratto: '', planimetria: false, foto: 0,
}
type Problem = { area: 'titolo' | 'descrizione' | 'foto' | 'dati' | 'prezzo'; gravita: 'alta' | 'media' | 'bassa'; problema: string; perche: string; soluzione: string; foto_indice: number; foto_stanza: string; modifica_foto: string }

// dati che l'acquirente filtra o chiede per primi, con il peso nel criterio "dati" (somma 25)
const DATI: [keyof Fields, string, number][] = [
  ['prezzo', 'Prezzo', 4], ['mq', 'Superficie', 4], ['locali', 'Locali', 2], ['bagni', 'Bagni', 2], ['piano', 'Piano', 2],
  ['classe_energetica', 'Classe energetica', 3], ['riscaldamento', 'Riscaldamento', 2], ['spese_condominiali', 'Spese condominiali', 2],
  ['stato', 'Stato dell\'immobile', 1], ['anno_costruzione', 'Anno di costruzione', 1], ['box_posto_auto', 'Box o posto auto', 1], ['esposizione', 'Esposizione', 1],
]
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const VUOTI = /\b(splendid[oa]|imperdibile|occasione unica|affare|bellissim[oa]|stupend[oa]|meraviglios[oa])\b/i
const CONTATTI = /(\+?\d[\d\s./-]{7,}\d)|([\w.+-]+@[\w-]+\.[\w.]+)/
const TIPOLOGIA = /\b(monolocale|bilocale|trilocale|quadrilocale|pentalocale|attico|mansarda|loft|villa|villino|villetta|rustico|casale|open space)\b/i

export function rulesAnalysis(f: Fields) {
  const problemi: Problem[] = []
  const forza: string[] = []
  const p = (area: Problem['area'], gravita: Problem['gravita'], problema: string, perche: string, soluzione: string) =>
    problemi.push({ area, gravita, problema, perche, soluzione, foto_indice: 0, foto_stanza: '', modifica_foto: '' })

  // dati della scheda
  const mancanti = DATI.filter(([k]) => !String(f[k] ?? '').trim())
  const datiPunti = DATI.reduce((s, [k, , w]) => s + (String(f[k] ?? '').trim() ? w : 0), 0)
  if (mancanti.length >= 3) p('dati', mancanti.length >= 5 ? 'alta' : 'media', `Mancano ${mancanti.length} dati che chi cerca guarda subito: ${mancanti.slice(0, 4).map(m => m[1].toLowerCase()).join(', ')}.`,
    'Chi filtra per questi campi non trova l\'annuncio, e chi lo apre deve chiamare per saperli.', `Compila nel portale: ${mancanti.map(m => m[1]).join(', ')}.`)
  else if (!mancanti.length) forza.push('Scheda completa: ci sono tutti i dati principali.')

  // titolo
  const t = f.titolo.trim()
  let titolo = 10
  if (!t) { titolo = 0; p('titolo', 'alta', 'L\'annuncio non ha un titolo tuo.', 'Il titolo e\' la prima riga che si legge in lista: senza, l\'annuncio non si distingue.', 'Scrivi un titolo con zona, tipologia e un punto di forza.') }
  else {
    if (t.length > 60) { titolo -= 3; p('titolo', 'media', `Il titolo e\' lungo ${t.length} caratteri: il portale lo taglia a 60.`, 'La parte finale, spesso il punto di forza, non si vede.', 'Accorcialo sotto i 60 caratteri, zona per prima.') }
    if (VUOTI.test(t)) { titolo -= 3; p('titolo', 'bassa', `Il titolo usa aggettivi vuoti ("${t.match(VUOTI)![0]}").`, 'Non dicono niente di concreto e sembrano pubblicità.', 'Sostituiscili con un punto di forza reale: terrazzo, box, ultimo piano, metro vicina.') }
    if (!TIPOLOGIA.test(t)) titolo -= 2
    if (CONTATTI.test(t)) titolo -= 2
  }

  // descrizione
  const d = f.descrizione.trim(), n = words(d)
  let descr = 20
  if (n < 60) { descr = n ? 6 : 0; p('descrizione', 'alta', n ? `La descrizione e\' di ${n} parole: troppo corta.` : 'Manca la descrizione.', 'Chi legge non trova risposte e passa all\'annuncio dopo.', 'Descrivi ambienti, finiture, dotazioni, zona e servizi vicini: almeno 150 parole.') }
  else if (n < 150) { descr = 13; p('descrizione', 'media', `La descrizione e\' di ${n} parole: si puo\' dire di piu\'.`, 'Le descrizioni complete tengono sull\'annuncio chi e\' davvero interessato.', 'Aggiungi composizione, finiture, dotazioni e cosa c\'e\' vicino.') }
  else forza.push('Descrizione completa e dettagliata.')
  if (VUOTI.test(d)) descr -= 2

  // affidabilita'
  let coer = 15
  if (CONTATTI.test(d)) { coer -= 6; p('descrizione', 'media', 'Nella descrizione ci sono numeri di telefono o email.', 'I portali li nascondono o penalizzano l\'annuncio, e i contatti non passano dal modulo.', 'Toglili dal testo: i contatti vanno nei campi dell\'agenzia.') }
  const mq = parseFloat(f.mq.replace(',', '.')), loc = parseInt(f.locali)
  if (mq && loc && mq / loc < 12) coer -= 4 // piu' locali di quanti ne stiano nei metri
  if (mq && d && !d.includes(String(Math.round(mq)))) coer -= 1

  // foto (solo numero e planimetria: la qualita' la vede solo chi guarda le foto)
  let foto = f.foto >= 15 ? 22 : f.foto >= 10 ? 18 : f.foto >= 5 ? 12 : f.foto ? 6 : 0
  if (f.planimetria) foto += 3; else if (f.foto) p('foto', 'media', 'Non c\'e\' la planimetria.', 'E\' tra le prime cose che l\'acquirente cerca per capire la casa.', 'Aggiungi la planimetria in fondo alla galleria.')
  if (f.foto < 10) p('foto', f.foto < 5 ? 'alta' : 'media', f.foto ? `Solo ${f.foto} foto.` : 'Non ci sono foto.', 'Gli annunci con piu\' foto ricevono piu\' visite e contatti.', 'Pubblica almeno 12-15 foto: tutti gli ambienti, esterni e vista.')
  else forza.push(`${f.foto} foto nella galleria.`)

  // punti dopo le correzioni: dati e testo al massimo, foto fino a 25 (la qualita' non la giudichiamo)
  const criteri: Partial<Criteri> = {
    foto: { punti: foto, punti_dopo: Math.max(foto, 25), nota: `${f.foto} foto${f.planimetria ? ' e planimetria' : ''}`, limite: 'La qualita\' delle foto (luce, ordine, prima foto) si valuta guardandole.' },
    dati: { punti: datiPunti, punti_dopo: 25, nota: mancanti.length ? `Mancano: ${mancanti.map(m => m[1].toLowerCase()).join(', ')}` : 'Tutti i dati principali', limite: '' },
    descrizione: { punti: Math.max(0, descr), punti_dopo: 20, nota: `${n} parole`, limite: '' },
    coerenza: { punti: Math.max(0, coer), punti_dopo: 15, nota: CONTATTI.test(d) ? 'Contatti nel testo' : 'Dati coerenti', limite: '' },
    titolo: { punti: Math.max(0, titolo), punti_dopo: 10, nota: t ? `${t.length} caratteri` : 'Assente', limite: '' },
  }
  const ordine = { alta: 0, media: 1, bassa: 2 }
  const r = withScores({ criteri })
  return {
    ...r,
    sintesi: r.score >= 80 ? 'Annuncio solido: restano pochi ritocchi.' : r.score >= 60 ? 'Buona base, ma mancano cose che chi cerca guarda subito.' : 'L\'annuncio perde contatti: mancano dati e cura nel testo e nelle foto.',
    punti_forza: forza.slice(0, 4),
    problemi: problemi.sort((a, b) => ordine[a.gravita] - ordine[b.gravita]).slice(0, 4),
    dati_mancanti: mancanti.map(m => m[1]),
    foto_consigli: [],
    titolo: f.titolo, descrizione: f.descrizione,
    riscritto: false,
  }
}

// ponytail: controllo minimo, `npx tsx src/lib/listingRules.ts`
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('listingRules.ts')) {
  const vuoto = rulesAnalysis(EMPTY_FIELDS)
  const pieno = rulesAnalysis({ ...EMPTY_FIELDS, titolo: 'Prati, trilocale con box a due passi dalla metro', descrizione: 'parola '.repeat(200) + '95', prezzo: '598000', mq: '95', locali: '3', camere: '2', bagni: '2', piano: '3', classe_energetica: 'C', riscaldamento: 'autonomo', spese_condominiali: '150', stato: 'buono', anno_costruzione: '1960', box_posto_auto: 'box', esposizione: 'doppia', planimetria: true, foto: 16 })
  console.assert(vuoto.score < 20 && vuoto.problemi.length === 4, 'vuoto basso', vuoto.score)
  console.assert(pieno.score >= 85 && pieno.problemi.length === 0, 'pieno alto', pieno.score, pieno.problemi)
  console.assert(CRITERI.every(c => pieno.criteri[c.key].punti_dopo <= c.max), 'dentro i massimi')
  console.log('ok', vuoto.score, pieno.score)
}
