import type { ProjectData } from './projects'

// Solo in sviluppo: 10 immobili finti per provare mappa e lista senza toccare il database.
const photos = ['2005025054', '2005025068', '2005025050', '2005025056', '2005025058', '2005025060'].map(i => `https://pwm.im-cdn.it/image/${i}/xxl.jpg`)
const rows: [string, string, number, number, number, number][] = [
  ['Trilocale arredato con box, zona Bocconi', 'Via Bernardino Verro 12, Milano', 598000, 95, 2, 1],
  ['Bilocale ristrutturato vicino alla metro', 'Via Padova 120, Milano', 289000, 60, 1, 1],
  ['Attico con terrazzo vista città', 'Corso Como 3, Milano', 1250000, 180, 3, 2],
  ['Quadrilocale luminoso, Porta Romana', 'Viale Sabotino 22, Milano', 640000, 120, 3, 2],
  ['Loft in ex fabbrica, Lambrate', 'Via Ventura 5, Milano', 420000, 85, 1, 1],
  ['Trilocale con balcone, Isola', 'Via Borsieri 20, Milano', 520000, 90, 2, 1],
  ['Bilocale su Navigli', 'Alzaia Naviglio Grande 44, Milano', 375000, 55, 1, 1],
  ['Quadrilocale signorile, Magenta', 'Corso Magenta 60, Milano', 1480000, 160, 3, 3],
  ['Trilocale nuovo con giardino, CityLife', 'Via Senofonte 8, Milano', 890000, 105, 2, 2],
  ['Monolocale arredato, Città Studi', 'Via Pascoli 30, Milano', 219000, 38, 1, 1],
]
export const FAKE_PROPERTIES: ProjectData[] = rows.map(([titolo, addr, prezzo, mq, camere, bagni], i) => ({
  id: `fake-${i}`, nome: '', titolo, addr, prezzo, mq, camere, bagni, tipologia: 'Appartamento',
  cover: photos[i % photos.length], is_public: i % 3 !== 1, import_data: { score: 55 + ((i * 7) % 35) },
}))
