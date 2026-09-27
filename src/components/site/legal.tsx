'use client';

import { Container, H, useSite } from './ui';
import { RichText } from './extras';

// Informativa privacy e cookie del sito di un agente, generate dai dati del sito: titolare e' l'agente,
// Agente Immo e' responsabile del trattamento (art. 28 GDPR). Base di partenza da far rivedere a un legale.
const PLATFORM = 'Antonio Scirica, che opera con il marchio Agente Immo / Agente Immo (as.scirica@gmail.com)';

export function LegalPage({ doc }: { doc: 'privacy' | 'cookie' }) {
  const { cfg, name } = useSite();
  const titolare = [name, cfg.legal, cfg.address || cfg.city, cfg.email, cfg.phone].filter(Boolean).join(', ');
  const contatto = cfg.email ? `scrivendo a ${cfg.email}` : 'usando i contatti indicati nel sito';
  const privacy = `Questa informativa spiega come vengono trattati i dati personali di chi visita questo sito e di chi usa il modulo di contatto (art. 13 del Regolamento UE 2016/679, GDPR).

## Titolare del trattamento
${titolare}.

## Quali dati trattiamo
Dati che ci invii con il modulo di contatto: nome e cognome, email, telefono, messaggio e l'immobile per cui scrivi.
Dati tecnici di navigazione: indirizzo IP, tipo di browser, pagine visitate e orario, raccolti in automatico dai server che ospitano il sito e conservati per poco tempo a fini di sicurezza.
Gli immobili che salvi tra i preferiti restano solo nel tuo browser: non ci vengono inviati.

## Perché e su quale base
Rispondere alla tua richiesta e fornirti le informazioni sugli immobili: base giuridica l'esecuzione di misure precontrattuali su tua richiesta (art. 6.1.b GDPR).
Proteggere il sito da abusi e invii automatici: base giuridica il legittimo interesse del titolare (art. 6.1.f GDPR).
Non usiamo i tuoi dati per profilazione né per pubblicità, e non li vendiamo.

## Per quanto tempo
La richiesta arriva per email al titolare e non viene archiviata sul sito. Il titolare la conserva per il tempo necessario a gestirla e al massimo per 24 mesi dall'ultimo contatto, salvo obblighi di legge o un rapporto contrattuale in corso.

## Chi può trattare i dati
Il sito è realizzato con la piattaforma Agente Immo, di ${PLATFORM}, che agisce come responsabile del trattamento (art. 28 GDPR) e si avvale di fornitori per hosting (Vercel), invio delle email (Resend), archiviazione delle immagini (Cloudflare) e database (Supabase). Alcuni di questi fornitori hanno sede negli Stati Uniti: il trasferimento avviene sulla base dell'EU-US Data Privacy Framework o delle clausole contrattuali standard della Commissione europea.

## I tuoi diritti
Puoi chiedere in ogni momento l'accesso ai tuoi dati, la rettifica, la cancellazione, la limitazione del trattamento, la portabilità e opporti al trattamento (artt. 15-22 GDPR), ${contatto}. Hai anche il diritto di proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).

## Cookie
Questo sito usa solo strumenti tecnici necessari al suo funzionamento. I dettagli sono nella cookie policy.`;
  const cookie = `Questa pagina spiega quali cookie e strumenti simili usa questo sito (art. 122 del Codice privacy e Linee guida del Garante del 10 giugno 2021).

## Cookie tecnici
Il sito non usa cookie di profilazione, né cookie analitici o pubblicitari, né di terze parti. Per questo non ti chiediamo alcun consenso.
Gli immobili che salvi tra i preferiti sono memorizzati solo nel tuo browser (localStorage) e servono solo a mostrarteli: puoi cancellarli dalle impostazioni del browser.

## Mappe, caratteri e immagini
Mappe, caratteri tipografici e foto sono serviti dai nostri server: aprendo il sito il tuo browser non contatta Google, Esri o altri servizi esterni.

## Contenuti esterni
Tour virtuali e video (ad esempio YouTube, Vimeo, Matterport) si caricano solo se premi "Mostra il tour": da quel momento il sito che li ospita può raccogliere dati e usare cookie secondo la sua informativa. Lo stesso vale per i link che aprono Google Maps o WhatsApp.

## Titolare
${titolare}. Per ogni domanda puoi contattarci ${contatto}. Maggiori informazioni sul trattamento dei dati sono nell'informativa privacy.`;
  return (
    <Container className="max-w-3xl py-16">
      <H as="h1" className="text-4xl md:text-5xl">{doc === 'privacy' ? 'Informativa privacy' : 'Cookie policy'}</H>
      <RichText text={doc === 'privacy' ? privacy : cookie} className="mt-8 [&_p]:text-base" />
    </Container>
  );
}
