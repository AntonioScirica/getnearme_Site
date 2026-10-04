import { type Locale } from "./i18n";

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

interface LegalPage {
  title: string;
  lastUpdated: string;
  description: string;
  blocks: Block[];
}

// Testi legali di Agente Immo (piattaforma web per agenti immobiliari). Aggiornati il 30/09/2026.
// 30/09: segnaposto completati (sede, P.IVA, prova 12 mesi, pacchetti che non scadono).
// es, fr, ru, uk: il sito le porta all inglese,
// quindi usano lo stesso testo inglese.

// ---------------------------------------------------------------------------------------------------------------
// PRIVACY
// ---------------------------------------------------------------------------------------------------------------

const privacyIt: LegalPage = {
  title: "Informativa sulla Privacy",
  lastUpdated: "Ultimo aggiornamento: 5 ottobre 2026",
  description: "Come Agente Immo tratta i dati personali di chi usa la piattaforma per agenti immobiliari su agenteimmo.me.",
  blocks: [
    { type: "h2", text: "1. Titolare del trattamento" },
    { type: "p", text: "Questa informativa spiega come vengono trattati i dati personali di chi visita il sito agenteimmo.me e di chi usa la piattaforma Agente Immo (il \"Servizio\"), ai sensi del Regolamento (UE) 2016/679 (GDPR), del D.Lgs. 196/2003 (Codice Privacy) come modificato dal D.Lgs. 101/2018 e della Direttiva 2002/58/CE (ePrivacy)." },
    { type: "p", text: "Titolare del trattamento: Antonio Scirica, operante commercialmente con il nome \"Agente Immo\"\nSede: Viale Pretoriano 3, Roma (RM), Italia\nPartita IVA: 16096461005\nEmail: info@agenteimmo.me" },
    { type: "h2", text: "2. A chi si applica" },
    { type: "ul", items: [
      "Agli utenti registrati della piattaforma (agenti e agenzie immobiliari) e a chi prova il Servizio dalla pagina iniziale.",
      "Ai visitatori del sito agenteimmo.me.",
      "A chi usa la valutazione gratuita della casa (pagina \"Quanto vale la mia casa?\"), anche senza account.",
      "Non si applica ai visitatori dei siti personali che gli agenti pubblicano con Agente Immo (per esempio agenteimmo.me/it/a/nome-agente): per quei siti il titolare è l'agente, che fornisce la propria informativa, e Agente Immo agisce come responsabile del trattamento per suo conto (art. 28 GDPR)."
    ]},
    { type: "h2", text: "3. Quali dati trattiamo" },
    { type: "h3", text: "3.1. Account e profilo" },
    { type: "ul", items: [
      "Indirizzo email e identificativo utente. La password è gestita dal fornitore di autenticazione in forma cifrata e non è leggibile da noi.",
      "Se scegli di accedere con Google: nome, indirizzo email e immagine del profilo che Google ci trasmette.",
      "Dati del profilo che inserisci: nome, agenzia, telefono, logo, foto, colori e altre informazioni per i tuoi contenuti e il tuo sito.",
      "Piano attivo, saldo e movimenti dei crediti."
    ]},
    { type: "h3", text: "3.2. Contenuti che carichi e che generi" },
    { type: "ul", items: [
      "Foto degli immobili, planimetrie e video che carichi, compresi eventuali video in cui compari tu.",
      "I messaggi e le richieste che scrivi nella chat di home staging e di creazione video.",
      "Le foto e i video generati, salvati nella tua Galleria.",
      "I dati degli immobili che inserisci o importi (indirizzo, prezzo, caratteristiche, descrizione, posizione sulla mappa)."
    ]},
    { type: "p", text: "Ti chiediamo di non caricare foto in cui si riconoscono persone, documenti o altri dati personali di terzi, se non hai titolo per farlo." },
    { type: "h3", text: "3.3. Annunci importati da un link" },
    { type: "p", text: "Quando incolli il link di un annuncio, il nostro server legge la pagina pubblica dell'annuncio e ne estrae dati sull'immobile (testo, caratteristiche, foto). Nella pagina possono comparire nomi e contatti dell'agenzia che l'ha pubblicato: li usiamo solo per compilare la scheda dell'immobile su tua richiesta." },
    { type: "h3", text: "3.4. Sito personale, richieste di contatto e visite" },
    { type: "p", text: "Se pubblichi il tuo sito personale trattiamo i contenuti che scegli di mostrare (immobili, testi, foto, contatti). Le richieste inviate dai visitatori con il modulo di contatto (nome, email, telefono, messaggio e immobile di interesse) ti arrivano per email e vengono salvate nella sezione Richieste del tuo profilo, dove puoi gestirle. Per quelle richieste il titolare sei tu; noi le trattiamo per tuo conto come responsabile del trattamento (art. 28 GDPR)." },
    { type: "p", text: "Contiamo inoltre le visite alle pagine degli immobili del tuo sito per mostrarti quante persone le hanno viste: salviamo solo un numero per immobile e per giorno, senza dati che identifichino i visitatori. Per non contare due volte la stessa persona il browser del visitatore conserva per un giorno un segno tecnico; l'indirizzo IP è usato solo per bloccare gli abusi e non viene salvato." },
    { type: "h3", text: "3.5. Pagamenti e fatturazione" },
    { type: "p", text: "I pagamenti sono gestiti da Stripe. Noi conserviamo l'identificativo cliente e dell'abbonamento, il piano, le date di rinnovo e i dati di fatturazione che inserisci (per esempio ragione sociale, partita IVA, codice destinatario o PEC). Non vediamo né conserviamo i numeri completi delle carte." },
    { type: "h3", text: "3.6. Prova gratuita" },
    { type: "p", text: "La prova gratuita dalla pagina iniziale (1 foto e 1 video) richiede un account e vale una sola volta per account, per indirizzo IP e per dispositivo. Per applicare il limite conserviamo, insieme all'account, un codice cifrato (hash) dell'indirizzo IP e un hash dell'impronta del dispositivo. L'impronta è calcolata nel tuo browser a partire da caratteristiche tecniche (per esempio schermo, scheda grafica, fuso orario, lingua): al nostro server arriva solo l'hash, da cui non si possono ricostruire queste informazioni. L'impronta si calcola solo quando avvii la prova. Trattiamo anche la foto che carichi per la prova e il risultato generato." },
    { type: "h3", text: "3.7. Dati tecnici e di sicurezza" },
    { type: "p", text: "Indirizzo IP, tipo di browser, data e ora delle richieste e registri tecnici, usati per far funzionare il Servizio, prevenire abusi e correggere errori. Registriamo inoltre le operazioni AI eseguite e i crediti consumati, per il calcolo dei crediti e dei costi." },
    { type: "h3", text: "3.8. Cookie e strumenti simili" },
    { type: "p", text: "Usiamo strumenti tecnici necessari (per esempio per mantenerti collegato e ricordare la tua scelta sui cookie). Strumenti statistici (Google Analytics, Microsoft Clarity, calendario Cal.com) e di marketing (Meta Pixel) si attivano solo con il tuo consenso, che puoi revocare in ogni momento. I dettagli sono nella Cookie Policy (agenteimmo.me/it/cookie). Sui siti personali degli agenti non usiamo strumenti statistici né di marketing." },
    { type: "h3", text: "3.9. Valutazione gratuita della casa" },
    { type: "p", text: "Se chiedi la valutazione della tua casa trattiamo: l'indirizzo e le caratteristiche dell'immobile che inserisci (tipo, metri quadri, locali, bagni, piano, stato ed extra), il tuo indirizzo email e, se li inserisci, nome e telefono, il risultato della stima e le scelte sui consensi. Usiamo l'indirizzo per trovare la zona e calcolare la stima sulle quotazioni OMI dell'Agenzia delle Entrate; la stima ti arriva per email." },
    { type: "ul", items: [
      "Senza altri consensi usiamo i tuoi dati solo per calcolare e inviarti la valutazione.",
      "Se spunti \"Voglio essere ricontattato da un agente immobiliare della mia zona\", possiamo comunicare i tuoi contatti e i dati della casa a un agente immobiliare che usa Agente Immo e opera nella tua zona, perché ti contatti per una consulenza o una proposta di incarico. L'agente che li riceve li tratta come titolare autonomo, con la propria informativa.",
      "Se spunti il consenso al marketing, possiamo inviarti comunicazioni su servizi e novità legati alla vendita o all'affitto della casa. Puoi disiscriverti in ogni momento dal link presente in ogni email."
    ]},
    { type: "h2", text: "4. Finalità e basi giuridiche" },
    { type: "ul", items: [
      "Creare e gestire l'account, fornire le funzioni richieste (home staging, video, import degli annunci, gestione immobili, sito personale, inoltro delle richieste di contatto), gestire piani, crediti e pagamenti, fornire assistenza: esecuzione del contratto (art. 6.1.b GDPR).",
      "Emettere fatture, tenere la contabilità e adempiere agli obblighi fiscali: obbligo legale (art. 6.1.c GDPR).",
      "Proteggere il Servizio, prevenire frodi e abusi, applicare i limiti della prova gratuita (hash di IP e dispositivo), correggere errori: legittimo interesse del titolare (art. 6.1.f GDPR), bilanciato con i tuoi diritti tramite l'uso di soli codici cifrati e di tempi di conservazione limitati.",
      "Statistiche di utilizzo del sito e misurazione delle campagne pubblicitarie: consenso (art. 6.1.a GDPR), revocabile in ogni momento.",
      "Valutazione gratuita della casa: calcolo e invio della stima su tua richiesta (art. 6.1.b GDPR); comunicazione dei tuoi contatti a un agente della zona e comunicazioni di marketing solo con i consensi specifici e facoltativi (art. 6.1.a GDPR), revocabili in ogni momento scrivendo a info@agenteimmo.me."
    ]},
    { type: "p", text: "Non vendiamo i tuoi dati e non li usiamo per addestrare modelli di intelligenza artificiale." },
    { type: "h2", text: "5. Fornitori che trattano i dati per nostro conto" },
    { type: "p", text: "Ci avvaliamo dei seguenti fornitori, nominati responsabili del trattamento o che operano come titolari autonomi per i propri servizi:" },
    { type: "ul", items: [
      "Supabase (UE): autenticazione, database e funzioni server.",
      "Vercel (USA): hosting del sito e della piattaforma.",
      "Cloudflare (USA), servizio R2: archiviazione di foto, video e file della Galleria.",
      "Stripe (Irlanda e USA): pagamenti, abbonamenti e fatture.",
      "Resend (USA): invio delle email di servizio e delle richieste di contatto dei siti personali.",
      "Google (USA): accesso con Google, se lo scegli; modelli Gemini per la generazione e la modifica delle foto e per l'analisi dei testi.",
      "OpenAI (USA): modelli GPT Image per la generazione e la modifica delle foto.",
      "Anthropic (USA): modelli Claude per riconoscere il tipo di stanza, preparare planimetrie e scrivere le istruzioni dei video.",
      "fal.ai (USA): generazione dei video con i modelli Kling e Veo.",
      "ZenRows: lettura delle pagine pubbliche degli annunci che importi da un link.",
      "Google Analytics, Microsoft Clarity, Cal.com e Meta (USA): solo con il tuo consenso ai cookie statistici o di marketing."
    ]},
    { type: "p", text: "Ai fornitori AI inviamo solo quanto serve per la singola operazione (la foto o il video e le istruzioni), senza il tuo nome né la tua email." },
    { type: "p", text: "Per mappe, indirizzi e dintorni degli immobili il nostro server interroga servizi pubblici come OpenStreetMap (Nominatim e Overpass) ed Esri, e per le foto di ispirazione degli stili la libreria Unsplash. Queste richieste partono dal nostro server e contengono solo indirizzi, coordinate o parole di ricerca, non dati che ti identificano." },
    { type: "h2", text: "6. Trasferimenti fuori dall'Unione europea" },
    { type: "p", text: "Alcuni fornitori hanno sede o trattano dati negli Stati Uniti o in altri paesi fuori dallo Spazio economico europeo. I trasferimenti avvengono sulla base della decisione di adeguatezza EU-US Data Privacy Framework, per i fornitori certificati, o delle Clausole contrattuali standard approvate dalla Commissione europea (art. 46 GDPR), con misure di sicurezza come la cifratura dei dati in transito e a riposo." },
    { type: "h2", text: "7. Per quanto tempo conserviamo i dati" },
    { type: "ul", items: [
      "Account, profilo, immobili e sito personale: finché l'account è attivo. Vengono cancellati quando elimini l'account.",
      "Conversazioni della chat: 30 giorni, poi vengono cancellate. Foto e video generati restano nella Galleria.",
      "Foto e video della Galleria e file caricati: finché non li elimini tu o finché non elimini l'account.",
      "Richieste di contatto dei siti personali: finché l'agente non le elimina o non elimina l'account; restano anche nella sua casella email e nei registri tecnici di invio del fornitore email per il periodo previsto dal fornitore.",
      "Conteggio delle visite agli immobili: numeri aggregati per giorno, senza dati personali, per la durata dell'account.",
      "Dati della prova gratuita (hash di IP e dispositivo, legati all'account): per il tempo necessario a garantire che la prova sia usata una sola volta, e comunque non oltre 12 mesi, poi li cancelliamo automaticamente. Foto e video della prova seguono le regole della Galleria.",
      "Valutazioni della casa e relativi contatti: 24 mesi dalla richiesta, poi li cancelliamo; prima, se revochi i consensi o chiedi la cancellazione. Se hai acconsentito al contatto, l'agente che ha ricevuto i tuoi dati li conserva secondo la propria informativa.",
      "Dati di pagamento e fatture: 10 anni, come previsto dalla legge (art. 2220 del Codice civile), anche dopo l'eliminazione dell'account.",
      "Registri tecnici e di sicurezza con indirizzo IP: al massimo 90 giorni.",
      "Registri delle operazioni AI e dei crediti: per la durata dell'account.",
      "Consenso ai cookie: la scelta resta memorizzata nel tuo browser per 6 mesi, poi te la chiediamo di nuovo."
    ]},
    { type: "p", text: "Le copie di backup vengono sovrascritte secondo i cicli tecnici dei fornitori; fino ad allora sono protette e non vengono usate." },
    { type: "h2", text: "8. Intelligenza artificiale e decisioni automatizzate" },
    { type: "p", text: "Le foto, i video e i testi generati con l'intelligenza artificiale vengono creati solo su tua richiesta. Il Servizio non prende decisioni basate unicamente su trattamenti automatizzati che producano effetti giuridici o che incidano in modo analogo significativamente su di te (art. 22 GDPR)." },
    { type: "h2", text: "9. Sicurezza" },
    { type: "p", text: "Usiamo connessioni cifrate (HTTPS), accesso ai dati limitato per utente, archiviazione presso fornitori con standard di sicurezza riconosciuti e accessi amministrativi ridotti al minimo. Nessun sistema è sicuro al 100%: in caso di violazione dei dati che ti riguardi ti informeremo come previsto dagli artt. 33 e 34 GDPR." },
    { type: "h2", text: "10. I tuoi diritti" },
    { type: "p", text: "Ai sensi degli artt. 15-22 GDPR puoi chiedere in ogni momento:" },
    { type: "ul", items: [
      "l'accesso ai tuoi dati e una copia (art. 15);",
      "la rettifica dei dati inesatti (art. 16);",
      "la cancellazione (art. 17), anche eliminando l'account dal Profilo;",
      "la limitazione del trattamento (art. 18);",
      "la portabilità dei dati che ci hai fornito, in un formato strutturato e leggibile da dispositivo (art. 20);",
      "di opporti ai trattamenti basati sul legittimo interesse (art. 21);",
      "di revocare il consenso in ogni momento, senza pregiudicare i trattamenti già effettuati."
    ]},
    { type: "p", text: "Per esercitare i tuoi diritti scrivi a info@agenteimmo.me. Rispondiamo entro un mese." },
    { type: "p", text: "Hai anche il diritto di proporre reclamo all'autorità di controllo:\nGarante per la protezione dei dati personali\nPiazza Venezia 11, 00187 Roma\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
    { type: "h2", text: "11. Minori" },
    { type: "p", text: "Il Servizio è destinato a professionisti del settore immobiliare maggiorenni. Non raccogliamo consapevolmente dati di persone con meno di 18 anni; se ci accorgiamo di averli ricevuti, li cancelliamo." },
    { type: "h2", text: "12. Modifiche a questa informativa" },
    { type: "p", text: "Possiamo aggiornare questa informativa quando cambiano il Servizio, i fornitori o la normativa. La data in alto indica l'ultima versione; in caso di modifiche importanti ti avviseremo via email o nella piattaforma." },
    { type: "h2", text: "13. Contatti" },
    { type: "p", text: "Per qualsiasi domanda su questa informativa o sul trattamento dei tuoi dati: info@agenteimmo.me." },
  ],
};

const privacyEn: LegalPage = {
  title: "Privacy Policy",
  lastUpdated: "Last Updated: 5 October 2026",
  description: "How Agente Immo processes the personal data of people who use the platform for real estate agents on agenteimmo.me.",
  blocks: [
    { type: "h2", text: "1. Data Controller" },
    { type: "p", text: "This policy explains how personal data is processed for people who visit agenteimmo.me and use the Agente Immo platform (the \"Service\"), in accordance with Regulation (EU) 2016/679 (GDPR), Italian Legislative Decree 196/2003 (Italian Privacy Code) as amended by Legislative Decree 101/2018, and Directive 2002/58/EC (ePrivacy)." },
    { type: "p", text: "Data Controller: Antonio Scirica, acting commercially under the trade name \"Agente Immo\"\nRegistered address: Viale Pretoriano 3, Rome (RM), Italy\nVAT number: IT16096461005\nEmail: info@agenteimmo.me" },
    { type: "h2", text: "2. Scope" },
    { type: "ul", items: [
      "Registered users of the platform (real estate agents and agencies) and people who try the Service from the home page.",
      "Visitors of the agenteimmo.me website.",
      "People who use the free home valuation (\"Quanto vale la mia casa?\" page), even without an account.",
      "It does not apply to visitors of the personal websites that agents publish with Agente Immo (for example agenteimmo.me/it/a/agent-name): for those websites the agent is the controller and provides their own privacy notice, and Agente Immo acts as a processor on the agent's behalf (Art. 28 GDPR)."
    ]},
    { type: "h2", text: "3. Data We Process" },
    { type: "h3", text: "3.1. Account and Profile" },
    { type: "ul", items: [
      "Email address and user ID. Your password is handled by our authentication provider in encrypted form and cannot be read by us.",
      "If you choose to sign in with Google: the name, email address and profile picture Google shares with us.",
      "Profile data you enter: name, agency, phone number, logo, photo, colors and other information for your content and your website.",
      "Active plan, credit balance and credit history."
    ]},
    { type: "h3", text: "3.2. Content You Upload and Generate" },
    { type: "ul", items: [
      "Property photos, floor plans and videos you upload, including any videos in which you appear.",
      "The messages and requests you write in the home staging and video chat.",
      "The photos and videos generated, saved in your Gallery.",
      "Property data you enter or import (address, price, features, description, location on the map)."
    ]},
    { type: "p", text: "Please do not upload photos in which people, documents or other personal data of third parties can be recognized unless you are entitled to do so." },
    { type: "h3", text: "3.3. Listings Imported from a Link" },
    { type: "p", text: "When you paste the link to a listing, our server reads the public listing page and extracts property data (text, features, photos). The page may show the name and contact details of the agency that published it: we use them only to fill in the property record at your request." },
    { type: "h3", text: "3.4. Personal Website, Contact Requests and Views" },
    { type: "p", text: "If you publish your personal website, we process the content you choose to show (properties, texts, photos, contact details). Requests sent by visitors through the contact form (name, email, phone number, message and property of interest) are sent to you by email and saved in the Requests section of your profile, where you can manage them. You are the controller of those requests; we process them on your behalf as a processor (Art. 28 GDPR)." },
    { type: "p", text: "We also count views of the property pages on your website to show you how many people saw them: we only store a number per property per day, with no data identifying visitors. To avoid counting the same person twice, the visitor's browser keeps a technical marker for one day; the IP address is used only to block abuse and is not stored." },
    { type: "h3", text: "3.5. Payments and Invoicing" },
    { type: "p", text: "Payments are handled by Stripe. We keep the customer and subscription IDs, the plan, the renewal dates and the billing details you enter (for example company name, VAT number, e-invoicing recipient code or certified email). We never see or store full card numbers." },
    { type: "h3", text: "3.6. Free Trial" },
    { type: "p", text: "The free trial on the home page (1 photo and 1 video) requires an account and can be used only once per account, per IP address and per device. To enforce this limit we store, together with the account, an encrypted code (hash) of the IP address and a hash of the device fingerprint. The fingerprint is computed in your browser from technical characteristics (for example screen, graphics card, time zone, language): only the hash reaches our server, and these characteristics cannot be reconstructed from it. The fingerprint is only computed when you start the trial. We also process the photo you upload for the trial and the generated result." },
    { type: "h3", text: "3.7. Technical and Security Data" },
    { type: "p", text: "IP address, browser type, date and time of requests and technical logs, used to run the Service, prevent abuse and fix errors. We also record the AI operations performed and the credits used, to calculate credits and costs." },
    { type: "h3", text: "3.8. Cookies and Similar Technologies" },
    { type: "p", text: "We use strictly necessary technologies (for example to keep you signed in and to remember your cookie choice). Analytics tools (Google Analytics, Microsoft Clarity, Cal.com calendar) and marketing tools (Meta Pixel) are enabled only with your consent, which you can withdraw at any time. Details are in the Cookie Policy (agenteimmo.me/en/cookie). We do not use analytics or marketing tools on agents' personal websites." },
    { type: "h3", text: "3.9. Free Home Valuation" },
    { type: "p", text: "If you request a valuation of your home we process: the address and features of the property you enter (type, square metres, rooms, bathrooms, floor, condition and extras), your email address and, if you enter them, your name and phone number, the result of the estimate and your consent choices. We use the address to find the area and calculate the estimate on the OMI quotations of the Italian Revenue Agency; the estimate is sent to you by email." },
    { type: "ul", items: [
      "Without further consent we use your data only to calculate and send you the valuation.",
      "If you tick \"I want to be contacted by a real estate agent in my area\", we may share your contact details and the property data with a real estate agent who uses Agente Immo and works in your area, so that they can contact you for advice or a listing proposal. The agent receiving them processes them as an independent controller, under their own privacy notice.",
      "If you tick the marketing consent, we may send you communications about services and news related to selling or renting your home. You can unsubscribe at any time using the link in every email."
    ]},
    { type: "h2", text: "4. Purposes and Legal Bases" },
    { type: "ul", items: [
      "Creating and managing your account, providing the features you request (home staging, videos, listing import, property management, personal website, forwarding of contact requests), managing plans, credits and payments, providing support: performance of a contract (Art. 6(1)(b) GDPR).",
      "Issuing invoices, bookkeeping and tax compliance: legal obligation (Art. 6(1)(c) GDPR).",
      "Protecting the Service, preventing fraud and abuse, enforcing free trial limits (IP and device hashes), fixing errors: legitimate interest of the controller (Art. 6(1)(f) GDPR), balanced against your rights by using only hashed codes and limited retention periods.",
      "Website usage statistics and measurement of advertising campaigns: consent (Art. 6(1)(a) GDPR), which can be withdrawn at any time.",
      "Free home valuation: calculating and sending the estimate at your request (Art. 6(1)(b) GDPR); sharing your contact details with a local agent and marketing communications only with the specific, optional consents (Art. 6(1)(a) GDPR), which can be withdrawn at any time by writing to info@agenteimmo.me."
    ]},
    { type: "p", text: "We do not sell your data and we do not use it to train artificial intelligence models." },
    { type: "h2", text: "5. Providers Processing Data on Our Behalf" },
    { type: "p", text: "We rely on the following providers, appointed as processors or acting as independent controllers for their own services:" },
    { type: "ul", items: [
      "Supabase (EU): authentication, database and server functions.",
      "Vercel (USA): hosting of the website and platform.",
      "Cloudflare (USA), R2 service: storage of photos, videos and Gallery files.",
      "Stripe (Ireland and USA): payments, subscriptions and invoices.",
      "Resend (USA): delivery of service emails and of contact requests from personal websites.",
      "Google (USA): sign in with Google, if you choose it; Gemini models for generating and editing photos and analyzing text.",
      "OpenAI (USA): GPT Image models for generating and editing photos.",
      "Anthropic (USA): Claude models for recognizing room types, preparing floor plans and writing video instructions.",
      "fal.ai (USA): video generation with Kling and Veo models.",
      "ZenRows: reading the public pages of the listings you import from a link.",
      "Google Analytics, Microsoft Clarity, Cal.com and Meta (USA): only with your consent to analytics or marketing cookies."
    ]},
    { type: "p", text: "We send AI providers only what is needed for each operation (the photo or video and the instructions), without your name or email." },
    { type: "p", text: "For maps, addresses and the surroundings of properties our server queries public services such as OpenStreetMap (Nominatim and Overpass) and Esri, and for style inspiration photos the Unsplash library. These requests come from our server and contain only addresses, coordinates or search terms, not data that identifies you." },
    { type: "h2", text: "6. Transfers Outside the European Union" },
    { type: "p", text: "Some providers are established in, or process data in, the United States or other countries outside the European Economic Area. Transfers are based on the EU-US Data Privacy Framework adequacy decision, for certified providers, or on the Standard Contractual Clauses approved by the European Commission (Art. 46 GDPR), with safeguards such as encryption of data in transit and at rest." },
    { type: "h2", text: "7. Retention Periods" },
    { type: "ul", items: [
      "Account, profile, properties and personal website: as long as the account is active. They are deleted when you delete your account.",
      "Chat conversations: 30 days, then they are deleted. Generated photos and videos remain in the Gallery.",
      "Gallery photos and videos and uploaded files: until you delete them or delete your account.",
      "Contact requests from personal websites: until the agent deletes them or deletes the account; they also remain in the agent's mailbox and in the email provider's delivery logs for the period set by that provider.",
      "Property view counts: aggregated numbers per day, with no personal data, for the lifetime of the account.",
      "Free trial data (IP and device hashes, linked to the account): for as long as needed to ensure the trial is used only once, and in any case no longer than 12 months, after which we delete them automatically. Trial photos and videos follow the Gallery rules.",
      "Home valuations and related contacts: 24 months from the request, then deleted; earlier if you withdraw consent or ask for deletion. If you agreed to be contacted, the agent who received your data keeps it under their own privacy notice.",
      "Payment data and invoices: 10 years, as required by Italian law (Art. 2220 of the Civil Code), also after account deletion.",
      "Technical and security logs containing IP addresses: up to 90 days.",
      "Logs of AI operations and credits: for the lifetime of the account.",
      "Cookie consent: your choice is stored in your browser for 6 months, then we ask again."
    ]},
    { type: "p", text: "Backup copies are overwritten according to the providers' technical cycles; until then they are protected and not used." },
    { type: "h2", text: "8. Artificial Intelligence and Automated Decisions" },
    { type: "p", text: "Photos, videos and texts generated with artificial intelligence are created only at your request. The Service does not make decisions based solely on automated processing that produce legal effects concerning you or similarly significantly affect you (Art. 22 GDPR)." },
    { type: "h2", text: "9. Security" },
    { type: "p", text: "We use encrypted connections (HTTPS), per-user access controls on data, storage with providers that follow recognized security standards, and minimal administrative access. No system is 100% secure: in the event of a personal data breach affecting you, we will inform you as required by Articles 33 and 34 GDPR." },
    { type: "h2", text: "10. Your Rights" },
    { type: "p", text: "Under Articles 15-22 GDPR you may at any time request:" },
    { type: "ul", items: [
      "access to your data and a copy of it (Art. 15);",
      "rectification of inaccurate data (Art. 16);",
      "erasure (Art. 17), including by deleting your account from your Profile;",
      "restriction of processing (Art. 18);",
      "portability of the data you provided, in a structured, machine-readable format (Art. 20);",
      "to object to processing based on legitimate interest (Art. 21);",
      "to withdraw your consent at any time, without affecting processing carried out before the withdrawal."
    ]},
    { type: "p", text: "To exercise your rights, write to info@agenteimmo.me. We reply within one month." },
    { type: "p", text: "You also have the right to lodge a complaint with the supervisory authority:\nGarante per la protezione dei dati personali\nPiazza Venezia 11, 00187 Rome, Italy\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
    { type: "h2", text: "11. Children" },
    { type: "p", text: "The Service is intended for adult real estate professionals. We do not knowingly collect data from people under 18; if we become aware that we have received such data, we delete it." },
    { type: "h2", text: "12. Changes to This Policy" },
    { type: "p", text: "We may update this policy when the Service, our providers or the law change. The date at the top shows the latest version; we will notify you of significant changes by email or in the platform." },
    { type: "h2", text: "13. Contact" },
    { type: "p", text: "For any question about this policy or the processing of your data: info@agenteimmo.me." },
  ],
};

export const privacyContent: Record<Locale, LegalPage> = {
  it: privacyIt,
  en: privacyEn,
  es: privacyEn,
  fr: privacyEn,
  ru: privacyEn,
  uk: privacyEn,
};

// ---------------------------------------------------------------------------------------------------------------
// TERMINI DI SERVIZIO
// ---------------------------------------------------------------------------------------------------------------

const termsIt: LegalPage = {
  title: "Termini di Servizio",
  lastUpdated: "Ultimo aggiornamento: 30 settembre 2026",
  description: "Termini di Servizio della piattaforma Agente Immo per agenti immobiliari.",
  blocks: [
    { type: "h2", text: "1. Chi siamo e accettazione dei Termini" },
    { type: "p", text: "Agente Immo è un servizio di Antonio Scirica, operante commercialmente con il nome \"Agente Immo\" (sede: Viale Pretoriano 3, Roma (RM); partita IVA: 16096461005; email: info@agenteimmo.me), disponibile su agenteimmo.me (il \"Servizio\")." },
    { type: "p", text: "Creando un account o usando il Servizio accetti questi Termini di Servizio (\"Termini\") e dichiari di avere almeno 18 anni. Se usi il Servizio per conto di un'agenzia o di un'impresa, dichiari di avere il potere di vincolarla. Se non accetti i Termini, non usare il Servizio." },
    { type: "h2", text: "2. Il Servizio" },
    { type: "p", text: "Agente Immo è una piattaforma web per agenti immobiliari che permette di:" },
    { type: "ul", items: [
      "fare home staging virtuale delle foto degli immobili con l'intelligenza artificiale, in una chat: arredare, svuotare, cambiare stile, lavorare sulle planimetrie;",
      "creare video per i social a partire dalle foto degli immobili e dai propri video;",
      "importare e analizzare un annuncio partendo dal suo link;",
      "gestire i propri immobili, anche su mappa;",
      "pubblicare un sito personale (agenteimmo.me/it/a/<nome>) con i propri immobili e un modulo di contatto che inoltra le richieste all'agente;",
      "conservare foto e video creati nella Galleria."
    ]},
    { type: "p", text: "Le funzioni disponibili dipendono dal piano scelto e possono evolvere nel tempo. Agente Immo non è un'agenzia immobiliare e non fornisce consulenza legale, fiscale, tecnica o finanziaria." },
    { type: "h2", text: "3. Account" },
    { type: "ul", items: [
      "Per usare il Servizio serve un account con un indirizzo email valido o l'accesso con Google.",
      "Sei responsabile della riservatezza delle credenziali e di tutto ciò che avviene con il tuo account. Avvisaci subito se sospetti un accesso non autorizzato.",
      "I dati che inserisci devono essere veri e aggiornati, compresi i dati di fatturazione.",
      "Il Servizio è pensato per un uso professionale. Se sei un consumatore restano salvi i diritti che la legge ti riconosce."
    ]},
    { type: "h2", text: "4. Piani, crediti e pagamenti" },
    { type: "h3", text: "4.1. Piani" },
    { type: "p", text: "Il Servizio è offerto con abbonamenti Starter, Plus e Pro. Prezzi, crediti inclusi, funzioni e durata di ciascun piano (mensile, trimestrale o annuale) sono indicati nella pagina prezzi al momento dell'acquisto." },
    { type: "h3", text: "4.2. Crediti" },
    { type: "ul", items: [
      "Ogni operazione (per esempio una foto o un video) consuma un numero di crediti indicato nella piattaforma prima di confermarla.",
      "I crediti del piano si ricaricano a ogni mese di abbonamento: il saldo torna ai crediti previsti dal piano e i crediti non usati non si accumulano.",
      "Puoi acquistare pacchetti di crediti extra con un pagamento una tantum. I crediti dei pacchetti si aggiungono al saldo. I crediti dei pacchetti non scadono: restano dopo il rinnovo mensile e anche se l'abbonamento finisce. Si usano dopo i crediti del mese, che invece si azzerano a ogni rinnovo.",
      "I crediti non sono moneta elettronica né valore prepagato, non hanno valore fuori dal Servizio, non si convertono in denaro e non si trasferiscono ad altri account.",
      "Alla fine dell'abbonamento il saldo dei crediti del piano si azzera."
    ]},
    { type: "h3", text: "4.3. Pagamenti e rinnovo" },
    { type: "ul", items: [
      "I pagamenti sono gestiti da Stripe secondo le sue condizioni. Non conserviamo i dati completi delle carte.",
      "Gli abbonamenti si rinnovano automaticamente alla fine di ogni periodo (mese, trimestre o anno) con addebito sul metodo di pagamento scelto, finché non li disdici.",
      "Ti avviseremo con un anticipo ragionevole di eventuali modifiche di prezzo, che si applicano dal rinnovo successivo; se non le accetti puoi disdire prima del rinnovo.",
      "Riceverai la fattura o la ricevuta di ogni pagamento via email."
    ]},
    { type: "h3", text: "4.4. Disdetta" },
    { type: "p", text: "Puoi disdire l'abbonamento in ogni momento dalla sezione del piano nella piattaforma (portale di Stripe). La disdetta ha effetto alla fine del periodo già pagato: fino ad allora puoi continuare a usare il Servizio. Se elimini l'account, l'abbonamento viene annullato subito." },
    { type: "h3", text: "4.5. Recesso e rimborsi" },
    { type: "p", text: "Se sei un consumatore, acquistando un abbonamento o un pacchetto di crediti chiedi espressamente che il Servizio inizi subito e prendi atto che, una volta resi disponibili i crediti o iniziato il Servizio, perdi il diritto di recesso (art. 59, comma 1, lett. a) e o) del Codice del Consumo, D.Lgs. 206/2005). Salvo quanto previsto dalla legge, i pagamenti non sono rimborsabili, neppure per periodi non usati o crediti residui. In caso di errore tecnico a noi imputabile (per esempio crediti pagati ma non accreditati) scrivici a info@agenteimmo.me e sistemeremo il problema." },
    { type: "h2", text: "5. Prova gratuita" },
    { type: "ul", items: [
      "Dalla pagina iniziale puoi provare il Servizio gratuitamente con 1 foto e 1 video.",
      "La prova richiede un account e vale una sola volta per account, per indirizzo IP e per dispositivo. Per applicare questo limite usiamo codici cifrati dell'IP e del dispositivo, come spiegato nell'Informativa sulla Privacy.",
      "Il download senza filigrana è disponibile dopo l'accesso con l'account.",
      "È vietato aggirare i limiti della prova, per esempio creando più account. Possiamo modificare o sospendere la prova in ogni momento."
    ]},
    { type: "h2", text: "6. Contenuti generati con l'intelligenza artificiale" },
    { type: "h3", text: "6.1. Natura dei risultati" },
    { type: "p", text: "Foto, video e testi sono generati da modelli di intelligenza artificiale e possono contenere errori, imprecisioni o elementi non realistici. Sei tenuto a controllare ogni risultato prima di usarlo o pubblicarlo." },
    { type: "h3", text: "6.2. Responsabilità dell'agente sugli annunci" },
    { type: "ul", items: [
      "Sei l'unico responsabile degli annunci e dei contenuti che pubblichi, anche se creati con il Servizio.",
      "Quando pubblichi foto con arredamento virtuale o modificate con l'AI devi indicare in modo chiaro che si tratta di home staging virtuale (per esempio \"arredamento virtuale\" o \"immagine elaborata digitalmente\"), e dove possibile mostrare anche la foto originale.",
      "Non devi usare il Servizio per nascondere difetti, alterare caratteristiche strutturali (superfici, finestre, impianti, affacci, stato di conservazione) o dare un'impressione ingannevole dell'immobile.",
      "Devi rispettare le norme sulla pubblicità ingannevole, sulle pratiche commerciali scorrette, sugli annunci immobiliari (per esempio l'indicazione della classe energetica) e gli obblighi di trasparenza sui contenuti generati o manipolati con l'AI, compresi quelli del Regolamento (UE) 2024/1689 (AI Act) quando applicabili.",
      "Devi avere i diritti sulle foto e sui video che carichi e, se compaiono persone, il loro consenso."
    ]},
    { type: "h2", text: "7. Import degli annunci" },
    { type: "p", text: "Quando importi un annuncio da un link, il nostro server legge la pagina pubblica per tuo conto e su tua richiesta. Puoi importare solo annunci che hai il diritto di usare, per esempio i tuoi o quelli su cui hai un incarico. Sei responsabile del rispetto delle condizioni d'uso dei portali e dei diritti di terzi. Agente Immo non è affiliato a nessun portale immobiliare; i marchi citati appartengono ai rispettivi titolari." },
    { type: "h2", text: "8. Sito personale dell'agente" },
    { type: "ul", items: [
      "Sei responsabile dei contenuti pubblicati sul tuo sito personale: immobili, testi, foto, prezzi, dati dell'agenzia e contatti devono essere veri, aggiornati e leciti.",
      "Per i dati dei visitatori e le richieste ricevute dal modulo di contatto sei tu il titolare del trattamento; Agente Immo agisce come responsabile per tuo conto. Devi completare nel sito i tuoi dati di titolare, rispondere alle richieste degli interessati e usare i contatti ricevuti solo in modo lecito.",
      "Il nome scelto per l'indirizzo del sito non deve violare diritti di terzi né essere offensivo o ingannevole.",
      "Possiamo rimuovere o sospendere contenuti o siti illeciti, ingannevoli o contrari a questi Termini, anche su segnalazione di terzi.",
      "Se l'abbonamento termina o elimini l'account, il sito personale può non essere più raggiungibile."
    ]},
    { type: "h2", text: "9. Uso consentito" },
    { type: "p", text: "Ti impegni a non usare il Servizio per:" },
    { type: "ul", items: [
      "attività illecite, contenuti diffamatori, discriminatori, osceni o che violano diritti di terzi;",
      "creare immagini o video ingannevoli su immobili, persone o fatti;",
      "caricare dati personali di terzi senza una base giuridica;",
      "estrarre dati in massa da portali o siti di terzi, o creare database concorrenti;",
      "aggirare limiti, sistemi di sicurezza o il sistema dei crediti, o condividere l'account con persone non autorizzate;",
      "decodificare, copiare o rivendere il Servizio, o usarlo con sistemi automatici non autorizzati;",
      "inviare spam o comunicazioni non richieste tramite il modulo di contatto o altre funzioni."
    ]},
    { type: "h2", text: "10. Proprietà intellettuale" },
    { type: "ul", items: [
      "Mantieni tutti i diritti sui contenuti che carichi. Ci concedi una licenza limitata, non esclusiva e gratuita a trattarli, conservarli e mostrarli solo per fornirti il Servizio.",
      "Nei limiti consentiti dalla legge e dalle condizioni dei fornitori AI, puoi usare le foto e i video generati per la tua attività, anche a fini commerciali.",
      "La piattaforma, il marchio Agente Immo, il software, i modelli grafici, le musiche e gli altri elementi forniti restano di nostra proprietà o dei nostri licenzianti. Le musiche e i modelli si possono usare solo all'interno dei contenuti creati con il Servizio."
    ]},
    { type: "h2", text: "11. Disponibilità e modifiche del Servizio" },
    { type: "p", text: "Facciamo il possibile per mantenere il Servizio disponibile e funzionante, ma non garantiamo un funzionamento senza interruzioni o errori. Il Servizio dipende anche da fornitori terzi (per esempio i modelli di intelligenza artificiale), che possono cambiare o interrompere i loro servizi. Possiamo modificare, aggiungere o togliere funzioni; se una modifica riduce in modo sostanziale un servizio già pagato ti avviseremo e potrai disdire." },
    { type: "h2", text: "12. Limitazione di responsabilità" },
    { type: "p", text: "Nei limiti consentiti dalla legge, Agente Immo non risponde di danni indiretti o consequenziali, perdita di profitti, di clienti o di dati, né delle conseguenze dei contenuti che pubblichi o delle decisioni prese sulla base del Servizio. La nostra responsabilità complessiva è limitata agli importi che ci hai pagato nei 12 mesi precedenti all'evento. Queste limitazioni non si applicano in caso di dolo o colpa grave, né ai diritti inderogabili dei consumatori." },
    { type: "p", text: "Ti impegni a tenere indenne Agente Immo da pretese di terzi derivanti dai contenuti che carichi o pubblichi o dalla violazione di questi Termini." },
    { type: "h2", text: "13. Sospensione e chiusura" },
    { type: "p", text: "Puoi eliminare l'account in ogni momento dal Profilo: vengono cancellati account, immobili, sito personale e file della Galleria, e l'abbonamento viene annullato. Possiamo sospendere o chiudere l'account, con preavviso quando possibile, in caso di violazione di questi Termini, uso fraudolento, mancato pagamento o richiesta delle autorità." },
    { type: "h2", text: "14. Modifiche ai Termini" },
    { type: "p", text: "Possiamo aggiornare questi Termini. Le modifiche importanti ti saranno comunicate via email o nella piattaforma con un preavviso ragionevole; continuando a usare il Servizio dopo la data di efficacia le accetti. Se non le accetti puoi disdire ed eliminare l'account." },
    { type: "h2", text: "15. Legge applicabile e foro competente" },
    { type: "p", text: "Questi Termini sono regolati dalla legge italiana. Per le controversie con utenti professionisti è competente in via esclusiva il Foro di Roma. Se sei un consumatore è competente il foro del tuo luogo di residenza o domicilio in Italia, e restano salvi i diritti inderogabili previsti dalla legge del tuo paese." },
    { type: "p", text: "Se una clausola risulta invalida, le altre restano valide." },
    { type: "h2", text: "16. Contatti" },
    { type: "p", text: "Per domande su questi Termini: info@agenteimmo.me." },
  ],
};

const termsEn: LegalPage = {
  title: "Terms of Service",
  lastUpdated: "Last Updated: 30 September 2026",
  description: "Terms of Service of the Agente Immo platform for real estate agents.",
  blocks: [
    { type: "h2", text: "1. About Us and Acceptance of the Terms" },
    { type: "p", text: "Agente Immo is a service provided by Antonio Scirica, acting commercially under the trade name \"Agente Immo\" (registered address: Viale Pretoriano 3, Rome (RM), Italy; VAT number: IT16096461005; email: info@agenteimmo.me), available at agenteimmo.me (the \"Service\")." },
    { type: "p", text: "By creating an account or using the Service you accept these Terms of Service (\"Terms\") and confirm that you are at least 18 years old. If you use the Service on behalf of an agency or business, you confirm that you are authorized to bind it. If you do not accept the Terms, do not use the Service." },
    { type: "h2", text: "2. The Service" },
    { type: "p", text: "Agente Immo is a web platform for real estate agents that lets you:" },
    { type: "ul", items: [
      "virtually stage property photos with artificial intelligence, in a chat: furnish, empty, restyle rooms and work on floor plans;",
      "create social media videos from property photos and from your own videos;",
      "import and analyze a listing from its link;",
      "manage your properties, including on a map;",
      "publish a personal website (agenteimmo.me/it/a/<name>) with your properties and a contact form that forwards requests to you;",
      "keep the photos and videos you create in the Gallery."
    ]},
    { type: "p", text: "Available features depend on your plan and may change over time. Agente Immo is not a real estate agency and does not provide legal, tax, technical or financial advice." },
    { type: "h2", text: "3. Account" },
    { type: "ul", items: [
      "To use the Service you need an account with a valid email address or sign in with Google.",
      "You are responsible for keeping your credentials confidential and for everything done with your account. Let us know immediately if you suspect unauthorized access.",
      "The information you enter must be true and up to date, including billing details.",
      "The Service is designed for professional use. If you are a consumer, the rights granted to you by law remain unaffected."
    ]},
    { type: "h2", text: "4. Plans, Credits and Payments" },
    { type: "h3", text: "4.1. Plans" },
    { type: "p", text: "The Service is offered through Starter, Plus and Pro subscriptions. Prices, included credits, features and billing period of each plan (monthly, quarterly or yearly) are shown on the pricing page at the time of purchase." },
    { type: "h3", text: "4.2. Credits" },
    { type: "ul", items: [
      "Each operation (for example a photo or a video) uses a number of credits shown in the platform before you confirm it.",
      "Plan credits are refilled every month of the subscription: the balance returns to the credits included in the plan, and unused credits do not accumulate.",
      "You can buy extra credit packs with a one-time payment. Pack credits are added to your balance. Pack credits do not expire: they remain after the monthly refill and even if the subscription ends. They are used after the monthly credits, which reset at every renewal.",
      "Credits are not electronic money or stored value, have no value outside the Service, cannot be exchanged for cash and cannot be transferred to other accounts.",
      "When the subscription ends, the plan credit balance is reset to zero."
    ]},
    { type: "h3", text: "4.3. Payments and Renewal" },
    { type: "ul", items: [
      "Payments are handled by Stripe under its own terms. We do not store full card details.",
      "Subscriptions renew automatically at the end of each period (month, quarter or year) and are charged to your chosen payment method until you cancel.",
      "We will notify you reasonably in advance of any price change, which applies from the next renewal; if you do not accept it you can cancel before the renewal.",
      "You will receive an invoice or receipt for each payment by email."
    ]},
    { type: "h3", text: "4.4. Cancellation" },
    { type: "p", text: "You can cancel your subscription at any time from the plan section of the platform (Stripe portal). Cancellation takes effect at the end of the period already paid, and until then you can keep using the Service. If you delete your account, the subscription is cancelled immediately." },
    { type: "h3", text: "4.5. Withdrawal and Refunds" },
    { type: "p", text: "If you are a consumer, when you buy a subscription or a credit pack you expressly request that the Service start immediately and acknowledge that, once the credits are made available or the Service has started, you lose your right of withdrawal (Article 16(m) of Directive 2011/83/EU and Article 59 of the Italian Consumer Code). Except where the law provides otherwise, payments are non-refundable, including for unused periods or remaining credits. In the event of a technical error attributable to us (for example credits paid for but not credited), write to info@agenteimmo.me and we will fix it." },
    { type: "h2", text: "5. Free Trial" },
    { type: "ul", items: [
      "From the home page you can try the Service for free with 1 photo and 1 video.",
      "The trial requires an account and can be used only once per account, per IP address and per device. To enforce this limit we use hashed codes of the IP address and of the device, as explained in the Privacy Policy.",
      "Watermark-free download is available after you sign in to your account.",
      "Circumventing the trial limits, for example by creating multiple accounts, is not allowed. We may change or suspend the trial at any time."
    ]},
    { type: "h2", text: "6. AI-Generated Content" },
    { type: "h3", text: "6.1. Nature of the Results" },
    { type: "p", text: "Photos, videos and texts are generated by artificial intelligence models and may contain errors, inaccuracies or unrealistic elements. You must check every result before using or publishing it." },
    { type: "h3", text: "6.2. The Agent's Responsibility for Listings" },
    { type: "ul", items: [
      "You are solely responsible for the listings and content you publish, including content created with the Service.",
      "When you publish virtually furnished or AI-edited photos you must clearly state that they are virtual staging (for example \"virtually staged\" or \"digitally edited image\") and, where possible, also show the original photo.",
      "You must not use the Service to hide defects, alter structural features (floor area, windows, systems, views, condition) or give a misleading impression of the property.",
      "You must comply with the rules on misleading advertising, unfair commercial practices and real estate listings (for example stating the energy class), and with the transparency obligations for AI-generated or manipulated content, including those of Regulation (EU) 2024/1689 (AI Act) where applicable.",
      "You must hold the rights to the photos and videos you upload and, if people appear in them, their consent."
    ]},
    { type: "h2", text: "7. Listing Import" },
    { type: "p", text: "When you import a listing from a link, our server reads the public page on your behalf and at your request. You may import only listings you are entitled to use, for example your own or those you have a mandate for. You are responsible for complying with the portals' terms of use and with third-party rights. Agente Immo is not affiliated with any real estate portal; any trademarks mentioned belong to their respective owners." },
    { type: "h2", text: "8. The Agent's Personal Website" },
    { type: "ul", items: [
      "You are responsible for the content published on your personal website: properties, texts, photos, prices, agency details and contact details must be true, up to date and lawful.",
      "You are the data controller for visitor data and for requests received through the contact form; Agente Immo acts as a processor on your behalf. You must complete your controller details on the website, answer data subjects' requests and use the contacts you receive only lawfully.",
      "The name chosen for your website address must not infringe third-party rights or be offensive or misleading.",
      "We may remove or suspend unlawful or misleading content or websites, or content that breaches these Terms, including following reports from third parties.",
      "If your subscription ends or you delete your account, your personal website may no longer be reachable."
    ]},
    { type: "h2", text: "9. Acceptable Use" },
    { type: "p", text: "You agree not to use the Service to:" },
    { type: "ul", items: [
      "carry out unlawful activities or publish defamatory, discriminatory or obscene content, or content that infringes third-party rights;",
      "create misleading images or videos about properties, people or facts;",
      "upload personal data of third parties without a legal basis;",
      "extract data in bulk from third-party portals or websites, or build competing databases;",
      "circumvent limits, security measures or the credit system, or share your account with unauthorized people;",
      "reverse engineer, copy or resell the Service, or use it with unauthorized automated systems;",
      "send spam or unsolicited communications through the contact form or other features."
    ]},
    { type: "h2", text: "10. Intellectual Property" },
    { type: "ul", items: [
      "You keep all rights to the content you upload. You grant us a limited, non-exclusive, royalty-free license to process, store and display it solely to provide the Service to you.",
      "To the extent permitted by law and by the AI providers' terms, you may use the generated photos and videos for your business, including for commercial purposes.",
      "The platform, the Agente Immo brand, the software, the design templates, the music tracks and the other elements we provide remain the property of us or our licensors. Music and templates may be used only within content created with the Service."
    ]},
    { type: "h2", text: "11. Availability and Changes to the Service" },
    { type: "p", text: "We do our best to keep the Service available and working, but we do not guarantee uninterrupted or error-free operation. The Service also depends on third-party providers (for example artificial intelligence models), which may change or discontinue their services. We may modify, add or remove features; if a change substantially reduces a service you have already paid for, we will notify you and you may cancel." },
    { type: "h2", text: "12. Limitation of Liability" },
    { type: "p", text: "To the extent permitted by law, Agente Immo is not liable for indirect or consequential damages, loss of profits, customers or data, or for the consequences of the content you publish or of decisions made on the basis of the Service. Our total liability is limited to the amounts you paid us in the 12 months before the event. These limitations do not apply in cases of willful misconduct or gross negligence, nor to consumers' mandatory rights." },
    { type: "p", text: "You agree to hold Agente Immo harmless from third-party claims arising from the content you upload or publish or from your breach of these Terms." },
    { type: "h2", text: "13. Suspension and Termination" },
    { type: "p", text: "You can delete your account at any time from your Profile: your account, properties, personal website and Gallery files are deleted and your subscription is cancelled. We may suspend or close your account, with notice where possible, in the event of a breach of these Terms, fraudulent use, non-payment or a request from the authorities." },
    { type: "h2", text: "14. Changes to the Terms" },
    { type: "p", text: "We may update these Terms. Significant changes will be communicated by email or in the platform with reasonable notice; by continuing to use the Service after the effective date you accept them. If you do not accept them, you can cancel and delete your account." },
    { type: "h2", text: "15. Governing Law and Jurisdiction" },
    { type: "p", text: "These Terms are governed by Italian law. Disputes with professional users are subject to the exclusive jurisdiction of the courts of Rome, Italy. If you are a consumer, the courts of your place of residence or domicile have jurisdiction, and the mandatory rights granted by the law of your country remain unaffected." },
    { type: "p", text: "If any provision is found invalid, the remaining provisions remain in effect." },
    { type: "h2", text: "16. Contact" },
    { type: "p", text: "For questions about these Terms: info@agenteimmo.me." },
  ],
};

export const termsContent: Record<Locale, LegalPage> = {
  it: termsIt,
  en: termsEn,
  es: termsEn,
  fr: termsEn,
  ru: termsEn,
  uk: termsEn,
};

// ---------------------------------------------------------------------------------------------------------------
// CANCELLAZIONE DEI DATI
// ---------------------------------------------------------------------------------------------------------------

const dataDeletionIt: LegalPage = {
  title: "Come cancellare i tuoi dati",
  lastUpdated: "Ultimo aggiornamento: 30 settembre 2026",
  description: "Come eliminare l'account Agente Immo e i dati collegati, e cosa conserviamo per obbligo di legge.",
  blocks: [
    { type: "p", text: "Puoi cancellare in ogni momento i dati che Agente Immo conserva su di te. Questa pagina spiega come fare e cosa viene eliminato." },
    { type: "h2", text: "1. Elimina l'account dalla piattaforma" },
    { type: "ul", items: [
      "Accedi alla piattaforma su agenteimmo.me.",
      "Apri il Profilo.",
      "Premi \"Elimina account\" e conferma scrivendo ELIMINA.",
      "L'eliminazione è immediata e non si può annullare."
    ]},
    { type: "h2", text: "2. Cosa viene eliminato" },
    { type: "ul", items: [
      "Account, email e dati del profilo.",
      "Immobili salvati e dati importati dagli annunci.",
      "Il tuo sito personale, che smette di essere raggiungibile.",
      "Foto e video della Galleria e i file caricati per il sito.",
      "Conversazioni della chat, crediti e storico dei crediti.",
      "L'abbonamento, che viene annullato subito su Stripe senza ulteriori addebiti."
    ]},
    { type: "h2", text: "3. Cosa conserviamo" },
    { type: "p", text: "Fatture e dati dei pagamenti vengono conservati per 10 anni, come richiesto dalla legge (art. 2220 del Codice civile), e usati solo a fini fiscali e contabili. Le copie di backup vengono sovrascritte secondo i cicli tecnici dei fornitori. I codici cifrati usati per il limite della prova gratuita possono essere conservati per il periodo indicato nell'Informativa sulla Privacy." },
    { type: "h2", text: "4. Cancellare solo alcuni dati" },
    { type: "ul", items: [
      "Foto e video: puoi eliminarli singolarmente dalla Galleria.",
      "Immobili: puoi eliminarli dalla sezione Immobili.",
      "Conversazioni della chat: vengono cancellate automaticamente dopo 30 giorni."
    ]},
    { type: "h2", text: "5. Richiesta via email" },
    { type: "p", text: "Se non riesci ad accedere o vuoi esercitare un altro diritto previsto dal GDPR, scrivi a info@agenteimmo.me dall'indirizzo email del tuo account, con oggetto \"Richiesta di cancellazione\". Rispondiamo entro 30 giorni e ti confermiamo la cancellazione via email (art. 17 GDPR)." },
    { type: "h2", text: "6. Account Instagram o Facebook collegati in passato" },
    { type: "p", text: "Se in passato hai collegato un account Instagram o una Pagina Facebook ad Agente Immo, puoi revocare l'accesso dalle impostazioni di Facebook (Impostazioni, Integrazioni aziendali) o di Instagram (Impostazioni, App e siti web), cercando \"Agente Immo\" e premendo \"Rimuovi\". Eliminando l'account cancelliamo anche i relativi codici di accesso." },
    { type: "h2", text: "7. Domande" },
    { type: "p", text: "Per qualsiasi domanda sulla cancellazione dei dati o sui tuoi diritti scrivi a info@agenteimmo.me. Puoi anche rivolgerti al Garante per la protezione dei dati personali: www.garanteprivacy.it." },
  ],
};

const dataDeletionEn: LegalPage = {
  title: "How to Delete Your Data",
  lastUpdated: "Last updated: 30 September 2026",
  description: "How to delete your Agente Immo account and related data, and what we keep to comply with the law.",
  blocks: [
    { type: "p", text: "You can delete the data Agente Immo holds about you at any time. This page explains how to do it and what is deleted." },
    { type: "h2", text: "1. Delete your account from the platform" },
    { type: "ul", items: [
      "Sign in to the platform at agenteimmo.me.",
      "Open your Profile.",
      "Press \"Delete account\" and confirm by typing DELETE.",
      "Deletion is immediate and cannot be undone."
    ]},
    { type: "h2", text: "2. What is deleted" },
    { type: "ul", items: [
      "Your account, email and profile data.",
      "Saved properties and data imported from listings.",
      "Your personal website, which is no longer reachable.",
      "Gallery photos and videos and files uploaded for your website.",
      "Chat conversations, credits and credit history.",
      "Your subscription, which is cancelled immediately on Stripe with no further charges."
    ]},
    { type: "h2", text: "3. What we keep" },
    { type: "p", text: "Invoices and payment records are kept for 10 years as required by Italian law (Art. 2220 of the Civil Code) and used only for tax and accounting purposes. Backup copies are overwritten according to the providers' technical cycles. The hashed codes used for the free trial limit may be kept for the period stated in the Privacy Policy." },
    { type: "h2", text: "4. Deleting only some data" },
    { type: "ul", items: [
      "Photos and videos: you can delete them one by one from the Gallery.",
      "Properties: you can delete them from the Properties section.",
      "Chat conversations: they are deleted automatically after 30 days."
    ]},
    { type: "h2", text: "5. Request by email" },
    { type: "p", text: "If you cannot sign in or want to exercise another GDPR right, write to info@agenteimmo.me from your account's email address, with the subject \"Deletion Request\". We reply within 30 days and confirm the deletion by email (Art. 17 GDPR)." },
    { type: "h2", text: "6. Instagram or Facebook accounts connected in the past" },
    { type: "p", text: "If you connected an Instagram account or a Facebook Page to Agente Immo in the past, you can revoke access from your Facebook settings (Settings, Business Integrations) or Instagram settings (Settings, Apps and Websites) by finding \"Agente Immo\" and pressing \"Remove\". Deleting your account also deletes the related access tokens." },
    { type: "h2", text: "7. Questions" },
    { type: "p", text: "For any question about data deletion or your rights, write to info@agenteimmo.me. You can also contact the Italian Data Protection Authority: www.garanteprivacy.it." },
  ],
};

export const dataDeletionContent: Record<Locale, LegalPage> = {
  it: dataDeletionIt,
  en: dataDeletionEn,
  es: dataDeletionEn,
  fr: dataDeletionEn,
  ru: dataDeletionEn,
  uk: dataDeletionEn,
};
