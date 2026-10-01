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
  no_titolo?: boolean // portale che non fa scrivere un titolo all'agente (idealista): il titolo non si valuta
}
export const EMPTY_FIELDS: Fields = {
  titolo: '', descrizione: '', prezzo: '', mq: '', locali: '', camere: '', bagni: '', piano: '', classe_energetica: '', riscaldamento: '',
  spese_condominiali: '', anno_costruzione: '', stato: '', box_posto_auto: '', esposizione: '', ascensore: '', balcone_terrazzo: '',
  arredato: '', disponibilita: '', zona: '', contratto: '', planimetria: false, foto: 0,
}
type Problem = { area: 'titolo' | 'descrizione' | 'foto' | 'dati' | 'prezzo'; gravita: 'alta' | 'media' | 'bassa'; problema: string; perche: string; soluzione: string; foto_indice: number; foto_stanza: string; modifica_foto: string }

// testi per l'agente in italiano o inglese (la lingua la manda il client, default italiano)
export type Lang = 'it' | 'en'
const t = (lang: Lang, it: string, en: string) => (lang === 'en' ? en : it)

// dati che l'acquirente filtra o chiede per primi, con il peso nel criterio "dati" (somma 25)
const DATI: [keyof Fields, string, number, string][] = [
  ['prezzo', 'Prezzo', 4, 'Price'], ['mq', 'Superficie', 4, 'Floor area'], ['locali', 'Locali', 2, 'Rooms'], ['bagni', 'Bagni', 2, 'Bathrooms'], ['piano', 'Piano', 2, 'Floor'],
  ['classe_energetica', 'Classe energetica', 3, 'Energy class'], ['riscaldamento', 'Riscaldamento', 2, 'Heating'], ['spese_condominiali', 'Spese condominiali', 2, 'Condo fees'],
  ['stato', 'Stato dell\'immobile', 1, 'Property condition'], ['anno_costruzione', 'Anno di costruzione', 1, 'Year built'], ['box_posto_auto', 'Box o posto auto', 1, 'Garage or parking'], ['esposizione', 'Esposizione', 1, 'Exposure'],
]
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const VUOTI = /\b(splendid[oa]|imperdibile|occasione unica|affare|bellissim[oa]|stupend[oa]|meraviglios[oa])\b/i
// telefoni italiani (cellulare 3xx o fisso 0x, anche con +39) ed email; non riferimenti, date o prezzi
const CONTATTI = /(?:\+39[\s.]?)?(?<!\d)(?:3\d{2}|0\d{1,3})[\s./-]?\d{3}[\s./-]?\d{3,4}(?!\d)|[\w.+-]+@[\w-]+\.[a-z]{2,}/i
const TIPOLOGIA = /\b(monolocale|bilocale|trilocale|quadrilocale|pentalocale|attico|mansarda|loft|villa|villino|villetta|rustico|casale|open space)\b/i

export function rulesAnalysis(f: Fields, lang: Lang = 'it') {
  const name = (m: (typeof DATI)[number]) => (lang === 'en' ? m[3] : m[1])
  const problemi: Problem[] = []
  const forza: string[] = []
  const p = (area: Problem['area'], gravita: Problem['gravita'], problema: string, perche: string, soluzione: string) =>
    problemi.push({ area, gravita, problema, perche, soluzione, foto_indice: 0, foto_stanza: '', modifica_foto: '' })

  // dati della scheda
  const mancanti = DATI.filter(([k]) => !String(f[k] ?? '').trim())
  const datiPunti = DATI.reduce((s, [k, , w]) => s + (String(f[k] ?? '').trim() ? w : 0), 0)
  if (mancanti.length >= 3) p('dati', mancanti.length >= 5 ? 'alta' : 'media', t(lang, `Mancano ${mancanti.length} dati che chi cerca guarda subito: ${mancanti.slice(0, 4).map(m => m[1].toLowerCase()).join(', ')}.`, `${mancanti.length} details buyers look at first are missing: ${mancanti.slice(0, 4).map(m => m[3].toLowerCase()).join(', ')}.`),
    t(lang, 'Chi filtra per questi campi non trova l\'annuncio, e chi lo apre deve chiamare per saperli.', 'Buyers who filter by these fields never find the listing, and those who open it have to call to ask.'), t(lang, 'Compila nel portale: ', 'Fill in on the portal: ') + `${mancanti.map(name).join(', ')}.`)
  else if (!mancanti.length) forza.push(t(lang, 'Scheda completa: ci sono tutti i dati principali.', 'Complete details: all the key information is there.'))

  // titolo
  const tt = f.titolo.trim()
  let titolo = 10
  if (f.no_titolo) titolo = 10
  else if (!tt) { titolo = 0; p('titolo', 'alta', t(lang, 'L\'annuncio non ha un titolo tuo.', 'The listing has no title of your own.'), t(lang, 'Il titolo è la prima riga che si legge in lista: senza, l\'annuncio non si distingue.', 'The title is the first line people read in the results: without one, the listing does not stand out.'), t(lang, 'Scrivi un titolo con zona, tipologia e un punto di forza.', 'Write a title with the area, property type and one selling point.')) }
  else {
    if (tt.length > 60) { titolo -= 3; p('titolo', 'media', t(lang, `Il titolo è lungo ${tt.length} caratteri: il portale lo taglia a 60.`, `The title is ${tt.length} characters long: the portal cuts it at 60.`), t(lang, 'La parte finale, spesso il punto di forza, non si vede.', 'The end of it, often the selling point, is not shown.'), t(lang, 'Accorcialo sotto i 60 caratteri, zona per prima.', 'Keep it under 60 characters, with the area first.')) }
    if (VUOTI.test(tt)) { titolo -= 3; p('titolo', 'bassa', t(lang, `Il titolo usa aggettivi vuoti ("${tt.match(VUOTI)![0]}").`, `The title uses empty adjectives ("${tt.match(VUOTI)![0]}").`), t(lang, 'Non dicono niente di concreto e sembrano pubblicità.', 'They say nothing concrete and sound like advertising.'), t(lang, 'Sostituiscili con un punto di forza reale: terrazzo, box, ultimo piano, metro vicina.', 'Replace them with a real selling point: terrace, garage, top floor, metro nearby.')) }
    if (!TIPOLOGIA.test(tt)) titolo -= 2
    if (CONTATTI.test(tt)) titolo -= 2
  }

  // descrizione
  const d = f.descrizione.trim(), n = words(d)
  let descr = 20
  if (n < 60) { descr = n ? 6 : 0; p('descrizione', 'alta', n ? t(lang, `La descrizione è di ${n} parole: troppo corta.`, `The description is ${n} words: too short.`) : t(lang, 'Manca la descrizione.', 'The description is missing.'), t(lang, 'Chi legge non trova risposte e passa all\'annuncio dopo.', 'Readers find no answers and move on to the next listing.'), t(lang, 'Descrivi ambienti, finiture, dotazioni, zona e servizi vicini: almeno 150 parole.', 'Describe the rooms, finishes, features, area and nearby services: at least 150 words.')) }
  else if (n < 150) { descr = 13; p('descrizione', 'media', t(lang, `La descrizione è di ${n} parole: si può dire di più.`, `The description is ${n} words: there is more to say.`), t(lang, 'Le descrizioni complete tengono sull\'annuncio chi è davvero interessato.', 'Complete descriptions keep genuinely interested buyers on the listing.'), t(lang, 'Aggiungi composizione, finiture, dotazioni e cosa c\'è vicino.', 'Add the layout, finishes, features and what is nearby.')) }
  else forza.push(t(lang, 'Descrizione completa e dettagliata.', 'Complete, detailed description.'))
  if (VUOTI.test(d)) descr -= 2

  // affidabilita'
  let coer = 15
  if (CONTATTI.test(d)) { coer -= 6; p('descrizione', 'media', t(lang, 'Nella descrizione ci sono numeri di telefono o email.', 'The description contains phone numbers or emails.'), t(lang, 'I portali li nascondono o penalizzano l\'annuncio, e i contatti non passano dal modulo.', 'Portals hide them or penalise the listing, and leads bypass the contact form.'), t(lang, 'Toglili dal testo: i contatti vanno nei campi dell\'agenzia.', 'Remove them from the text: contact details belong in the agency fields.')) }
  const mq = parseFloat(f.mq.replace(',', '.')), loc = parseInt(f.locali)
  if (mq && loc && mq / loc < 12) coer -= 4 // piu' locali di quanti ne stiano nei metri
  if (mq && d && !d.includes(String(Math.round(mq)))) coer -= 1

  // foto (solo numero e planimetria: la qualita' la vede solo chi guarda le foto)
  let foto = f.foto >= 15 ? 22 : f.foto >= 10 ? 18 : f.foto >= 5 ? 12 : f.foto ? 6 : 0
  if (f.planimetria) foto += 3; else if (f.foto) p('foto', 'media', t(lang, 'Non c\'è la planimetria.', 'There is no floor plan.'), t(lang, 'E\' tra le prime cose che l\'acquirente cerca per capire la casa.', 'It is one of the first things buyers look for to understand the property.'), t(lang, 'Aggiungi la planimetria in fondo alla galleria.', 'Add the floor plan at the end of the gallery.'))
  if (f.foto < 10) p('foto', f.foto < 5 ? 'alta' : 'media', f.foto ? t(lang, `Solo ${f.foto} foto.`, `Only ${f.foto} photos.`) : t(lang, 'Non ci sono foto.', 'There are no photos.'), t(lang, 'Gli annunci con più foto ricevono più visite e contatti.', 'Listings with more photos get more views and leads.'), t(lang, 'Pubblica almeno 12-15 foto: tutti gli ambienti, esterni e vista.', 'Post at least 12-15 photos: every room, the outside and the view.'))
  else forza.push(t(lang, `${f.foto} foto nella galleria.`, `${f.foto} photos in the gallery.`))

  // punti dopo le correzioni: dati e testo al massimo, foto fino a 25 (la qualita' non la giudichiamo)
  const criteri: Partial<Criteri> = {
    foto: { punti: foto, punti_dopo: Math.max(foto, 25), nota: t(lang, `${f.foto} foto${f.planimetria ? ' e planimetria' : ''}`, `${f.foto} photos${f.planimetria ? ' and floor plan' : ''}`), limite: t(lang, 'La qualità delle foto (luce, ordine, prima foto) si valuta guardandole.', 'Photo quality (light, tidiness, first photo) can only be judged by looking at them.') },
    dati: { punti: datiPunti, punti_dopo: 25, nota: mancanti.length ? t(lang, 'Mancano: ', 'Missing: ') + mancanti.map(m => name(m).toLowerCase()).join(', ') : t(lang, 'Tutti i dati principali', 'All key details'), limite: '' },
    descrizione: { punti: Math.max(0, descr), punti_dopo: 20, nota: t(lang, `${n} parole`, `${n} words`), limite: '' },
    coerenza: { punti: Math.max(0, coer), punti_dopo: 15, nota: CONTATTI.test(d) ? t(lang, 'Contatti nel testo', 'Contact details in the text') : t(lang, 'Dati coerenti', 'Consistent details'), limite: '' },
    titolo: { punti: Math.max(0, titolo), punti_dopo: 10, nota: f.no_titolo ? t(lang, 'Il portale lo crea da solo', 'The portal creates it automatically') : tt ? t(lang, `${tt.length} caratteri`, `${tt.length} characters`) : t(lang, 'Assente', 'Missing'), limite: '' },
  }
  const ordine = { alta: 0, media: 1, bassa: 2 }
  const r = withScores({ criteri })
  return {
    ...r,
    sintesi: r.score >= 80 ? t(lang, 'Annuncio solido: restano pochi ritocchi.', 'Solid listing: only a few touches left.') : r.score >= 60 ? t(lang, 'Buona base, ma mancano cose che chi cerca guarda subito.', 'Good base, but it is missing things buyers look at first.') : t(lang, 'L\'annuncio perde contatti: mancano dati e cura nel testo e nelle foto.', 'The listing is losing leads: it lacks details and care in the text and photos.'),
    punti_forza: forza.slice(0, 4),
    problemi: problemi.sort((a, b) => ordine[a.gravita] - ordine[b.gravita]).slice(0, 4),
    dati_mancanti: mancanti.map(name),
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
