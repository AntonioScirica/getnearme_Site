// Shorten ped-post-singolo bodies: max 2 paragraphs, complete sentences, no overflow
const SUPA_URL = "https://ecrnpyksnfyykqwnutwa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcm5weWtzbmZ5eWtxd251dHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4NjEzOSwiZXhwIjoyMDg0NDQ2MTM5fQ.Z2jdXYjoaO4z0knuBiAYc2PaFwiQ25GweaDjty_Tbz0";
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" };

const FIXES = [
  { id: "46796fa3-adf0-41a8-8379-9506ee1d1d3d",
    body: `Dietro ogni immobile c'è lavoro invisibile: analisi, confronto, selezione foto, descrizioni.<br><br><strong>GetNearMe lo trasforma in materiali chiari e presentabili.</strong> Così il cliente capisce cosa fai per lui.` },
  { id: "dc4ee68b-621b-49f3-8ce8-5374f9eaac6b",
    body: `Un report PDF non serve solo a fare bella figura.<br><br>Serve a <strong>spiegare meglio il prezzo e rendere leggibile il confronto con la zona.</strong> Il proprietario percepisce il lavoro dell'agenzia.` },
  { id: "cbf3f36e-daef-49de-a663-dd78b0992fa5",
    body: `Secondo Nomisma, nel 2026 le compravendite potrebbero crescere dell'1,8%, intorno a 783.000 transazioni.<br><br><strong>Non è un mercato fermo. È un mercato che richiede più metodo</strong> per presentare bene ogni immobile.` },
  { id: "8c10a7a8-a079-4feb-87f0-3661bb8bac3d",
    body: `Il problema non è usare strumenti digitali. È usarne troppi, tutti separati: Canva, PowerPoint, Excel.<br><br><strong>GetNearMe semplifica il flusso:</strong> parte dall'annuncio e centralizza gli output più utili.` },
  { id: "64a723a2-942a-4f6c-a8c7-b76b4e9bf2b3",
    body: `A maggio 2026 Roma non è un solo mercato: tra Centro Storico e periferia i valori cambiano anche di 4 volte.<br><br><strong>Ogni zona ha una domanda e una percezione diversa.</strong> L'agente deve saperla raccontare.` },
  { id: "ec9c585d-336b-48c2-a322-38a640ac0e86",
    body: `Una stanza vuota sembra più piccola, fredda, difficile da immaginare.<br><br><strong>Il prima/dopo con home staging AI dà una lettura possibile dello spazio.</strong> Non è solo estetica: è percezione del potenziale.` },
  { id: "e5dcf853-7796-41cc-afe0-39ccac05b858",
    body: `Prima di incontrare un proprietario servono dati chiari, contesto della zona e materiali presentabili.<br><br><strong>Con GetNearMe parti dall'annuncio e prepari una base ordinata.</strong> Non è solo velocità, è metodo.` },
  { id: "653b1d4e-4133-4790-8143-143765f41f81",
    body: `GetNearMe automatizza le attività operative, ma <strong>fiducia, ascolto, negoziazione e conoscenza del territorio restano umane.</strong><br><br>Meno peso sul lavoro ripetitivo, più tempo per la relazione e la vendita.` },
  { id: "c2836abb-b5cf-496f-bb5d-debae90b42f4",
    body: `Rispondere prima, arrivare preparati, pubblicare con continuità.<br><br><strong>Nel lavoro immobiliare la velocità è un vantaggio commerciale.</strong> GetNearMe riduce i passaggi manuali, dall'annuncio ai materiali pronti.` },
  { id: "6bd7590e-cdfc-47bb-968c-9e187e3a11dc",
    body: `Il dato nazionale è utile, ma non basta: <strong>le dinamiche cambiano per area, città e quartiere.</strong><br><br>L'agente non deve solo conoscere il mercato. Deve saperlo tradurre in informazioni semplici per il cliente.` },
  { id: "9072e97e-b4f3-4908-bb78-25bfe20d8413",
    body: `Trasporti, scuole, servizi e aree verdi non sono dettagli: <strong>influiscono su percezione, scelta e fiducia.</strong><br><br>Con GetNearMe diventano una parte leggibile del materiale di vendita.` },
  { id: "7af51f75-0b2a-42fb-ad33-dfcfe62ecec8",
    body: `Se conosci agenzie immobiliari, non serve una vendita aggressiva.<br><br><strong>Presenti uno strumento utile a un problema reale.</strong> GetNearMe gestisce demo e attivazione, tu apri la porta giusta.` },
  { id: "4b24c292-5d0b-4adc-99f7-6cbab91e1b4f",
    body: `GetNearMe non nasce per dire "abbiamo l'AI".<br><br>Nasce per un problema concreto: <strong>trasformare il lavoro sull'annuncio in materiali utili e coerenti.</strong> Meno attività manuali, più output pronti.` },
  { id: "dccc35ea-3407-4b4c-9104-764da6605074",
    body: `In call non mostriamo slide.<br><br><strong>Partiamo da un annuncio reale e vediamo cosa può diventare:</strong> report, social, video, analisi zona. Così capisci subito se fa per te.` },
  { id: "5f541c88-e1b5-4c41-aa31-603af9094bed",
    body: `Il cliente arriva dopo aver visto decine di annunci e confrontato prezzi online.<br><br>Questo non rende inutile l'agente, <strong>lo rende più importante.</strong> Servono materiali migliori e dati più chiari.` },
  { id: "08931c03-33be-4b96-979f-b59f5f196c8a",
    body: `Non come una scheda isolata, ma come punto di partenza: <strong>report, video, post, analisi zona, home staging.</strong><br><br>Questo è GetNearMe: ogni annuncio diventa valore commerciale, senza più lavoro manuale.` },
];

let ok = 0;
for (const f of FIXES) {
  const r1 = await fetch(`${SUPA_URL}/rest/v1/content_topics?id=eq.${f.id}&select=slide_data`, { headers: H });
  const [row] = await r1.json();
  const merged = { ...(row?.slide_data || {}), body: f.body };
  const r2 = await fetch(`${SUPA_URL}/rest/v1/content_topics?id=eq.${f.id}`, {
    method: "PATCH", headers: H, body: JSON.stringify({ slide_data: merged }),
  });
  if (r2.ok) ok++; else console.error(`FAIL ${f.id}: ${r2.status}`);
}
console.log(`Updated ${ok}/${FIXES.length}`);
