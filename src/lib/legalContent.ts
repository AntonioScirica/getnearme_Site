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

export const privacyContent: Record<Locale, LegalPage> = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated: 02 April 2026",
    description: "Privacy Policy for the GetNearMe browser extension.",
    blocks: [
      { type: "h2", text: "1. Introduction and Data Controller" },
      { type: "p", text: "This Privacy Policy governs the processing of personal data in connection with the use of the GetNearMe browser extension (the \"Service\"). This Policy is intended to comply with Regulation (EU) 2016/679 (GDPR), Italian Legislative Decree 196/2003 (Italian Privacy Code) as amended by Legislative Decree 101/2018, and Directive 2002/58/EC (ePrivacy Directive) regarding access to and storage of information on user terminal equipment." },
      { type: "p", text: "Data Controller: Antonio Scirica acting commercially under the trade name \"GetNearMe\"\nEmail: as.scirica@gmail.com" },
      { type: "h2", text: "2. Nature of Data Processing" },
      { type: "p", text: "To ensure data minimization and strictly respect third-party intellectual property rights, the Service operates primarily as a local, client-side utility." },
      { type: "ul", items: [
        "Local Processing: The analysis of real estate properties is performed dynamically within the User's browser. The Service does not index, or reproduce third-party databases on its own servers to create a competing search engine.",
        "No Data Transfer for Aggregation: Content visible on the User's screen is processed temporarily in the browser's volatile memory and is not transmitted to the Controller's servers for permanent storage or aggregation.",
        "Property-related data processed locally by the Service primarily relates to real estate objects and locations and does not typically constitute personal data of identifiable natural persons within the meaning of Article 4 GDPR."
      ]},
      { type: "h2", text: "3. Categories of Data Processed" },
      { type: "p", text: "We process only the data strictly necessary to deliver the Service, categorized by storage location:" },
      { type: "h3", text: "3.1. Server-Side Data (Account & Technical Logs)" },
      { type: "p", text: "Our backend infrastructure processes limited metadata required for account management and security:" },
      { type: "ul", items: [
        "Identity Data: Email address and User ID (authenticated via Supabase) to manage your account and subscription.",
        "Transactional Data: Subscription status, credit balance, and payment identifiers processed securely by Stripe (we do not store full credit card numbers).",
        "Technical Service Logs: Technical service validation events confirming that a requested operation was successfully executed (used strictly for credit deduction and debugging), without storing listing content or attributes.",
        "Security & Retention: IP addresses and technical logs are retained only for the limited period strictly necessary to fulfill their specific purpose (security monitoring, debugging, and service validation) and are periodically deleted in accordance with internal retention policies to comply with the principle of Storage Limitation (Art. 5(1)(e) GDPR)."
      ]},
      { type: "h3", text: "3.2. Client-Side Data (Local Device Only)" },
      { type: "p", text: "To display comparisons and contextual insights, the Service processes the following data exclusively on your device:" },
      { type: "ul", items: [
        "Temporary Session Data: The Extension utilizes the browser's Local Storage API (chrome.storage.local) to temporarily cache limited factual data necessary for analysis visible on the page required for the User's requested analysis. This data remains sandboxed within your browser and is not accessible to the Controller."
      ]},
      { type: "p", text: "This local storage is technically necessary for the functioning of the Service, is not used for tracking or advertising purposes, and remains sandboxed within the User's browser." },
      { type: "h3", text: "3.3. Voluntary Marketing Data" },
      { type: "p", text: "Only if you explicitly consent via a separate checkbox, we process your email address and limited activity metrics (such as daily usage streaks) to administer the optional Daily Bonus system and to send the Newsletter." },
      { type: "h3", text: "3.4. Team and Referral Data" },
      { type: "p", text: "If you use the Team or Referral features of the Service, we additionally process:" },
      { type: "ul", items: [
        "Team Data: Email address of invitees, team role (owner/member), team ID, and invitation status. Email addresses of unaccepted invitations are deleted after 7 days.",
        "Referral Data: Referral code, email address of the inviting and invited user, referral status, and bonus credits awarded."
      ]},
      { type: "h2", text: "4. Third-Party Processors and Data Recipients" },
      { type: "ul", items: [
        "Infrastructure and Payments: We utilize Supabase (EU) for database hosting and authentication services, and Stripe (Global) for secure PCI-DSS compliant payment processing.",
        "Transactional Emails: We use Resend (USA) as our email delivery provider for transactional emails (verification codes, team invitations, notifications).",
        "Email Marketing: We use Brevo (Sendinblue, EU — France) for newsletter management and marketing communications, subject to User consent.",
        "AI Description Analysis: If the User activates the listing description analysis feature, the description text is transmitted to Groq (USA) for automated quality assessment. No personal User data is included in the request.",
        "Video Generation: If the User uses the social post video generation feature, listing text data (price, address, features) is transmitted to Remotion/AWS Lambda (EU — eu-central-1, Frankfurt) for video rendering. No listing photos are transmitted.",
        "Maps and Routing: To calculate distances and travel times, the Service transmits approximate location coordinates to routing and mapping services.",
        "Market Data & Valuations: Specific property location data may be cross-referenced with Public Market Data Sources to retrieve estimated market valuations.",
        "Contextual Events & Activities: To display nearby activities, the Service queries Contextual Event & Activity Providers. These providers receive general location coordinates and dates to return relevant events; no User identity or personal browsing history is shared with them.",
        "AI Image Processing: If the User voluntarily triggers the \"Virtual Staging\" feature by uploading their own photo, the image is transmitted transiently to Replicate (USA) solely for the generation of the requested content.",
        "Social Media Publishing (Optional, Agency users): If the User connects their Instagram Business or Facebook Page account, we exchange OAuth credentials with Meta Platforms, Inc. (USA) through Instagram Graph API and Facebook Graph API. We store long-lived access tokens (~60 days), the linked Instagram Business Account ID, the linked Facebook Page ID, and Page access tokens — solely to publish content the User has explicitly scheduled or requested via the Service. No content is published without explicit User action. Media uploaded for publishing (images/videos) is stored privately on Supabase Storage and automatically deleted within minutes after successful publication."
      ]},
      { type: "h2", text: "5. International Data Transfers" },
      { type: "p", text: "Some of our service providers operate in the United States (Resend, Groq, Replicate, Stripe, Meta Platforms). Such transfers are carried out on the basis of:" },
      { type: "ul", items: [
        "Standard Contractual Clauses (SCCs) approved by the European Commission under Art. 46(2)(c) GDPR.",
        "EU-US Data Privacy Framework, where the provider is certified.",
        "Supplementary technical (encryption in transit and at rest) and organizational safeguards implemented by the providers."
      ]},
      { type: "p", text: "Transfers to Remotion/AWS occur within the EU (region eu-central-1, Frankfurt). Brevo and Supabase operate within the EU." },
      { type: "h2", text: "6. Legal Basis for Processing" },
      { type: "p", text: "In compliance with Article 6 of the GDPR, we process data based on the following grounds:" },
      { type: "ul", items: [
        "Performance of a Contract (Art. 6(1)(b)): For the core delivery of the analysis service, routing calculations, valuation estimates, account management, and processing payments.",
        "Legitimate Interest (Art. 6(1)(f)): For ensuring the security of the Extension, preventing fraud (e.g., credit abuse), and maintaining platform integrity.",
        "Explicit Consent (Art. 6(1)(a)): For optional features such as marketing communications, the Daily Bonus system, and AI-generated content.",
        "Legal Obligation (Art. 6(1)(c)): For tax reporting and accounting compliance."
      ]},
      { type: "h2", text: "7. Data Retention Periods" },
      { type: "p", text: "Personal data is retained only for as long as necessary to fulfill the purposes for which it was collected:" },
      { type: "ul", items: [
        "Account data (email, user ID): for the duration of the account and deleted within 30 days of a deletion request.",
        "Transactional data (payments, credits): retained for 10 years as required by Italian tax law (Art. 2220 Civil Code).",
        "Technical logs and IP addresses: retained for a maximum of 90 days, then automatically deleted.",
        "Marketing data (bonus emails, newsletter): retained until consent is withdrawn or the user unsubscribes.",
        "Team data — unaccepted invitations: automatically deleted after 7 days.",
        "Referral data: retained for the duration of the inviting user's account.",
        "AI images (Virtual Staging): processed in real time and not stored by the Controller. AI providers (Replicate) delete images within 24 hours of processing.",
        "AI description analysis: text is transmitted to Groq solely for the duration of processing and is not stored.",
        "Social media access tokens: stored for the duration of the account connection, automatically refreshed every ~50 days, and deleted immediately upon User disconnection or account deletion. Media uploaded for scheduled publishing is deleted from storage within minutes after successful publication, and within 7 days if publishing fails. The User may revoke access at any time via Facebook/Instagram settings (Settings → Apps and Websites) or from the GetNearMe Settings panel."
      ]},
      { type: "h2", text: "8. Automated Decision-Making and Profiling" },
      { type: "p", text: "Pursuant to Art. 22 of the GDPR, we inform you that the Service uses automated decision-making processes in the following features:" },
      { type: "ul", items: [
        "AI Description Analysis: The automated quality analysis of real estate descriptions generates a score from 1 to 10 using artificial intelligence models (Groq/LLaMA). This score is purely informational and does not produce legal effects or similarly significantly affect the User.",
        "AI Virtual Staging: The generation of virtual furnishing images via AI (Replicate) occurs exclusively at the User's voluntary request and does not involve automated decisions with significant effects."
      ]},
      { type: "p", text: "None of these features produce decisions based solely on automated processing that produce legal effects or similarly significantly affect the data subject. The User may in any case request human intervention by contacting as.scirica@gmail.com." },
      { type: "h2", text: "9. User Rights" },
      { type: "p", text: "Under Articles 15-22 of the GDPR, you have the right to:" },
      { type: "ul", items: [
        "Access (Art. 15): obtain confirmation of whether your personal data is being processed.",
        "Rectification (Art. 16): obtain rectification of inaccurate personal data.",
        "Erasure (Art. 17): obtain erasure of your data (\"right to be forgotten\").",
        "Restriction (Art. 18): obtain restriction of processing.",
        "Portability (Art. 20): receive your data in a structured, machine-readable format.",
        "Objection (Art. 21): object to processing based on legitimate interest.",
        "Withdrawal of consent: withdraw consent given for marketing or AI features at any time, without affecting the lawfulness of prior processing."
      ]},
      { type: "p", text: "To exercise these rights, please contact: as.scirica@gmail.com." },
      { type: "p", text: "You also have the right to lodge a complaint with the supervisory authority:\nGarante per la protezione dei dati personali\nPiazza Venezia 11 — 00187 Rome, Italy\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
      { type: "h2", text: "10. Changes to this Policy" },
      { type: "p", text: "We may update this Privacy Policy from time to time. We will notify you of any significant changes via the Extension interface or email." },
    ],
  },
  it: {
    title: "Informativa sulla Privacy",
    lastUpdated: "Ultimo aggiornamento: 02 aprile 2026",
    description: "Informativa sulla Privacy per l'estensione browser GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Introduzione e Titolare del Trattamento" },
      { type: "p", text: "La presente Informativa sulla Privacy disciplina il trattamento dei dati personali in relazione all'utilizzo dell'estensione browser GetNearMe (il \"Servizio\"). La presente Informativa è volta a rispettare il Regolamento (UE) 2016/679 (GDPR), il D.Lgs. 196/2003 (Codice Privacy italiano) come modificato dal D.Lgs. 101/2018 e la Direttiva 2002/58/CE (Direttiva ePrivacy) in materia di accesso e archiviazione delle informazioni sui dispositivi terminali degli utenti." },
      { type: "p", text: "Titolare del Trattamento: Antonio Scirica, operante commercialmente con il nome \"GetNearMe\"\nEmail: as.scirica@gmail.com" },
      { type: "h2", text: "2. Natura del Trattamento dei Dati" },
      { type: "p", text: "Per garantire la minimizzazione dei dati e il rigoroso rispetto dei diritti di proprietà intellettuale di terzi, il Servizio opera principalmente come utilità locale, lato client." },
      { type: "ul", items: [
        "Elaborazione Locale: L'analisi degli immobili viene eseguita dinamicamente all'interno del browser dell'Utente. Il Servizio non effettua indicizzazione o riproduzione di database di terze parti sui propri server per creare un motore di ricerca concorrente.",
        "Nessun Trasferimento Dati per Aggregazione: Il contenuto visibile sullo schermo dell'Utente viene elaborato temporaneamente nella memoria volatile del browser e non viene trasmesso ai server del Titolare per l'archiviazione permanente o l'aggregazione.",
        "I dati relativi agli immobili elaborati localmente dal Servizio si riferiscono principalmente a oggetti immobiliari e localizzazioni e non costituiscono tipicamente dati personali di persone fisiche identificabili ai sensi dell'Articolo 4 del GDPR."
      ]},
      { type: "h2", text: "3. Categorie di Dati Trattati" },
      { type: "p", text: "Trattiamo esclusivamente i dati strettamente necessari all'erogazione del Servizio, suddivisi per luogo di archiviazione:" },
      { type: "h3", text: "3.1. Dati Lato Server (Account e Log Tecnici)" },
      { type: "p", text: "La nostra infrastruttura backend elabora metadati limitati necessari per la gestione dell'account e la sicurezza:" },
      { type: "ul", items: [
        "Dati Identificativi: Indirizzo email e ID Utente (autenticato tramite Supabase) per la gestione dell'account e dell'abbonamento.",
        "Dati Transazionali: Stato dell'abbonamento, saldo crediti e identificativi di pagamento elaborati in modo sicuro da Stripe (non memorizziamo i numeri completi delle carte di credito).",
        "Log Tecnici del Servizio: Eventi di validazione tecnica che confermano la corretta esecuzione di un'operazione richiesta (utilizzati esclusivamente per la deduzione dei crediti e il debugging), senza memorizzare contenuti o attributi degli annunci.",
        "Sicurezza e Conservazione: Gli indirizzi IP e i log tecnici sono conservati solo per il periodo strettamente necessario a soddisfare il loro scopo specifico (monitoraggio della sicurezza, debugging e validazione del servizio) e vengono periodicamente cancellati in conformità con le politiche di conservazione interne per rispettare il principio di Limitazione della Conservazione (Art. 5(1)(e) GDPR)."
      ]},
      { type: "h3", text: "3.2. Dati Lato Client (Solo Dispositivo Locale)" },
      { type: "p", text: "Per visualizzare confronti e informazioni contestuali, il Servizio elabora i seguenti dati esclusivamente sul dispositivo dell'utente:" },
      { type: "ul", items: [
        "Dati di Sessione Temporanei: L'Estensione utilizza l'API Local Storage del browser (chrome.storage.local) per memorizzare temporaneamente nella cache dati fattuali limitati necessari per l'analisi visibile nella pagina richiesta dall'Utente. Questi dati rimangono isolati nel browser e non sono accessibili al Titolare."
      ]},
      { type: "p", text: "Questa archiviazione locale è tecnicamente necessaria per il funzionamento del Servizio, non viene utilizzata per finalità di tracciamento o pubblicitarie e rimane isolata all'interno del browser dell'Utente." },
      { type: "h3", text: "3.3. Dati di Marketing Volontari" },
      { type: "p", text: "Solo previo consenso esplicito tramite apposita casella, trattiamo il tuo indirizzo email e metriche di attività limitate (come le serie di utilizzo giornaliero) per amministrare il sistema opzionale Daily Bonus e per inviare la Newsletter." },
      { type: "h3", text: "3.4. Dati Team e Referral" },
      { type: "p", text: "Se utilizzi le funzionalità Team o Referral del Servizio, trattiamo inoltre:" },
      { type: "ul", items: [
        "Dati Team: Indirizzo email degli invitati, ruolo nel team (owner/member), ID team e stato dell'invito. Gli indirizzi email degli invitati non accettati vengono cancellati dopo 7 giorni.",
        "Dati Referral: Codice referral, email dell'utente invitante e dell'invitato, stato del referral e crediti bonus assegnati."
      ]},
      { type: "h2", text: "4. Responsabili del Trattamento e Destinatari dei Dati" },
      { type: "ul", items: [
        "Infrastruttura e Pagamenti: Utilizziamo Supabase (UE) per l'hosting del database e i servizi di autenticazione, e Stripe (Globale) per l'elaborazione sicura dei pagamenti conforme PCI-DSS.",
        "Email Transazionali: Utilizziamo Resend (USA) come fornitore per l'invio di email transazionali (codici di verifica, inviti team, notifiche).",
        "Email Marketing: Utilizziamo Brevo (Sendinblue, UE — Francia) per la gestione delle newsletter e delle comunicazioni di marketing, previo consenso dell'Utente.",
        "Analisi AI Descrizioni: Se l'Utente attiva la funzione di analisi della descrizione immobiliare, il testo della descrizione viene trasmesso a Groq (USA) per la valutazione automatica della qualità. Nessun dato personale dell'Utente viene incluso nella richiesta.",
        "Generazione Video: Se l'Utente utilizza la funzione di generazione video per post social, i dati testuali dell'annuncio (prezzo, indirizzo, caratteristiche) vengono trasmessi a Remotion/AWS Lambda (UE — eu-central-1, Francoforte) per il rendering del video. Nessuna foto dell'annuncio viene trasmessa.",
        "Mappe e Percorsi: Per calcolare distanze e tempi di percorrenza, il Servizio trasmette coordinate di posizione approssimative a servizi di routing e mappatura.",
        "Dati di Mercato e Valutazioni: Dati specifici sulla posizione dell'immobile possono essere incrociati con Fonti Pubbliche di Dati di Mercato per ottenere valutazioni di mercato stimate.",
        "Eventi e Attività Contestuali: Per mostrare attività nelle vicinanze, il Servizio interroga Fornitori di Eventi e Attività Contestuali. Questi fornitori ricevono coordinate di posizione generiche e date per restituire eventi pertinenti; nessuna identità dell'Utente o cronologia di navigazione viene condivisa con loro.",
        "Elaborazione AI Immagini: Se l'Utente attiva volontariamente la funzione \"Virtual Staging\" caricando una propria foto, l'immagine viene trasmessa temporaneamente a Replicate (USA) esclusivamente per la generazione del contenuto richiesto.",
        "Pubblicazione Social Media (Opzionale, utenti Agency): Se l'Utente collega il proprio account Instagram Business o Pagina Facebook, scambiamo credenziali OAuth con Meta Platforms, Inc. (USA) tramite Instagram Graph API e Facebook Graph API. Conserviamo token di accesso long-lived (~60 giorni), l'ID Instagram Business Account collegato, l'ID Pagina Facebook collegato e i token di accesso della Pagina — esclusivamente per pubblicare contenuti che l'Utente ha esplicitamente programmato o richiesto tramite il Servizio. Nessun contenuto viene pubblicato senza azione esplicita dell'Utente. I media caricati per la pubblicazione (immagini/video) sono archiviati privatamente su Supabase Storage e cancellati automaticamente entro pochi minuti dalla pubblicazione riuscita."
      ]},
      { type: "h2", text: "5. Trasferimenti Internazionali di Dati" },
      { type: "p", text: "Alcuni dei nostri fornitori di servizi operano negli Stati Uniti (Resend, Groq, Replicate, Stripe, Meta Platforms). Tali trasferimenti sono effettuati sulla base di:" },
      { type: "ul", items: [
        "Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea ai sensi dell'Art. 46(2)(c) GDPR.",
        "Data Privacy Framework UE-USA, ove il fornitore sia certificato.",
        "Garanzie supplementari tecniche (crittografia in transito e a riposo) e organizzative implementate dai fornitori."
      ]},
      { type: "p", text: "I trasferimenti verso Remotion/AWS avvengono all'interno dell'UE (regione eu-central-1, Francoforte). Brevo e Supabase operano all'interno dell'UE." },
      { type: "h2", text: "6. Base Giuridica del Trattamento" },
      { type: "p", text: "In conformità con l'Articolo 6 del GDPR, trattiamo i dati sulla base dei seguenti fondamenti:" },
      { type: "ul", items: [
        "Esecuzione di un Contratto (Art. 6(1)(b)): Per l'erogazione del servizio di analisi, calcoli di percorso, stime di valutazione, gestione dell'account ed elaborazione dei pagamenti.",
        "Interesse Legittimo (Art. 6(1)(f)): Per garantire la sicurezza dell'Estensione, prevenire frodi (es. abuso di crediti) e mantenere l'integrità della piattaforma.",
        "Consenso Esplicito (Art. 6(1)(a)): Per funzionalità opzionali come comunicazioni di marketing, il sistema Daily Bonus e contenuti generati dall'AI.",
        "Obbligo Legale (Art. 6(1)(c)): Per la dichiarazione fiscale e la conformità contabile."
      ]},
      { type: "h2", text: "7. Durata della Conservazione dei Dati" },
      { type: "p", text: "I dati personali vengono conservati per il tempo strettamente necessario al raggiungimento delle finalità per cui sono raccolti:" },
      { type: "ul", items: [
        "Dati dell'account (email, ID utente): per tutta la durata dell'account e cancellati entro 30 giorni dalla richiesta di cancellazione.",
        "Dati transazionali (pagamenti, crediti): conservati per 10 anni come richiesto dalla normativa fiscale italiana (Art. 2220 c.c.).",
        "Log tecnici e indirizzi IP: conservati per un massimo di 90 giorni, poi cancellati automaticamente.",
        "Dati di marketing (email bonus, newsletter): conservati fino alla revoca del consenso o alla disiscrizione.",
        "Dati team — inviti non accettati: cancellati automaticamente dopo 7 giorni.",
        "Dati referral: conservati per tutta la durata dell'account dell'utente invitante.",
        "Immagini AI (Virtual Staging): elaborate in tempo reale e non conservate dal Titolare. I fornitori AI (Replicate) eliminano le immagini entro 24 ore dall'elaborazione.",
        "Analisi descrizioni AI: il testo viene trasmesso a Groq per la sola durata dell'elaborazione e non viene conservato.",
        "Token di accesso social media: conservati per la durata della connessione dell'account, rinnovati automaticamente ogni ~50 giorni e cancellati immediatamente alla disconnessione dell'Utente o all'eliminazione dell'account. I media caricati per la pubblicazione programmata sono cancellati dallo storage entro pochi minuti dalla pubblicazione riuscita, ed entro 7 giorni in caso di pubblicazione fallita. L'Utente può revocare l'accesso in qualsiasi momento dalle impostazioni Facebook/Instagram (Impostazioni → App e siti web) o dal pannello Impostazioni di GetNearMe."
      ]},
      { type: "h2", text: "8. Decisioni Automatizzate e Profilazione" },
      { type: "p", text: "Ai sensi dell'Art. 22 del GDPR, informiamo che il Servizio utilizza processi decisionali automatizzati nelle seguenti funzionalità:" },
      { type: "ul", items: [
        "Analisi Descrizione AI: L'analisi automatica della qualità delle descrizioni immobiliari genera un punteggio da 1 a 10 tramite modelli di intelligenza artificiale (Groq/LLaMA). Questo punteggio è puramente informativo e non produce effetti giuridici né incide in modo analogo significativamente sull'Utente.",
        "Virtual Staging AI: La generazione di immagini di arredamento virtuale tramite AI (Replicate) avviene esclusivamente su richiesta volontaria dell'Utente e non comporta decisioni automatizzate con effetti significativi."
      ]},
      { type: "p", text: "Nessuna di queste funzionalità produce decisioni basate unicamente su trattamento automatizzato che producano effetti giuridici o che incidano in modo analogo significativamente sull'interessato. L'Utente può in ogni caso richiedere l'intervento umano contattando as.scirica@gmail.com." },
      { type: "h2", text: "9. Diritti dell'Utente" },
      { type: "p", text: "Ai sensi degli Artt. 15-22 del GDPR e degli Artt. 7-10 del D.Lgs. 196/2003, hai il diritto di:" },
      { type: "ul", items: [
        "Accesso (Art. 15): ottenere conferma che sia o meno in corso un trattamento dei tuoi dati personali.",
        "Rettifica (Art. 16): ottenere la rettifica di dati personali inesatti.",
        "Cancellazione (Art. 17): ottenere la cancellazione dei dati (\"diritto all'oblio\").",
        "Limitazione (Art. 18): ottenere la limitazione del trattamento.",
        "Portabilità (Art. 20): ricevere i dati in formato strutturato e leggibile da dispositivo automatico.",
        "Opposizione (Art. 21): opporti al trattamento basato su interesse legittimo.",
        "Revoca del consenso: revocare in qualsiasi momento il consenso prestato per il marketing o le funzionalità AI, senza pregiudizio per la liceità del trattamento precedente."
      ]},
      { type: "p", text: "Per esercitare questi diritti, contattare: as.scirica@gmail.com." },
      { type: "p", text: "Hai inoltre il diritto di proporre reclamo all'autorità di controllo:\nGarante per la protezione dei dati personali\nPiazza Venezia 11 — 00187 Roma\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
      { type: "h2", text: "10. Modifiche alla presente Informativa" },
      { type: "p", text: "Potremmo aggiornare la presente Informativa sulla Privacy di tanto in tanto. Ti informeremo di eventuali modifiche significative tramite l'interfaccia dell'Estensione o via email." },
    ],
  },
  es: {
    title: "Política de Privacidad",
    lastUpdated: "Última actualización: 02 de abril de 2026",
    description: "Política de Privacidad para la extensión de navegador GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Introducción y Responsable del Tratamiento" },
      { type: "p", text: "Esta Política de Privacidad regula el tratamiento de datos personales en relación con el uso de la extensión de navegador GetNearMe (el \"Servicio\"). Esta Política tiene como objetivo cumplir con el Reglamento (UE) 2016/679 (RGPD), el D.Lgs. 196/2003 (Código de Privacidad italiano) modificado por el D.Lgs. 101/2018, y la Directiva 2002/58/CE (Directiva ePrivacy) en materia de acceso y almacenamiento de información en los equipos terminales de los usuarios." },
      { type: "p", text: "Responsable del Tratamiento: Antonio Scirica, operando comercialmente bajo el nombre comercial \"GetNearMe\"\nEmail: as.scirica@gmail.com" },
      { type: "h2", text: "2. Naturaleza del Tratamiento de Datos" },
      { type: "p", text: "Para garantizar la minimización de datos y respetar estrictamente los derechos de propiedad intelectual de terceros, el Servicio opera principalmente como una utilidad local, del lado del cliente." },
      { type: "ul", items: [
        "Procesamiento Local: El análisis de propiedades inmobiliarias se realiza dinámicamente dentro del navegador del Usuario. El Servicio no realiza indexación ni reproducción de bases de datos de terceros en sus propios servidores para crear un motor de búsqueda competidor.",
        "Sin Transferencia de Datos para Agregación: El contenido visible en la pantalla del Usuario se procesa temporalmente en la memoria volátil del navegador y no se transmite a los servidores del Responsable para almacenamiento permanente o agregación.",
        "Los datos relacionados con propiedades procesados localmente por el Servicio se refieren principalmente a objetos inmobiliarios y ubicaciones y no constituyen típicamente datos personales de personas físicas identificables en el sentido del Artículo 4 del RGPD."
      ]},
      { type: "h2", text: "3. Categorías de Datos Tratados" },
      { type: "p", text: "Procesamos únicamente los datos estrictamente necesarios para prestar el Servicio, categorizados por ubicación de almacenamiento:" },
      { type: "h3", text: "3.1. Datos del Lado del Servidor (Cuenta y Registros Técnicos)" },
      { type: "p", text: "Nuestra infraestructura backend procesa metadatos limitados necesarios para la gestión de cuentas y seguridad:" },
      { type: "ul", items: [
        "Datos de Identidad: Dirección de correo electrónico e ID de Usuario (autenticado mediante Supabase) para gestionar su cuenta y suscripción.",
        "Datos Transaccionales: Estado de suscripción, saldo de créditos e identificadores de pago procesados de forma segura por Stripe (no almacenamos números completos de tarjetas de crédito).",
        "Registros Técnicos del Servicio: Eventos de validación técnica que confirman la ejecución exitosa de una operación solicitada (utilizados estrictamente para la deducción de créditos y depuración), sin almacenar contenido ni atributos de anuncios.",
        "Seguridad y Retención: Las direcciones IP y los registros técnicos se conservan únicamente durante el período estrictamente necesario para cumplir su propósito específico (monitoreo de seguridad, depuración y validación del servicio) y se eliminan periódicamente de acuerdo con las políticas de retención internas para cumplir con el principio de Limitación del Almacenamiento (Art. 5(1)(e) RGPD)."
      ]},
      { type: "h3", text: "3.2. Datos del Lado del Cliente (Solo Dispositivo Local)" },
      { type: "p", text: "Para mostrar comparaciones e información contextual, el Servicio procesa los siguientes datos exclusivamente en su dispositivo:" },
      { type: "ul", items: [
        "Datos de Sesión Temporales: La Extensión utiliza la API de almacenamiento local del navegador (chrome.storage.local) para almacenar temporalmente en caché datos factuales limitados necesarios para el análisis visible en la página requerida para el análisis solicitado por el Usuario. Estos datos permanecen aislados dentro de su navegador y no son accesibles para el Responsable."
      ]},
      { type: "p", text: "Este almacenamiento local es técnicamente necesario para el funcionamiento del Servicio, no se utiliza con fines de seguimiento o publicitarios y permanece aislado dentro del navegador del Usuario." },
      { type: "h3", text: "3.3. Datos de Marketing Voluntarios" },
      { type: "p", text: "Solo si usted consiente explícitamente mediante una casilla de verificación separada, procesamos su dirección de correo electrónico y métricas de actividad limitadas (como rachas de uso diario) para administrar el sistema opcional Daily Bonus y para enviar el Boletín." },
      { type: "h3", text: "3.4. Datos de Equipo y Referidos" },
      { type: "p", text: "Si utiliza las funciones de Equipo o Referidos del Servicio, también procesamos:" },
      { type: "ul", items: [
        "Datos de Equipo: Dirección de correo electrónico de los invitados, rol en el equipo (propietario/miembro), ID de equipo y estado de la invitación. Las direcciones de correo de invitaciones no aceptadas se eliminan después de 7 días.",
        "Datos de Referidos: Código de referido, correo electrónico del usuario que invita y del invitado, estado del referido y créditos de bonificación otorgados."
      ]},
      { type: "h2", text: "4. Encargados del Tratamiento y Destinatarios de Datos" },
      { type: "ul", items: [
        "Infraestructura y Pagos: Utilizamos Supabase (UE) para el alojamiento de la base de datos y servicios de autenticación, y Stripe (Global) para el procesamiento seguro de pagos conforme a PCI-DSS.",
        "Emails Transaccionales: Utilizamos Resend (EE.UU.) como proveedor de envío de correo electrónico para emails transaccionales (códigos de verificación, invitaciones de equipo, notificaciones).",
        "Email Marketing: Utilizamos Brevo (Sendinblue, UE — Francia) para la gestión de boletines y comunicaciones de marketing, previo consentimiento del Usuario.",
        "Análisis AI de Descripciones: Si el Usuario activa la función de análisis de descripciones inmobiliarias, el texto se transmite a Groq (EE.UU.) para la evaluación automatizada de calidad. No se incluyen datos personales del Usuario en la solicitud.",
        "Generación de Video: Si el Usuario utiliza la función de generación de video para publicaciones sociales, los datos textuales del anuncio (precio, dirección, características) se transmiten a Remotion/AWS Lambda (UE — eu-central-1, Fráncfort) para el renderizado del video. No se transmiten fotos del anuncio.",
        "Mapas y Rutas: Para calcular distancias y tiempos de viaje, el Servicio transmite coordenadas de ubicación aproximadas a servicios de enrutamiento y mapeo.",
        "Datos de Mercado y Valoraciones: Los datos de ubicación de propiedades específicas pueden cruzarse con Fuentes Públicas de Datos de Mercado para obtener valoraciones de mercado estimadas.",
        "Eventos y Actividades Contextuales: Para mostrar actividades cercanas, el Servicio consulta Proveedores de Eventos y Actividades Contextuales. Estos proveedores reciben coordenadas de ubicación generales y fechas para devolver eventos relevantes; no se comparte la identidad del Usuario ni el historial de navegación personal.",
        "Procesamiento AI de Imágenes: Si el Usuario activa voluntariamente la función \"Virtual Staging\" subiendo una foto propia, la imagen se transmite transitoriamente a Replicate (EE.UU.) exclusivamente para la generación del contenido solicitado.",
        "Publicación en Redes Sociales (Opcional, usuarios Agency): Si el Usuario conecta su cuenta de Instagram Business o Página de Facebook, intercambiamos credenciales OAuth con Meta Platforms, Inc. (EE.UU.) a través de Instagram Graph API y Facebook Graph API. Almacenamos tokens de acceso de larga duración (~60 días), el ID de la cuenta Instagram Business vinculada, el ID de la Página de Facebook vinculada y los tokens de acceso de la Página — exclusivamente para publicar contenido que el Usuario haya programado o solicitado explícitamente. Ningún contenido se publica sin acción explícita del Usuario. Los medios cargados para publicación (imágenes/videos) se almacenan de forma privada en Supabase Storage y se eliminan automáticamente en minutos tras la publicación exitosa."
      ]},
      { type: "h2", text: "5. Transferencias Internacionales de Datos" },
      { type: "p", text: "Algunos de nuestros proveedores de servicios operan en Estados Unidos (Resend, Groq, Replicate, Stripe, Meta Platforms). Dichas transferencias se realizan sobre la base de:" },
      { type: "ul", items: [
        "Cláusulas Contractuales Tipo (CCT) aprobadas por la Comisión Europea conforme al Art. 46(2)(c) RGPD.",
        "Marco de Privacidad de Datos UE-EE.UU., cuando el proveedor esté certificado.",
        "Garantías suplementarias técnicas (cifrado en tránsito y en reposo) y organizativas implementadas por los proveedores."
      ]},
      { type: "p", text: "Las transferencias a Remotion/AWS se realizan dentro de la UE (región eu-central-1, Fráncfort). Brevo y Supabase operan dentro de la UE." },
      { type: "h2", text: "6. Base Jurídica del Tratamiento" },
      { type: "p", text: "En cumplimiento del Artículo 6 del RGPD, tratamos los datos en base a los siguientes fundamentos:" },
      { type: "ul", items: [
        "Ejecución de un Contrato (Art. 6(1)(b)): Para la prestación principal del servicio de análisis, cálculos de ruta, estimaciones de valoración, gestión de cuenta y procesamiento de pagos.",
        "Interés Legítimo (Art. 6(1)(f)): Para garantizar la seguridad de la Extensión, prevenir fraudes (ej. abuso de créditos) y mantener la integridad de la plataforma.",
        "Consentimiento Explícito (Art. 6(1)(a)): Para funciones opcionales como comunicaciones de marketing, el sistema Daily Bonus y contenido generado por IA.",
        "Obligación Legal (Art. 6(1)(c)): Para la declaración de impuestos y el cumplimiento contable."
      ]},
      { type: "h2", text: "7. Períodos de Conservación de Datos" },
      { type: "p", text: "Los datos personales se conservan únicamente durante el tiempo necesario para cumplir los fines para los que fueron recopilados:" },
      { type: "ul", items: [
        "Datos de cuenta (email, ID de usuario): durante la vigencia de la cuenta y eliminados en un plazo de 30 días tras la solicitud de cancelación.",
        "Datos transaccionales (pagos, créditos): conservados durante 10 años según la normativa fiscal italiana (Art. 2220 C.C.).",
        "Logs técnicos y direcciones IP: conservados durante un máximo de 90 días, luego eliminados automáticamente.",
        "Datos de marketing (emails de bonificación, boletín): conservados hasta la revocación del consentimiento o la cancelación de la suscripción.",
        "Datos de equipo — invitaciones no aceptadas: eliminados automáticamente después de 7 días.",
        "Datos de referidos: conservados durante la vigencia de la cuenta del usuario que invita.",
        "Imágenes AI (Virtual Staging): procesadas en tiempo real y no almacenadas por el Responsable. Los proveedores AI (Replicate) eliminan las imágenes en un plazo de 24 horas tras el procesamiento.",
        "Análisis de descripciones AI: el texto se transmite a Groq únicamente durante el procesamiento y no se almacena.",
        "Tokens de acceso de redes sociales: almacenados durante la conexión de la cuenta, renovados automáticamente cada ~50 días y eliminados inmediatamente tras la desconexión del Usuario o eliminación de la cuenta. Los medios cargados para publicación programada se eliminan del almacenamiento en minutos tras la publicación exitosa, y en 7 días si la publicación falla. El Usuario puede revocar el acceso en cualquier momento desde la configuración de Facebook/Instagram (Configuración → Apps y sitios web) o desde el panel de Configuración de GetNearMe."
      ]},
      { type: "h2", text: "8. Decisiones Automatizadas y Elaboración de Perfiles" },
      { type: "p", text: "De conformidad con el Art. 22 del RGPD, le informamos que el Servicio utiliza procesos de toma de decisiones automatizados en las siguientes funcionalidades:" },
      { type: "ul", items: [
        "Análisis AI de Descripción: El análisis automatizado de la calidad de las descripciones inmobiliarias genera una puntuación de 1 a 10 mediante modelos de inteligencia artificial (Groq/LLaMA). Esta puntuación es puramente informativa y no produce efectos jurídicos ni afecta de manera similar significativamente al Usuario.",
        "Virtual Staging AI: La generación de imágenes de amueblamiento virtual mediante IA (Replicate) se realiza exclusivamente a solicitud voluntaria del Usuario y no implica decisiones automatizadas con efectos significativos."
      ]},
      { type: "p", text: "Ninguna de estas funcionalidades produce decisiones basadas únicamente en tratamiento automatizado que produzcan efectos jurídicos o que afecten de manera similar significativamente al interesado. El Usuario puede en cualquier caso solicitar la intervención humana contactando a as.scirica@gmail.com." },
      { type: "h2", text: "9. Derechos del Usuario" },
      { type: "p", text: "Conforme a los Artículos 15-22 del RGPD, usted tiene derecho a:" },
      { type: "ul", items: [
        "Acceso (Art. 15): obtener confirmación de si se están tratando sus datos personales.",
        "Rectificación (Art. 16): obtener la rectificación de datos personales inexactos.",
        "Supresión (Art. 17): obtener la supresión de sus datos (\"derecho al olvido\").",
        "Limitación (Art. 18): obtener la limitación del tratamiento.",
        "Portabilidad (Art. 20): recibir sus datos en un formato estructurado y legible por máquina.",
        "Oposición (Art. 21): oponerse al tratamiento basado en interés legítimo.",
        "Revocación del consentimiento: revocar en cualquier momento el consentimiento otorgado para marketing o funcionalidades AI, sin que ello afecte a la licitud del tratamiento anterior."
      ]},
      { type: "p", text: "Para ejercer estos derechos, contacte: as.scirica@gmail.com." },
      { type: "p", text: "También tiene derecho a presentar una reclamación ante la autoridad de control:\nGarante per la protezione dei dati personali\nPiazza Venezia 11 — 00187 Roma, Italia\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
      { type: "h2", text: "10. Cambios en esta Política" },
      { type: "p", text: "Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos cualquier cambio significativo a través de la interfaz de la Extensión o por correo electrónico." },
    ],
  },
  fr: {
    title: "Politique de Confidentialité",
    lastUpdated: "Dernière mise à jour : 02 avril 2026",
    description: "Politique de Confidentialité pour l'extension de navigateur GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Introduction et Responsable du Traitement" },
      { type: "p", text: "La présente Politique de Confidentialité régit le traitement des données personnelles dans le cadre de l'utilisation de l'extension de navigateur GetNearMe (le \"Service\"). Cette Politique vise à respecter le Règlement (UE) 2016/679 (RGPD), le D.Lgs. 196/2003 (Code de la Protection des Données italien) tel que modifié par le D.Lgs. 101/2018, et la Directive 2002/58/CE (Directive ePrivacy) concernant l'accès et le stockage d'informations sur les équipements terminaux des utilisateurs." },
      { type: "p", text: "Responsable du Traitement : Antonio Scirica, opérant commercialement sous le nom commercial \"GetNearMe\"\nEmail : as.scirica@gmail.com" },
      { type: "h2", text: "2. Nature du Traitement des Données" },
      { type: "p", text: "Pour garantir la minimisation des données et respecter strictement les droits de propriété intellectuelle des tiers, le Service fonctionne principalement comme un utilitaire local, côté client." },
      { type: "ul", items: [
        "Traitement Local : L'analyse des biens immobiliers est effectuée dynamiquement dans le navigateur de l'Utilisateur. Le Service ne pratique pas l'indexation ou la reproduction de bases de données tierces sur ses propres serveurs pour créer un moteur de recherche concurrent.",
        "Pas de Transfert de Données pour l'Agrégation : Le contenu visible sur l'écran de l'Utilisateur est traité temporairement dans la mémoire volatile du navigateur et n'est pas transmis aux serveurs du Responsable pour un stockage permanent ou une agrégation.",
        "Les données relatives aux biens immobiliers traitées localement par le Service se rapportent principalement à des objets immobiliers et des emplacements et ne constituent généralement pas des données personnelles de personnes physiques identifiables au sens de l'Article 4 du RGPD."
      ]},
      { type: "h2", text: "3. Catégories de Données Traitées" },
      { type: "p", text: "Nous ne traitons que les données strictement nécessaires à la fourniture du Service, classées par lieu de stockage :" },
      { type: "h3", text: "3.1. Données Côté Serveur (Compte et Journaux Techniques)" },
      { type: "p", text: "Notre infrastructure backend traite des métadonnées limitées nécessaires à la gestion des comptes et à la sécurité :" },
      { type: "ul", items: [
        "Données d'Identité : Adresse e-mail et identifiant utilisateur (authentifié via Supabase) pour gérer votre compte et abonnement.",
        "Données Transactionnelles : Statut de l'abonnement, solde de crédits et identifiants de paiement traités de manière sécurisée par Stripe (nous ne stockons pas les numéros complets de cartes de crédit).",
        "Journaux Techniques du Service : Événements de validation technique confirmant l'exécution réussie d'une opération demandée (utilisés strictement pour la déduction de crédits et le débogage), sans stocker le contenu ou les attributs des annonces.",
        "Sécurité et Conservation : Les adresses IP et les journaux techniques ne sont conservés que pendant la durée strictement nécessaire à l'accomplissement de leur finalité spécifique (surveillance de la sécurité, débogage et validation du service) et sont périodiquement supprimés conformément aux politiques de conservation internes pour respecter le principe de Limitation de la Conservation (Art. 5(1)(e) RGPD)."
      ]},
      { type: "h3", text: "3.2. Données Côté Client (Appareil Local Uniquement)" },
      { type: "p", text: "Pour afficher des comparaisons et des informations contextuelles, le Service traite les données suivantes exclusivement sur votre appareil :" },
      { type: "ul", items: [
        "Données de Session Temporaires : L'Extension utilise l'API de stockage local du navigateur (chrome.storage.local) pour mettre temporairement en cache des données factuelles limitées nécessaires à l'analyse visible sur la page requise pour l'analyse demandée par l'Utilisateur. Ces données restent isolées dans votre navigateur et ne sont pas accessibles au Responsable."
      ]},
      { type: "p", text: "Ce stockage local est techniquement nécessaire au fonctionnement du Service, n'est pas utilisé à des fins de suivi ou publicitaires et reste isolé dans le navigateur de l'Utilisateur." },
      { type: "h3", text: "3.3. Données Marketing Volontaires" },
      { type: "p", text: "Uniquement si vous consentez explicitement via une case à cocher séparée, nous traitons votre adresse e-mail et vos métriques d'activité limitées (telles que les séries d'utilisation quotidienne) pour administrer le système optionnel Daily Bonus et pour envoyer la Newsletter." },
      { type: "h3", text: "3.4. Données d'Équipe et de Parrainage" },
      { type: "p", text: "Si vous utilisez les fonctionnalités Équipe ou Parrainage du Service, nous traitons également :" },
      { type: "ul", items: [
        "Données d'Équipe : Adresse e-mail des invités, rôle dans l'équipe (propriétaire/membre), ID d'équipe et statut de l'invitation. Les adresses e-mail des invitations non acceptées sont supprimées après 7 jours.",
        "Données de Parrainage : Code de parrainage, adresse e-mail de l'utilisateur parrain et du filleul, statut du parrainage et crédits bonus attribués."
      ]},
      { type: "h2", text: "4. Sous-traitants et Destinataires des Données" },
      { type: "ul", items: [
        "Infrastructure et Paiements : Nous utilisons Supabase (UE) pour l'hébergement de la base de données et les services d'authentification, et Stripe (Global) pour le traitement sécurisé des paiements conforme PCI-DSS.",
        "Emails Transactionnels : Nous utilisons Resend (USA) comme fournisseur de livraison d'e-mails pour les emails transactionnels (codes de vérification, invitations d'équipe, notifications).",
        "Email Marketing : Nous utilisons Brevo (Sendinblue, UE — France) pour la gestion des newsletters et des communications marketing, sous réserve du consentement de l'Utilisateur.",
        "Analyse AI des Descriptions : Si l'Utilisateur active la fonction d'analyse des descriptions immobilières, le texte de la description est transmis à Groq (USA) pour l'évaluation automatisée de la qualité. Aucune donnée personnelle de l'Utilisateur n'est incluse dans la requête.",
        "Génération de Vidéo : Si l'Utilisateur utilise la fonction de génération de vidéo pour les publications sociales, les données textuelles de l'annonce (prix, adresse, caractéristiques) sont transmises à Remotion/AWS Lambda (UE — eu-central-1, Francfort) pour le rendu vidéo. Aucune photo de l'annonce n'est transmise.",
        "Cartes et Itinéraires : Pour calculer les distances et les temps de trajet, le Service transmet des coordonnées de localisation approximatives à des services de routage et de cartographie.",
        "Données de Marché et Évaluations : Les données de localisation de propriétés spécifiques peuvent être croisées avec des Sources Publiques de Données de Marché pour obtenir des évaluations de marché estimées.",
        "Événements et Activités Contextuels : Pour afficher les activités à proximité, le Service interroge des Fournisseurs d'Événements et d'Activités Contextuels. Ces fournisseurs reçoivent des coordonnées de localisation générales et des dates pour renvoyer des événements pertinents ; aucune identité de l'Utilisateur ni historique de navigation personnel n'est partagé avec eux.",
        "Traitement AI d'Images : Si l'Utilisateur déclenche volontairement la fonctionnalité \"Virtual Staging\" en téléchargeant sa propre photo, l'image est transmise de manière transitoire à Replicate (USA) uniquement pour la génération du contenu demandé.",
        "Publication sur les Réseaux Sociaux (Optionnelle, utilisateurs Agency) : Si l'Utilisateur connecte son compte Instagram Business ou sa Page Facebook, nous échangeons des identifiants OAuth avec Meta Platforms, Inc. (USA) via Instagram Graph API et Facebook Graph API. Nous stockons des jetons d'accès longue durée (~60 jours), l'ID du compte Instagram Business lié, l'ID de la Page Facebook liée et les jetons d'accès de la Page — uniquement pour publier le contenu que l'Utilisateur a explicitement programmé ou demandé via le Service. Aucun contenu n'est publié sans action explicite de l'Utilisateur. Les médias téléchargés pour la publication (images/vidéos) sont stockés en privé sur Supabase Storage et automatiquement supprimés dans les minutes suivant la publication réussie."
      ]},
      { type: "h2", text: "5. Transferts Internationaux de Données" },
      { type: "p", text: "Certains de nos prestataires de services opèrent aux États-Unis (Resend, Groq, Replicate, Stripe, Meta Platforms). Ces transferts sont effectués sur la base de :" },
      { type: "ul", items: [
        "Clauses Contractuelles Types (CCT) approuvées par la Commission Européenne en vertu de l'Art. 46(2)(c) RGPD.",
        "Cadre de Protection des Données UE-USA, lorsque le fournisseur est certifié.",
        "Garanties supplémentaires techniques (chiffrement en transit et au repos) et organisationnelles mises en œuvre par les fournisseurs."
      ]},
      { type: "p", text: "Les transferts vers Remotion/AWS s'effectuent au sein de l'UE (région eu-central-1, Francfort). Brevo et Supabase opèrent au sein de l'UE." },
      { type: "h2", text: "6. Base Juridique du Traitement" },
      { type: "p", text: "En conformité avec l'Article 6 du RGPD, nous traitons les données sur les bases suivantes :" },
      { type: "ul", items: [
        "Exécution d'un Contrat (Art. 6(1)(b)) : Pour la fourniture principale du service d'analyse, les calculs d'itinéraire, les estimations d'évaluation, la gestion de compte et le traitement des paiements.",
        "Intérêt Légitime (Art. 6(1)(f)) : Pour assurer la sécurité de l'Extension, prévenir la fraude (ex. abus de crédits) et maintenir l'intégrité de la plateforme.",
        "Consentement Explicite (Art. 6(1)(a)) : Pour les fonctionnalités optionnelles telles que les communications marketing, le système Daily Bonus et le contenu généré par l'IA.",
        "Obligation Légale (Art. 6(1)(c)) : Pour la déclaration fiscale et la conformité comptable."
      ]},
      { type: "h2", text: "7. Durées de Conservation des Données" },
      { type: "p", text: "Les données personnelles ne sont conservées que pendant la durée nécessaire à l'accomplissement des finalités pour lesquelles elles ont été collectées :" },
      { type: "ul", items: [
        "Données de compte (email, ID utilisateur) : pendant la durée du compte et supprimées dans un délai de 30 jours suivant la demande de suppression.",
        "Données transactionnelles (paiements, crédits) : conservées pendant 10 ans conformément à la législation fiscale italienne (Art. 2220 C.C.).",
        "Journaux techniques et adresses IP : conservés pendant un maximum de 90 jours, puis supprimés automatiquement.",
        "Données marketing (emails bonus, newsletter) : conservées jusqu'au retrait du consentement ou à la désinscription.",
        "Données d'équipe — invitations non acceptées : supprimées automatiquement après 7 jours.",
        "Données de parrainage : conservées pendant la durée du compte de l'utilisateur parrain.",
        "Images AI (Virtual Staging) : traitées en temps réel et non conservées par le Responsable. Les fournisseurs AI (Replicate) suppriment les images dans un délai de 24 heures après le traitement.",
        "Analyse de descriptions AI : le texte est transmis à Groq uniquement pendant la durée du traitement et n'est pas conservé.",
        "Jetons d'accès aux réseaux sociaux : conservés pendant la durée de la connexion du compte, renouvelés automatiquement tous les ~50 jours et supprimés immédiatement lors de la déconnexion de l'Utilisateur ou de la suppression du compte. Les médias téléchargés pour publication programmée sont supprimés du stockage dans les minutes suivant la publication réussie, et dans les 7 jours en cas d'échec. L'Utilisateur peut révoquer l'accès à tout moment depuis les paramètres Facebook/Instagram (Paramètres → Apps et sites web) ou depuis le panneau Paramètres de GetNearMe."
      ]},
      { type: "h2", text: "8. Décisions Automatisées et Profilage" },
      { type: "p", text: "Conformément à l'Art. 22 du RGPD, nous vous informons que le Service utilise des processus de prise de décision automatisés dans les fonctionnalités suivantes :" },
      { type: "ul", items: [
        "Analyse AI de Description : L'analyse automatisée de la qualité des descriptions immobilières génère un score de 1 à 10 à l'aide de modèles d'intelligence artificielle (Groq/LLaMA). Ce score est purement informatif et ne produit pas d'effets juridiques ni n'affecte de manière similaire significativement l'Utilisateur.",
        "Virtual Staging AI : La génération d'images d'ameublement virtuel par IA (Replicate) s'effectue exclusivement à la demande volontaire de l'Utilisateur et n'implique pas de décisions automatisées ayant des effets significatifs."
      ]},
      { type: "p", text: "Aucune de ces fonctionnalités ne produit de décisions fondées uniquement sur un traitement automatisé qui produisent des effets juridiques ou qui affectent de manière similaire significativement la personne concernée. L'Utilisateur peut en tout cas demander une intervention humaine en contactant as.scirica@gmail.com." },
      { type: "h2", text: "9. Droits de l'Utilisateur" },
      { type: "p", text: "En vertu des Articles 15-22 du RGPD, vous avez le droit de :" },
      { type: "ul", items: [
        "Accès (Art. 15) : obtenir la confirmation que vos données personnelles font ou non l'objet d'un traitement.",
        "Rectification (Art. 16) : obtenir la rectification de données personnelles inexactes.",
        "Effacement (Art. 17) : obtenir l'effacement de vos données (\"droit à l'oubli\").",
        "Limitation (Art. 18) : obtenir la limitation du traitement.",
        "Portabilité (Art. 20) : recevoir vos données dans un format structuré et lisible par machine.",
        "Opposition (Art. 21) : vous opposer au traitement fondé sur l'intérêt légitime.",
        "Retrait du consentement : retirer à tout moment le consentement donné pour le marketing ou les fonctionnalités AI, sans affecter la licéité du traitement antérieur."
      ]},
      { type: "p", text: "Pour exercer ces droits, contactez : as.scirica@gmail.com." },
      { type: "p", text: "Vous avez également le droit de déposer une réclamation auprès de l'autorité de contrôle :\nGarante per la protezione dei dati personali\nPiazza Venezia 11 — 00187 Rome, Italie\nwww.garanteprivacy.it\nEmail : protocollo@gpdp.it" },
      { type: "h2", text: "10. Modifications de cette Politique" },
      { type: "p", text: "Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Nous vous informerons de tout changement significatif via l'interface de l'Extension ou par e-mail." },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    lastUpdated: "Последнее обновление: 02 апреля 2026",
    description: "Политика конфиденциальности расширения браузера GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Введение и Контролёр данных" },
      { type: "p", text: "Настоящая Политика конфиденциальности регулирует обработку персональных данных в связи с использованием расширения браузера GetNearMe (\"Сервис\"). Настоящая Политика направлена на соблюдение Регламента (ЕС) 2016/679 (GDPR), D.Lgs. 196/2003 (Итальянский Кодекс конфиденциальности) с изменениями D.Lgs. 101/2018 и Директивы 2002/58/EC (Директива ePrivacy) в отношении доступа к информации и её хранения на терминальном оборудовании пользователей." },
      { type: "p", text: "Контролёр данных: Антонио Шрика, действующий коммерчески под торговым наименованием \"GetNearMe\"\nEmail: as.scirica@gmail.com" },
      { type: "h2", text: "2. Характер обработки данных" },
      { type: "p", text: "Для обеспечения минимизации данных и строгого соблюдения прав интеллектуальной собственности третьих лиц Сервис функционирует преимущественно как локальная, клиентская утилита." },
      { type: "ul", items: [
        "Локальная обработка: Анализ объектов недвижимости выполняется динамически в браузере Пользователя. Сервис не осуществляет индексацию или воспроизведение баз данных третьих лиц на своих серверах для создания конкурирующей поисковой системы.",
        "Отсутствие передачи данных для агрегации: Контент, видимый на экране Пользователя, обрабатывается временно в оперативной памяти браузера и не передаётся на серверы Контролёра для постоянного хранения или агрегации.",
        "Данные, связанные с недвижимостью, обрабатываемые локально Сервисом, относятся преимущественно к объектам недвижимости и местоположениям и, как правило, не являются персональными данными идентифицируемых физических лиц по смыслу Статьи 4 GDPR."
      ]},
      { type: "h2", text: "3. Категории обрабатываемых данных" },
      { type: "p", text: "Мы обрабатываем только данные, строго необходимые для предоставления Сервиса, классифицированные по месту хранения:" },
      { type: "h3", text: "3.1. Серверные данные (Аккаунт и технические журналы)" },
      { type: "p", text: "Наша серверная инфраструктура обрабатывает ограниченные метаданные, необходимые для управления аккаунтом и обеспечения безопасности:" },
      { type: "ul", items: [
        "Идентификационные данные: Адрес электронной почты и ID пользователя (аутентификация через Supabase) для управления аккаунтом и подпиской.",
        "Транзакционные данные: Статус подписки, баланс кредитов и идентификаторы платежей, безопасно обрабатываемые Stripe (мы не храним полные номера кредитных карт).",
        "Технические журналы сервиса: События технической валидации, подтверждающие успешное выполнение запрошенной операции (используются исключительно для списания кредитов и отладки), без хранения содержания или атрибутов объявлений.",
        "Безопасность и хранение: IP-адреса и технические журналы хранятся только в течение периода, строго необходимого для выполнения их конкретной цели (мониторинг безопасности, отладка и валидация сервиса) и периодически удаляются в соответствии с внутренними политиками хранения для соблюдения принципа ограничения хранения (Ст. 5(1)(e) GDPR)."
      ]},
      { type: "h3", text: "3.2. Клиентские данные (только локальное устройство)" },
      { type: "p", text: "Для отображения сравнений и контекстной информации Сервис обрабатывает следующие данные исключительно на вашем устройстве:" },
      { type: "ul", items: [
        "Временные данные сессии: Расширение использует API локального хранилища браузера (chrome.storage.local) для временного кэширования ограниченных фактических данных, необходимых для анализа, видимого на странице для запрошенного Пользователем анализа. Эти данные остаются изолированными в вашем браузере и недоступны Контролёру."
      ]},
      { type: "p", text: "Данное локальное хранилище является технически необходимым для функционирования Сервиса, не используется в целях отслеживания или рекламы и остаётся изолированным в браузере Пользователя." },
      { type: "h3", text: "3.3. Добровольные маркетинговые данные" },
      { type: "p", text: "Только при вашем явном согласии через отдельный флажок мы обрабатываем ваш адрес электронной почты и ограниченные метрики активности (такие как ежедневные серии использования) для администрирования опциональной системы Daily Bonus и для отправки Рассылки." },
      { type: "h3", text: "3.4. Данные команды и реферальной программы" },
      { type: "p", text: "Если вы используете функции Команды или Реферальной программы Сервиса, мы дополнительно обрабатываем:" },
      { type: "ul", items: [
        "Данные команды: Адрес электронной почты приглашённых, роль в команде (владелец/участник), ID команды и статус приглашения. Адреса электронной почты непринятых приглашений удаляются через 7 дней.",
        "Реферальные данные: Реферальный код, адрес электронной почты приглашающего и приглашённого пользователя, статус реферала и начисленные бонусные кредиты."
      ]},
      { type: "h2", text: "4. Обработчики данных и получатели" },
      { type: "ul", items: [
        "Инфраструктура и платежи: Мы используем Supabase (ЕС) для хостинга баз данных и услуг аутентификации, а также Stripe (Глобально) для безопасной обработки платежей, соответствующей PCI-DSS.",
        "Транзакционные письма: Мы используем Resend (США) для отправки транзакционных писем (коды верификации, приглашения в команду, уведомления).",
        "Email-маркетинг: Мы используем Brevo (Sendinblue, ЕС — Франция) для управления рассылками и маркетинговыми коммуникациями при наличии согласия Пользователя.",
        "AI-анализ описаний: Если Пользователь активирует функцию анализа описания объекта недвижимости, текст описания передаётся в Groq (США) для автоматической оценки качества. Персональные данные Пользователя в запрос не включаются.",
        "Генерация видео: Если Пользователь использует функцию генерации видео для социальных публикаций, текстовые данные объявления (цена, адрес, характеристики) передаются в Remotion/AWS Lambda (ЕС — eu-central-1, Франкфурт) для рендеринга видео. Фотографии объявления не передаются.",
        "Карты и маршруты: Для расчёта расстояний и времени в пути Сервис передаёт приблизительные координаты местоположения сервисам маршрутизации и картографии.",
        "Рыночные данные и оценки: Конкретные данные о местоположении недвижимости могут быть сопоставлены с Публичными источниками рыночных данных для получения ориентировочных рыночных оценок.",
        "Контекстные события и мероприятия: Для отображения ближайших мероприятий Сервис обращается к Провайдерам контекстных событий и мероприятий. Эти провайдеры получают общие координаты местоположения и даты для возврата релевантных событий; личность Пользователя или история просмотров не передаются им.",
        "AI-обработка изображений: Если Пользователь добровольно активирует функцию \"Virtual Staging\", загружая собственное фото, изображение временно передаётся в Replicate (США) исключительно для генерации запрошенного контента.",
        "Публикация в социальных сетях (Опционально, пользователи Agency): Если Пользователь подключает свой аккаунт Instagram Business или Страницу Facebook, мы обмениваемся OAuth-учётными данными с Meta Platforms, Inc. (США) через Instagram Graph API и Facebook Graph API. Мы храним долгосрочные токены доступа (~60 дней), ID связанного аккаунта Instagram Business, ID связанной Страницы Facebook и токены доступа к Странице — исключительно для публикации контента, который Пользователь явно запланировал или запросил через Сервис. Ни один контент не публикуется без явного действия Пользователя. Медиафайлы, загруженные для публикации (изображения/видео), хранятся приватно в Supabase Storage и автоматически удаляются в течение нескольких минут после успешной публикации."
      ]},
      { type: "h2", text: "5. Международные передачи данных" },
      { type: "p", text: "Некоторые наши поставщики услуг работают в США (Resend, Groq, Replicate, Stripe, Meta Platforms). Такие передачи осуществляются на основании:" },
      { type: "ul", items: [
        "Стандартных контрактных положений (SCC), утверждённых Европейской Комиссией в соответствии со Ст. 46(2)(c) GDPR.",
        "Рамочного соглашения о защите данных ЕС-США, если поставщик сертифицирован.",
        "Дополнительных технических (шифрование при передаче и хранении) и организационных гарантий, реализованных поставщиками."
      ]},
      { type: "p", text: "Передачи в Remotion/AWS осуществляются в пределах ЕС (регион eu-central-1, Франкфурт). Brevo и Supabase работают в пределах ЕС." },
      { type: "h2", text: "6. Правовая основа обработки" },
      { type: "p", text: "В соответствии со Статьёй 6 GDPR мы обрабатываем данные на следующих основаниях:" },
      { type: "ul", items: [
        "Исполнение договора (Ст. 6(1)(b)): Для основного предоставления аналитического сервиса, расчётов маршрутов, оценочных расчётов, управления аккаунтом и обработки платежей.",
        "Законный интерес (Ст. 6(1)(f)): Для обеспечения безопасности Расширения, предотвращения мошенничества (напр., злоупотребление кредитами) и поддержания целостности платформы.",
        "Явное согласие (Ст. 6(1)(a)): Для опциональных функций, таких как маркетинговые коммуникации, система Daily Bonus и контент, сгенерированный ИИ.",
        "Юридическая обязанность (Ст. 6(1)(c)): Для налоговой отчётности и бухгалтерского соответствия."
      ]},
      { type: "h2", text: "7. Сроки хранения данных" },
      { type: "p", text: "Персональные данные хранятся только в течение времени, необходимого для достижения целей, для которых они были собраны:" },
      { type: "ul", items: [
        "Данные аккаунта (email, ID пользователя): в течение срока действия аккаунта и удаляются в течение 30 дней после запроса на удаление.",
        "Транзакционные данные (платежи, кредиты): хранятся 10 лет в соответствии с итальянским налоговым законодательством (Ст. 2220 ГК).",
        "Технические журналы и IP-адреса: хранятся не более 90 дней, затем автоматически удаляются.",
        "Маркетинговые данные (бонусные письма, рассылка): хранятся до отзыва согласия или отписки.",
        "Данные команды — непринятые приглашения: автоматически удаляются через 7 дней.",
        "Реферальные данные: хранятся в течение срока действия аккаунта приглашающего пользователя.",
        "AI-изображения (Virtual Staging): обрабатываются в реальном времени и не хранятся Контролёром. Провайдеры ИИ (Replicate) удаляют изображения в течение 24 часов после обработки.",
        "AI-анализ описаний: текст передаётся в Groq только на время обработки и не сохраняется.",
        "Токены доступа к соцсетям: хранятся в течение подключения аккаунта, автоматически обновляются каждые ~50 дней и удаляются немедленно при отключении Пользователя или удалении аккаунта. Медиафайлы, загруженные для запланированной публикации, удаляются из хранилища в течение нескольких минут после успешной публикации и в течение 7 дней в случае сбоя. Пользователь может отозвать доступ в любое время через настройки Facebook/Instagram (Настройки → Приложения и сайты) или через панель Настройки GetNearMe."
      ]},
      { type: "h2", text: "8. Автоматизированное принятие решений и профилирование" },
      { type: "p", text: "В соответствии со Ст. 22 GDPR сообщаем, что Сервис использует автоматизированные процессы принятия решений в следующих функциях:" },
      { type: "ul", items: [
        "AI-анализ описания: Автоматический анализ качества описаний недвижимости генерирует оценку от 1 до 10 с помощью моделей искусственного интеллекта (Groq/LLaMA). Эта оценка носит исключительно информационный характер и не производит правовых последствий и не оказывает аналогичного существенного влияния на Пользователя.",
        "AI Virtual Staging: Генерация изображений виртуальной меблировки с помощью ИИ (Replicate) осуществляется исключительно по добровольному запросу Пользователя и не предполагает автоматизированных решений с существенными последствиями."
      ]},
      { type: "p", text: "Ни одна из этих функций не производит решений, основанных исключительно на автоматизированной обработке, которые производят правовые последствия или аналогичным образом существенно влияют на субъекта данных. Пользователь может в любом случае запросить вмешательство человека, обратившись по адресу as.scirica@gmail.com." },
      { type: "h2", text: "9. Права пользователя" },
      { type: "p", text: "Согласно Статьям 15-22 GDPR, вы имеете право на:" },
      { type: "ul", items: [
        "Доступ (Ст. 15): получить подтверждение того, обрабатываются ли ваши персональные данные.",
        "Исправление (Ст. 16): получить исправление неточных персональных данных.",
        "Удаление (Ст. 17): получить удаление данных (\"право на забвение\").",
        "Ограничение (Ст. 18): получить ограничение обработки.",
        "Переносимость (Ст. 20): получить данные в структурированном, машиночитаемом формате.",
        "Возражение (Ст. 21): возразить против обработки на основании законного интереса.",
        "Отзыв согласия: отозвать в любое время согласие на маркетинг или функции ИИ без ущерба для законности предшествующей обработки."
      ]},
      { type: "p", text: "Для осуществления этих прав обращайтесь: as.scirica@gmail.com." },
      { type: "p", text: "Вы также имеете право подать жалобу в надзорный орган:\nGarante per la protezione dei dati personali\nPiazza Venezia 11 — 00187 Рим, Италия\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
      { type: "h2", text: "10. Изменения настоящей Политики" },
      { type: "p", text: "Мы можем периодически обновлять настоящую Политику конфиденциальности. Мы уведомим вас о любых существенных изменениях через интерфейс Расширения или по электронной почте." },
    ],
  },
  uk: {
    title: "Політика конфіденційності",
    lastUpdated: "Останнє оновлення: 02 квітня 2026",
    description: "Політика конфіденційності розширення браузера GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Вступ та Контролер даних" },
      { type: "p", text: "Ця Політика конфіденційності регулює обробку персональних даних у зв'язку з використанням розширення браузера GetNearMe (\"Сервіс\"). Ця Політика спрямована на дотримання Регламенту (ЄС) 2016/679 (GDPR), D.Lgs. 196/2003 (Італійський Кодекс конфіденційності) зі змінами D.Lgs. 101/2018 та Директиви 2002/58/EC (Директива ePrivacy) щодо доступу до інформації та її зберігання на термінальному обладнанні користувачів." },
      { type: "p", text: "Контролер даних: Антоніо Шріка, що діє комерційно під торговою назвою \"GetNearMe\"\nEmail: as.scirica@gmail.com" },
      { type: "h2", text: "2. Характер обробки даних" },
      { type: "p", text: "Для забезпечення мінімізації даних та суворого дотримання прав інтелектуальної власності третіх осіб Сервіс функціонує переважно як локальна, клієнтська утиліта." },
      { type: "ul", items: [
        "Локальна обробка: Аналіз об'єктів нерухомості виконується динамічно у браузері Користувача. Сервіс не здійснює індексацію або відтворення баз даних третіх осіб на своїх серверах для створення конкуруючої пошукової системи.",
        "Відсутність передачі даних для агрегації: Контент, видимий на екрані Користувача, обробляється тимчасово в оперативній пам'яті браузера і не передається на сервери Контролера для постійного зберігання або агрегації.",
        "Дані, пов'язані з нерухомістю, що обробляються локально Сервісом, переважно стосуються об'єктів нерухомості та місцеположень і, як правило, не є персональними даними ідентифікованих фізичних осіб у розумінні Статті 4 GDPR."
      ]},
      { type: "h2", text: "3. Категорії оброблюваних даних" },
      { type: "p", text: "Ми обробляємо лише дані, суворо необхідні для надання Сервісу, класифіковані за місцем зберігання:" },
      { type: "h3", text: "3.1. Серверні дані (Акаунт та технічні журнали)" },
      { type: "p", text: "Наша серверна інфраструктура обробляє обмежені метадані, необхідні для управління акаунтом та забезпечення безпеки:" },
      { type: "ul", items: [
        "Ідентифікаційні дані: Адреса електронної пошти та ID користувача (автентифікація через Supabase) для управління акаунтом та підпискою.",
        "Транзакційні дані: Статус підписки, баланс кредитів та ідентифікатори платежів, безпечно оброблювані Stripe (ми не зберігаємо повні номери кредитних карток).",
        "Технічні журнали сервісу: Події технічної валідації, що підтверджують успішне виконання запитаної операції (використовуються виключно для списання кредитів та налагодження), без зберігання вмісту або атрибутів оголошень.",
        "Безпека та зберігання: IP-адреси та технічні журнали зберігаються лише протягом періоду, суворо необхідного для виконання їх конкретної мети (моніторинг безпеки, налагодження та валідація сервісу) та періодично видаляються відповідно до внутрішніх політик зберігання для дотримання принципу обмеження зберігання (Ст. 5(1)(e) GDPR)."
      ]},
      { type: "h3", text: "3.2. Клієнтські дані (лише локальний пристрій)" },
      { type: "p", text: "Для відображення порівнянь та контекстної інформації Сервіс обробляє наступні дані виключно на вашому пристрої:" },
      { type: "ul", items: [
        "Тимчасові дані сесії: Розширення використовує API локального сховища браузера (chrome.storage.local) для тимчасового кешування обмежених фактичних даних, необхідних для аналізу, видимого на сторінці для запитаного Користувачем аналізу. Ці дані залишаються ізольованими у вашому браузері та недоступні Контролеру."
      ]},
      { type: "p", text: "Це локальне сховище є технічно необхідним для функціонування Сервісу, не використовується з метою відстеження або реклами та залишається ізольованим у браузері Користувача." },
      { type: "h3", text: "3.3. Добровільні маркетингові дані" },
      { type: "p", text: "Лише за вашої явної згоди через окремий прапорець ми обробляємо вашу адресу електронної пошти та обмежені метрики активності (такі як щоденні серії використання) для адміністрування опціональної системи Daily Bonus та для відправки Розсилки." },
      { type: "h3", text: "3.4. Дані команди та реферальної програми" },
      { type: "p", text: "Якщо ви використовуєте функції Команди або Реферальної програми Сервісу, ми додатково обробляємо:" },
      { type: "ul", items: [
        "Дані команди: Адреса електронної пошти запрошених, роль у команді (власник/учасник), ID команди та статус запрошення. Адреси електронної пошти неприйнятих запрошень видаляються через 7 днів.",
        "Реферальні дані: Реферальний код, адреса електронної пошти запрошуючого та запрошеного користувача, статус реферала та нараховані бонусні кредити."
      ]},
      { type: "h2", text: "4. Обробники даних та отримувачі" },
      { type: "ul", items: [
        "Інфраструктура та платежі: Ми використовуємо Supabase (ЄС) для хостингу баз даних та послуг автентифікації, а також Stripe (Глобально) для безпечної обробки платежів, відповідної PCI-DSS.",
        "Транзакційні листи: Ми використовуємо Resend (США) для відправки транзакційних листів (коди верифікації, запрошення до команди, сповіщення).",
        "Email-маркетинг: Ми використовуємо Brevo (Sendinblue, ЄС — Франція) для управління розсилками та маркетинговими комунікаціями за наявності згоди Користувача.",
        "ШІ-аналіз описів: Якщо Користувач активує функцію аналізу опису об'єкта нерухомості, текст опису передається до Groq (США) для автоматичної оцінки якості. Персональні дані Користувача до запиту не включаються.",
        "Генерація відео: Якщо Користувач використовує функцію генерації відео для соціальних публікацій, текстові дані оголошення (ціна, адреса, характеристики) передаються до Remotion/AWS Lambda (ЄС — eu-central-1, Франкфурт) для рендерингу відео. Фотографії оголошення не передаються.",
        "Карти та маршрути: Для розрахунку відстаней та часу подорожі Сервіс передає приблизні координати місцеположення сервісам маршрутизації та картографії.",
        "Ринкові дані та оцінки: Конкретні дані про місцеположення нерухомості можуть бути зіставлені з Публічними джерелами ринкових даних для отримання орієнтовних ринкових оцінок.",
        "Контекстні події та заходи: Для відображення найближчих заходів Сервіс звертається до Провайдерів контекстних подій та заходів. Ці провайдери отримують загальні координати місцеположення та дати для повернення релевантних подій; особистість Користувача або історія перегляду не передаються їм.",
        "ШІ-обробка зображень: Якщо Користувач добровільно активує функцію \"Virtual Staging\", завантажуючи власне фото, зображення тимчасово передається до Replicate (США) виключно для генерації запитаного контенту.",
        "Публікація у соцмережах (Опціонально, користувачі Agency): Якщо Користувач підключає свій акаунт Instagram Business або Сторінку Facebook, ми обмінюємося OAuth-обліковими даними з Meta Platforms, Inc. (США) через Instagram Graph API та Facebook Graph API. Ми зберігаємо довгострокові токени доступу (~60 днів), ID пов'язаного акаунта Instagram Business, ID пов'язаної Сторінки Facebook та токени доступу до Сторінки — виключно для публікації контенту, який Користувач явно запланував або запросив через Сервіс. Жоден контент не публікується без явної дії Користувача. Медіафайли, завантажені для публікації (зображення/відео), зберігаються приватно у Supabase Storage та автоматично видаляються протягом кількох хвилин після успішної публікації."
      ]},
      { type: "h2", text: "5. Міжнародні передачі даних" },
      { type: "p", text: "Деякі наші постачальники послуг працюють у США (Resend, Groq, Replicate, Stripe, Meta Platforms). Такі передачі здійснюються на підставі:" },
      { type: "ul", items: [
        "Стандартних контрактних положень (SCC), затверджених Європейською Комісією відповідно до Ст. 46(2)(c) GDPR.",
        "Рамкової угоди про захист даних ЄС-США, якщо постачальник сертифікований.",
        "Додаткових технічних (шифрування при передачі та зберіганні) та організаційних гарантій, реалізованих постачальниками."
      ]},
      { type: "p", text: "Передачі до Remotion/AWS здійснюються в межах ЄС (регіон eu-central-1, Франкфурт). Brevo та Supabase працюють у межах ЄС." },
      { type: "h2", text: "6. Правова основа обробки" },
      { type: "p", text: "Відповідно до Статті 6 GDPR ми обробляємо дані на таких підставах:" },
      { type: "ul", items: [
        "Виконання договору (Ст. 6(1)(b)): Для основного надання аналітичного сервісу, розрахунків маршрутів, оціночних розрахунків, управління акаунтом та обробки платежів.",
        "Законний інтерес (Ст. 6(1)(f)): Для забезпечення безпеки Розширення, запобігання шахрайству (напр., зловживання кредитами) та підтримання цілісності платформи.",
        "Явна згода (Ст. 6(1)(a)): Для опціональних функцій, таких як маркетингові комунікації, система Daily Bonus та контент, згенерований ШІ.",
        "Юридичний обов'язок (Ст. 6(1)(c)): Для податкової звітності та бухгалтерської відповідності."
      ]},
      { type: "h2", text: "7. Строки зберігання даних" },
      { type: "p", text: "Персональні дані зберігаються лише протягом часу, необхідного для досягнення цілей, для яких вони були зібрані:" },
      { type: "ul", items: [
        "Дані акаунту (email, ID користувача): протягом терміну дії акаунту та видаляються протягом 30 днів після запиту на видалення.",
        "Транзакційні дані (платежі, кредити): зберігаються 10 років відповідно до італійського податкового законодавства (Ст. 2220 ЦК).",
        "Технічні журнали та IP-адреси: зберігаються не більше 90 днів, потім автоматично видаляються.",
        "Маркетингові дані (бонусні листи, розсилка): зберігаються до відкликання згоди або відписки.",
        "Дані команди — неприйняті запрошення: автоматично видаляються через 7 днів.",
        "Реферальні дані: зберігаються протягом терміну дії акаунту запрошуючого користувача.",
        "ШІ-зображення (Virtual Staging): обробляються в реальному часі та не зберігаються Контролером. Провайдери ШІ (Replicate) видаляють зображення протягом 24 годин після обробки.",
        "ШІ-аналіз описів: текст передається до Groq лише на час обробки та не зберігається.",
        "Токени доступу до соцмереж: зберігаються протягом підключення акаунту, автоматично оновлюються кожні ~50 днів та видаляються негайно при відключенні Користувача або видаленні акаунту. Медіафайли, завантажені для запланованої публікації, видаляються зі сховища протягом кількох хвилин після успішної публікації та протягом 7 днів у разі помилки. Користувач може відкликати доступ у будь-який момент через налаштування Facebook/Instagram (Налаштування → Додатки та сайти) або через панель Налаштування GetNearMe."
      ]},
      { type: "h2", text: "8. Автоматизоване прийняття рішень та профілювання" },
      { type: "p", text: "Відповідно до Ст. 22 GDPR повідомляємо, що Сервіс використовує автоматизовані процеси прийняття рішень у таких функціях:" },
      { type: "ul", items: [
        "ШІ-аналіз опису: Автоматичний аналіз якості описів нерухомості генерує оцінку від 1 до 10 за допомогою моделей штучного інтелекту (Groq/LLaMA). Ця оцінка є виключно інформаційною та не створює правових наслідків і не впливає аналогічним чином суттєво на Користувача.",
        "ШІ Virtual Staging: Генерація зображень віртуального меблювання за допомогою ШІ (Replicate) здійснюється виключно за добровільним запитом Користувача та не передбачає автоматизованих рішень із суттєвими наслідками."
      ]},
      { type: "p", text: "Жодна з цих функцій не створює рішень, заснованих виключно на автоматизованій обробці, які створюють правові наслідки або аналогічним чином суттєво впливають на суб'єкта даних. Користувач може в будь-якому випадку вимагати втручання людини, звернувшись за адресою as.scirica@gmail.com." },
      { type: "h2", text: "9. Права користувача" },
      { type: "p", text: "Згідно зі Статтями 15-22 GDPR, ви маєте право на:" },
      { type: "ul", items: [
        "Доступ (Ст. 15): отримати підтвердження того, чи обробляються ваші персональні дані.",
        "Виправлення (Ст. 16): отримати виправлення неточних персональних даних.",
        "Видалення (Ст. 17): отримати видалення даних (\"право на забуття\").",
        "Обмеження (Ст. 18): отримати обмеження обробки.",
        "Переносимість (Ст. 20): отримати дані у структурованому, машинозчитуваному форматі.",
        "Заперечення (Ст. 21): заперечити проти обробки на підставі законного інтересу.",
        "Відкликання згоди: відкликати в будь-який час згоду на маркетинг або функції ШІ без шкоди для законності попередньої обробки."
      ]},
      { type: "p", text: "Для здійснення цих прав звертайтеся: as.scirica@gmail.com." },
      { type: "p", text: "Ви також маєте право подати скаргу до наглядового органу:\nGarante per la protezione dei dati personali\nPiazza Venezia 11 — 00187 Рим, Італія\nwww.garanteprivacy.it\nEmail: protocollo@gpdp.it" },
      { type: "h2", text: "10. Зміни цієї Політики" },
      { type: "p", text: "Ми можемо періодично оновлювати цю Політику конфіденційності. Ми повідомимо вас про будь-які суттєві зміни через інтерфейс Розширення або електронною поштою." },
    ],
  },
};

export const termsContent: Record<Locale, LegalPage> = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last Updated: 02 April 2026",
    description: "Terms of Service for the GetNearMe browser extension.",
    blocks: [
      { type: "h2", text: "1. Acceptance of Terms" },
      { type: "p", text: "By installing or using the GetNearMe extension (\"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). You affirm that you are at least 18 years of age and are fully able and competent to enter into this agreement. If you do not agree, you must immediately uninstall the Service." },
      { type: "h2", text: "2. License and Nature of Service" },
      { type: "p", text: "2.1. User Agent: The Service operates as a \"User Agent\" — a software tool that acts exclusively on behalf of and under the direct control of the individual User, analogous to how a web browser (itself a user agent) renders and presents web content for the User. The Extension does not act autonomously, does not independently crawl or index websites, and processes only the content already visible on the page the User is currently viewing. All analysis is initiated by the User and executed locally in the User's browser session." },
      { type: "p", text: "2.2. Limited License: We grant you a revocable, non-exclusive, non-transferable license to use the Service solely for your personal or internal business analysis of real estate market data." },
      { type: "p", text: "2.3. Data Volatility and Local Storage: The User acknowledges that GetNearMe is a client-side tool that stores detailed analysis data (e.g., prices, property characteristics) exclusively in the browser's local storage (Local Storage)." },
      { type: "ul", items: [
        "a) No Remote Backup: GetNearMe does not maintain backup copies of listing content on its own servers.",
        "b) User Responsibility: It is the User's sole responsibility to save or export generated reports (e.g., as PDF) immediately after the analysis.",
        "c) Data Loss: Uninstalling the extension, clearing the browser cache, or using system cleaning software will result in the irreversible loss of saved data and analysis history. GetNearMe shall under no circumstances be able to recover such data nor refund credits used for analyses lost due to local actions by the User."
      ]},
      { type: "p", text: "2.4. Personal Use of Reports: Analysis reports, PDF exports, social media posts, and any other output generated by the Service are intended solely for the User's personal, informational, or internal business use. The User shall not redistribute, resell, sublicense, or publicly publish such outputs for commercial purposes or in a manner that could infringe upon the intellectual property rights of third parties (including the source platforms from which data was analyzed)." },
      { type: "p", text: "2.5. Social Media Publishing (Optional, Agency users): The Service may publish content to the User's connected Instagram Business account or Facebook Page on the User's behalf, only upon the User's explicit scheduling or immediate publish request. By connecting these accounts, the User authorizes GetNearMe to act on their behalf strictly within the scope of these Terms and grants GetNearMe permission to call the Instagram Graph API and Facebook Graph API solely for the purpose of publishing content the User has prepared. The User is solely responsible for the published content, including compliance with the Instagram Community Guidelines, Facebook Community Standards, applicable copyright law, and the Terms of Service of Meta Platforms, Inc. GetNearMe does not own, modify, or claim rights over the User's published content. The User may revoke this authorization at any time from the GetNearMe Settings panel or from Facebook/Instagram settings (see Data Deletion Instructions)." },
      { type: "h2", text: "3. Restrictions and Intellectual Property" },
      { type: "p", text: "3.1. Independence: GetNearMe is an independent software tool. We are not affiliated with, endorsed by, sponsored by, or officially connected to any real estate platform (such as Immobiliare.it, Idealista, or others). All third-party trademarks are the property of their respective owners and are used solely for descriptive compatibility purposes (Nominative Fair Use)." },
      { type: "p", text: "3.2. Prohibited Conduct: You explicitly agree NOT to use the Service to:" },
      { type: "ul", items: [
        "Perform mass extraction of data for the purpose of creating a competing database, search engine, or commercial service.",
        "Bypass any security measures, CAPTCHAs, or authentication barriers of third-party platforms.",
        "Violate the Terms of Service of any third-party real estate portal visited while using the Extension.",
        "Attempt to bypass, disable, or defeat any technical restrictions or content protection measures implemented within the Service (including restrictions on printing, copying, or exporting data)."
      ]},
      { type: "h2", text: "4. Disclaimers and Limitations of Liability" },
      { type: "p", text: "4.1. Estimated Values: Any \"Estimated Total\" or financial calculation provided by the Service represents an indicative estimate of costs associated with a property purchase (e.g., agency fees, notary costs, taxes). These estimates are for informational purposes only and do not constitute a binding offer or professional financial quote." },
      { type: "p", text: "4.2. Data Reliability: The information visualized by the Service is derived from publicly available data, information present in the analyzed listings, and automatic processing. We do not verify energy classes via official certificates (APE) nor guarantee the accuracy of data in the source listings. Inaccuracies or omissions in the original third-party listing may be reflected in the Service's report." },
      { type: "p", text: "4.3. No Professional Advice: The Service does not substitute technical, legal, fiscal, or real estate verification performed by qualified professionals. To the extent permitted by applicable law, GetNearMe assumes no responsibility for decisions made based on the information provided." },
      { type: "h2", text: "5. Credits, Payments, and Refunds" },
      { type: "p", text: "5.1. Purchase of Credits: The Service operates on a credit-based system. Credits are virtual units used solely to unlock specific features or analyses within the Extension. Credits do not represent prepaid funds, electronic money, or stored value, have no monetary value outside the Service, and cannot be exchanged for cash, refunded, or transferred to other accounts." },
      { type: "p", text: "5.2. Payment Processing: All payments are processed securely and exclusively by Stripe in accordance with its own terms and privacy policies. GetNearMe does not store or have access to users' full payment card details. By purchasing credits, you authorize Stripe to charge your selected payment method for the applicable amount." },
      { type: "p", text: "5.3. Waiver of Right of Withdrawal: By purchasing digital credits, you expressly consent to the immediate performance of the contract and expressly acknowledge that, once the credits are credited to your account, you lose your right of withdrawal (cooling-off period) in accordance with Article 16(m) of Directive 2011/83/EU on Consumer Rights." },
      { type: "p", text: "5.4. Refund Policy: All purchases of credits are final and non-refundable, except where mandatory consumer protection laws provide otherwise. No refunds will be issued for unused credits or if you choose to stop using the Service." },
      { type: "p", text: "In the event of a proven technical error attributable solely to GetNearMe (for example, credits paid for but not credited to the user's account), the user may contact support at as.scirica@gmail.com for verification and rectification." },
      { type: "h2", text: "6. Liability" },
      { type: "p", text: "To the maximum extent permitted by applicable law, GetNearMe shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits, data, use, or goodwill, arising out of or in connection with your use of, or inability to use, the Service." },
      { type: "p", text: "The Service is provided for informational and illustrative purposes only and relies on publicly available information, third-party platforms, and automated processing. GetNearMe does not guarantee the accuracy, completeness, or availability of any information, estimates, or AI-generated outputs and is not responsible for decisions or actions taken based on the Service." },
      { type: "p", text: "These limitations apply only to the extent permitted by applicable law." },
      { type: "h2", text: "7. Termination" },
      { type: "p", text: "We reserve the right to suspend or terminate your access to the Service immediately, without prior notice, if you breach these Terms, particularly regarding the unauthorized mass extraction of data or violation of third-party rights." },
      { type: "h2", text: "8. General Provisions" },
      { type: "p", text: "8.1. Severability: If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect." },
      { type: "p", text: "8.2. Changes to Terms: We reserve the right to modify these Terms at any time at our sole discretion. Continued use of the Service following any changes constitutes your acceptance of the new Terms." },
      { type: "h2", text: "9. Governing Law and Jurisdiction" },
      { type: "p", text: "These Terms shall be governed by the laws of Italy. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts of Rome, Italy. European consumers have the right to use the Online Dispute Resolution platform." },
    ],
  },
  it: {
    title: "Termini di Servizio",
    lastUpdated: "Ultimo aggiornamento: 02 aprile 2026",
    description: "Termini di Servizio per l'estensione browser GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Accettazione dei Termini" },
      { type: "p", text: "Installando o utilizzando l'estensione GetNearMe (\"Servizio\"), l'utente accetta di essere vincolato dai presenti Termini di Servizio (\"Termini\"). L'utente dichiara di avere almeno 18 anni e di essere pienamente capace e competente per stipulare il presente accordo. In caso di disaccordo, l'utente deve immediatamente disinstallare il Servizio." },
      { type: "h2", text: "2. Licenza e Natura del Servizio" },
      { type: "p", text: "2.1. User Agent: Il Servizio opera come \"User Agent\" — uno strumento software che agisce esclusivamente per conto e sotto il diretto controllo dell'Utente individuale, analogamente a come un browser web (esso stesso un user agent) renderizza e presenta i contenuti web per l'Utente. L'Estensione non agisce in modo autonomo, non effettua crawling o indicizzazione indipendente di siti web e elabora esclusivamente il contenuto già visibile nella pagina che l'Utente sta attualmente visualizzando. Ogni analisi è avviata dall'Utente ed eseguita localmente nella sessione del browser dell'Utente." },
      { type: "p", text: "2.2. Licenza Limitata: Concediamo una licenza revocabile, non esclusiva e non trasferibile per utilizzare il Servizio esclusivamente per l'analisi personale o aziendale interna di dati del mercato immobiliare." },
      { type: "p", text: "2.3. Volatilità dei Dati e Archiviazione Locale: L'Utente riconosce che GetNearMe è uno strumento \"Client-Side\" che memorizza i dati dettagliati delle analisi (es. prezzi, caratteristiche immobili) esclusivamente nella memoria locale del browser (Local Storage)." },
      { type: "ul", items: [
        "a) Nessun Backup Remoto: GetNearMe non conserva copie di backup del contenuto degli annunci sui propri server.",
        "b) Responsabilità dell'Utente: È esclusiva responsabilità dell'Utente salvare o esportare i report generati (es. come PDF) immediatamente dopo l'analisi.",
        "c) Perdita Dati: La disinstallazione dell'estensione, la pulizia della cache del browser o l'uso di software di pulizia sistema comporteranno la perdita irreversibile dei dati salvati e dello storico analisi. GetNearMe non potrà in alcun caso recuperare tali dati né rimborsare i crediti utilizzati per analisi andate perse a causa di azioni locali dell'Utente."
      ]},
      { type: "p", text: "2.4. Uso Personale dei Report: I report di analisi, le esportazioni PDF, i post per social media e qualsiasi altro output generato dal Servizio sono destinati esclusivamente all'uso personale, informativo o aziendale interno dell'Utente. L'Utente non deve ridistribuire, rivendere, sublicenziare o pubblicare pubblicamente tali output per scopi commerciali o in modo che possa violare i diritti di proprietà intellettuale di terzi (incluse le piattaforme di origine da cui i dati sono stati analizzati)." },
      { type: "p", text: "2.5. Pubblicazione Social Media (Opzionale, utenti Agency): Il Servizio può pubblicare contenuti sull'account Instagram Business o Pagina Facebook collegati dall'Utente, esclusivamente su esplicita programmazione o richiesta di pubblicazione immediata da parte dell'Utente. Collegando tali account, l'Utente autorizza GetNearMe ad agire per suo conto nei limiti dei presenti Termini e concede a GetNearMe il permesso di chiamare le API Instagram Graph e Facebook Graph al solo scopo di pubblicare contenuti predisposti dall'Utente. L'Utente è l'unico responsabile dei contenuti pubblicati, inclusa la conformità alle Linee Guida della Community di Instagram, agli Standard della Community di Facebook, alla normativa applicabile sul diritto d'autore e ai Termini di Servizio di Meta Platforms, Inc. GetNearMe non possiede, modifica o rivendica diritti sui contenuti pubblicati dall'Utente. L'Utente può revocare questa autorizzazione in qualsiasi momento dal pannello Impostazioni di GetNearMe o dalle impostazioni Facebook/Instagram (vedi Istruzioni Cancellazione Dati)." },
      { type: "h2", text: "3. Restrizioni e Proprietà Intellettuale" },
      { type: "p", text: "3.1. Indipendenza: GetNearMe è uno strumento software indipendente. Non siamo affiliati, approvati, sponsorizzati o ufficialmente collegati ad alcuna piattaforma immobiliare (come Immobiliare.it, Idealista o altre). Tutti i marchi di terze parti sono di proprietà dei rispettivi titolari e sono utilizzati esclusivamente a fini descrittivi di compatibilità (Nominative Fair Use)." },
      { type: "p", text: "3.2. Condotta Vietata: L'utente si impegna esplicitamente a NON utilizzare il Servizio per:" },
      { type: "ul", items: [
        "Effettuare estrazione massiva di dati allo scopo di creare un database concorrente, un motore di ricerca o un servizio commerciale.",
        "Aggirare misure di sicurezza, CAPTCHA o barriere di autenticazione di piattaforme di terze parti.",
        "Violare i Termini di Servizio di qualsiasi portale immobiliare di terze parti visitato durante l'utilizzo dell'Estensione.",
        "Tentare di aggirare, disabilitare o sconfiggere qualsiasi restrizione tecnica o misura di protezione dei contenuti implementata nel Servizio (incluse le restrizioni su stampa, copia o esportazione dei dati)."
      ]},
      { type: "h2", text: "4. Esclusioni e Limitazioni di Responsabilità" },
      { type: "p", text: "4.1. Valori Stimati: Qualsiasi \"Totale Stimato\" o calcolo finanziario fornito dal Servizio rappresenta una stima indicativa dei costi associati all'acquisto di un immobile (es. commissioni di agenzia, costi notarili, imposte). Queste stime hanno scopo puramente informativo e non costituiscono un'offerta vincolante o una quotazione finanziaria professionale." },
      { type: "p", text: "4.2. Affidabilità dei Dati: Le informazioni visualizzate dal Servizio derivano da dati pubblicamente disponibili, informazioni presenti negli annunci analizzati ed elaborazione automatica. Non verifichiamo le classi energetiche tramite certificati ufficiali (APE) né garantiamo l'accuratezza dei dati negli annunci di origine. Inesattezze o omissioni nell'annuncio originale di terze parti possono riflettersi nel report del Servizio." },
      { type: "p", text: "4.3. Nessuna Consulenza Professionale: Il Servizio non sostituisce la verifica tecnica, legale, fiscale o immobiliare svolta da professionisti qualificati. Nei limiti consentiti dalla legge applicabile, GetNearMe non assume alcuna responsabilità per le decisioni prese sulla base delle informazioni fornite." },
      { type: "h2", text: "5. Crediti, Pagamenti e Rimborsi" },
      { type: "p", text: "5.1. Acquisto di Crediti: Il Servizio opera su un sistema basato su crediti. I crediti sono unità virtuali utilizzate esclusivamente per sbloccare funzionalità o analisi specifiche all'interno dell'Estensione. I crediti non rappresentano fondi prepagati, moneta elettronica o valore conservato, non hanno valore monetario al di fuori del Servizio e non possono essere scambiati in denaro, rimborsati o trasferiti ad altri account." },
      { type: "p", text: "5.2. Elaborazione dei Pagamenti: Tutti i pagamenti sono elaborati in modo sicuro ed esclusivamente da Stripe in conformità con i propri termini e politiche sulla privacy. GetNearMe non memorizza né ha accesso ai dati completi delle carte di pagamento degli utenti. Acquistando crediti, l'utente autorizza Stripe ad addebitare il metodo di pagamento selezionato per l'importo applicabile." },
      { type: "p", text: "5.3. Rinuncia al Diritto di Recesso: Acquistando crediti digitali, l'utente acconsente espressamente all'esecuzione immediata del contratto e riconosce espressamente che, una volta accreditati i crediti sul proprio account, perde il diritto di recesso (periodo di ripensamento) ai sensi dell'Articolo 16(m) della Direttiva 2011/83/UE sui Diritti dei Consumatori." },
      { type: "p", text: "5.4. Politica di Rimborso: Tutti gli acquisti di crediti sono definitivi e non rimborsabili, salvo diversa disposizione delle leggi obbligatorie a tutela dei consumatori. Non verranno emessi rimborsi per crediti non utilizzati o in caso di cessazione dell'uso del Servizio." },
      { type: "p", text: "In caso di errore tecnico comprovato attribuibile esclusivamente a GetNearMe (ad esempio, crediti pagati ma non accreditati sull'account dell'utente), l'utente può contattare il supporto all'indirizzo as.scirica@gmail.com per la verifica e la rettifica." },
      { type: "h2", text: "6. Responsabilità" },
      { type: "p", text: "Nei limiti massimi consentiti dalla legge applicabile, GetNearMe non sarà responsabile per danni indiretti, incidentali, speciali o consequenziali, inclusa la perdita di profitti, dati, utilizzo o avviamento, derivanti dall'uso o dall'impossibilità di utilizzare il Servizio." },
      { type: "p", text: "Il Servizio è fornito esclusivamente a scopo informativo e illustrativo e si basa su informazioni pubblicamente disponibili, piattaforme di terze parti ed elaborazione automatizzata. GetNearMe non garantisce l'accuratezza, la completezza o la disponibilità di qualsiasi informazione, stima o output generato dall'IA e non è responsabile per decisioni o azioni intraprese sulla base del Servizio." },
      { type: "p", text: "Queste limitazioni si applicano solo nella misura consentita dalla legge applicabile." },
      { type: "h2", text: "7. Risoluzione" },
      { type: "p", text: "Ci riserviamo il diritto di sospendere o terminare immediatamente l'accesso al Servizio, senza preavviso, in caso di violazione dei presenti Termini, in particolare per quanto riguarda l'estrazione massiva non autorizzata di dati o la violazione dei diritti di terzi." },
      { type: "h2", text: "8. Disposizioni Generali" },
      { type: "p", text: "8.1. Clausola di Salvaguardia: Se una disposizione dei presenti Termini risulta inapplicabile o non valida, tale disposizione sarà limitata o eliminata nella misura minima necessaria affinché i presenti Termini rimangano pienamente in vigore ed efficaci." },
      { type: "p", text: "8.2. Modifiche ai Termini: Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento a nostra esclusiva discrezione. L'uso continuato del Servizio successivamente a qualsiasi modifica costituisce accettazione dei nuovi Termini." },
      { type: "h2", text: "9. Legge Applicabile e Foro Competente" },
      { type: "p", text: "I presenti Termini sono regolati dalle leggi italiane. Qualsiasi controversia derivante dai presenti Termini sarà soggetta alla giurisdizione esclusiva dei tribunali competenti di Roma, Italia. I consumatori europei hanno il diritto di utilizzare la piattaforma di Risoluzione delle Controversie Online." },
    ],
  },
  es: {
    title: "Términos de Servicio",
    lastUpdated: "Última actualización: 02 de abril de 2026",
    description: "Términos de Servicio para la extensión de navegador GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Aceptación de los Términos" },
      { type: "p", text: "Al instalar o usar la extensión GetNearMe (\"Servicio\"), usted acepta quedar vinculado por estos Términos de Servicio (\"Términos\"). Usted afirma que tiene al menos 18 años de edad y que es plenamente capaz y competente para celebrar este acuerdo. Si no está de acuerdo, debe desinstalar inmediatamente el Servicio." },
      { type: "h2", text: "2. Licencia y Naturaleza del Servicio" },
      { type: "p", text: "2.1. User Agent: El Servicio opera como un \"User Agent\" — una herramienta de software que actúa exclusivamente en nombre y bajo el control directo del Usuario individual, de manera análoga a como un navegador web (que también es un user agent) renderiza y presenta el contenido web para el Usuario. La Extensión no actúa de forma autónoma, no realiza rastreo o indexación independiente de sitios web, y procesa únicamente el contenido ya visible en la página que el Usuario está visualizando actualmente. Todo análisis es iniciado por el Usuario y ejecutado localmente en la sesión del navegador del Usuario." },
      { type: "p", text: "2.2. Licencia Limitada: Le otorgamos una licencia revocable, no exclusiva e intransferible para usar el Servicio exclusivamente para su análisis personal o empresarial interno de datos del mercado inmobiliario." },
      { type: "p", text: "2.3. Volatilidad de los Datos y Almacenamiento Local: El Usuario reconoce que GetNearMe es una herramienta del lado del cliente que almacena los datos detallados de los análisis (ej. precios, características de los inmuebles) exclusivamente en el almacenamiento local del navegador (Local Storage)." },
      { type: "ul", items: [
        "a) Sin Copia de Seguridad Remota: GetNearMe no mantiene copias de seguridad del contenido de los anuncios en sus propios servidores.",
        "b) Responsabilidad del Usuario: Es responsabilidad exclusiva del Usuario guardar o exportar los informes generados (ej. como PDF) inmediatamente después del análisis.",
        "c) Pérdida de Datos: La desinstalación de la extensión, la limpieza de la caché del navegador o el uso de software de limpieza del sistema resultarán en la pérdida irreversible de los datos guardados y del historial de análisis. GetNearMe no podrá en ningún caso recuperar dichos datos ni reembolsar los créditos utilizados para análisis perdidos debido a acciones locales del Usuario."
      ]},
      { type: "p", text: "2.4. Uso Personal de los Informes: Los informes de análisis, exportaciones PDF, publicaciones para redes sociales y cualquier otro resultado generado por el Servicio están destinados exclusivamente al uso personal, informativo o empresarial interno del Usuario. El Usuario no debe redistribuir, revender, sublicenciar ni publicar públicamente dichos resultados con fines comerciales ni de manera que pueda infringir los derechos de propiedad intelectual de terceros (incluidas las plataformas de origen de las que se analizaron los datos)." },
      { type: "p", text: "2.5. Publicación en Redes Sociales (Opcional, usuarios Agency): El Servicio puede publicar contenido en la cuenta Instagram Business o Página de Facebook conectada por el Usuario, únicamente bajo programación explícita o solicitud de publicación inmediata del Usuario. Al conectar dichas cuentas, el Usuario autoriza a GetNearMe a actuar en su nombre dentro de los límites de estos Términos y concede a GetNearMe permiso para llamar a las API Instagram Graph y Facebook Graph con el único propósito de publicar contenido preparado por el Usuario. El Usuario es el único responsable del contenido publicado, incluido el cumplimiento de las Normas de la Comunidad de Instagram, las Normas Comunitarias de Facebook, la normativa de derechos de autor aplicable y los Términos de Servicio de Meta Platforms, Inc. GetNearMe no posee, modifica ni reclama derechos sobre el contenido publicado por el Usuario. El Usuario puede revocar esta autorización en cualquier momento desde el panel Configuración de GetNearMe o desde la configuración de Facebook/Instagram (ver Instrucciones de Eliminación de Datos)." },
      { type: "h2", text: "3. Restricciones y Propiedad Intelectual" },
      { type: "p", text: "3.1. Independencia: GetNearMe es una herramienta de software independiente. No estamos afiliados, respaldados, patrocinados ni oficialmente conectados con ninguna plataforma inmobiliaria (como Immobiliare.it, Idealista u otras). Todas las marcas comerciales de terceros son propiedad de sus respectivos titulares y se utilizan exclusivamente con fines descriptivos de compatibilidad (Nominative Fair Use)." },
      { type: "p", text: "3.2. Conducta Prohibida: Usted acepta explícitamente NO utilizar el Servicio para:" },
      { type: "ul", items: [
        "Realizar extracción masiva de datos con el propósito de crear una base de datos competidora, motor de búsqueda o servicio comercial.",
        "Eludir medidas de seguridad, CAPTCHAs o barreras de autenticación de plataformas de terceros.",
        "Violar los Términos de Servicio de cualquier portal inmobiliario de terceros visitado mientras se usa la Extensión.",
        "Intentar eludir, desactivar o vencer cualquier restricción técnica o medida de protección de contenido implementada en el Servicio (incluidas las restricciones de impresión, copia o exportación de datos)."
      ]},
      { type: "h2", text: "4. Exclusiones y Limitaciones de Responsabilidad" },
      { type: "p", text: "4.1. Valores Estimados: Cualquier \"Total Estimado\" o cálculo financiero proporcionado por el Servicio representa una estimación indicativa de costos asociados con la compra de una propiedad (ej. comisiones de agencia, costos notariales, impuestos). Estas estimaciones son solo para fines informativos y no constituyen una oferta vinculante o una cotización financiera profesional." },
      { type: "p", text: "4.2. Fiabilidad de los Datos: La información visualizada por el Servicio se deriva de datos públicamente disponibles, información presente en los anuncios analizados y procesamiento automático. No verificamos las clases energéticas mediante certificados oficiales (APE) ni garantizamos la exactitud de los datos en los anuncios de origen. Las inexactitudes u omisiones en el anuncio original de terceros pueden reflejarse en el informe del Servicio." },
      { type: "p", text: "4.3. Sin Asesoramiento Profesional: El Servicio no sustituye la verificación técnica, legal, fiscal o inmobiliaria realizada por profesionales cualificados. En la medida permitida por la ley aplicable, GetNearMe no asume responsabilidad por las decisiones tomadas basándose en la información proporcionada." },
      { type: "h2", text: "5. Créditos, Pagos y Reembolsos" },
      { type: "p", text: "5.1. Compra de Créditos: El Servicio opera con un sistema basado en créditos. Los créditos son unidades virtuales utilizadas exclusivamente para desbloquear funciones o análisis específicos dentro de la Extensión. Los créditos no representan fondos prepagados, dinero electrónico o valor almacenado, no tienen valor monetario fuera del Servicio y no pueden canjearse por efectivo, reembolsarse ni transferirse a otras cuentas." },
      { type: "p", text: "5.2. Procesamiento de Pagos: Todos los pagos son procesados de forma segura y exclusivamente por Stripe de acuerdo con sus propios términos y políticas de privacidad. GetNearMe no almacena ni tiene acceso a los datos completos de las tarjetas de pago de los usuarios. Al comprar créditos, usted autoriza a Stripe a cobrar su método de pago seleccionado por el monto aplicable." },
      { type: "p", text: "5.3. Renuncia al Derecho de Desistimiento: Al comprar créditos digitales, usted consiente expresamente la ejecución inmediata del contrato y reconoce expresamente que, una vez que los créditos son acreditados en su cuenta, pierde su derecho de desistimiento (período de reflexión) de acuerdo con el Artículo 16(m) de la Directiva 2011/83/UE sobre Derechos de los Consumidores." },
      { type: "p", text: "5.4. Política de Reembolso: Todas las compras de créditos son definitivas y no reembolsables, excepto cuando las leyes obligatorias de protección al consumidor dispongan lo contrario. No se emitirán reembolsos por créditos no utilizados o si decide dejar de usar el Servicio." },
      { type: "p", text: "En caso de error técnico comprobado atribuible exclusivamente a GetNearMe (por ejemplo, créditos pagados pero no acreditados en la cuenta del usuario), el usuario puede contactar con soporte en as.scirica@gmail.com para verificación y rectificación." },
      { type: "h2", text: "6. Responsabilidad" },
      { type: "p", text: "En la máxima medida permitida por la ley aplicable, GetNearMe no será responsable de daños indirectos, incidentales, especiales o consecuentes, incluida la pérdida de beneficios, datos, uso o fondo de comercio, que surjan del uso o la imposibilidad de uso del Servicio." },
      { type: "p", text: "El Servicio se proporciona únicamente con fines informativos e ilustrativos y se basa en información públicamente disponible, plataformas de terceros y procesamiento automatizado. GetNearMe no garantiza la exactitud, integridad o disponibilidad de ninguna información, estimación o resultado generado por IA y no es responsable de las decisiones o acciones tomadas basándose en el Servicio." },
      { type: "p", text: "Estas limitaciones se aplican solo en la medida permitida por la ley aplicable." },
      { type: "h2", text: "7. Terminación" },
      { type: "p", text: "Nos reservamos el derecho de suspender o terminar su acceso al Servicio inmediatamente, sin previo aviso, si incumple estos Términos, particularmente en lo que respecta a la extracción masiva no autorizada de datos o la violación de derechos de terceros." },
      { type: "h2", text: "8. Disposiciones Generales" },
      { type: "p", text: "8.1. Separabilidad: Si alguna disposición de estos Términos resulta inaplicable o inválida, dicha disposición será limitada o eliminada en la medida mínima necesaria para que estos Términos permanezcan en pleno vigor y efecto." },
      { type: "p", text: "8.2. Cambios en los Términos: Nos reservamos el derecho de modificar estos Términos en cualquier momento a nuestra entera discreción. El uso continuado del Servicio tras cualquier cambio constituye su aceptación de los nuevos Términos." },
      { type: "h2", text: "9. Ley Aplicable y Jurisdicción" },
      { type: "p", text: "Estos Términos se regirán por las leyes de Italia. Cualquier disputa que surja de estos Términos estará sujeta a la jurisdicción exclusiva de los tribunales competentes de Roma, Italia. Los consumidores europeos tienen derecho a utilizar la plataforma de Resolución de Disputas en Línea." },
    ],
  },
  fr: {
    title: "Conditions d'Utilisation",
    lastUpdated: "Dernière mise à jour : 02 avril 2026",
    description: "Conditions d'Utilisation pour l'extension de navigateur GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Acceptation des Conditions" },
      { type: "p", text: "En installant ou en utilisant l'extension GetNearMe (\"Service\"), vous acceptez d'être lié par les présentes Conditions d'Utilisation (\"Conditions\"). Vous affirmez avoir au moins 18 ans et être pleinement capable et compétent pour conclure cet accord. Si vous n'êtes pas d'accord, vous devez immédiatement désinstaller le Service." },
      { type: "h2", text: "2. Licence et Nature du Service" },
      { type: "p", text: "2.1. User Agent : Le Service fonctionne comme un \"User Agent\" — un outil logiciel qui agit exclusivement pour le compte et sous le contrôle direct de l'Utilisateur individuel, de manière analogue à la façon dont un navigateur web (lui-même un user agent) affiche et présente le contenu web pour l'Utilisateur. L'Extension n'agit pas de manière autonome, ne parcourt ni n'indexe de manière indépendante les sites web, et ne traite que le contenu déjà visible sur la page que l'Utilisateur consulte actuellement. Toute analyse est initiée par l'Utilisateur et exécutée localement dans la session du navigateur de l'Utilisateur." },
      { type: "p", text: "2.2. Licence Limitée : Nous vous accordons une licence révocable, non exclusive et non transférable pour utiliser le Service uniquement pour votre analyse personnelle ou professionnelle interne de données du marché immobilier." },
      { type: "p", text: "2.3. Volatilité des Données et Stockage Local : L'Utilisateur reconnaît que GetNearMe est un outil côté client qui stocke les données détaillées des analyses (ex. prix, caractéristiques des biens) exclusivement dans le stockage local du navigateur (Local Storage)." },
      { type: "ul", items: [
        "a) Pas de Sauvegarde Distante : GetNearMe ne conserve pas de copies de sauvegarde du contenu des annonces sur ses propres serveurs.",
        "b) Responsabilité de l'Utilisateur : Il est de la responsabilité exclusive de l'Utilisateur de sauvegarder ou d'exporter les rapports générés (ex. en PDF) immédiatement après l'analyse.",
        "c) Perte de Données : La désinstallation de l'extension, le nettoyage du cache du navigateur ou l'utilisation de logiciels de nettoyage système entraîneront la perte irréversible des données sauvegardées et de l'historique des analyses. GetNearMe ne pourra en aucun cas récupérer ces données ni rembourser les crédits utilisés pour des analyses perdues en raison d'actions locales de l'Utilisateur."
      ]},
      { type: "p", text: "2.4. Utilisation Personnelle des Rapports : Les rapports d'analyse, exports PDF, publications pour réseaux sociaux et tout autre résultat généré par le Service sont destinés exclusivement à l'usage personnel, informatif ou professionnel interne de l'Utilisateur. L'Utilisateur ne doit pas redistribuer, revendre, sous-licencier ou publier publiquement ces résultats à des fins commerciales ni d'une manière susceptible de porter atteinte aux droits de propriété intellectuelle de tiers (y compris les plateformes d'origine à partir desquelles les données ont été analysées)." },
      { type: "p", text: "2.5. Publication sur les Réseaux Sociaux (Optionnelle, utilisateurs Agency) : Le Service peut publier du contenu sur le compte Instagram Business ou la Page Facebook connectés par l'Utilisateur, uniquement sur programmation explicite ou demande de publication immédiate de l'Utilisateur. En connectant ces comptes, l'Utilisateur autorise GetNearMe à agir en son nom dans les limites des présents Conditions et accorde à GetNearMe la permission d'appeler les API Instagram Graph et Facebook Graph dans le seul but de publier le contenu préparé par l'Utilisateur. L'Utilisateur est seul responsable du contenu publié, y compris la conformité aux Règles de la Communauté Instagram, aux Standards de la Communauté Facebook, à la législation applicable sur le droit d'auteur et aux Conditions d'Utilisation de Meta Platforms, Inc. GetNearMe ne possède pas, ne modifie pas ni ne revendique de droits sur le contenu publié par l'Utilisateur. L'Utilisateur peut révoquer cette autorisation à tout moment depuis le panneau Paramètres de GetNearMe ou depuis les paramètres Facebook/Instagram (voir Instructions de Suppression des Données)." },
      { type: "h2", text: "3. Restrictions et Propriété Intellectuelle" },
      { type: "p", text: "3.1. Indépendance : GetNearMe est un outil logiciel indépendant. Nous ne sommes affiliés, approuvés, sponsorisés ni officiellement liés à aucune plateforme immobilière (telle qu'Immobiliare.it, Idealista ou d'autres). Toutes les marques de tiers sont la propriété de leurs détenteurs respectifs et sont utilisées uniquement à des fins descriptives de compatibilité (Nominative Fair Use)." },
      { type: "p", text: "3.2. Conduite Interdite : Vous acceptez explicitement de NE PAS utiliser le Service pour :" },
      { type: "ul", items: [
        "Effectuer une extraction massive de données dans le but de créer une base de données concurrente, un moteur de recherche ou un service commercial.",
        "Contourner les mesures de sécurité, CAPTCHAs ou barrières d'authentification de plateformes tierces.",
        "Violer les Conditions d'Utilisation de tout portail immobilier tiers visité lors de l'utilisation de l'Extension.",
        "Tenter de contourner, désactiver ou vaincre toute restriction technique ou mesure de protection du contenu mise en œuvre dans le Service (y compris les restrictions d'impression, de copie ou d'exportation de données)."
      ]},
      { type: "h2", text: "4. Exclusions et Limitations de Responsabilité" },
      { type: "p", text: "4.1. Valeurs Estimées : Tout \"Total Estimé\" ou calcul financier fourni par le Service représente une estimation indicative des coûts associés à l'achat d'un bien immobilier (ex. frais d'agence, frais de notaire, taxes). Ces estimations sont fournies à titre informatif uniquement et ne constituent pas une offre contraignante ou un devis financier professionnel." },
      { type: "p", text: "4.2. Fiabilité des Données : Les informations visualisées par le Service proviennent de données publiquement disponibles, d'informations présentes dans les annonces analysées et d'un traitement automatique. Nous ne vérifions pas les classes énergétiques via des certificats officiels (APE) et ne garantissons pas l'exactitude des données dans les annonces sources. Les inexactitudes ou omissions dans l'annonce originale du tiers peuvent se refléter dans le rapport du Service." },
      { type: "p", text: "4.3. Pas de Conseil Professionnel : Le Service ne remplace pas la vérification technique, juridique, fiscale ou immobilière effectuée par des professionnels qualifiés. Dans la mesure permise par la loi applicable, GetNearMe n'assume aucune responsabilité pour les décisions prises sur la base des informations fournies." },
      { type: "h2", text: "5. Crédits, Paiements et Remboursements" },
      { type: "p", text: "5.1. Achat de Crédits : Le Service fonctionne sur un système de crédits. Les crédits sont des unités virtuelles utilisées uniquement pour débloquer des fonctionnalités ou analyses spécifiques au sein de l'Extension. Les crédits ne représentent pas des fonds prépayés, de la monnaie électronique ou de la valeur stockée, n'ont aucune valeur monétaire en dehors du Service et ne peuvent être échangés contre de l'argent, remboursés ou transférés à d'autres comptes." },
      { type: "p", text: "5.2. Traitement des Paiements : Tous les paiements sont traités de manière sécurisée et exclusivement par Stripe conformément à ses propres conditions et politiques de confidentialité. GetNearMe ne stocke pas et n'a pas accès aux détails complets des cartes de paiement des utilisateurs. En achetant des crédits, vous autorisez Stripe à débiter votre moyen de paiement sélectionné du montant applicable." },
      { type: "p", text: "5.3. Renonciation au Droit de Rétractation : En achetant des crédits numériques, vous consentez expressément à l'exécution immédiate du contrat et reconnaissez expressément que, une fois les crédits crédités sur votre compte, vous perdez votre droit de rétractation (délai de réflexion) conformément à l'Article 16(m) de la Directive 2011/83/UE relative aux Droits des Consommateurs." },
      { type: "p", text: "5.4. Politique de Remboursement : Tous les achats de crédits sont définitifs et non remboursables, sauf disposition contraire des lois obligatoires de protection des consommateurs. Aucun remboursement ne sera émis pour les crédits non utilisés ou si vous choisissez de cesser d'utiliser le Service." },
      { type: "p", text: "En cas d'erreur technique prouvée attribuable exclusivement à GetNearMe (par exemple, crédits payés mais non crédités sur le compte de l'utilisateur), l'utilisateur peut contacter le support à as.scirica@gmail.com pour vérification et rectification." },
      { type: "h2", text: "6. Responsabilité" },
      { type: "p", text: "Dans la mesure maximale permise par la loi applicable, GetNearMe ne sera pas responsable de tout dommage indirect, accessoire, spécial ou consécutif, y compris la perte de profits, de données, d'utilisation ou de clientèle, résultant de l'utilisation ou de l'impossibilité d'utiliser le Service." },
      { type: "p", text: "Le Service est fourni à des fins informatives et illustratives uniquement et repose sur des informations publiquement disponibles, des plateformes tierces et un traitement automatisé. GetNearMe ne garantit pas l'exactitude, l'exhaustivité ou la disponibilité de toute information, estimation ou résultat généré par l'IA et n'est pas responsable des décisions ou actions entreprises sur la base du Service." },
      { type: "p", text: "Ces limitations ne s'appliquent que dans la mesure permise par la loi applicable." },
      { type: "h2", text: "7. Résiliation" },
      { type: "p", text: "Nous nous réservons le droit de suspendre ou de résilier votre accès au Service immédiatement, sans préavis, si vous enfreignez les présentes Conditions, notamment en ce qui concerne l'extraction massive non autorisée de données ou la violation des droits de tiers." },
      { type: "h2", text: "8. Dispositions Générales" },
      { type: "p", text: "8.1. Divisibilité : Si une disposition des présentes Conditions est jugée inapplicable ou invalide, cette disposition sera limitée ou éliminée dans la mesure minimale nécessaire afin que les présentes Conditions restent pleinement en vigueur et effet." },
      { type: "p", text: "8.2. Modifications des Conditions : Nous nous réservons le droit de modifier les présentes Conditions à tout moment à notre seule discrétion. L'utilisation continue du Service après toute modification constitue votre acceptation des nouvelles Conditions." },
      { type: "h2", text: "9. Droit Applicable et Juridiction" },
      { type: "p", text: "Les présentes Conditions sont régies par les lois de l'Italie. Tout litige découlant des présentes Conditions sera soumis à la juridiction exclusive des tribunaux compétents de Rome, Italie. Les consommateurs européens ont le droit d'utiliser la plateforme de Résolution des Litiges en Ligne." },
    ],
  },
  ru: {
    title: "Условия использования",
    lastUpdated: "Последнее обновление: 02 апреля 2026",
    description: "Условия использования расширения браузера GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Принятие условий" },
      { type: "p", text: "Устанавливая или используя расширение GetNearMe (\"Сервис\"), вы соглашаетесь соблюдать настоящие Условия использования (\"Условия\"). Вы подтверждаете, что вам исполнилось 18 лет и вы полностью дееспособны для заключения данного соглашения. Если вы не согласны, вы должны немедленно удалить Сервис." },
      { type: "h2", text: "2. Лицензия и характер Сервиса" },
      { type: "p", text: "2.1. User Agent: Сервис работает как \"User Agent\" — программный инструмент, действующий исключительно от имени и под непосредственным контролем индивидуального Пользователя, аналогично тому, как веб-браузер (сам являющийся user agent) отображает и представляет веб-контент для Пользователя. Расширение не действует автономно, не осуществляет независимый обход или индексацию веб-сайтов и обрабатывает только контент, уже видимый на странице, которую Пользователь просматривает в данный момент. Любой анализ инициируется Пользователем и выполняется локально в сеансе браузера Пользователя." },
      { type: "p", text: "2.2. Ограниченная лицензия: Мы предоставляем вам отзывную, неисключительную, непередаваемую лицензию на использование Сервиса исключительно для личного или внутреннего делового анализа данных рынка недвижимости." },
      { type: "p", text: "2.3. Волатильность данных и локальное хранение: Пользователь признаёт, что GetNearMe является клиентским инструментом, который хранит детальные данные анализа (напр., цены, характеристики недвижимости) исключительно в локальном хранилище браузера (Local Storage)." },
      { type: "ul", items: [
        "a) Отсутствие удалённого резервного копирования: GetNearMe не хранит резервные копии содержания объявлений на своих серверах.",
        "b) Ответственность пользователя: Исключительная ответственность за сохранение или экспорт сгенерированных отчётов (напр., в формате PDF) сразу после анализа лежит на Пользователе.",
        "c) Потеря данных: Удаление расширения, очистка кэша браузера или использование программ для очистки системы приведут к необратимой потере сохранённых данных и истории анализов. GetNearMe ни при каких обстоятельствах не сможет восстановить эти данные и не возместит кредиты, использованные для анализов, утраченных в результате локальных действий Пользователя."
      ]},
      { type: "p", text: "2.4. Личное использование отчётов: Аналитические отчёты, экспорт в PDF, публикации для социальных сетей и любые другие результаты, сгенерированные Сервисом, предназначены исключительно для личного, информационного или внутреннего делового использования Пользователем. Пользователь не должен перераспределять, перепродавать, сублицензировать или публично публиковать такие результаты в коммерческих целях или способом, который может нарушить права интеллектуальной собственности третьих лиц (включая платформы-источники, с которых были проанализированы данные)." },
      { type: "p", text: "2.5. Публикация в социальных сетях (Опционально, пользователи Agency): Сервис может публиковать контент в подключённом аккаунте Instagram Business или Странице Facebook Пользователя только по явному планированию или запросу немедленной публикации от Пользователя. Подключая эти аккаунты, Пользователь уполномочивает GetNearMe действовать от его имени в рамках настоящих Условий и предоставляет GetNearMe разрешение на вызов Instagram Graph API и Facebook Graph API исключительно с целью публикации контента, подготовленного Пользователем. Пользователь несёт единоличную ответственность за опубликованный контент, включая соблюдение Правил сообщества Instagram, Стандартов сообщества Facebook, применимого законодательства об авторском праве и Условий использования Meta Platforms, Inc. GetNearMe не владеет, не изменяет и не претендует на права в отношении опубликованного Пользователем контента. Пользователь может отозвать это разрешение в любое время из панели Настройки GetNearMe или из настроек Facebook/Instagram (см. Инструкции по удалению данных)." },
      { type: "h2", text: "3. Ограничения и интеллектуальная собственность" },
      { type: "p", text: "3.1. Независимость: GetNearMe является независимым программным инструментом. Мы не аффилированы, не одобрены, не спонсированы и не связаны официально ни с одной платформой недвижимости (такой как Immobiliare.it, Idealista или другие). Все товарные знаки третьих лиц являются собственностью их соответствующих владельцев и используются исключительно в описательных целях совместимости (Nominative Fair Use)." },
      { type: "p", text: "3.2. Запрещённые действия: Вы явно соглашаетесь НЕ использовать Сервис для:" },
      { type: "ul", items: [
        "Массового извлечения данных с целью создания конкурирующей базы данных, поисковой системы или коммерческого сервиса.",
        "Обхода мер безопасности, CAPTCHA или барьеров аутентификации сторонних платформ.",
        "Нарушения Условий использования любого стороннего портала недвижимости, посещаемого при использовании Расширения.",
        "Попытки обойти, отключить или преодолеть любые технические ограничения или меры защиты контента, реализованные в Сервисе (включая ограничения на печать, копирование или экспорт данных)."
      ]},
      { type: "h2", text: "4. Отказ от ответственности и ограничения" },
      { type: "p", text: "4.1. Оценочные значения: Любой \"Расчётный итог\" или финансовый расчёт, предоставленный Сервисом, представляет собой ориентировочную оценку затрат, связанных с покупкой недвижимости (напр., агентские комиссии, нотариальные расходы, налоги). Эти оценки носят исключительно информационный характер и не являются обязывающим предложением или профессиональной финансовой котировкой." },
      { type: "p", text: "4.2. Достоверность данных: Информация, визуализируемая Сервисом, основана на общедоступных данных, информации из анализируемых объявлений и автоматической обработке. Мы не проверяем энергетические классы через официальные сертификаты (APE) и не гарантируем точность данных в исходных объявлениях. Неточности или пропуски в оригинальном стороннем объявлении могут отразиться в отчёте Сервиса." },
      { type: "p", text: "4.3. Отсутствие профессиональной консультации: Сервис не заменяет техническую, юридическую, налоговую или риэлторскую проверку, выполняемую квалифицированными специалистами. В пределах, допускаемых применимым законодательством, GetNearMe не несёт ответственности за решения, принятые на основе предоставленной информации." },
      { type: "h2", text: "5. Кредиты, платежи и возвраты" },
      { type: "p", text: "5.1. Покупка кредитов: Сервис работает на системе кредитов. Кредиты — это виртуальные единицы, используемые исключительно для разблокировки определённых функций или аналитики в Расширении. Кредиты не являются предоплаченными средствами, электронными деньгами или сохранённой стоимостью, не имеют денежной ценности вне Сервиса и не могут быть обменяны на наличные, возвращены или переведены на другие аккаунты." },
      { type: "p", text: "5.2. Обработка платежей: Все платежи обрабатываются безопасно и исключительно Stripe в соответствии с его собственными условиями и политиками конфиденциальности. GetNearMe не хранит и не имеет доступа к полным данным платёжных карт пользователей. Приобретая кредиты, вы уполномочиваете Stripe списать средства с выбранного способа оплаты на применимую сумму." },
      { type: "p", text: "5.3. Отказ от права на отзыв: Приобретая цифровые кредиты, вы явно соглашаетесь на немедленное исполнение договора и явно признаёте, что после зачисления кредитов на ваш аккаунт вы теряете право на отзыв (период обдумывания) в соответствии со Статьёй 16(m) Директивы 2011/83/ЕС о правах потребителей." },
      { type: "p", text: "5.4. Политика возврата: Все покупки кредитов являются окончательными и невозвратными, за исключением случаев, предусмотренных обязательным законодательством о защите прав потребителей. Возвраты не производятся за неиспользованные кредиты или при прекращении использования Сервиса." },
      { type: "p", text: "В случае подтверждённой технической ошибки, относящейся исключительно к GetNearMe (например, кредиты оплачены, но не зачислены на аккаунт пользователя), пользователь может обратиться в поддержку по адресу as.scirica@gmail.com для проверки и исправления." },
      { type: "h2", text: "6. Ответственность" },
      { type: "p", text: "В максимальной степени, допускаемой применимым законодательством, GetNearMe не несёт ответственности за любые косвенные, побочные, особые или последующие убытки, включая упущенную выгоду, потерю данных, использования или деловой репутации, возникающие в связи с использованием или невозможностью использования Сервиса." },
      { type: "p", text: "Сервис предоставляется исключительно в информационных и иллюстративных целях и основан на общедоступной информации, сторонних платформах и автоматизированной обработке. GetNearMe не гарантирует точность, полноту или доступность какой-либо информации, оценок или результатов, сгенерированных ИИ, и не несёт ответственности за решения или действия, предпринятые на основе Сервиса." },
      { type: "p", text: "Эти ограничения применяются только в пределах, допускаемых применимым законодательством." },
      { type: "h2", text: "7. Прекращение" },
      { type: "p", text: "Мы оставляем за собой право немедленно приостановить или прекратить ваш доступ к Сервису без предварительного уведомления в случае нарушения настоящих Условий, особенно в отношении несанкционированного массового извлечения данных или нарушения прав третьих лиц." },
      { type: "h2", text: "8. Общие положения" },
      { type: "p", text: "8.1. Делимость: Если какое-либо положение настоящих Условий будет признано неисполнимым или недействительным, это положение будет ограничено или исключено в минимально необходимой степени, чтобы настоящие Условия в остальном сохраняли полную силу и действие." },
      { type: "p", text: "8.2. Изменение Условий: Мы оставляем за собой право изменять настоящие Условия в любое время по нашему собственному усмотрению. Продолжение использования Сервиса после любых изменений означает ваше принятие новых Условий." },
      { type: "h2", text: "9. Применимое право и юрисдикция" },
      { type: "p", text: "Настоящие Условия регулируются законодательством Италии. Любой спор, вытекающий из настоящих Условий, подлежит исключительной юрисдикции компетентных судов Рима, Италия. Европейские потребители имеют право использовать платформу Онлайн-разрешения споров." },
    ],
  },
  uk: {
    title: "Умови використання",
    lastUpdated: "Останнє оновлення: 02 квітня 2026",
    description: "Умови використання розширення браузера GetNearMe.",
    blocks: [
      { type: "h2", text: "1. Прийняття умов" },
      { type: "p", text: "Встановлюючи або використовуючи розширення GetNearMe (\"Сервіс\"), ви погоджуєтесь дотримуватись цих Умов використання (\"Умови\"). Ви підтверджуєте, що вам виповнилось 18 років і ви повністю дієздатні для укладення цієї угоди. Якщо ви не погоджуєтесь, ви повинні негайно видалити Сервіс." },
      { type: "h2", text: "2. Ліцензія та характер Сервісу" },
      { type: "p", text: "2.1. User Agent: Сервіс працює як \"User Agent\" — програмний інструмент, що діє виключно від імені та під безпосереднім контролем індивідуального Користувача, аналогічно тому, як веб-браузер (сам будучи user agent) відображає та представляє веб-контент для Користувача. Розширення не діє автономно, не здійснює незалежний обхід або індексацію веб-сайтів і обробляє лише контент, вже видимий на сторінці, яку Користувач переглядає в даний момент. Будь-який аналіз ініціюється Користувачем і виконується локально в сеансі браузера Користувача." },
      { type: "p", text: "2.2. Обмежена ліцензія: Ми надаємо вам відкличну, невиключну, непередавану ліцензію на використання Сервісу виключно для особистого або внутрішнього ділового аналізу даних ринку нерухомості." },
      { type: "p", text: "2.3. Волатильність даних та локальне зберігання: Користувач визнає, що GetNearMe є клієнтським інструментом, який зберігає детальні дані аналізу (напр., ціни, характеристики нерухомості) виключно в локальному сховищі браузера (Local Storage)." },
      { type: "ul", items: [
        "a) Відсутність віддаленого резервного копіювання: GetNearMe не зберігає резервні копії вмісту оголошень на своїх серверах.",
        "b) Відповідальність користувача: Виключна відповідальність за збереження або експорт згенерованих звітів (напр., у форматі PDF) одразу після аналізу лежить на Користувачеві.",
        "c) Втрата даних: Видалення розширення, очищення кешу браузера або використання програм для очищення системи призведуть до безповоротної втрати збережених даних та історії аналізів. GetNearMe за жодних обставин не зможе відновити ці дані та не відшкодує кредити, використані для аналізів, втрачених внаслідок локальних дій Користувача."
      ]},
      { type: "p", text: "2.4. Особисте використання звітів: Аналітичні звіти, експорт у PDF, публікації для соціальних мереж та будь-які інші результати, згенеровані Сервісом, призначені виключно для особистого, інформаційного або внутрішнього ділового використання Користувачем. Користувач не повинен перерозповсюджувати, перепродавати, субліцензувати або публічно публікувати такі результати в комерційних цілях або способом, що може порушити права інтелектуальної власності третіх осіб (включаючи платформи-джерела, з яких були проаналізовані дані)." },
      { type: "p", text: "2.5. Публікація у соцмережах (Опціонально, користувачі Agency): Сервіс може публікувати контент у підключеному акаунті Instagram Business або Сторінці Facebook Користувача лише за явним плануванням або запитом негайної публікації від Користувача. Підключаючи ці акаунти, Користувач уповноважує GetNearMe діяти від його імені в межах цих Умов та надає GetNearMe дозвіл викликати Instagram Graph API та Facebook Graph API виключно з метою публікації контенту, підготовленого Користувачем. Користувач несе одноосібну відповідальність за опублікований контент, включаючи дотримання Правил спільноти Instagram, Стандартів спільноти Facebook, застосовного законодавства про авторське право та Умов використання Meta Platforms, Inc. GetNearMe не володіє, не змінює та не претендує на права щодо опублікованого Користувачем контенту. Користувач може відкликати цей дозвіл у будь-який час з панелі Налаштування GetNearMe або з налаштувань Facebook/Instagram (див. Інструкції з видалення даних)." },
      { type: "h2", text: "3. Обмеження та інтелектуальна власність" },
      { type: "p", text: "3.1. Незалежність: GetNearMe є незалежним програмним інструментом. Ми не афілійовані, не схвалені, не спонсоровані та не пов'язані офіційно з жодною платформою нерухомості (такою як Immobiliare.it, Idealista або інші). Усі товарні знаки третіх осіб є власністю їхніх відповідних власників і використовуються виключно в описових цілях сумісності (Nominative Fair Use)." },
      { type: "p", text: "3.2. Заборонені дії: Ви явно погоджуєтесь НЕ використовувати Сервіс для:" },
      { type: "ul", items: [
        "Масового видобування даних з метою створення конкуруючої бази даних, пошукової системи або комерційного сервісу.",
        "Обходу заходів безпеки, CAPTCHA або бар'єрів автентифікації сторонніх платформ.",
        "Порушення Умов використання будь-якого стороннього порталу нерухомості, відвідуваного при використанні Розширення.",
        "Спроби обійти, вимкнути або подолати будь-які технічні обмеження або заходи захисту контенту, реалізовані в Сервісі (включаючи обмеження на друк, копіювання або експорт даних)."
      ]},
      { type: "h2", text: "4. Застереження та обмеження відповідальності" },
      { type: "p", text: "4.1. Оціночні значення: Будь-який \"Розрахунковий підсумок\" або фінансовий розрахунок, наданий Сервісом, являє собою орієнтовну оцінку витрат, пов'язаних з придбанням нерухомості (напр., агентські комісії, нотаріальні витрати, податки). Ці оцінки носять виключно інформаційний характер і не є обов'язковою пропозицією або професійною фінансовою котировкою." },
      { type: "p", text: "4.2. Достовірність даних: Інформація, візуалізована Сервісом, базується на загальнодоступних даних, інформації з аналізованих оголошень та автоматичній обробці. Ми не перевіряємо енергетичні класи через офіційні сертифікати (APE) і не гарантуємо точність даних у вихідних оголошеннях. Неточності або пропуски в оригінальному сторонньому оголошенні можуть відобразитися у звіті Сервісу." },
      { type: "p", text: "4.3. Відсутність професійної консультації: Сервіс не замінює технічну, юридичну, податкову або ріелторську перевірку, виконувану кваліфікованими фахівцями. У межах, допустимих чинним законодавством, GetNearMe не несе відповідальності за рішення, прийняті на основі наданої інформації." },
      { type: "h2", text: "5. Кредити, платежі та повернення" },
      { type: "p", text: "5.1. Придбання кредитів: Сервіс працює на системі кредитів. Кредити — це віртуальні одиниці, що використовуються виключно для розблокування певних функцій або аналітики в Розширенні. Кредити не є передоплаченими коштами, електронними грошима або збереженою вартістю, не мають грошової цінності поза Сервісом і не можуть бути обміняні на готівку, повернені або переведені на інші акаунти." },
      { type: "p", text: "5.2. Обробка платежів: Усі платежі обробляються безпечно та виключно Stripe відповідно до його власних умов та політик конфіденційності. GetNearMe не зберігає та не має доступу до повних даних платіжних карток користувачів. Купуючи кредити, ви уповноважуєте Stripe списати кошти з обраного способу оплати на відповідну суму." },
      { type: "p", text: "5.3. Відмова від права на відкликання: Купуючи цифрові кредити, ви явно погоджуєтесь на негайне виконання договору та явно визнаєте, що після зарахування кредитів на ваш акаунт ви втрачаєте право на відкликання (період обдумування) відповідно до Статті 16(m) Директиви 2011/83/ЄС про права споживачів." },
      { type: "p", text: "5.4. Політика повернення: Усі покупки кредитів є остаточними та неповоротними, за винятком випадків, передбачених обов'язковим законодавством про захист прав споживачів. Повернення не здійснюються за невикористані кредити або при припиненні використання Сервісу." },
      { type: "p", text: "У разі підтвердженої технічної помилки, що відноситься виключно до GetNearMe (наприклад, кредити оплачені, але не зараховані на акаунт користувача), користувач може звернутися до підтримки за адресою as.scirica@gmail.com для перевірки та виправлення." },
      { type: "h2", text: "6. Відповідальність" },
      { type: "p", text: "У максимальному обсязі, допустимому чинним законодавством, GetNearMe не несе відповідальності за будь-які непрямі, випадкові, особливі або наслідкові збитки, включаючи втрату прибутку, даних, використання або ділової репутації, що виникають у зв'язку з використанням або неможливістю використання Сервісу." },
      { type: "p", text: "Сервіс надається виключно в інформаційних та ілюстративних цілях і базується на загальнодоступній інформації, сторонніх платформах та автоматизованій обробці. GetNearMe не гарантує точність, повноту або доступність будь-якої інформації, оцінок або результатів, згенерованих ШІ, і не несе відповідальності за рішення або дії, вжиті на основі Сервісу." },
      { type: "p", text: "Ці обмеження застосовуються лише в межах, допустимих чинним законодавством." },
      { type: "h2", text: "7. Припинення" },
      { type: "p", text: "Ми залишаємо за собою право негайно призупинити або припинити ваш доступ до Сервісу без попереднього повідомлення у разі порушення цих Умов, зокрема щодо несанкціонованого масового видобування даних або порушення прав третіх осіб." },
      { type: "h2", text: "8. Загальні положення" },
      { type: "p", text: "8.1. Подільність: Якщо будь-яке положення цих Умов буде визнано нездійсненним або недійсним, це положення буде обмежене або виключене в мінімально необхідному обсязі, щоб ці Умови в іншому залишались у повній силі та дії." },
      { type: "p", text: "8.2. Зміна Умов: Ми залишаємо за собою право змінювати ці Умови в будь-який час на наш власний розсуд. Продовження використання Сервісу після будь-яких змін означає ваше прийняття нових Умов." },
      { type: "h2", text: "9. Застосовне право та юрисдикція" },
      { type: "p", text: "Ці Умови регулюються законодавством Італії. Будь-який спір, що виникає з цих Умов, підлягає виключній юрисдикції компетентних судів Риму, Італія. Європейські споживачі мають право використовувати платформу Онлайн-вирішення спорів." },
    ],
  },
};

// ─── Data Deletion Instructions (Meta App Review requirement) ────────────────

export const dataDeletionContent: Record<Locale, LegalPage> = {
  en: {
    title: "Data Deletion Instructions",
    lastUpdated: "Last updated: 14 May 2026",
    description: "How to request deletion of your data from GetNearMe and revoke access from connected Instagram or Facebook accounts.",
    blocks: [
      { type: "p", text: "GetNearMe takes your data privacy seriously. This page explains how to delete the data we hold about you and how to revoke access from any Instagram or Facebook account you may have connected to our service." },
      { type: "h2", text: "1. Delete your GetNearMe account" },
      { type: "p", text: "To request full deletion of your GetNearMe account and all associated personal data (email, user ID, transactional records subject to legal retention, social media access tokens, scheduled posts), send an email to:" },
      { type: "p", text: "as.scirica@gmail.com" },
      { type: "p", text: "Subject: \"Account Deletion Request\". Include the email address associated with your GetNearMe account. We will process the request and confirm deletion within 30 days, in accordance with Article 17 GDPR." },
      { type: "h2", text: "2. Revoke Instagram / Facebook access only" },
      { type: "p", text: "If you only want to disconnect your Instagram Business or Facebook Page from GetNearMe without deleting your account, you have three options:" },
      { type: "h3", text: "Option A — From GetNearMe (recommended)" },
      { type: "ul", items: [
        "Open the GetNearMe browser extension.",
        "Open Settings → Social Accounts.",
        "Click \"Disconnect\" next to the Instagram or Facebook account.",
        "Access tokens are revoked immediately on our side and removed from our database."
      ]},
      { type: "h3", text: "Option B — From Facebook" },
      { type: "ul", items: [
        "Go to https://www.facebook.com/settings?tab=business_tools.",
        "Locate \"GetNearMe\" in the list of connected business tools.",
        "Click \"Remove\".",
        "This revokes our access tokens at the Meta level. We will detect the revocation on the next API call and remove the corresponding row from our database."
      ]},
      { type: "h3", text: "Option C — From Instagram" },
      { type: "ul", items: [
        "Open the Instagram app → Settings → Apps and Websites → Active.",
        "Find \"GetNearMe\" and tap \"Remove\".",
        "Access is revoked immediately."
      ]},
      { type: "h2", text: "3. What data is deleted" },
      { type: "p", text: "Upon disconnection or account deletion we permanently delete:" },
      { type: "ul", items: [
        "Long-lived access tokens (Instagram and Facebook).",
        "Page access tokens.",
        "Connected Instagram Business Account ID and Facebook Page ID.",
        "Cached account name and avatar URL.",
        "Pending scheduled posts associated with the disconnected account.",
        "Media files uploaded for unpublished posts (within minutes, automatic cleanup)."
      ]},
      { type: "p", text: "Data we are legally required to retain (e.g. invoices, payment records under Italian tax law Art. 2220 C.C., 10 years) is anonymized and retained only for compliance purposes." },
      { type: "h2", text: "4. Confirmation" },
      { type: "p", text: "After deletion you will receive an email confirmation. If you do not receive confirmation within 30 days, contact as.scirica@gmail.com." },
      { type: "h2", text: "5. Questions" },
      { type: "p", text: "For any question about data deletion or your rights under GDPR, write to as.scirica@gmail.com or to the Italian Data Protection Authority: www.garanteprivacy.it." },
    ],
  },
  it: {
    title: "Istruzioni per la Cancellazione dei Dati",
    lastUpdated: "Ultimo aggiornamento: 14 maggio 2026",
    description: "Come richiedere la cancellazione dei dati personali da GetNearMe e revocare l'accesso agli account Instagram o Facebook collegati.",
    blocks: [
      { type: "p", text: "GetNearMe prende sul serio la tua privacy. Questa pagina spiega come cancellare i dati che conserviamo su di te e come revocare l'accesso a qualsiasi account Instagram o Facebook collegato al nostro servizio." },
      { type: "h2", text: "1. Cancella il tuo account GetNearMe" },
      { type: "p", text: "Per richiedere la cancellazione completa dell'account GetNearMe e di tutti i dati personali associati (email, ID utente, dati transazionali soggetti a conservazione legale, token di accesso social, post programmati), invia una email a:" },
      { type: "p", text: "as.scirica@gmail.com" },
      { type: "p", text: "Oggetto: \"Richiesta cancellazione account\". Includi l'indirizzo email associato al tuo account GetNearMe. Elaboreremo la richiesta e confermeremo la cancellazione entro 30 giorni, in conformità con l'Art. 17 GDPR." },
      { type: "h2", text: "2. Revoca solo l'accesso Instagram / Facebook" },
      { type: "p", text: "Se vuoi solo scollegare il tuo account Instagram Business o Pagina Facebook da GetNearMe senza cancellare l'account, hai tre opzioni:" },
      { type: "h3", text: "Opzione A — Da GetNearMe (consigliato)" },
      { type: "ul", items: [
        "Apri l'estensione browser GetNearMe.",
        "Apri Impostazioni → Account Social.",
        "Clicca \"Scollega\" accanto all'account Instagram o Facebook.",
        "I token di accesso sono revocati immediatamente dal nostro lato e rimossi dal nostro database."
      ]},
      { type: "h3", text: "Opzione B — Da Facebook" },
      { type: "ul", items: [
        "Vai su https://www.facebook.com/settings?tab=business_tools.",
        "Trova \"GetNearMe\" nella lista degli strumenti business collegati.",
        "Clicca \"Rimuovi\".",
        "Questo revoca i nostri token a livello Meta. Rileveremo la revoca alla successiva chiamata API e rimuoveremo la riga corrispondente dal nostro database."
      ]},
      { type: "h3", text: "Opzione C — Da Instagram" },
      { type: "ul", items: [
        "Apri l'app Instagram → Impostazioni → App e siti web → Attive.",
        "Trova \"GetNearMe\" e tocca \"Rimuovi\".",
        "L'accesso viene revocato immediatamente."
      ]},
      { type: "h2", text: "3. Quali dati vengono cancellati" },
      { type: "p", text: "Alla disconnessione o cancellazione account eliminiamo permanentemente:" },
      { type: "ul", items: [
        "Token di accesso long-lived (Instagram e Facebook).",
        "Token di accesso della Pagina Facebook.",
        "ID Instagram Business Account collegato e ID Pagina Facebook.",
        "Nome account e URL avatar in cache.",
        "Post programmati pendenti associati all'account scollegato.",
        "File media caricati per post non pubblicati (entro pochi minuti, pulizia automatica)."
      ]},
      { type: "p", text: "I dati che siamo legalmente obbligati a conservare (es. fatture, registri pagamenti ai sensi dell'Art. 2220 C.C., 10 anni) vengono anonimizzati e conservati solo per finalità di conformità." },
      { type: "h2", text: "4. Conferma" },
      { type: "p", text: "Dopo la cancellazione riceverai una email di conferma. Se non ricevi la conferma entro 30 giorni, contatta as.scirica@gmail.com." },
      { type: "h2", text: "5. Domande" },
      { type: "p", text: "Per qualsiasi domanda sulla cancellazione dei dati o sui tuoi diritti GDPR, scrivi a as.scirica@gmail.com o all'Autorità Garante per la Protezione dei Dati Personali: www.garanteprivacy.it." },
    ],
  },
  es: {
    title: "Instrucciones para la Eliminación de Datos",
    lastUpdated: "Última actualización: 14 de mayo de 2026",
    description: "Cómo solicitar la eliminación de tus datos de GetNearMe y revocar el acceso a las cuentas de Instagram o Facebook conectadas.",
    blocks: [
      { type: "p", text: "GetNearMe toma en serio tu privacidad. Esta página explica cómo eliminar los datos que conservamos sobre ti y cómo revocar el acceso a cualquier cuenta de Instagram o Facebook conectada a nuestro servicio." },
      { type: "h2", text: "1. Elimina tu cuenta de GetNearMe" },
      { type: "p", text: "Para solicitar la eliminación completa de la cuenta GetNearMe y todos los datos personales asociados, envía un correo a:" },
      { type: "p", text: "as.scirica@gmail.com" },
      { type: "p", text: "Asunto: \"Solicitud de eliminación de cuenta\". Incluye la dirección de correo asociada a tu cuenta GetNearMe. Procesaremos la solicitud y confirmaremos la eliminación en un plazo de 30 días, conforme al Art. 17 RGPD." },
      { type: "h2", text: "2. Revocar solo el acceso a Instagram / Facebook" },
      { type: "p", text: "Si solo deseas desconectar tu cuenta Instagram Business o Página de Facebook de GetNearMe sin eliminar la cuenta, tienes tres opciones:" },
      { type: "h3", text: "Opción A — Desde GetNearMe (recomendado)" },
      { type: "ul", items: [
        "Abre la extensión del navegador GetNearMe.",
        "Abre Configuración → Cuentas Sociales.",
        "Haz clic en \"Desconectar\" junto a la cuenta de Instagram o Facebook.",
        "Los tokens de acceso se revocan inmediatamente y se eliminan de nuestra base de datos."
      ]},
      { type: "h3", text: "Opción B — Desde Facebook" },
      { type: "ul", items: [
        "Ve a https://www.facebook.com/settings?tab=business_tools.",
        "Localiza \"GetNearMe\" en la lista de herramientas empresariales conectadas.",
        "Haz clic en \"Eliminar\".",
        "Esto revoca nuestros tokens a nivel de Meta."
      ]},
      { type: "h3", text: "Opción C — Desde Instagram" },
      { type: "ul", items: [
        "Abre la app Instagram → Configuración → Apps y sitios web → Activos.",
        "Encuentra \"GetNearMe\" y toca \"Eliminar\".",
        "El acceso se revoca inmediatamente."
      ]},
      { type: "h2", text: "3. Qué datos se eliminan" },
      { type: "ul", items: [
        "Tokens de acceso de larga duración (Instagram y Facebook).",
        "Tokens de acceso de la Página de Facebook.",
        "ID de cuenta Instagram Business e ID de Página de Facebook conectadas.",
        "Nombre de cuenta y URL de avatar en caché.",
        "Publicaciones programadas pendientes asociadas a la cuenta desconectada.",
        "Archivos multimedia cargados para publicaciones no publicadas (limpieza automática)."
      ]},
      { type: "h2", text: "4. Confirmación" },
      { type: "p", text: "Tras la eliminación recibirás un correo de confirmación. Si no recibes confirmación en 30 días, contacta a as.scirica@gmail.com." },
      { type: "h2", text: "5. Preguntas" },
      { type: "p", text: "Para cualquier pregunta sobre eliminación de datos o tus derechos RGPD, escribe a as.scirica@gmail.com." },
    ],
  },
  fr: {
    title: "Instructions de Suppression des Données",
    lastUpdated: "Dernière mise à jour : 14 mai 2026",
    description: "Comment demander la suppression de vos données de GetNearMe et révoquer l'accès aux comptes Instagram ou Facebook connectés.",
    blocks: [
      { type: "p", text: "GetNearMe prend votre confidentialité au sérieux. Cette page explique comment supprimer les données que nous détenons sur vous et comment révoquer l'accès à tout compte Instagram ou Facebook connecté à notre service." },
      { type: "h2", text: "1. Supprimez votre compte GetNearMe" },
      { type: "p", text: "Pour demander la suppression complète du compte GetNearMe et de toutes les données personnelles associées, envoyez un email à :" },
      { type: "p", text: "as.scirica@gmail.com" },
      { type: "p", text: "Objet : « Demande de suppression de compte ». Incluez l'adresse email associée à votre compte GetNearMe. Nous traiterons la demande et confirmerons la suppression dans un délai de 30 jours, conformément à l'Art. 17 RGPD." },
      { type: "h2", text: "2. Révoquer uniquement l'accès Instagram / Facebook" },
      { type: "p", text: "Si vous souhaitez uniquement déconnecter votre compte Instagram Business ou Page Facebook de GetNearMe sans supprimer le compte, vous avez trois options :" },
      { type: "h3", text: "Option A — Depuis GetNearMe (recommandé)" },
      { type: "ul", items: [
        "Ouvrez l'extension navigateur GetNearMe.",
        "Ouvrez Paramètres → Comptes Sociaux.",
        "Cliquez sur « Déconnecter » à côté du compte Instagram ou Facebook.",
        "Les jetons d'accès sont révoqués immédiatement et supprimés de notre base de données."
      ]},
      { type: "h3", text: "Option B — Depuis Facebook" },
      { type: "ul", items: [
        "Allez sur https://www.facebook.com/settings?tab=business_tools.",
        "Trouvez « GetNearMe » dans la liste des outils d'entreprise connectés.",
        "Cliquez sur « Supprimer »."
      ]},
      { type: "h3", text: "Option C — Depuis Instagram" },
      { type: "ul", items: [
        "Ouvrez l'app Instagram → Paramètres → Apps et sites web → Actifs.",
        "Trouvez « GetNearMe » et appuyez sur « Supprimer ».",
        "L'accès est révoqué immédiatement."
      ]},
      { type: "h2", text: "3. Quelles données sont supprimées" },
      { type: "ul", items: [
        "Jetons d'accès longue durée (Instagram et Facebook).",
        "Jetons d'accès de la Page Facebook.",
        "ID du compte Instagram Business et ID de la Page Facebook connectés.",
        "Nom du compte et URL de l'avatar en cache.",
        "Publications programmées en attente associées au compte déconnecté.",
        "Fichiers médias téléchargés pour publications non publiées (nettoyage automatique)."
      ]},
      { type: "h2", text: "4. Confirmation" },
      { type: "p", text: "Après suppression, vous recevrez un email de confirmation. Si vous ne recevez pas la confirmation dans 30 jours, contactez as.scirica@gmail.com." },
      { type: "h2", text: "5. Questions" },
      { type: "p", text: "Pour toute question sur la suppression des données ou vos droits RGPD, écrivez à as.scirica@gmail.com." },
    ],
  },
  ru: {
    title: "Инструкции по удалению данных",
    lastUpdated: "Последнее обновление: 14 мая 2026",
    description: "Как запросить удаление ваших данных из GetNearMe и отозвать доступ к подключённым аккаунтам Instagram или Facebook.",
    blocks: [
      { type: "p", text: "GetNearMe серьёзно относится к вашей конфиденциальности. Эта страница объясняет, как удалить данные, которые мы храним о вас, и как отозвать доступ к любому подключённому аккаунту Instagram или Facebook." },
      { type: "h2", text: "1. Удалите свой аккаунт GetNearMe" },
      { type: "p", text: "Чтобы запросить полное удаление аккаунта GetNearMe и всех связанных персональных данных, отправьте письмо на:" },
      { type: "p", text: "as.scirica@gmail.com" },
      { type: "p", text: "Тема: «Запрос на удаление аккаунта». Укажите адрес электронной почты, связанный с вашим аккаунтом GetNearMe. Мы обработаем запрос и подтвердим удаление в течение 30 дней в соответствии со ст. 17 GDPR." },
      { type: "h2", text: "2. Отозвать только доступ Instagram / Facebook" },
      { type: "p", text: "Если вы хотите только отключить аккаунт Instagram Business или Страницу Facebook от GetNearMe, не удаляя аккаунт, у вас есть три варианта:" },
      { type: "h3", text: "Вариант A — Из GetNearMe (рекомендуется)" },
      { type: "ul", items: [
        "Откройте расширение браузера GetNearMe.",
        "Откройте Настройки → Социальные аккаунты.",
        "Нажмите «Отключить» рядом с аккаунтом Instagram или Facebook.",
        "Токены доступа отзываются немедленно и удаляются из нашей базы данных."
      ]},
      { type: "h3", text: "Вариант B — Из Facebook" },
      { type: "ul", items: [
        "Перейдите на https://www.facebook.com/settings?tab=business_tools.",
        "Найдите «GetNearMe» в списке подключённых бизнес-инструментов.",
        "Нажмите «Удалить»."
      ]},
      { type: "h3", text: "Вариант C — Из Instagram" },
      { type: "ul", items: [
        "Откройте приложение Instagram → Настройки → Приложения и сайты → Активные.",
        "Найдите «GetNearMe» и нажмите «Удалить».",
        "Доступ отзывается немедленно."
      ]},
      { type: "h2", text: "3. Какие данные удаляются" },
      { type: "ul", items: [
        "Долгосрочные токены доступа (Instagram и Facebook).",
        "Токены доступа Страницы Facebook.",
        "ID подключённого аккаунта Instagram Business и ID Страницы Facebook.",
        "Имя аккаунта и URL аватара в кэше.",
        "Ожидающие запланированные публикации, связанные с отключённым аккаунтом.",
        "Медиафайлы, загруженные для неопубликованных публикаций (автоматическая очистка)."
      ]},
      { type: "h2", text: "4. Подтверждение" },
      { type: "p", text: "После удаления вы получите письмо с подтверждением. Если вы не получили подтверждение в течение 30 дней, свяжитесь с as.scirica@gmail.com." },
      { type: "h2", text: "5. Вопросы" },
      { type: "p", text: "По любым вопросам об удалении данных или ваших правах GDPR пишите на as.scirica@gmail.com." },
    ],
  },
  uk: {
    title: "Інструкції з видалення даних",
    lastUpdated: "Останнє оновлення: 14 травня 2026",
    description: "Як запросити видалення ваших даних з GetNearMe та відкликати доступ до підключених акаунтів Instagram або Facebook.",
    blocks: [
      { type: "p", text: "GetNearMe серйозно ставиться до вашої конфіденційності. Ця сторінка пояснює, як видалити дані, які ми зберігаємо про вас, та як відкликати доступ до будь-якого підключеного акаунта Instagram або Facebook." },
      { type: "h2", text: "1. Видаліть свій акаунт GetNearMe" },
      { type: "p", text: "Щоб запросити повне видалення акаунта GetNearMe та всіх пов'язаних персональних даних, надішліть листа на:" },
      { type: "p", text: "as.scirica@gmail.com" },
      { type: "p", text: "Тема: «Запит на видалення акаунта». Вкажіть адресу електронної пошти, пов'язану з вашим акаунтом GetNearMe. Ми обробимо запит та підтвердимо видалення протягом 30 днів відповідно до ст. 17 GDPR." },
      { type: "h2", text: "2. Відкликати лише доступ Instagram / Facebook" },
      { type: "p", text: "Якщо ви хочете лише відключити акаунт Instagram Business або Сторінку Facebook від GetNearMe, не видаляючи акаунт, у вас є три варіанти:" },
      { type: "h3", text: "Варіант A — З GetNearMe (рекомендовано)" },
      { type: "ul", items: [
        "Відкрийте розширення браузера GetNearMe.",
        "Відкрийте Налаштування → Соціальні акаунти.",
        "Натисніть «Відключити» поруч з акаунтом Instagram або Facebook.",
        "Токени доступу відкликаються негайно та видаляються з нашої бази даних."
      ]},
      { type: "h3", text: "Варіант B — З Facebook" },
      { type: "ul", items: [
        "Перейдіть на https://www.facebook.com/settings?tab=business_tools.",
        "Знайдіть «GetNearMe» у списку підключених бізнес-інструментів.",
        "Натисніть «Видалити»."
      ]},
      { type: "h3", text: "Варіант C — З Instagram" },
      { type: "ul", items: [
        "Відкрийте додаток Instagram → Налаштування → Додатки та сайти → Активні.",
        "Знайдіть «GetNearMe» та торкніться «Видалити».",
        "Доступ відкликається негайно."
      ]},
      { type: "h2", text: "3. Які дані видаляються" },
      { type: "ul", items: [
        "Довгострокові токени доступу (Instagram та Facebook).",
        "Токени доступу Сторінки Facebook.",
        "ID підключеного акаунта Instagram Business та ID Сторінки Facebook.",
        "Ім'я акаунта та URL аватару в кеші.",
        "Очікувані заплановані публікації, пов'язані з відключеним акаунтом.",
        "Медіафайли, завантажені для неопублікованих публікацій (автоматичне очищення)."
      ]},
      { type: "h2", text: "4. Підтвердження" },
      { type: "p", text: "Після видалення ви отримаєте лист з підтвердженням. Якщо ви не отримали підтвердження протягом 30 днів, зв'яжіться з as.scirica@gmail.com." },
      { type: "h2", text: "5. Запитання" },
      { type: "p", text: "З будь-яких питань щодо видалення даних або ваших прав GDPR пишіть на as.scirica@gmail.com." },
    ],
  },
};
