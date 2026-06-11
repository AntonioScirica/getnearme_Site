// Add story fields to slide_data for all 42 PED topics
const SUPA_URL = "https://ecrnpyksnfyykqwnutwa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcm5weWtzbmZ5eWtxd251dHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4NjEzOSwiZXhwIjoyMDg0NDQ2MTM5fQ.Z2jdXYjoaO4z0knuBiAYc2PaFwiQ25GweaDjty_Tbz0";
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

async function mergeStory(id, storyFields) {
  // GET current slide_data, merge story fields, PATCH back
  const r1 = await fetch(`${SUPA_URL}/rest/v1/content_topics?id=eq.${id}&select=slide_data`, { headers: H });
  const [row] = await r1.json();
  const merged = { ...(row?.slide_data || {}), ...storyFields };
  const r2 = await fetch(`${SUPA_URL}/rest/v1/content_topics?id=eq.${id}`, {
    method: "PATCH", headers: H, body: JSON.stringify({ slide_data: merged }),
  });
  if (!r2.ok) console.error(`FAIL ${id}: ${r2.status}`);
  return r2.ok;
}

const STORIES = [
  // ── Jun 15 ──
  { id: "79a2b80c-61ae-4d46-85e2-455b7a9eba27", // Il mercato casa è ripartito
    s: { storyBadge: "NUOVO POST", storyHook: "767.000 compravendite.", storyHookHL: "E adesso?", storySub: "Cosa significa per chi vende casa nel 2026." }},
  { id: "46796fa3-adf0-41a8-8379-9506ee1d1d3d", // Il lavoro che il proprietario non vede
    s: { storyBadge: "NUOVO POST", storyHook: "Il tuo lavoro", storyHookHL: "è invisibile?", storySub: "Come rendere visibile il valore che porti." }},
  { id: "633783e2-e519-4da4-82cf-e7b5fb2ca0a4", // Da annuncio a materiali pronti
    s: { storyBadge: "NUOVO POST", storyHook: "Un annuncio contiene", storyHookHL: "quasi tutto.", storySub: "Scopri cosa puoi generare partendo da quello che hai già.", storyHLColor: "blue" }},

  // ── Jun 16 ──
  { id: "9c56b020-788f-460f-919e-c182fd11259a", // Roma: il quartiere pesa più di quanto sembra
    s: { storyBadge: "FOCUS ROMA", storyHook: "Da 1.909 a 8.697 €/m².", storyHookHL: "Stessa città.", storySub: "Il quartiere cambia tutto. Scopri perché." }},
  { id: "ceffe01d-967c-4a91-85c6-72c1b38407c8", // 5 cose che un annuncio dovrebbe spiegare meglio
    s: { storyBadge: "CAROSELLO", storyHook: "Il tuo annuncio spiega", storyHookHL: "abbastanza?", storySub: "5 cose che spesso mancano. Scorri per scoprirle.", storyHLColor: "blue" }},
  { id: "dc4ee68b-621b-49f3-8ce8-5374f9eaac6b", // Report PDF: non solo un file
    s: { storyBadge: "NUOVO POST", storyHook: "Un PDF può cambiare", storyHookHL: "la conversazione.", storySub: "Non è solo un documento. È uno strumento.", storyHLColor: "blue" }},

  // ── Jun 17 ──
  { id: "cbf3f36e-daef-49de-a663-dd78b0992fa5", // 2026: meno corsa, più qualità
    s: { storyBadge: "PREVISIONI", storyHook: "783.000 transazioni", storyHookHL: "previste nel 2026.", storySub: "Cosa cambia per le agenzie." }},
  { id: "0182c02b-64e7-469c-87d7-9f0fda90593b", // Home staging AI: quando ha senso usarlo
    s: { storyBadge: "CAROSELLO", storyHook: "Home staging AI:", storyHookHL: "sì o no?", storySub: "Non sempre serve. Ma quando serve, cambia tutto.", storyHLColor: "blue" }},
  { id: "b52cfeb7-31fc-4eac-bd75-b35fb340b200", // Hai contatti con agenzie immobiliari?
    s: { storyBadge: "AMBASSADOR", storyHook: "I tuoi contatti", storyHookHL: "possono valere.", storySub: "Il programma ambassador in un post." }},

  // ── Jun 18 ──
  { id: "52351a49-18c4-4cd1-b254-e79ddceb9afb", // Milano: prezzi alti, aspettative alte
    s: { storyBadge: "FOCUS MILANO", storyHook: "Fino a 11.300 €/m².", storyHookHL: "Come presenti?", storySub: "Più è alto il prezzo, più conta la presentazione.", storyHLColor: "blue" }},
  { id: "8c10a7a8-a079-4feb-87f0-3661bb8bac3d", // Meno strumenti aperti, più tempo per vendere
    s: { storyBadge: "NUOVO POST", storyHook: "Canva + Excel +", storyHookHL: "PowerPoint = caos.", storySub: "C'è un modo per semplificare." }},
  { id: "04a13f89-4644-4560-a3f8-13063e4175f2", // Come creare un post social da un annuncio
    s: { storyBadge: "NUOVO POST", storyHook: "Post social", storyHookHL: "dall'annuncio?", storySub: "Più continuità, meno improvvisazione.", storyHLColor: "blue" }},

  // ── Jun 19 ──
  { id: "08d67387-0c5a-4575-a2e4-ad43751a584e", // Il dato più utile non è il prezzo. È il confronto.
    s: { storyBadge: "DATI", storyHook: "450.000€.", storyHookHL: "Ti basta come info?", storySub: "Un prezzo senza contesto è solo un numero." }},
  { id: "407509c7-5f97-443a-bbab-b2c9212b7fe7", // Analisi zona: cosa puoi raccontare oltre le foto
    s: { storyBadge: "CAROSELLO", storyHook: "\"Zona ben servita\"", storyHookHL: "non basta più.", storySub: "Cosa raccontare davvero oltre le foto.", storyHLColor: "blue" }},
  { id: "f97f525d-572e-49e1-bcdd-c3214b67acd2", // Il post perfetto non vende da solo. Ma aiuta.
    s: { storyBadge: "CAROSELLO", storyHook: "Un post social", storyHookHL: "a cosa serve?", storySub: "3 ruoli concreti per un'agenzia.", storyHLColor: "blue" }},

  // ── Jun 20 ──
  { id: "64a723a2-942a-4f6c-a8c7-b76b4e9bf2b3", // Roma: Centro Storico a 8.697 €/m²
    s: { storyBadge: "FOCUS ROMA", storyHook: "Centro Storico vs", storyHookHL: "Lunghezza.", storySub: "8.697 contro 1.909 €/m². Stessa Roma." }},
  { id: "ec9c585d-336b-48c2-a322-38a640ac0e86", // Da foto vuota a stanza valorizzata
    s: { storyBadge: "STAGING", storyHook: "Una stanza vuota", storyHookHL: "non si spiega.", storySub: "Il prima/dopo che aiuta il cliente a immaginare.", storyHLColor: "blue" }},
  { id: "3f2487da-f140-44ac-9029-1439b491df94", // Ambassador in 4 passaggi
    s: { storyBadge: "AMBASSADOR", storyHook: "4 passaggi.", storyHookHL: "Zero obblighi.", storySub: "Come funziona il programma ambassador." }},

  // ── Jun 21 ──
  { id: "31749376-f940-4aeb-9093-62d36b3c124e", // Più mercato significa anche più rumore
    s: { storyBadge: "MERCATO", storyHook: "+6,4% compravendite.", storyHookHL: "Più concorrenza.", storySub: "Come distinguersi quando tutti pubblicano." }},
  { id: "653b1d4e-4133-4790-8143-143765f41f81", // L'agente resta al centro
    s: { storyBadge: "NUOVO POST", storyHook: "La tecnologia", storyHookHL: "non ti sostituisce.", storySub: "Cosa resta umano e cosa può essere automatizzato." }},
  { id: "e5dcf853-7796-41cc-afe0-39ccac05b858", // Come si prepara un appuntamento in 10 minuti
    s: { storyBadge: "NUOVO POST", storyHook: "10 minuti.", storyHookHL: "Appuntamento pronto.", storySub: "Dati, zona, materiali. Il metodo conta.", storyHLColor: "blue" }},

  // ── Jun 22 ──
  { id: "c7546a2f-9a62-48f9-9af0-f283ef5a7e95", // Milano: Centro, Porta Nuova e Arco della Pace
    s: { storyBadge: "FOCUS MILANO", storyHook: "Valori simili.", storyHookHL: "Target diversi.", storySub: "Centro, Porta Nuova, Arco della Pace: cosa cambia.", storyHLColor: "blue" }},
  { id: "ec2ae7ea-82c9-4433-bf92-d22b8975a49b", // Il tuo brand dentro ogni materiale
    s: { storyBadge: "CAROSELLO", storyHook: "I tuoi materiali", storyHookHL: "parlano di te?", storySub: "Brand coerente su ogni output. Senza rifare nulla.", storyHLColor: "blue" }},
  { id: "02fcac12-cd67-4934-81a0-f4160a7bcb44", // 4 dati da portare a un proprietario
    s: { storyBadge: "CAROSELLO", storyHook: "Vai dal proprietario.", storyHookHL: "Cosa porti?", storySub: "4 dati che cambiano la percezione.", storyHLColor: "blue" }},

  // ── Jun 23 ──
  { id: "c2836abb-b5cf-496f-bb5d-debae90b42f4", // La velocità è un vantaggio commerciale
    s: { storyBadge: "NUOVO POST", storyHook: "Rispondere prima.", storyHookHL: "Vendere prima.", storySub: "La velocità non è comodità. È strategia." }},
  { id: "6bd7590e-cdfc-47bb-968c-9e187e3a11dc", // L'Italia non ha un solo mercato immobiliare
    s: { storyBadge: "MERCATO", storyHook: "Un dato nazionale", storyHookHL: "non basta.", storySub: "Ogni zona ha la sua storia. Sai raccontarla?" }},
  { id: "9072e97e-b4f3-4908-bb78-25bfe20d8413", // Come funziona l'analisi zona
    s: { storyBadge: "FEATURE", storyHook: "Cosa c'è intorno", storyHookHL: "all'immobile?", storySub: "Trasporti, scuole, servizi. Non sono dettagli.", storyHLColor: "blue" }},

  // ── Jun 24 ──
  { id: "a8d31c08-3c13-49ea-907e-899c63b730ab", // Roma EUR: contesto e servizi pesano
    s: { storyBadge: "FOCUS ROMA", storyHook: "EUR, Torrino,", storyHookHL: "Tintoretto.", storySub: "Fino a 5.090 €/m². Il contesto è tutto." }},
  { id: "f268f208-1772-48e3-b241-648fc04a9396", // Report, video, post: tutto parte dall'annuncio
    s: { storyBadge: "CAROSELLO", storyHook: "Quanti strumenti", storyHookHL: "usi ogni giorno?", storySub: "Un flusso. Molti output. Meno dispersione.", storyHLColor: "blue" }},
  { id: "7af51f75-0b2a-42fb-ad33-dfcfe62ecec8", // Una relazione può diventare valore
    s: { storyBadge: "AMBASSADOR", storyHook: "Una relazione.", storyHookHL: "Un'opportunità.", storySub: "Il programma per chi conosce agenzie." }},

  // ── Jun 25 ──
  { id: "fc7751cf-48c4-430b-a246-2b40dea627f7", // Prezzi in crescita: opportunità o difficoltà?
    s: { storyBadge: "MERCATO", storyHook: "Prezzi +3,2%.", storyHookHL: "Bene o male?", storySub: "Il cliente diventa più attento. E tu?" }},
  { id: "a9232d11-c4d3-4cfc-96a0-64dbcb755329", // Cosa deve contenere un report immobiliare utile
    s: { storyBadge: "CAROSELLO", storyHook: "Il tuo report", storyHookHL: "è completo?", storySub: "6 elementi che fanno la differenza.", storyHLColor: "blue" }},
  { id: "0f9f6509-e5f0-4a3c-93e4-4589c418d9be", // Demo: da annuncio a PDF cliente
    s: { storyBadge: "DEMO", storyHook: "Da annuncio a", storyHookHL: "PDF cliente.", storySub: "Non è solo un file. È il tuo strumento.", storyHLColor: "blue" }},

  // ── Jun 26 ──
  { id: "81f698b7-1b60-4090-8521-f146d4515640", // Milano affitti: non solo vendita
    s: { storyBadge: "FOCUS MILANO", storyHook: "Affitti fino a", storyHookHL: "31 €/m² mese.", storySub: "Anche le locazioni meritano qualità.", storyHLColor: "blue" }},
  { id: "4b24c292-5d0b-4adc-99f7-6cbab91e1b4f", // Non solo AI: metodo, dati e materiali pronti
    s: { storyBadge: "NUOVO POST", storyHook: "Non è l'AI.", storyHookHL: "È il metodo.", storySub: "Il vero valore è nel flusso, non nel buzzword.", storyHLColor: "blue" }},
  { id: "f590952c-c66f-4704-9ff8-b8d77c64c89b", // Da agente operativo ad agente consulenziale
    s: { storyBadge: "CAROSELLO", storyHook: "Operativo o", storyHookHL: "consulenziale?", storySub: "Due modi di lavorare. Uno fa la differenza.", storyHLColor: "blue" }},

  // ── Jun 27 ──
  { id: "5f541c88-e1b5-4c41-aa31-603af9094bed", // Il cliente è più informato
    s: { storyBadge: "MERCATO", storyHook: "Il cliente sa già", storyHookHL: "quasi tutto.", storySub: "Arriva con dati. Tu devi arrivare con di più." }},
  { id: "f8cf646f-ebaa-4c00-86ac-e38beacf8856", // Perché è facile proporre GetNearMe a un'agenzia
    s: { storyBadge: "AMBASSADOR", storyHook: "Facile da proporre.", storyHookHL: "Facile da capire.", storySub: "Perché ogni agenzia ha già il problema." }},
  { id: "dccc35ea-3407-4b4c-9104-764da6605074", // La demo che vedrai in call
    s: { storyBadge: "DEMO", storyHook: "Niente slide.", storyHookHL: "Solo pratica.", storySub: "Cosa succede davvero in una demo GetNearMe.", storyHLColor: "blue" }},

  // ── Jun 28 ──
  { id: "193b2a30-34d7-44a6-888b-016057ab2a82", // Da 1.909 a 11.300 €/m²: il divario Roma-Milano
    s: { storyBadge: "ROMA & MILANO", storyHook: "5,9 volte.", storyHookHL: "Stesso Paese.", storySub: "Il divario Roma-Milano in un dato." }},
  { id: "40a665ff-aaf6-4465-a036-a9dac48ee9ff", // Tutto quello che GetNearMe ti evita di fare a mano
    s: { storyBadge: "CAROSELLO", storyHook: "Quanto tempo perdi", storyHookHL: "ogni settimana?", storySub: "Tutto quello che puoi evitare di fare a mano.", storyHLColor: "blue" }},
  { id: "08931c03-33be-4b96-979f-b59f5f196c8a", // Prova a immaginare il tuo prossimo annuncio così
    s: { storyBadge: "NUOVO POST", storyHook: "Il prossimo annuncio?", storyHookHL: "Immaginalo diverso.", storySub: "Non una scheda. Un punto di partenza." }},
];

async function main() {
  let ok = 0, fail = 0;
  for (const { id, s } of STORIES) {
    const success = await mergeStory(id, s);
    if (success) ok++; else fail++;
  }
  console.log(`Done: ${ok} updated, ${fail} failed (total: ${STORIES.length})`);
}
main();
