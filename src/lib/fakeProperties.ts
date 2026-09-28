import type { ProjectData } from './projects'

// 10 immobili finti, tutti a Roma: in sviluppo per provare mappa e lista, in produzione come esempio in Immobili
// finche' l'agente non ne ha uno e nelle miniature dei modelli del sito. Foto nostre, mai quelle dei portali.
const photos = ['/staging/1.jpg', '/staging/2.jpg', '/immo/home/demo-after.webp', '/staging/3.jpg', '/staging/4.jpg', '/immo/home/demo-1.webp', '/staging/5.jpg', '/staging/6.jpg', '/staging/1_real.jpg', '/staging/2_real.jpg']
// coordinate fisse: la mappa inquadra subito Roma, senza aspettare la geolocalizzazione degli indirizzi
const rows: [string, string, number, number, number, number, [number, number]][] = [
  ['Trilocale arredato con box, zona Prati', 'Via Cola di Rienzo 120, Roma', 598000, 95, 2, 1, [41.9075, 12.4620]],
  ['Bilocale ristrutturato vicino alla metro', 'Via Tuscolana 210, 00182 Roma', 289000, 60, 1, 1, [41.8800, 12.5290]],
  ['Attico con terrazzo vista cupole', 'Via del Corso 300, Roma', 1250000, 180, 3, 2, [41.9010, 12.4810]],
  ['Quadrilocale luminoso, San Giovanni', 'Via Appia Nuova 45, 00183 Roma', 640000, 120, 3, 2, [41.8830, 12.5130]],
  ['Loft in ex fabbrica, Ostiense', 'Via Ostiense 95, Roma', 420000, 85, 1, 1, [41.8680, 12.4800]],
  ['Trilocale con balcone, Monteverde', 'Via di Donna Olimpia 20, Roma', 520000, 90, 2, 1, [41.8760, 12.4520]],
  ['Bilocale a Trastevere', 'Via della Lungaretta 44, Roma', 375000, 55, 1, 1, [41.8890, 12.4720]],
  ['Quadrilocale signorile, Parioli', 'Viale Parioli 60, Roma', 1480000, 160, 3, 3, [41.9270, 12.4920]],
  ['Trilocale nuovo con giardino, EUR', 'Viale Europa 100, 00144 Roma', 890000, 105, 2, 2, [41.8330, 12.4700]],
  ['Monolocale arredato, San Lorenzo', 'Via dei Volsci 30, Roma', 219000, 38, 1, 1, [41.8990, 12.5150]],
]
export const FAKE_GEO: Record<string, [number, number]> = Object.fromEntries(rows.map(r => [r[1], r[6]]))
export const FAKE_PROPERTIES: ProjectData[] = rows.map(([titolo, addr, prezzo, mq, camere, bagni], i) => ({
  id: `fake-${i}`, nome: '', titolo, addr, prezzo, mq, camere, bagni, tipologia: 'Appartamento',
  cover: photos[i % photos.length], is_public: i % 3 !== 1, import_data: { score: 55 + ((i * 7) % 35) },
}))

// Solo in sviluppo: Galleria di prova per i primi 4 immobili finti (prima, dopo e passaggi)
const S = (n: string) => `/staging/${n}`
type FakeMedia = { id: string; dopo: string; prima: string | null; at: number; casa: string | null; text: string; room: string; steps: { url: string; text: string }[]; all: string; keys: string[] }
const fm = (i: number, casa: number, hoursAgo: number, room: string, prima: string, steps: [string, string][]): FakeMedia => ({
  id: `fake-media-${i}`, casa: `fake-${casa}`, room, prima, at: Date.parse('2026-09-25T12:00:00Z') - hoursAgo * 3_600_000,
  dopo: steps[steps.length - 1][0], text: steps[steps.length - 1][1], steps: steps.map(([url, text]) => ({ url, text })),
  all: steps.map(s => s[1]).join(' '), keys: [],
})
// 4 immobili x 15 lavori = 60 foto: abbastanza per vedere lo scorrimento infinito (24 alla volta)
const ROOMS = ['un soggiorno', 'una cucina', 'una camera da letto', 'un bagno', 'un balcone', 'uno studio', 'una sala da pranzo']
const REQS = ['Arreda moderno', 'Arreda nordico', 'Cucina moderna', 'Camera accogliente', 'Bagno moderno', 'Arreda il balcone', 'cuscini verdi sul divano', 'togli il quadro', 'pavimento in rovere chiaro', 'più luce naturale', 'tende di lino bianche', 'Svuota la stanza']
const AFTERS = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'].map(S)
const BEFORES = [S('1_real.jpg'), S('2_real.jpg'), S('before.jpg'), '/demo/foto_demo.jpg', ...photos]
export const FAKE_MEDIA: FakeMedia[] = Array.from({ length: 60 }, (_, i) => {
  const n = 1 + (i % 3) // 1-3 passaggi
  return fm(i, i % 4, i * 7 + (i % 5), ROOMS[i % ROOMS.length], BEFORES[i % BEFORES.length],
    Array.from({ length: n }, (_, j) => [AFTERS[(i + j) % AFTERS.length], REQS[(i * 3 + j) % REQS.length]] as [string, string]))
})
