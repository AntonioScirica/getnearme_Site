// Controllo del filtro parolacce: npx tsx scripts/profanity-check.ts (esce con 1 se sbaglia)
import { hasProfanity, badSlug } from '../src/lib/profanity'
const bad = ['che cazzo', 'porco dio', 'diocane', 'Dio c4ne', 'madonna puttana', 'porca madonna', 'vaffanculo', 'sei uno stronzo', 'fuck you', 'CAZZZZO', 'hijo de puta', 'scheiße', 'merde alors', 'figlio di puttana']
const good = ['Trilocale con pompa di calore', 'Pareti nude e luminose', 'Cazzaniga', 'Classe energetica A', 'Via Madonna di Campiglio', 'Troia (FG)', 'Canale privato', 'Finocchio in giardino', 'Casa in pietra, 300 m² con 4 camere', 'Pesce fresco al mercato', 'Studio canestro', 'Cristo Re, parrocchia', 'Sexy loft? no: luminoso']
const fp = good.filter(hasProfanity), fn = bad.filter(t => !hasProfanity(t))
console.log('falsi positivi:', fp); console.log('mancati:', fn)
console.log('slug', badSlug('studio-cazz-o'), badSlug('mario-rossi'), badSlug('cazzaniga-casa'))
if (fn.length || fp.length) process.exit(1)
