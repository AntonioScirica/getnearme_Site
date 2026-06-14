export type Locale = 'it' | 'en' | 'es' | 'fr' | 'ru' | 'uk';

export const translations = {
  it: {
    nav: {
      features: "Funzionalità",
      examples: "Esempi",
      pricing: "Prezzi",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutorial",
      startAnalysis: "Prova gratis",
      backToHome: "← Torna alla home",
      dashboard: "Dashboard",
      myAccount: "Il mio account"
    },
    hero: {
      title1: "L'assistente AI per agenti immobiliari.",
      title2: "Risparmia più di un giorno e mezzo a settimana",
      title3: "",
      description: "Home staging, video, post social e report per ogni immobile, pronti in pochi minuti. Quello che oggi ti porta via ore, lo fai da un posto solo.",
      cta: "Prova gratis",
      ctaSecondary: "Come funziona",
      subMockup: "GetNearMe è l'assistente AI per agenti immobiliari: parti dall'annuncio o dalle tue foto e ottieni home staging, video, post social, report col tuo brand e analisi di zona. Tutto in un posto solo, senza imparare niente di nuovo."
    },
    features: {
      title: "Tutto ciò che puoi",
      titleItalic: "fare con GetNearMe",
      description: "Un assistente al posto di Canva, editor video, designer e ore di lavoro. Analizzi l'immobile, valorizzi le foto e prepari report e contenuti in pochi minuti.",
      card1: {
        title: "Analisi completa dell'immobile",
        desc: "Hai subito una visione chiara e ordinata dei dati chiave dell'immobile, senza cercare informazioni sparse tra mille pagine."
      },
      card2: {
        title: "Analisi di zona interattiva",
        desc: "Mostri al cliente cosa significa vivere in quella zona: servizi, trasporti e distanze reali, su mappa e in tempo reale."
      },
      card3: {
        title: "Prezzo medio di zona al m²",
        desc: "Il prezzo medio €/m² della zona, per preparare la trattativa con i numeri alla mano."
      },
      card4: {
        title: "Report comparativi col tuo brand",
        desc: "Presenti più immobili in un documento ordinato col tuo logo, pronto da inviare al cliente."
      },
      card5: {
        title: "Home staging con l'AI",
        desc: "Modifichi le foto con l'AI e mostri il confronto prima/dopo: stanze vuote o arredate, luce migliorata e spazi valorizzati in pochi secondi."
      },
      disclaimer: "I dati di zona sono informazioni di mercato a scopo informativo e non costituiscono una valutazione o perizia immobiliare.",
      addExtension: "Prova gratis",
      comingSoonTitle: "In arrivo",
      comingSoonDesc: "Stiamo sviluppando nuove funzioni per rendere il tuo lavoro ancora più veloce e professionale.",
    },
    faq: {
      title: "Domande",
      titleItalic: "frequenti",
      items: [
        {
          q: "Cos'è GetNearMe?",
          a: "È l'assistente AI che prepara tutto il materiale dei tuoi annunci: home staging, video, post social, report e analisi di zona. Parti dal link del portale o dalle tue foto e in pochi minuti hai tutto pronto, col tuo brand."
        },
        {
          q: "Devo installare qualcosa?",
          a: "No. GetNearMe è online: accedi dal browser e inizi a lavorare. Niente da scaricare, niente software da imparare."
        },
        {
          q: "Come lo provo?",
          a: "Gratis e senza carta. Crei l'account e provi subito le funzioni: vedi l'output prima di decidere."
        },
        {
          q: "Funziona se lavoro da solo?",
          a: "Sì, è pensato proprio per il singolo agente. Fai da solo il lavoro di un piccolo team: foto, video, post e report, senza fornitori esterni."
        },
        {
          q: "Devo saper montare video o usare programmi di grafica?",
          a: "No. Scegli un template e l'AI fa il resto: video con musica e sottotitoli, post col tuo logo, report già impaginati."
        },
        {
          q: "I dati di zona sono una valutazione?",
          a: "No. Sono informazioni di mercato a scopo informativo, utili per raccontare l'immobile e preparare la trattativa. Non sostituiscono una perizia ufficiale."
        }
      ]
    },
    pricing: {
      title: "Un prezzo solo",
      titleItalic: "per tutto",
      description: "Un unico piano con tutte le funzioni: home staging, video, post social, report e analisi di zona. Provi gratis prima di pagare.",
      free: "Free",
      buyNow: "Acquista ora",
      registerNow: "Registrati ora",
      mostChosen: "Più scelto",
      footer1: "Pagamento sicuro con carta, PayPal e i principali provider.",
      footer2: "Provi gratis, senza carta. Disdici quando vuoi.",
      footer3: "",
      plans: [
        {
          name: "Free",
          subtitle: "Per iniziare",
          desc: "Provi GetNearMe gratis e senza carta: crei l'account e usi subito le funzioni con i crediti di prova inclusi."
        },
        {
          name: "Piano Mensile",
          subtitle: "Tutte le funzioni incluse",
          desc: "Accesso completo a GetNearMe per il singolo agente: home staging AI, video, post social, report col tuo brand e analisi di zona. Uno strumento di supporto al tuo lavoro, non un sistema di valutazione immobiliare."
        },
        {
          name: "Piano Annuale",
          subtitle: "Il più conveniente",
          desc: "Tutte le funzioni del piano mensile con due mesi gratis e supporto prioritario."
        }
      ]
    },
    cta: {
      title: "Presentati come una grande agenzia",
      title2: "anche se lavori",
      titleItalic: "da solo",
      desc: "Prepara foto, video, post e report professionali per ogni immobile, in pochi minuti.",
      button: "Prova gratis",
      requestInfo: "Richiedi informazioni",
    },
    howItWorks: {
      step1Title: "Crea il tuo account gratis",
      step1Desc: "Ti registri in pochi secondi. Nessuna carta richiesta.",
      step2Title: "Parti dall'annuncio",
      step2Desc: "Incolli il link del portale o carichi le tue foto e i dati dell'immobile.",
      step3Title: "Pubblica in pochi minuti",
      step3Desc: "Foto, video, post e report pronti, col tuo brand. Tutto da un posto solo.",
      cta: "Prova gratis",
      videoTitle: "GetNearMe: come funziona",
    },
    footer: {
      desc: "L'assistente AI per agenti immobiliari. Quello che oggi ti costa ore — foto, video, post e presentazioni — con GetNearMe lo fai in pochi minuti, partendo dall'annuncio.",
      product: "Prodotto",
      legal: "Legale",
      privacy: "Privacy Policy",
      cookie: "Cookie Policy",
      terms: "Termini di Servizio",
      dataDeletion: "Cancellazione Dati",
      rights: "Tutti i diritti riservati."
    },
    privacy: {
      update: "Ultimo aggiornamento: 23/01/2026",
      intro: "La presente Privacy Policy descrive le modalità di trattamento dei dati personali degli utenti che utilizzano il sito web getnearme.it e l'estensione browser GetNearMe (di seguito, il \"Servizio\").",
      sections: [
        {
          t: "1. Titolare del trattamento",
          c: "Il titolare del trattamento è persona fisica, identificata come GetNearMe. Per qualsiasi richiesta relativa al trattamento dei dati personali è possibile contattare: info@getnearme.it"
        },
        {
          t: "2. Tipologie di dati trattati",
          c: "Nel corso dell'utilizzo del Servizio possono essere trattate le seguenti categorie di dati: dati forniti volontariamente dall'utente (ad esempio indirizzo email in fase di registrazione); dati tecnici e di navigazione (indirizzo IP, tipo di browser, sistema operativo, data e ora di accesso); dati relativi all'utilizzo del Servizio (analisi effettuate, crediti utilizzati, preferenze di utilizzo). Non vengono trattati dati personali sensibili."
        },
        {
          t: "3. Autenticazione",
          c: "L'estensione utilizza Supabase per l'autenticazione degli utenti. Quando crei un account, memorizziamo: indirizzo email, ID utente univoco, data di registrazione e stato dell'abbonamento. Questi dati sono conservati sui server Supabase (EU) e sono necessari per gestire i crediti e l'accesso alle funzionalità premium."
        },
        {
          t: "4. Pagamenti",
          c: "I pagamenti sono elaborati da Stripe. GetNearMe NON memorizza dati di carte di credito. Stripe gestisce tutte le informazioni di pagamento in conformità con gli standard PCI-DSS. Conserviamo solo: ID cliente Stripe (per collegare gli acquisti al tuo account) e storico crediti acquistati."
        },
        {
          t: "5. Generazione Immagini AI",
          c: "La funzionalità \"Virtual Staging\" utilizza Replicate API per generare immagini. Quando usi questa funzione: l'immagine selezionata viene inviata a Replicate per l'elaborazione; le immagini generate sono temporanee e non vengono conservate permanentemente; Replicate può conservare log per scopi di debugging (consulta la loro privacy policy per dettagli)."
        },
        {
          t: "6. Finalità del trattamento",
          c: "I dati personali sono trattati per le seguenti finalità: consentire la registrazione e la gestione dell'account utente; fornire le funzionalità di analisi e confronto offerte dal Servizio; gestire il sistema di crediti e l'accesso alle funzionalità; inviare comunicazioni di servizio necessarie al funzionamento del Servizio; inviare comunicazioni informative solo previo consenso esplicito dell'utente; migliorare il funzionamento e la sicurezza del Servizio."
        },
        {
          t: "7. Base giuridica del trattamento",
          c: "Il trattamento dei dati si basa su: esecuzione di un contratto o di misure precontrattuali; consenso dell'utente, ove richiesto; legittimo interesse del titolare al corretto funzionamento e miglioramento del Servizio."
        },
        {
          t: "8. Modalità di trattamento",
          c: "Il trattamento dei dati avviene mediante strumenti informatici, adottando misure di sicurezza adeguate a garantire riservatezza, integrità e disponibilità delle informazioni."
        },
        {
          t: "9. Conservazione dei dati",
          c: "Dati di navigazione locale: cancellati alla chiusura del browser. Cache immobili analizzati: conservata localmente fino a cancellazione manuale. Account utente: conservato fino a richiesta di eliminazione. Per eliminare il tuo account e tutti i dati associati, contatta info@getnearme.it o usa l'opzione \"Elimina Account\" nelle impostazioni dell'estensione."
        },
        {
          t: "10. Condivisione dei dati",
          c: "I dati possono essere condivisi con fornitori di servizi tecnici e operativi (Supabase per autenticazione, Stripe per pagamenti, Replicate per elaborazione immagini AI), esclusivamente per finalità connesse all'erogazione del Servizio."
        },
        {
          t: "11. Diritti dell'utente",
          c: "L'utente può esercitare i diritti previsti dal Regolamento UE 2016/679 (GDPR), inclusi accesso, rettifica, cancellazione e opposizione, scrivendo a info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Ultimo aggiornamento: 22/12/2025",
      intro: "I presenti Termini disciplinano l’utilizzo del sito web getnearme.it e l’estensione browser GetNearMe.",
      sections: [
        {
          t: "1. Natura del Servizio",
          c: "GetNearMe è uno strumento di supporto decisionale che organizza e confronta dati disponibili su immobili e quartieri. GetNearMe non è un’agenzia immobiliare e non fornisce consulenza professionale, legale, fiscale o immobiliare."
        },
        {
          t: "2. Origine dei dati",
          c: "Le informazioni visualizzate derivano da annunci immobiliari di terze parti e da fonti pubbliche disponibili. GetNearMe non ha alcun controllo sui contenuti degli annunci e non è responsabile per eventuali errori, omissioni o variazioni successive."
        },
        {
          t: "3. Analisi e stime",
          c: "Le analisi e le stime fornite sono puramente indicative, basate su valori medi e dati disponibili, e non costituiscono una valutazione immobiliare ufficiale. Ogni decisione presa dall’utente resta sotto la sua esclusiva responsabilità."
        },
        {
          t: "4. Account e crediti",
          c: "Alcune funzionalità del Servizio richiedono la creazione di un account. I crediti: sono associati all’account dell’utente; non hanno scadenza; non sono rimborsabili."
        },
        {
          t: "5. Uso consentito",
          c: "È vietato: utilizzare il Servizio per finalità illecite o non autorizzate; tentare di aggirare i sistemi di sicurezza o il sistema di crediti; effettuare scraping massivo o uso commerciale non autorizzato dei contenuti."
        },
        {
          t: "6. Disponibilità del Servizio",
          c: "Alcune funzionalità possono variare in base alla disponibilità delle fonti, al sito analizzato o al browser utilizzato. GetNearMe si riserva il diritto di modificare, sospendere o interrompere il Servizio, in tutto o in parte, in qualsiasi momento."
        },
        {
          t: "7. Limitazione di responsabilità",
          c: "Nei limiti consentiti dalla legge, GetNearMe non è responsabile per eventuali danni derivanti dall’uso o dall’impossibilità di utilizzo del Servizio."
        }
      ]
    },
    cookie: {
      update: "Ultimo aggiornamento: 22/12/2025",
      intro: "La presente Cookie Policy si applica esclusivamente al sito web getnearme.it.",
      sections: [
        {
          t: "1. Cosa sono i cookie",
          c: "I cookie sono piccoli file di testo che il sito invia al dispositivo dell’utente per migliorare l’esperienza di navigazione e il corretto funzionamento del sito."
        },
        {
          t: "2. Tipologie di cookie utilizzate",
          c: "Il sito utilizza: cookie tecnici, necessari al funzionamento del sito e alla gestione delle preferenze dell’utente; eventuali cookie di terze parti collegati a servizi tecnici o di pagamento."
        },
        {
          t: "3. Gestione dei cookie",
          c: "L’utente può gestire o disabilitare i cookie tramite le impostazioni del proprio browser. La disabilitazione dei cookie tecnici può compromettere il corretto funzionamento del sito."
        },
        {
          t: "4. Consenso",
          c: "I cookie tecnici non richiedono il consenso dell’utente. Per eventuali cookie non tecnici viene richiesto il consenso tramite apposito banner."
        }
      ]
    },
    bonus: {
      creditsClaimed: "Crediti Riscossi!",
      dayCompleted: "Giorno {day} completato!",
      weekComplete: "Fantastico! Hai completato la settimana! Ricevi 120 crediti bonus!",
      comeBackTomorrow: "Torna domani per il giorno {day}.",
      goToHome: "Vai a GetNearMe",
      backToHome: "Torna alla Home",
      error: {
        defaultTitle: "Errore",
        defaultMessage: "Si è verificato un errore.",
        alreadyClaimedTitle: "Bonus Già Riscosso",
        alreadyClaimedMessage: "Hai già riscosso il bonus di oggi. Torna domani!",
        expiredTitle: "Token Scaduto",
        expiredMessage: "Questo link non è più valido. Controlla l'email di oggi.",
        invalidTokenTitle: "Token Non Valido",
        invalidTokenMessage: "Il link che hai usato non è valido.",
        missingTokenTitle: "Token Mancante",
        missingTokenMessage: "Nessun token fornito.",
        serverErrorTitle: "Errore Server",
        serverErrorMessage: "Si è verificato un errore. Riprova più tardi."
      },
      loading: "Caricamento..."
    },
    confirm: {
      subtitle: "Benvenuto in GetNearMe",
      description: "La tua iscrizione al servizio è stata confermata. Accedi a GetNearMe e inizia a usare tutte le funzioni.",
      cta: "Inizia ad esplorare"
    },
    unsubscribe: {
      subtitle: "Disiscrizione completata",
      description: "Sei stato rimosso con successo dalla nostra mailing list. Non riceverai più email da GetNearMe."
    },
    featuresPage: {
      title: "Tutte le Funzionalità",
      titleItalic: "di GetNearMe",
      subtitle: "Scopri tutti gli strumenti pensati per cambiare il tuo lavoro di agente immobiliare. Dall'analisi di zona all'intelligenza artificiale, ogni funzione ti dà un vantaggio concreto.",
      feature6: {
        title: "Marketing Immobiliare Automatico",
        desc: "Trasforma i dati dell'immobile in post professionali, già ottimizzati per i principali social network.",
        badge: "NUOVO",
      },
      feature7: {
        title: "Video Immobiliari in pochi click",
        desc: "Crea in pochi click contenuti video professionali per promuovere ogni immobile in modo moderno e immediato.",
        badge: "NUOVO",
      },
      ctaTitle: "Pronto per iniziare?",
      ctaDesc: "Unisciti agli agenti immobiliari che stanno già cambiando il loro modo di lavorare con GetNearMe.",
      ctaButton: "Prova gratis",
      ctaContact: "Contattaci",
    },
    landing: {
      topBar: {
        promo: "Offerta lancio:",
        discount: "Prezzo lancio limitato",
        expiresIn: "scade tra",
        freeTrialShort: "",
      },
      hero: {
        badge: "",
        title1: "L'assistente AI per agenti immobiliari.",
        title2: "Risparmia più di un giorno e mezzo a settimana.",
        desc: "Home staging, video, post social e report per ogni immobile, pronti in pochi minuti. Quello che oggi ti porta via ore, lo fai da un posto solo.",
        ctaPrimary: "Prova gratis",
        ctaSecondary: "Guarda come funziona",
        ctaDemo: "Prenota una demo",
        stats: ["Provi senza carta", "Pronto in pochi minuti", "I tuoi annunci, col tuo brand"],
      },
      problem: {
        emoji: "frown",
        title: "Per un solo annuncio apri dieci programmi diversi.",
        desc: "Foto da sistemare, video da montare, post per i social, il PDF da mandare al cliente. Strumenti che costano, non si parlano tra loro e ti rubano ore ogni settimana. E intanto un altro agente arriva prima di te.",
      },
      solution: {
        emoji: "rocket",
        title: "Un assistente solo. Tutto il lavoro sull'annuncio, finito.",
        desc: "Parti dall'annuncio — incolli il link del portale o carichi le tue foto — e GetNearMe ti restituisce home staging, video, post social e report col tuo logo. In pochi minuti, senza aprire altri programmi e senza imparare niente di nuovo.",
      },
      features: {
        title: "Sei strumenti professionali.",
        titleHighlight: "Un assistente solo.",
        subtitle: "GetNearMe fa il lavoro di Canva, editor video, designer, social media manager e PowerPoint. E non devi imparare niente di nuovo.",
        items: [
          { num: "01", title: "Home staging AI", desc: "Arreda, svuota o trasforma una stanza in pochi secondi. Mostri il prima/dopo al cliente o lo pubblichi subito sui portali e sui social.", icon: "sparkles", color: "#6366f1" },
          { num: "02", title: "Video AI per l'immobile", desc: "Reel, walkthrough, before/after, video con avatar che parla e molto altro. Pronti in pochi click, senza montaggio e senza videomaker.", icon: "clapperboard", color: "#10b981" },
          { num: "03", title: "Post, reel e storie social", desc: "Contenuti pronti per Instagram, Facebook, TikTok e LinkedIn dai dati dell'annuncio. Il tuo logo e i tuoi colori applicati da soli.", icon: "smartphone", color: "#ec4899" },
          { num: "04", title: "Report PDF col tuo brand", desc: "Confronti più immobili in un documento ordinato col tuo logo, colori e font. Pronto da inviare al cliente dopo la visita.", icon: "file-text", color: "#f97316" },
          { num: "05", title: "Analisi di zona interattiva", desc: "Servizi, trasporti, scuole, sanità, parchi e distanze reali mostrati su mappa. Racconti il quartiere al cliente con dati concreti, senza aprire venti schede.", icon: "map", color: "#0ea5e9" },
          { num: "06", title: "Prezzo medio di zona al m²", desc: "Il prezzo medio €/m² della zona e il confronto tra immobili simili, per preparare la trattativa con i numeri alla mano. Dati di mercato a scopo informativo, non una perizia.", icon: "trending-up", color: "#f59e0b" },
        ],
      },
      testimonials: {
        title: "Meno strumenti, più risultati.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Marco R.", role: "Agente immobiliare", text: "Ho provato i video AI per un trilocale fermo da due mesi. L'ho messo su Instagram e in una settimana ho ricevuto tre richieste di visita. Non me l'aspettavo, onestamente.", avatar: "MR", color: "#f59e0b", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
          { name: "Giulia T.", role: "Agente immobiliare", text: "Il report lo mando dopo la visita, così il cliente confronta le case con calma. Con le foto AI gli faccio vedere la stessa stanza arredata in tre modi diversi: si convince molto prima.", avatar: "GT", color: "#6366f1", photo: "https://randomuser.me/api/portraits/women/65.jpg" },
          { name: "Davide M.", role: "Agente immobiliare", text: "Carico le foto, scelgo lo stile e in un minuto ho il reel pronto. Prima dovevo chiamare il videomaker e aspettare giorni, adesso lo faccio mentre aspetto il cliente in ufficio.", avatar: "DM", color: "#10b981", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
        ],
      },
      pricing: {
        title1: "Un prezzo solo.",
        title2: "Si ripaga col",
        titleHighlight: "primo immobile",
        subtitle: "Provalo gratis. Poi un solo abbonamento al posto di Canva, editor video, designer e ore di lavoro: costa meno della somma.",
        countdownLabel: "Prezzo lancio, scade tra",
        trustBadges: ["🔒 Pagamento sicuro Stripe", "⚡ Attivazione immediata"],
        savingsLabel: "RISPARMI",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "free", name: "Free", users: "Per iniziare", oldPrice: null, price: 0, period: "",
            savingsYear: null, badge: null, popular: false,
            features: ["Provi tutte le funzioni", "Crediti di prova inclusi", "Nessuna carta richiesta"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Inizia gratis",
          },
          {
            id: "agency_monthly", name: "Mensile", users: "Tutte le funzioni incluse", oldPrice: 150, price: 59, period: "/mese",
            savingsYear: null, badge: null, popular: false,
            features: ["Tutto del piano Free", "Report col tuo logo", "Home staging AI", "Video AI per gli immobili", "Post e storie social", "Prezzo al m² in tempo reale", "Supporto via email"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Scegli questo piano",
          },
          {
            id: "agency_annual", name: "Annuale", users: "Tutte le funzioni incluse", oldPrice: 1800, price: 590, period: "/anno",
            savingsYear: null, badge: "Più scelto", popular: true,
            features: ["Tutto del piano Mensile", "2 mesi gratis rispetto al mensile", "Prezzo bloccato per 12 mesi", "Supporto prioritario"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Scegli questo piano",
          },
        ],
      },
      howItWorks: {
        title: "Operativo in",
        titleHighlight: "2 minuti",
        subtitle: "Niente da installare, niente da imparare. Crei l'account, parti dall'annuncio e hai tutto pronto.",
        steps: [
          { step: "1", title: "Crea il tuo account gratis", desc: "Ti registri in pochi secondi, direttamente dal browser. Nessuna carta richiesta.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Parti dall'annuncio", desc: "Incolli il link del portale o carichi le tue foto e i dati dell'immobile.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Pubblica in pochi minuti", desc: "Home staging, video, post social e report pronti, col tuo brand. Tutto da un posto solo.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Domande?",
        titleHighlight: "Risposte.",
        items: [
          { q: "Cos'è GetNearMe?", a: "È l'assistente AI che prepara tutto il materiale dei tuoi annunci: home staging, video, post social, report e analisi di zona. Parti dal link del portale o dalle tue foto e in pochi minuti hai tutto pronto, col tuo brand." },
          { q: "Devo installare qualcosa?", a: "No. GetNearMe è online: accedi dal browser e inizi a lavorare. Niente da scaricare, niente software da imparare." },
          { q: "Come lo provo?", a: "Gratis e senza carta. Crei l'account e provi subito le funzioni: vedi l'output prima di decidere se abbonarti." },
          { q: "Funziona se lavoro da solo?", a: "Sì, è pensato proprio per il singolo agente. Fai da solo il lavoro di un piccolo team: foto, video, post e report, senza fornitori esterni." },
          { q: "Quali strumenti sostituisce?", a: "Canva, editor video, PowerPoint, designer, social media manager e ore di ricerca manuale. Un assistente solo al posto di tanti strumenti, con meno costi e meno tempo per ogni immobile." },
          { q: "Devo saper montare video o usare la grafica?", a: "No. Scegli un template (avatar parlante, schermo diviso, walkthrough, before/after, montaggio automatico, timelapse AI) e l'AI genera il video con musica e sottotitoli. I post escono già col tuo logo." },
          { q: "I dati di zona sono una valutazione?", a: "No. I prezzi medi al m² e i dati di zona sono informazioni di mercato a scopo informativo, utili per raccontare l'immobile e preparare la trattativa. Non sostituiscono una perizia ufficiale." },
          { q: "Posso disdire quando voglio?", a: "Sì. Con il piano mensile disdici quando vuoi dalla dashboard, senza vincoli. Il piano annuale è fatturato in anticipo e ha il prezzo più basso al mese." },
        ],
      },
      finalCta: {
        title1: "Smetti di saltare tra dieci programmi.",
        title2: "Prepara i tuoi annunci con un assistente solo.",
        desc: "Foto, video, post e report professionali per ogni immobile, in pochi minuti. Provalo gratis, senza carta.",
        button: "Prova gratis",
        buttonDemo: "Prenota una demo",
        footer: "🔒 Pagamento sicuro Stripe. Provi gratis, disdici quando vuoi.",
      },
      roiCalculator: {
        title: "Quanto risparmi con",
        titleHighlight: "GetNearMe?",
        subtitle: "Calcola quanto tempo e quanti soldi ti fa risparmiare.",
        inputProperties: "Immobili che gestisci al mese",
        inputHours: "Ore per preparare i materiali di un immobile",
        inputRate: "Quanto vale un'ora del tuo lavoro",
        outputHoursSaved: "Ore risparmiate al mese",
        outputValueRecovered: "Valore del tempo recuperato",
        outputCost: "Costo di GetNearMe",
        outputNetSavings: "Risparmio netto mensile",
        outputROI: "ritorno per ogni euro speso",
        perMonth: "/mese",
        cta: "Scegli questo piano",
        note: "Con GetNearMe ogni immobile richiede circa 3 minuti invece di ore. Usiamo 80% come stima conservativa del tempo risparmiato.",
      },
      demo: {
        pageTitle: "Prenota una demo",
        pageSubtitle: "Compila il modulo e ti ricontattiamo per organizzare una demo personalizzata di GetNearMe.",
        fieldName: "Nome e cognome",
        fieldEmail: "Email",
        fieldAgencyName: "Agenzia o team (opzionale)",
        fieldPhone: "Telefono (opzionale)",
        fieldMessage: "Messaggio (opzionale)",
        submit: "Prenota demo",
        submitting: "Invio in corso...",
        successTitle: "Richiesta inviata!",
        successMessage: "Ti contatteremo al più presto per organizzare la demo.",
        errorMessage: "Si è verificato un errore. Riprova più tardi.",
        backToHome: "Torna alla home",
      },
      modal: {
        emoji: "rocket",
        title: "Ottima scelta.",
        planLabel: "Piano",
        desc: "Accedi o registrati per attivare il",
        descBold: "piano scelto",
        descEnd: "con accesso completo a tutte le funzioni.",
        cta: "Attiva il piano",
        footer: "🔒 Pagamento sicuro Stripe. Cancelli con un click.",
      },
      popups: [
        { icon: "circle", text: "Un agente ha appena attivato il piano", time: "3 min fa" },
        { icon: "clapperboard", text: "Un agente ha generato un video promozionale con l'AI", time: "" },
        { icon: "users", text: "Agenti al lavoro su GetNearMe in questo momento", time: "" },
        { icon: "rocket", text: "Un agente ha appena iniziato la prova gratuita", time: "12 min fa" },
        { icon: "flame", text: "Sempre più agenti scelgono GetNearMe", time: "" },
        { icon: "sparkles", text: "Un agente ha arredato una stanza con l'home staging AI", time: "5 min fa" },
        { icon: "star", text: "Un agente è passato al piano annuale", time: "18 min fa" },
        { icon: "smartphone", text: "Post social creati con GetNearMe", time: "" },
        { icon: "target", text: "Un agente ha esportato un report PDF col proprio logo", time: "7 min fa" },
        { icon: "briefcase", text: "Un agente si è appena registrato su GetNearMe", time: "2 min fa" },
        { icon: "trophy", text: "GetNearMe usato da agenti immobiliari in tutta Italia", time: "" },
        { icon: "map", text: "Un agente ha generato l'analisi di zona di un immobile", time: "9 min fa" },
      ],
    },
  },
  en: {
    nav: {
      features: "Features",
      examples: "Examples",
      pricing: "Pricing",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutorial",
      startAnalysis: "Try it free",
      backToHome: "← Back to home",
      dashboard: "Dashboard",
      myAccount: "My account"
    },
    hero: {
      title1: "The AI assistant for real estate agents.",
      title2: "Save more than a day and a half every week",
      title3: "",
      description: "Home staging, videos, social posts and reports for every property, ready in minutes. Everything that used to take you hours, done from one place.",
      cta: "Try it free",
      ctaSecondary: "How it works",
      subMockup: "GetNearMe is the AI assistant for real estate agents: start from the listing or your own photos and get home staging, videos, social posts, branded reports and area analysis. All in one place, with nothing new to learn."
    },
    features: {
      title: "Everything you can",
      titleItalic: "do with GetNearMe",
      description: "One assistant instead of Canva, a video editor, a designer and hours of work. Analyse the property, enhance the photos and prepare reports and content in minutes.",
      card1: {
        title: "Full property analysis",
        desc: "You get an immediate, clear overview of the property's key data, without hunting for information scattered across dozens of pages."
      },
      card2: {
        title: "Interactive area analysis",
        desc: "Show your client what it actually means to live in that area: amenities, transport and real distances, on a map and in real time."
      },
      card3: {
        title: "Average area price per m²",
        desc: "The average €/m² price for the area, so you can go into negotiations with the numbers at hand."
      },
      card4: {
        title: "Comparative reports with your brand",
        desc: "Present multiple properties in a tidy document with your logo, ready to send to the client."
      },
      card5: {
        title: "AI home staging",
        desc: "Edit photos with AI and show the before/after comparison: empty or furnished rooms, improved lighting and enhanced spaces in seconds."
      },
      disclaimer: "Area data is market information for illustrative purposes and does not constitute a property valuation or appraisal.",
      addExtension: "Try it free",
      comingSoonTitle: "Coming soon",
      comingSoonDesc: "We are developing new features to make your work even faster and more professional.",
    },
    faq: {
      title: "Frequently asked",
      titleItalic: "questions",
      items: [
        {
          q: "What is GetNearMe?",
          a: "It is the AI assistant that prepares all the material for your listings: home staging, videos, social posts, reports and area analysis. Start from the portal link or your own photos and in minutes everything is ready, with your brand."
        },
        {
          q: "Do I need to install anything?",
          a: "No. GetNearMe is online: open it in your browser and start working. Nothing to download, no software to learn."
        },
        {
          q: "How do I try it?",
          a: "Free and without a card. Create your account and try the features straight away: see the output before you decide."
        },
        {
          q: "Does it work if I work alone?",
          a: "Yes, it is designed precisely for the individual agent. You do the work of a small team on your own: photos, videos, posts and reports, with no external suppliers."
        },
        {
          q: "Do I need to know how to edit videos or use design software?",
          a: "No. Choose a template and the AI does the rest: video with music and subtitles, post with your logo, reports already laid out."
        },
        {
          q: "Is the area data a valuation?",
          a: "No. It is market information for illustrative purposes, useful for presenting the property and preparing negotiations. It does not replace an official appraisal."
        }
      ]
    },
    pricing: {
      title: "One price",
      titleItalic: "for everything",
      description: "A single plan with every feature: home staging, videos, social posts, reports and area analysis. Try it free before you pay.",
      free: "Free",
      buyNow: "Buy now",
      registerNow: "Sign up now",
      mostChosen: "Most popular",
      footer1: "Secure payment by card, PayPal and major providers.",
      footer2: "Try it free, no card required. Cancel anytime.",
      footer3: "",
      plans: [
        {
          name: "Free",
          subtitle: "To get started",
          desc: "Try GetNearMe free with no card: create your account and use the features right away with the included trial credits."
        },
        {
          name: "Monthly Plan",
          subtitle: "All features included",
          desc: "Full access to GetNearMe for the individual agent: AI home staging, videos, social posts, branded reports and area analysis. A tool to support your work, not a property valuation system."
        },
        {
          name: "Annual Plan",
          subtitle: "Best value",
          desc: "All the features of the monthly plan with two months free and priority support."
        }
      ]
    },
    cta: {
      title: "Present yourself like a large agency",
      title2: "even when you work",
      titleItalic: "alone",
      desc: "Prepare professional photos, videos, posts and reports for every property, in minutes.",
      button: "Try it free",
      requestInfo: "Request information",
    },
    howItWorks: {
      step1Title: "Create your free account",
      step1Desc: "Sign up in seconds. No card required.",
      step2Title: "Start from the listing",
      step2Desc: "Paste the portal link or upload your own photos and property details.",
      step3Title: "Publish in minutes",
      step3Desc: "Photos, videos, posts and reports ready, with your brand. All from one place.",
      cta: "Try it free",
      videoTitle: "GetNearMe: how it works",
    },
    footer: {
      desc: "The AI assistant for real estate agents. Everything that used to cost you hours — photos, videos, posts and presentations — with GetNearMe you do it in minutes, starting from the listing.",
      product: "Product",
      legal: "Legal",
      privacy: "Privacy Policy",
      cookie: "Cookie Policy",
      terms: "Terms of Service",
      dataDeletion: "Data Deletion",
      rights: "All rights reserved."
    },
    privacy: {
      update: "Last update: 01/23/2026",
      intro: "This Privacy Policy describes the methods of processing personal data of users who use the getnearme.it website and the GetNearMe browser extension (hereinafter, the \"Service\").",
      sections: [
        {
          t: "1. Data Controller",
          c: "The data controller is a natural person, identified as GetNearMe. For any request relating to the processing of personal data, please contact: info@getnearme.it"
        },
        {
          t: "2. Types of data processed",
          c: "During the use of the Service, the following categories of data may be processed: data provided voluntarily by the user (e.g. email address during registration); technical and navigation data (IP address, browser type, operating system, date and time of access); data relating to the use of the Service (analyzes performed, credits used, usage preferences). Sensitive personal data are not processed."
        },
        {
          t: "3. Authentication",
          c: "The extension uses Supabase for user authentication. When you create an account, we store: email address, unique user ID, registration date, and subscription status. This data is stored on Supabase servers (EU) and is necessary to manage credits and access to premium features."
        },
        {
          t: "4. Payments",
          c: "Payments are processed by Stripe. GetNearMe does NOT store credit card data. Stripe handles all payment information in compliance with PCI-DSS standards. We only store: Stripe customer ID (to link purchases to your account) and purchased credits history."
        },
        {
          t: "5. AI Image Generation",
          c: "The \"Virtual Staging\" feature uses Replicate API to generate images. When you use this feature: the selected image is sent to Replicate for processing; generated images are temporary and are not permanently stored; Replicate may retain logs for debugging purposes (see their privacy policy for details)."
        },
        {
          t: "6. Purpose of the processing",
          c: "Personal data are processed for the following purposes: to allow registration and management of the user account; provide the analysis and comparison features offered by the Service; manage the credit system and access to features; send service communications necessary for the operation of the Service; send informative communications only with the explicit consent of the user; improve the operation and security of the Service."
        },
        {
          t: "7. Legal basis of processing",
          c: "The data processing is based on: execution of a contract or pre-contractual measures; user consent, where required; legitimate interest of the controller in the correct functioning and improvement of the Service."
        },
        {
          t: "8. Processing methods",
          c: "The data processing is carried out by means of computer tools, adopting appropriate security measures to guarantee confidentiality, integrity and availability of information."
        },
        {
          t: "9. Data retention",
          c: "Local browsing data: deleted when the browser is closed. Analyzed property cache: stored locally until manual deletion. User account: retained until deletion request. To delete your account and all associated data, contact info@getnearme.it or use the \"Delete Account\" option in the extension settings."
        },
        {
          t: "10. Data sharing",
          c: "Data may be shared with technical and operational service providers (Supabase for authentication, Stripe for payments, Replicate for AI image processing), exclusively for purposes related to the provision of the Service."
        },
        {
          t: "11. User rights",
          c: "The user can exercise the rights provided by EU Regulation 2016/679 (GDPR), including access, rectification, cancellation and opposition, by writing to info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Last update: 12/22/2025",
      intro: "These Terms govern the use of the getnearme.it website and the GetNearMe browser extension.",
      sections: [
        {
          t: "1. Nature of the Service",
          c: "GetNearMe is a decision support tool that organizes and compares available data on real estate and neighborhoods. GetNearMe is not a real estate agency and does not provide professional, legal, tax or real estate advice."
        },
        {
          t: "2. Origin of the data",
          c: "The displayed information derives from third-party real estate listings and available public sources. GetNearMe has no control over the content of the listings and is not responsible for any errors, omissions or subsequent changes."
        },
        {
          t: "3. Analyzes and estimates",
          c: "The analyzes and estimates provided are purely indicative, based on average values and available data, and do not constitute an official real estate appraisal. Every decision taken by the user remains under his/her exclusive responsibility."
        },
        {
          t: "4. Account and credits",
          c: "Some features of the Service require the creation of an account. Credits: are associated with the user's account; have no expiration; are non-refundable."
        },
        {
          t: "5. Permitted use",
          c: "It is prohibited: to use the Service for illegal or unauthorized purposes; attempt to circumvent security systems or the credit system; perform massive scraping or unauthorized commercial use of content."
        },
        {
          t: "6. Service availability",
          c: "Some features may vary based on source availability, the site analyzed or the browser used. GetNearMe reserves the right to modify, suspend or interrupt the Service, in whole or in part, at any time."
        },
        {
          t: "7. Limitation of liability",
          c: "To the extent permitted by law, GetNearMe is not responsible for any damages resulting from the use or inability to use the Service."
        }
      ]
    },
    cookie: {
      update: "Last update: 12/22/2025",
      intro: "This Cookie Policy applies exclusively to the getnearme.it website.",
      sections: [
        {
          t: "1. What are cookies",
          c: "Cookies are small text files that the site sends to the user's device to improve the browsing experience and the correct functioning of the site."
        },
        {
          t: "2. Types of cookies used",
          c: "The site uses: technical cookies, necessary for the site to function and to manage user preferences; any third-party cookies linked to technical or payment services."
        },
        {
          t: "3. Cookie management",
          c: "The user can manage or disable cookies through their browser settings. Disabling technical cookies may compromise the correct functioning of the site."
        },
        {
          t: "4. Consent",
          c: "Technical cookies do not require user consent. For any non-technical cookies, consent is requested via a specific banner."
        }
      ]
    },
    bonus: {
      creditsClaimed: "Credits Claimed!",
      dayCompleted: "Day {day} completed!",
      weekComplete: "Fantastic! You completed the week! You get 120 bonus credits!",
      comeBackTomorrow: "Come back tomorrow for day {day}.",
      goToHome: "Go to GetNearMe",
      backToHome: "Back to Home",
      error: {
        defaultTitle: "Error",
        defaultMessage: "An error occurred.",
        alreadyClaimedTitle: "Bonus Already Claimed",
        alreadyClaimedMessage: "You have already claimed today's bonus. Come back tomorrow!",
        expiredTitle: "Token Expired",
        expiredMessage: "This link is no longer valid. Check today's email.",
        invalidTokenTitle: "Invalid Token",
        invalidTokenMessage: "The link you used is invalid.",
        missingTokenTitle: "Missing Token",
        missingTokenMessage: "No token provided.",
        serverErrorTitle: "Server Error",
        serverErrorMessage: "An error occurred. Try again later."
      },
      loading: "Loading..."
    },
    confirm: {
      subtitle: "Welcome to GetNearMe",
      description: "Your subscription has been successfully confirmed. Return to the extension and start using all GetNearMe features!",
      cta: "Start exploring"
    },
    unsubscribe: {
      subtitle: "Unsubscribe complete",
      description: "You have been successfully removed from our mailing list. You will no longer receive emails from GetNearMe."
    },
    featuresPage: {
      title: "All the Features",
      titleItalic: "of GetNearMe",
      subtitle: "Discover all the tools designed to change the way you work as a real estate agent. From area analysis to artificial intelligence, every feature gives you a concrete advantage.",
      feature6: {
        title: "Automated Property Marketing",
        desc: "Turn property data into professional posts, already optimised for the major social networks.",
        badge: "NEW",
      },
      feature7: {
        title: "Property Videos in a Few Clicks",
        desc: "Create professional video content in just a few clicks to promote every property in a modern and immediate way.",
        badge: "NEW",
      },
      ctaTitle: "Ready to get started?",
      ctaDesc: "Join the real estate agents already changing the way they work with GetNearMe.",
      ctaButton: "Try it free",
      ctaContact: "Contact us",
    },
    landing: {
      topBar: {
        promo: "Launch offer:",
        discount: "Limited launch price",
        expiresIn: "expires in",
        freeTrialShort: "",
      },
      hero: {
        badge: "",
        title1: "The AI assistant for real estate agents.",
        title2: "Save more than a day and a half every week.",
        desc: "Home staging, videos, social posts and reports for every property, ready in minutes. Everything that used to take you hours, done from one place.",
        ctaPrimary: "Try it free",
        ctaSecondary: "See how it works",
        ctaDemo: "Book a demo",
        stats: ["No card required", "Ready in minutes", "Your listings, with your brand"],
      },
      problem: {
        emoji: "frown",
        title: "For a single listing you open ten different programmes.",
        desc: "Photos to fix, videos to edit, social posts to create, a PDF to send the client. Tools that cost money, don't talk to each other and steal hours every week. And meanwhile another agent gets there first.",
      },
      solution: {
        emoji: "rocket",
        title: "One assistant. All the work on the listing, done.",
        desc: "Start from the listing — paste the portal link or upload your photos — and GetNearMe gives you back home staging, videos, social posts and a branded report. In minutes, without opening another programme or learning anything new.",
      },
      features: {
        title: "Six professional tools.",
        titleHighlight: "One assistant.",
        subtitle: "GetNearMe does the work of Canva, a video editor, a designer, a social media manager and PowerPoint. And you don't need to learn anything new.",
        items: [
          { num: "01", title: "AI home staging", desc: "Furnish, empty or transform a room in seconds. Show the before/after to the client or publish it straight to portals and social media.", icon: "sparkles", color: "#6366f1" },
          { num: "02", title: "AI property video", desc: "Reels, walkthroughs, before/after, videos with a talking avatar and much more. Ready in a few clicks, no editing and no videographer.", icon: "clapperboard", color: "#10b981" },
          { num: "03", title: "Posts, reels and social stories", desc: "Content ready for Instagram, Facebook, TikTok and LinkedIn from the listing data. Your logo and colours applied automatically.", icon: "smartphone", color: "#ec4899" },
          { num: "04", title: "Branded PDF report", desc: "Compare multiple properties in a tidy document with your logo, colours and font. Ready to send to the client after the viewing.", icon: "file-text", color: "#f97316" },
          { num: "05", title: "Interactive area analysis", desc: "Amenities, transport, schools, healthcare, parks and real distances shown on a map. Tell the client about the neighbourhood with concrete data, without opening twenty tabs.", icon: "map", color: "#0ea5e9" },
          { num: "06", title: "Average area price per m²", desc: "The average €/m² price in the area and a comparison with similar properties, so you go into negotiations with the numbers at hand. Market data for illustrative purposes, not an appraisal.", icon: "trending-up", color: "#f59e0b" },
        ],
      },
      testimonials: {
        title: "Fewer tools, better results.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Marco R.", role: "Real estate agent", text: "I tried the AI videos for a three-bedroom flat that had been sitting for two months. I posted it on Instagram and within a week I had three viewing requests. Honestly, I didn't expect that.", avatar: "MR", color: "#f59e0b", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
          { name: "Giulia T.", role: "Real estate agent", text: "I send the report after the viewing so the client can compare properties at their own pace. With the AI photos I show them the same room furnished three different ways — they make up their mind much faster.", avatar: "GT", color: "#6366f1", photo: "https://randomuser.me/api/portraits/women/65.jpg" },
          { name: "Davide M.", role: "Real estate agent", text: "I upload the photos, pick a style and in a minute the reel is ready. Before I had to call a videographer and wait days — now I do it while I'm waiting for a client in the office.", avatar: "DM", color: "#10b981", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
        ],
      },
      pricing: {
        title1: "One price.",
        title2: "Pays for itself with the",
        titleHighlight: "first property",
        subtitle: "Try it free. Then one single subscription instead of Canva, a video editor, a designer and hours of work: it costs less than the sum of the parts.",
        countdownLabel: "Launch price, expires in",
        trustBadges: ["🔒 Secure payment with Stripe", "⚡ Instant activation"],
        savingsLabel: "YOU SAVE",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "free", name: "Free", users: "To get started", oldPrice: null, price: 0, period: "",
            savingsYear: null, badge: null, popular: false,
            features: ["Try all the features", "Trial credits included", "No card required"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Start free",
          },
          {
            id: "agency_monthly", name: "Monthly", users: "All features included", oldPrice: 150, price: 59, period: "/month",
            savingsYear: null, badge: null, popular: false,
            features: ["Everything in Free", "Reports with your logo", "AI home staging", "AI property videos", "Social posts and stories", "Real-time €/m² price", "Email support"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Choose this plan",
          },
          {
            id: "agency_annual", name: "Annual", users: "All features included", oldPrice: 1800, price: 590, period: "/year",
            savingsYear: null, badge: "Most popular", popular: true,
            features: ["Everything in Monthly", "2 months free vs monthly", "Price locked for 12 months", "Priority support"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Choose this plan",
          },
        ],
      },
      howItWorks: {
        title: "Up and running in",
        titleHighlight: "2 minutes",
        subtitle: "Nothing to install, nothing to learn. Create your account, start from the listing and everything is ready.",
        steps: [
          { step: "1", title: "Create your free account", desc: "Sign up in seconds, directly in the browser. No card required.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Start from the listing", desc: "Paste the portal link or upload your own photos and property details.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Publish in minutes", desc: "Home staging, videos, social posts and reports ready, with your brand. All from one place.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Questions?",
        titleHighlight: "Answers.",
        items: [
          { q: "What is GetNearMe?", a: "It is the AI assistant that prepares all the material for your listings: home staging, videos, social posts, reports and area analysis. Start from the portal link or your own photos and in minutes everything is ready, with your brand." },
          { q: "Do I need to install anything?", a: "No. GetNearMe is online: open it in your browser and start working. Nothing to download, no software to learn." },
          { q: "How do I try it?", a: "Free and without a card. Create your account and try the features straight away: see the output before you decide to subscribe." },
          { q: "Does it work if I work alone?", a: "Yes, it is designed precisely for the individual agent. You do the work of a small team on your own: photos, videos, posts and reports, with no external suppliers." },
          { q: "Which tools does it replace?", a: "Canva, a video editor, PowerPoint, a designer, a social media manager and hours of manual research. One assistant instead of many tools, with lower costs and less time spent per property." },
          { q: "Do I need to know how to edit videos or use design software?", a: "No. Choose a template (talking avatar, split screen, walkthrough, before/after, automatic editing, AI timelapse) and the AI generates the video with music and subtitles. Posts come out with your logo already applied." },
          { q: "Is the area data a valuation?", a: "No. Average €/m² prices and area data are market information for illustrative purposes, useful for presenting the property and preparing negotiations. They do not replace an official appraisal." },
          { q: "Can I cancel anytime?", a: "Yes. With the monthly plan you can cancel anytime from the dashboard, with no strings attached. The annual plan is billed upfront and has the lowest monthly price." },
        ],
      },
      finalCta: {
        title1: "Stop jumping between ten programmes.",
        title2: "Prepare your listings with one assistant.",
        desc: "Professional photos, videos, posts and reports for every property, in minutes. Try it free, no card required.",
        button: "Try it free",
        buttonDemo: "Book a demo",
        footer: "🔒 Secure payment with Stripe. Try it free, cancel anytime.",
      },
      roiCalculator: {
        title: "How much do you save with",
        titleHighlight: "GetNearMe?",
        subtitle: "Calculate how much time and money you save.",
        inputProperties: "Properties you manage per month",
        inputHours: "Hours to prepare materials per property",
        inputRate: "What one hour of your time is worth",
        outputHoursSaved: "Hours saved per month",
        outputValueRecovered: "Value of time recovered",
        outputCost: "Cost of GetNearMe",
        outputNetSavings: "Net monthly savings",
        outputROI: "return for every euro spent",
        perMonth: "/month",
        cta: "Choose this plan",
        note: "With GetNearMe each property takes about 3 minutes instead of hours. We use 80% as a conservative estimate of time saved.",
      },
      demo: {
        pageTitle: "Book a demo",
        pageSubtitle: "Fill out the form and we'll get back to you to arrange a personalised GetNearMe demo.",
        fieldName: "Full name",
        fieldEmail: "Email",
        fieldAgencyName: "Agency or team (optional)",
        fieldPhone: "Phone (optional)",
        fieldMessage: "Message (optional)",
        submit: "Book demo",
        submitting: "Sending...",
        successTitle: "Request sent!",
        successMessage: "We'll contact you shortly to arrange the demo.",
        errorMessage: "An error occurred. Please try again later.",
        backToHome: "Back to home",
      },
      modal: {
        emoji: "rocket",
        title: "Great choice.",
        planLabel: "Plan",
        desc: "Sign in or register to activate the",
        descBold: "selected plan",
        descEnd: "with full access to all features.",
        cta: "Activate plan",
        footer: "🔒 Secure payment with Stripe. Cancel with one click.",
      },
      popups: [
        { icon: "circle", text: "An agent just activated the plan", time: "3 min ago" },
        { icon: "clapperboard", text: "An agent generated a promotional video with AI", time: "" },
        { icon: "users", text: "Agents working on GetNearMe right now", time: "" },
        { icon: "rocket", text: "An agent just started the free trial", time: "12 min ago" },
        { icon: "flame", text: "More and more agents are choosing GetNearMe", time: "" },
        { icon: "sparkles", text: "An agent furnished a room with AI home staging", time: "5 min ago" },
        { icon: "star", text: "An agent switched to the annual plan", time: "18 min ago" },
        { icon: "smartphone", text: "Social posts created with GetNearMe", time: "" },
        { icon: "target", text: "An agent exported a branded PDF report", time: "7 min ago" },
        { icon: "briefcase", text: "An agent just signed up on GetNearMe", time: "2 min ago" },
        { icon: "trophy", text: "GetNearMe used by real estate agents all across Italy", time: "" },
        { icon: "map", text: "An agent generated area analysis for a property", time: "9 min ago" },
      ],
    },
  },
  es: {
    nav: {
      features: "Funcionalidades",
      examples: "Ejemplos",
      pricing: "Precios",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutorial",
      startAnalysis: "Pruébalo gratis",
      backToHome: "← Volver al inicio",
      dashboard: "Dashboard",
      myAccount: "Mi cuenta"
    },
    hero: {
      title1: "El asistente de IA para agentes inmobiliarios.",
      title2: "Ahorra más de un día y medio a la semana",
      title3: "",
      description: "Home staging, vídeos, posts sociales e informes para cada inmueble, listos en pocos minutos. Lo que hoy te lleva horas, lo haces desde un solo lugar.",
      cta: "Pruébalo gratis",
      ctaSecondary: "Cómo funciona",
      subMockup: "GetNearMe es el asistente de IA para agentes inmobiliarios: parte del anuncio o de tus fotos y obtén home staging, vídeos, posts sociales, informes con tu marca y análisis de zona. Todo en un solo lugar, sin aprender nada nuevo."
    },
    features: {
      title: "Todo lo que puedes",
      titleItalic: "hacer con GetNearMe",
      description: "Un asistente en lugar de Canva, editor de vídeo, diseñador y horas de trabajo. Analizas el inmueble, valorizas las fotos y preparas informes y contenidos en pocos minutos.",
      card1: {
        title: "Análisis completo del inmueble",
        desc: "Tienes al instante una visión clara y ordenada de los datos clave del inmueble, sin buscar información repartida entre mil páginas."
      },
      card2: {
        title: "Análisis de zona interactivo",
        desc: "Le muestras al cliente qué significa vivir en esa zona: servicios, transportes y distancias reales, en mapa y en tiempo real."
      },
      card3: {
        title: "Precio medio de zona por m²",
        desc: "El precio medio €/m² de la zona, para preparar la negociación con los números a mano."
      },
      card4: {
        title: "Informes comparativos con tu marca",
        desc: "Presentas varios inmuebles en un documento ordenado con tu logo, listo para enviar al cliente."
      },
      card5: {
        title: "Home staging con IA",
        desc: "Editas las fotos con IA y muestras la comparación antes/después: habitaciones vacías o amuebladas, luz mejorada y espacios valorizados en pocos segundos."
      },
      disclaimer: "Los datos de zona son información de mercado a título orientativo y no constituyen una valoración ni tasación inmobiliaria.",
      addExtension: "Pruébalo gratis",
      comingSoonTitle: "Próximamente",
      comingSoonDesc: "Estamos desarrollando nuevas funciones para que tu trabajo sea aún más rápido y profesional.",
    },
    faq: {
      title: "Preguntas",
      titleItalic: "frecuentes",
      items: [
        {
          q: "¿Qué es GetNearMe?",
          a: "Es el asistente de IA que prepara todo el material de tus anuncios: home staging, vídeos, posts sociales, informes y análisis de zona. Parte del enlace del portal o de tus fotos y en pocos minutos tienes todo listo, con tu marca."
        },
        {
          q: "¿Tengo que instalar algo?",
          a: "No. GetNearMe es online: accedes desde el navegador y empiezas a trabajar. Nada que descargar, ningún software que aprender."
        },
        {
          q: "¿Cómo lo pruebo?",
          a: "Gratis y sin tarjeta. Creas la cuenta y pruebas las funciones enseguida: ves el resultado antes de decidir."
        },
        {
          q: "¿Funciona si trabajo solo?",
          a: "Sí, está pensado precisamente para el agente individual. Haces tú solo el trabajo de un pequeño equipo: fotos, vídeos, posts e informes, sin proveedores externos."
        },
        {
          q: "¿Necesito saber montar vídeos o usar programas de diseño?",
          a: "No. Eliges una plantilla y la IA hace el resto: vídeo con música y subtítulos, posts con tu logo, informes ya maquetados."
        },
        {
          q: "¿Los datos de zona son una valoración?",
          a: "No. Son información de mercado a título orientativo, útiles para presentar el inmueble y preparar la negociación. No sustituyen una tasación oficial."
        }
      ]
    },
    pricing: {
      title: "Un solo precio",
      titleItalic: "para todo",
      description: "Un único plan con todas las funciones: home staging, vídeos, posts sociales, informes y análisis de zona. Prueba gratis antes de pagar.",
      free: "Gratis",
      buyNow: "Comprar ahora",
      registerNow: "Regístrate ahora",
      mostChosen: "Más elegido",
      footer1: "Pago seguro con tarjeta, PayPal y los principales proveedores.",
      footer2: "Prueba gratis, sin tarjeta. Cancela cuando quieras.",
      footer3: "",
      plans: [
        {
          name: "Gratis",
          subtitle: "Para empezar",
          desc: "Prueba GetNearMe gratis y sin tarjeta: creas la cuenta y usas enseguida las funciones con los créditos de prueba incluidos."
        },
        {
          name: "Plan Mensual",
          subtitle: "Todas las funciones incluidas",
          desc: "Acceso completo a GetNearMe para el agente individual: home staging AI, vídeos, posts sociales, informes con tu marca y análisis de zona. Una herramienta de apoyo a tu trabajo, no un sistema de valoración inmobiliaria."
        },
        {
          name: "Plan Anual",
          subtitle: "El más conveniente",
          desc: "Todas las funciones del plan mensual con dos meses gratis y soporte prioritario."
        }
      ]
    },
    cta: {
      title: "Preséntate como una gran agencia",
      title2: "aunque trabajes",
      titleItalic: "solo",
      desc: "Prepara fotos, vídeos, posts e informes profesionales para cada inmueble, en pocos minutos.",
      button: "Pruébalo gratis",
      requestInfo: "Solicitar información",
    },
    howItWorks: {
      step1Title: "Crea tu cuenta gratis",
      step1Desc: "Te registras en pocos segundos. Sin tarjeta requerida.",
      step2Title: "Parte del anuncio",
      step2Desc: "Pegas el enlace del portal o subes tus fotos y los datos del inmueble.",
      step3Title: "Publica en pocos minutos",
      step3Desc: "Fotos, vídeos, posts e informes listos, con tu marca. Todo desde un solo lugar.",
      cta: "Pruébalo gratis",
      videoTitle: "GetNearMe: cómo funciona",
    },
    footer: {
      desc: "El asistente de IA para agentes inmobiliarios. Lo que hoy te cuesta horas — fotos, vídeos, posts y presentaciones — con GetNearMe lo haces en pocos minutos, partiendo del anuncio.",
      product: "Producto",
      legal: "Legal",
      privacy: "Política de Privacidad",
      cookie: "Política de Cookies",
      terms: "Términos de Servicio",
      dataDeletion: "Eliminación de Datos",
      rights: "Todos los derechos reservados."
    },
    privacy: {
      update: "Última actualización: 23/01/2026",
      intro: "Esta Política de Privacidad describe las modalidades de tratamiento de los datos personales de los usuarios que utilizan el sitio web getnearme.it y la extensión de navegador GetNearMe (en adelante, el \"Servicio\").",
      sections: [
        {
          t: "1. Responsable del tratamiento",
          c: "El responsable del tratamiento es una persona física, identificada como GetNearMe. Para cualquier solicitud relacionada con el tratamiento de datos personales es posible contactar con: info@getnearme.it"
        },
        {
          t: "2. Tipos de datos tratados",
          c: "Durante el uso del Servicio pueden tratarse las siguientes categorías de datos: datos facilitados voluntariamente por el usuario (por ejemplo, dirección de correo electrónico durante el registro); datos técnicos y de navegación (dirección IP, tipo de navegador, sistema operativo, fecha y hora de acceso); datos relativos al uso del Servicio (análisis realizados, créditos utilizados, preferencias de uso). No se tratan datos personales sensibles."
        },
        {
          t: "3. Autenticación",
          c: "La extensión utiliza Supabase para la autenticación de usuarios. Cuando creas una cuenta, almacenamos: dirección de correo electrónico, ID de usuario único, fecha de registro y estado de la suscripción. Estos datos se almacenan en servidores de Supabase (UE) y son necesarios para gestionar los créditos y el acceso a las funcionalidades premium."
        },
        {
          t: "4. Pagos",
          c: "Los pagos son procesados por Stripe. GetNearMe NO almacena datos de tarjetas de crédito. Stripe gestiona toda la información de pago de conformidad con los estándares PCI-DSS. Solo almacenamos: ID de cliente de Stripe (para vincular compras a tu cuenta) e historial de créditos comprados."
        },
        {
          t: "5. Generación de Imágenes con IA",
          c: "La función \"Virtual Staging\" utiliza Replicate API para generar imágenes. Cuando usas esta función: la imagen seleccionada se envía a Replicate para su procesamiento; las imágenes generadas son temporales y no se almacenan permanentemente; Replicate puede conservar registros para fines de depuración (consulta su política de privacidad para más detalles)."
        },
        {
          t: "6. Finalidad del tratamiento",
          c: "Los datos personales se tratan con las siguientes finalidades: permitir el registro y la gestión de la cuenta de usuario; proporcionar las funcionalidades de análisis y comparación que ofrece el Servicio; gestionar el sistema de créditos y el acceso a las funcionalidades; enviar comunicaciones de servicio necesarias para el funcionamiento del Servicio; enviar comunicaciones informativas solo previo consentimiento explícito del usuario; mejorar el funcionamiento y la seguridad del Servicio."
        },
        {
          t: "7. Base jurídica del tratamiento",
          c: "El tratamiento de los datos se basa en: ejecución de un contrato o de medidas precontractuales; consentimiento del usuario, cuando sea requerido; interés legítimo del responsable en el correcto funcionamiento y mejora del Servicio."
        },
        {
          t: "8. Modalidades de tratamiento",
          c: "El tratamiento de los datos se realiza mediante herramientas informáticas, adoptando las medidas de seguridad adecuadas para garantizar la confidencialidad, integridad y disponibilidad de la información."
        },
        {
          t: "9. Conservación de los datos",
          c: "Datos de navegación local: se eliminan al cerrar el navegador. Caché de inmuebles analizados: se conserva localmente hasta su eliminación manual. Cuenta de usuario: se conserva hasta solicitud de eliminación. Para eliminar tu cuenta y todos los datos asociados, contacta con info@getnearme.it o usa la opción \"Eliminar cuenta\" en la configuración de la extensión."
        },
        {
          t: "10. Intercambio de datos",
          c: "Los datos pueden compartirse con proveedores de servicios técnicos y operativos (Supabase para autenticación, Stripe para pagos, Replicate para procesamiento de imágenes con IA), exclusivamente para finalidades relacionadas con la prestación del Servicio."
        },
        {
          t: "11. Derechos del usuario",
          c: "El usuario puede ejercer los derechos previstos por el Reglamento UE 2016/679 (RGPD), incluidos el acceso, rectificación, cancelación y oposición, escribiendo a info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Última actualización: 22/12/2025",
      intro: "Estos Términos regulan el uso del sitio web getnearme.it y la extensión de navegador GetNearMe.",
      sections: [
        {
          t: "1. Naturaleza del Servicio",
          c: "GetNearMe es una herramienta de soporte a la decisión que organiza y compara datos disponibles sobre inmuebles y barrios. GetNearMe no es una agencia inmobiliaria y no proporciona asesoramiento profesional, legal, fiscal o inmobiliario."
        },
        {
          t: "2. Origen de los datos",
          c: "La información mostrada deriva de anuncios inmobiliarios de terceros y de fuentes públicas disponibles. GetNearMe no tiene control sobre el contenido de los anuncios y no es responsable de errores, omisiones o cambios posteriores."
        },
        {
          t: "3. Análisis y estimaciones",
          c: "Los análisis y estimaciones proporcionados son puramente indicativos, basados en valores medios y datos disponibles, y no constituyen una tasación inmobiliaria oficial. Toda decisión tomada por el usuario queda bajo su exclusiva responsabilidad."
        },
        {
          t: "4. Cuenta y créditos",
          c: "Algunas funcionalidades del Servicio requieren la creación de una cuenta. Los créditos: están asociados a la cuenta del usuario; no tienen caducidad; no son reembolsables."
        },
        {
          t: "5. Uso permitido",
          c: "Está prohibido: utilizar el Servicio con fines ilícitos o no autorizados; intentar eludir los sistemas de seguridad o el sistema de créditos; realizar scraping masivo o uso comercial no autorizado de los contenidos."
        },
        {
          t: "6. Disponibilidad del Servicio",
          c: "Algunas funcionalidades pueden variar según la disponibilidad de las fuentes, el sitio analizado o el navegador utilizado. GetNearMe se reserva el derecho de modificar, suspender o interrumpir el Servicio, en todo o en parte, en cualquier momento."
        },
        {
          t: "7. Limitación de responsabilidad",
          c: "En la medida permitida por la ley, GetNearMe no es responsable de los daños derivados del uso o de la imposibilidad de uso del Servicio."
        }
      ]
    },
    cookie: {
      update: "Última actualización: 22/12/2025",
      intro: "Esta Política de Cookies se aplica exclusivamente al sitio web getnearme.it.",
      sections: [
        {
          t: "1. ¿Qué son las cookies?",
          c: "Las cookies son pequeños archivos de texto que el sitio envía al dispositivo del usuario para mejorar la experiencia de navegación y el correcto funcionamiento del sitio."
        },
        {
          t: "2. Tipos de cookies utilizadas",
          c: "El sitio utiliza: cookies técnicas, necesarias para el funcionamiento del sitio y para la gestión de las preferencias del usuario; posibles cookies de terceros vinculadas a servicios técnicos o de pago."
        },
        {
          t: "3. Gestión de cookies",
          c: "El usuario puede gestionar o desactivar las cookies a través de la configuración de su navegador. Desactivar las cookies técnicas puede comprometer el correcto funcionamiento del sitio."
        },
        {
          t: "4. Consentimiento",
          c: "Las cookies técnicas no requieren el consentimiento del usuario. Para cualquier cookie no técnica, se solicita el consentimiento a través de un banner específico."
        }
      ]
    },
    bonus: {
      creditsClaimed: "¡Créditos Reclamados!",
      dayCompleted: "¡Día {day} completado!",
      weekComplete: "¡Genial! ¡Has completado la semana! ¡Recibes 120 créditos extra!",
      comeBackTomorrow: "Vuelve mañana para el día {day}.",
      goToHome: "Ir a GetNearMe",
      backToHome: "Volver al Inicio",
      error: {
        defaultTitle: "Error",
        defaultMessage: "Se ha producido un error.",
        alreadyClaimedTitle: "Bono Ya Reclamado",
        alreadyClaimedMessage: "Ya has reclamado el bono de hoy. ¡Vuelve mañana!",
        expiredTitle: "Token Caducado",
        expiredMessage: "Este enlace ya no es válido. Revisa el correo de hoy.",
        invalidTokenTitle: "Token Inválido",
        invalidTokenMessage: "El enlace que has utilizado no es válido.",
        missingTokenTitle: "Token Faltante",
        missingTokenMessage: "No se ha proporcionado ningún token.",
        serverErrorTitle: "Error del Servidor",
        serverErrorMessage: "Se ha producido un error. Inténtalo de nuevo más tarde."
      },
      loading: "Cargando..."
    },
    confirm: {
      subtitle: "Bienvenido a GetNearMe",
      description: "Tu suscripcion al servicio ha sido confirmada con exito. Vuelve a la extension y empieza a utilizar todas las funcionalidades de GetNearMe!",
      cta: "Empieza a explorar"
    },
    unsubscribe: {
      subtitle: "Baja completada",
      description: "Has sido eliminado con exito de nuestra lista de correo. Ya no recibiras emails de GetNearMe."
    },
    featuresPage: {
      title: "Todas las Funcionalidades",
      titleItalic: "de GetNearMe",
      subtitle: "Descubre todas las herramientas pensadas para transformar tu trabajo como agente inmobiliario. Desde el análisis de zona hasta la inteligencia artificial, cada función te da una ventaja concreta.",
      feature6: {
        title: "Marketing Inmobiliario Automático",
        desc: "Transforma los datos del inmueble en publicaciones profesionales, ya optimizadas para las principales redes sociales.",
        badge: "NUEVO",
      },
      feature7: {
        title: "Vídeos Inmobiliarios en pocos clics",
        desc: "Crea en pocos clics contenidos de vídeo profesionales para promocionar cada inmueble de forma moderna e inmediata.",
        badge: "NUEVO",
      },
      ctaTitle: "¿Listo para empezar?",
      ctaDesc: "Únete a los agentes inmobiliarios que ya están cambiando su forma de trabajar con GetNearMe.",
      ctaButton: "Pruébalo gratis",
      ctaContact: "Contáctanos",
    },
    landing: {
      topBar: {
        promo: "Oferta de lanzamiento:",
        discount: "Precio de lanzamiento limitado",
        expiresIn: "expira en",
        freeTrialShort: "",
      },
      hero: {
        badge: "",
        title1: "El asistente de IA para agentes inmobiliarios.",
        title2: "Ahorra más de un día y medio a la semana.",
        desc: "Home staging, vídeos, posts sociales e informes para cada inmueble, listos en pocos minutos. Lo que hoy te lleva horas, lo haces desde un solo lugar.",
        ctaPrimary: "Pruébalo gratis",
        ctaSecondary: "Mira cómo funciona",
        ctaDemo: "Reserva una demo",
        stats: ["Sin tarjeta requerida", "Listo en pocos minutos", "Tus anuncios, con tu marca"],
      },
      problem: {
        emoji: "frown",
        title: "Para un solo anuncio abres diez programas distintos.",
        desc: "Fotos que arreglar, vídeos que montar, posts para las redes, el PDF que enviar al cliente. Herramientas que cuestan, no se hablan entre sí y te roban horas cada semana. Y mientras tanto otro agente llega antes que tú.",
      },
      solution: {
        emoji: "rocket",
        title: "Un solo asistente. Todo el trabajo sobre el anuncio, terminado.",
        desc: "Partes del anuncio — pegas el enlace del portal o subes tus fotos — y GetNearMe te devuelve home staging, vídeos, posts sociales e informes con tu logo. En pocos minutos, sin abrir otros programas y sin aprender nada nuevo.",
      },
      features: {
        title: "Seis herramientas profesionales.",
        titleHighlight: "Un solo asistente.",
        subtitle: "GetNearMe hace el trabajo de Canva, editor de vídeo, diseñador, social media manager y PowerPoint. Y no tienes que aprender nada nuevo.",
        items: [
          { num: "01", title: "Home staging AI", desc: "Amuebla, vacía o transforma una habitación en pocos segundos. Muestras el antes/después al cliente o lo publicas directamente en los portales y en las redes.", icon: "sparkles", color: "#6366f1" },
          { num: "02", title: "Vídeo AI para el inmueble", desc: "Reels, walkthrough, before/after, vídeo con avatar que habla y mucho más. Listos en pocos clics, sin montaje y sin videomaker.", icon: "clapperboard", color: "#10b981" },
          { num: "03", title: "Posts, reels e historias sociales", desc: "Contenidos listos para Instagram, Facebook, TikTok y LinkedIn a partir de los datos del anuncio. Tu logo y tus colores aplicados solos.", icon: "smartphone", color: "#ec4899" },
          { num: "04", title: "Informe PDF con tu marca", desc: "Comparas varios inmuebles en un documento ordenado con tu logo, colores y tipografía. Listo para enviar al cliente después de la visita.", icon: "file-text", color: "#f97316" },
          { num: "05", title: "Análisis de zona interactivo", desc: "Servicios, transportes, colegios, sanidad, parques y distancias reales mostrados en mapa. Le cuentas el barrio al cliente con datos concretos, sin abrir veinte pestañas.", icon: "map", color: "#0ea5e9" },
          { num: "06", title: "Precio medio de zona por m²", desc: "El precio medio €/m² de la zona y la comparativa entre inmuebles similares, para preparar la negociación con los números a mano. Datos de mercado a título orientativo, no una tasación.", icon: "trending-up", color: "#f59e0b" },
        ],
      },
      testimonials: {
        title: "Menos herramientas, más resultados.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Marco R.", role: "Agente inmobiliario", text: "Probé los vídeos AI para un piso que llevaba dos meses parado. Lo puse en Instagram y en una semana recibí tres solicitudes de visita. Sinceramente no me lo esperaba.", avatar: "MR", color: "#f59e0b", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
          { name: "Giulia T.", role: "Agente inmobiliario", text: "El informe lo mando después de la visita, así el cliente compara las casas con calma. Con las fotos AI le muestro la misma habitación amueblada de tres formas distintas: se convence mucho antes.", avatar: "GT", color: "#6366f1", photo: "https://randomuser.me/api/portraits/women/65.jpg" },
          { name: "Davide M.", role: "Agente inmobiliario", text: "Subo las fotos, elijo el estilo y en un minuto tengo el reel listo. Antes tenía que llamar al videomaker y esperar días; ahora lo hago mientras espero al cliente en la oficina.", avatar: "DM", color: "#10b981", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
        ],
      },
      pricing: {
        title1: "Un solo precio.",
        title2: "Se amortiza con el",
        titleHighlight: "primer inmueble",
        subtitle: "Pruébalo gratis. Luego un solo plan en lugar de Canva, editor de vídeo, diseñador y horas de trabajo: cuesta menos que la suma de todo.",
        countdownLabel: "Precio de lanzamiento, expira en",
        trustBadges: ["🔒 Pago seguro con Stripe", "⚡ Activación inmediata"],
        savingsLabel: "AHORRAS",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "free", name: "Free", users: "Para empezar", oldPrice: null, price: 0, period: "",
            savingsYear: null, badge: null, popular: false,
            features: ["Prueba todas las funciones", "Créditos de prueba incluidos", "Sin tarjeta requerida"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Empieza gratis",
          },
          {
            id: "agency_monthly", name: "Mensual", users: "Todas las funciones incluidas", oldPrice: 150, price: 59, period: "/mes",
            savingsYear: null, badge: null, popular: false,
            features: ["Todo del plan Gratis", "Informes con tu logo", "Home staging AI", "Vídeos AI para inmuebles", "Posts e historias sociales", "Precio al m² en tiempo real", "Soporte por email"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Elige este plan",
          },
          {
            id: "agency_annual", name: "Anual", users: "Todas las funciones incluidas", oldPrice: 1800, price: 590, period: "/año",
            savingsYear: null, badge: "Más elegido", popular: true,
            features: ["Todo del plan Mensual", "2 meses gratis respecto al mensual", "Precio fijo durante 12 meses", "Soporte prioritario"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Elige este plan",
          },
        ],
      },
      howItWorks: {
        title: "Operativo en",
        titleHighlight: "2 minutos",
        subtitle: "Nada que instalar, nada que aprender. Creas la cuenta, partes del anuncio y tienes todo listo.",
        steps: [
          { step: "1", title: "Crea tu cuenta gratis", desc: "Te registras en pocos segundos, directamente desde el navegador. Sin tarjeta requerida.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Parte del anuncio", desc: "Pegas el enlace del portal o subes tus fotos y los datos del inmueble.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Publica en pocos minutos", desc: "Home staging, vídeos, posts sociales e informes listos, con tu marca. Todo desde un solo lugar.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "¿Preguntas?",
        titleHighlight: "Respuestas.",
        items: [
          { q: "¿Qué es GetNearMe?", a: "Es el asistente de IA que prepara todo el material de tus anuncios: home staging, vídeos, posts sociales, informes y análisis de zona. Parte del enlace del portal o de tus fotos y en pocos minutos tienes todo listo, con tu marca." },
          { q: "¿Tengo que instalar algo?", a: "No. GetNearMe es online: accedes desde el navegador y empiezas a trabajar. Nada que descargar, ningún software que aprender." },
          { q: "¿Cómo lo pruebo?", a: "Gratis y sin tarjeta. Creas la cuenta y pruebas las funciones enseguida: ves el resultado antes de decidir si suscribirte." },
          { q: "¿Funciona si trabajo solo?", a: "Sí, está pensado precisamente para el agente individual. Haces tú solo el trabajo de un pequeño equipo: fotos, vídeos, posts e informes, sin proveedores externos." },
          { q: "¿Qué herramientas sustituye?", a: "Canva, editor de vídeo, PowerPoint, diseñador, social media manager y horas de búsqueda manual. Un solo asistente en lugar de muchas herramientas, con menos costes y menos tiempo por inmueble." },
          { q: "¿Necesito saber montar vídeos o usar diseño gráfico?", a: "No. Eliges una plantilla (avatar parlante, pantalla dividida, walkthrough, before/after, montaje automático, timelapse AI) y la IA genera el vídeo con música y subtítulos. Los posts salen ya con tu logo." },
          { q: "¿Los datos de zona son una valoración?", a: "No. Los precios medios al m² y los datos de zona son información de mercado a título orientativo, útiles para presentar el inmueble y preparar la negociación. No sustituyen una tasación oficial." },
          { q: "¿Puedo cancelar cuando quiera?", a: "Sí. Con el plan mensual cancelas cuando quieras desde la dashboard, sin compromisos. El plan anual se factura por adelantado y tiene el precio más bajo por mes." },
        ],
      },
      finalCta: {
        title1: "Deja de saltar entre diez programas.",
        title2: "Prepara tus anuncios con un solo asistente.",
        desc: "Fotos, vídeos, posts e informes profesionales para cada inmueble, en pocos minutos. Pruébalo gratis, sin tarjeta.",
        button: "Pruébalo gratis",
        buttonDemo: "Reserva una demo",
        footer: "🔒 Pago seguro con Stripe. Prueba gratis, cancela cuando quieras.",
      },
      roiCalculator: {
        title: "¿Cuánto ahorras con",
        titleHighlight: "GetNearMe?",
        subtitle: "Calcula cuánto tiempo y dinero te hace ahorrar.",
        inputProperties: "Inmuebles que gestionas al mes",
        inputHours: "Horas para preparar los materiales de un inmueble",
        inputRate: "Cuánto vale una hora de tu trabajo",
        outputHoursSaved: "Horas ahorradas al mes",
        outputValueRecovered: "Valor del tiempo recuperado",
        outputCost: "Coste de GetNearMe",
        outputNetSavings: "Ahorro neto mensual",
        outputROI: "retorno por cada euro invertido",
        perMonth: "/mes",
        cta: "Elige este plan",
        note: "Con GetNearMe cada inmueble requiere unos 3 minutos en lugar de horas. Usamos el 80% como estimación conservadora del tiempo ahorrado.",
      },
      demo: {
        pageTitle: "Reserva una demo",
        pageSubtitle: "Rellena el formulario y te contactamos para organizar una demo personalizada de GetNearMe.",
        fieldName: "Nombre y apellidos",
        fieldEmail: "Email",
        fieldAgencyName: "Agencia o equipo (opcional)",
        fieldPhone: "Teléfono (opcional)",
        fieldMessage: "Mensaje (opcional)",
        submit: "Reservar demo",
        submitting: "Enviando...",
        successTitle: "¡Solicitud enviada!",
        successMessage: "Te contactaremos lo antes posible para organizar la demo.",
        errorMessage: "Se ha producido un error. Inténtalo de nuevo más tarde.",
        backToHome: "Volver al inicio",
      },
      modal: {
        emoji: "rocket",
        title: "Buena elección.",
        planLabel: "Plan",
        desc: "Accede o regístrate para activar el",
        descBold: "plan elegido",
        descEnd: "con acceso completo a todas las funciones.",
        cta: "Activar el plan",
        footer: "🔒 Pago seguro con Stripe. Cancela con un clic.",
      },
      popups: [
        { icon: "circle", text: "Un agente acaba de activar el plan", time: "hace 3 min" },
        { icon: "clapperboard", text: "Un agente ha generado un vídeo promocional con IA", time: "" },
        { icon: "users", text: "Agentes trabajando en GetNearMe en este momento", time: "" },
        { icon: "rocket", text: "Un agente acaba de empezar la prueba gratuita", time: "hace 12 min" },
        { icon: "flame", text: "Cada vez más agentes eligen GetNearMe", time: "" },
        { icon: "sparkles", text: "Un agente ha amueblado una habitación con el home staging AI", time: "hace 5 min" },
        { icon: "star", text: "Un agente ha pasado al plan anual", time: "hace 18 min" },
        { icon: "smartphone", text: "Posts sociales creados con GetNearMe", time: "" },
        { icon: "target", text: "Un agente ha exportado un informe PDF con su logo", time: "hace 7 min" },
        { icon: "briefcase", text: "Un agente acaba de registrarse en GetNearMe", time: "hace 2 min" },
        { icon: "trophy", text: "GetNearMe usado por agentes inmobiliarios en toda Italia", time: "" },
        { icon: "map", text: "Un agente ha generado el análisis de zona de un inmueble", time: "hace 9 min" },
      ],
    },
  },
  fr: {
    nav: {
      features: "Fonctionnalités",
      examples: "Exemples",
      pricing: "Tarifs",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutoriel",
      startAnalysis: "Essaie gratuitement",
      backToHome: "← Retour à l'accueil",
      dashboard: "Tableau de bord",
      myAccount: "Mon compte"
    },
    hero: {
      title1: "L'assistant AI pour les agents immobiliers.",
      title2: "Gagne plus d'une journée et demie par semaine",
      title3: "",
      description: "Home staging, vidéos, posts sociaux et rapports pour chaque bien, prêts en quelques minutes. Ce qui te prend des heures aujourd'hui, tu le fais depuis un seul endroit.",
      cta: "Essaie gratuitement",
      ctaSecondary: "Comment ça marche",
      subMockup: "GetNearMe est l'assistant AI pour les agents immobiliers : pars de l'annonce ou de tes photos et obtiens home staging, vidéos, posts sociaux, rapports avec ton logo et analyse de zone. Tout au même endroit, sans rien apprendre de nouveau."
    },
    features: {
      title: "Tout ce que tu peux",
      titleItalic: "faire avec GetNearMe",
      description: "Un assistant à la place de Canva, éditeur vidéo, designer et des heures de travail. Tu analyses le bien, tu valorises les photos et tu prépares rapports et contenus en quelques minutes.",
      card1: {
        title: "Analyse complète du bien",
        desc: "Tu as immédiatement une vision claire et organisée des données clés du bien, sans chercher des informations éparpillées sur mille pages."
      },
      card2: {
        title: "Analyse de zone interactive",
        desc: "Tu montres au client ce que signifie vivre dans ce quartier : services, transports et distances réelles, sur carte et en temps réel."
      },
      card3: {
        title: "Prix moyen de zone au m²",
        desc: "Le prix moyen €/m² de la zone, pour préparer la négociation avec les chiffres en main."
      },
      card4: {
        title: "Rapports comparatifs avec ton logo",
        desc: "Tu présentes plusieurs biens dans un document organisé avec ton logo, prêt à envoyer au client."
      },
      card5: {
        title: "Home staging avec l'AI",
        desc: "Tu modifies les photos avec l'AI et tu montres la comparaison avant/après : pièces vides ou meublées, lumière améliorée et espaces valorisés en quelques secondes."
      },
      disclaimer: "Les données de zone sont des informations de marché à titre indicatif et ne constituent pas une évaluation ou une expertise immobilière.",
      addExtension: "Essaie gratuitement",
      comingSoonTitle: "Bientôt disponible",
      comingSoonDesc: "Nous développons de nouvelles fonctions pour rendre ton travail encore plus rapide et professionnel.",
    },
    faq: {
      title: "Questions",
      titleItalic: "fréquentes",
      items: [
        {
          q: "Qu'est-ce que GetNearMe ?",
          a: "C'est l'assistant AI qui prépare tous les supports de tes annonces : home staging, vidéos, posts sociaux, rapports et analyse de zone. Pars du lien du portail ou de tes photos et en quelques minutes tu as tout prêt, avec ton logo."
        },
        {
          q: "Dois-je installer quelque chose ?",
          a: "Non. GetNearMe est en ligne : tu accèdes depuis le navigateur et tu commences à travailler. Rien à télécharger, aucun logiciel à apprendre."
        },
        {
          q: "Comment l'essayer ?",
          a: "Gratuitement et sans carte. Tu crées le compte et tu essaies aussitôt les fonctions : tu vois le résultat avant de décider."
        },
        {
          q: "Ça marche si je travaille seul ?",
          a: "Oui, c'est conçu justement pour l'agent individuel. Tu fais seul le travail d'une petite équipe : photos, vidéos, posts et rapports, sans prestataires externes."
        },
        {
          q: "Dois-je savoir monter des vidéos ou utiliser des logiciels de graphisme ?",
          a: "Non. Tu choisis un modèle et l'AI fait le reste : vidéo avec musique et sous-titres, post avec ton logo, rapports déjà mis en page."
        },
        {
          q: "Les données de zone sont-elles une évaluation ?",
          a: "Non. Ce sont des informations de marché à titre indicatif, utiles pour présenter le bien et préparer la négociation. Elles ne remplacent pas une expertise officielle."
        }
      ]
    },
    pricing: {
      title: "Un seul prix",
      titleItalic: "pour tout",
      description: "Un seul plan avec toutes les fonctions : home staging, vidéos, posts sociaux, rapports et analyse de zone. Tu essaies gratuitement avant de payer.",
      free: "Gratuit",
      buyNow: "Acheter maintenant",
      registerNow: "S'inscrire maintenant",
      mostChosen: "Le plus choisi",
      footer1: "Paiement sécurisé par carte, PayPal et principaux prestataires.",
      footer2: "Tu essaies gratuitement, sans carte. Annule quand tu veux.",
      footer3: "",
      plans: [
        {
          name: "Gratuit",
          subtitle: "Pour commencer",
          desc: "Tu essaies GetNearMe gratuitement et sans carte : tu crées le compte et tu utilises aussitôt les fonctions avec les crédits d'essai inclus."
        },
        {
          name: "Plan Mensuel",
          subtitle: "Toutes les fonctions incluses",
          desc: "Accès complet à GetNearMe pour l'agent individuel : home staging AI, vidéos, posts sociaux, rapports avec ton logo et analyse de zone. Un outil de support à ton travail, pas un système d'évaluation immobilière."
        },
        {
          name: "Plan Annuel",
          subtitle: "Le plus avantageux",
          desc: "Toutes les fonctions du plan mensuel avec deux mois offerts et support prioritaire."
        }
      ]
    },
    cta: {
      title: "Présente-toi comme une grande agence",
      title2: "même si tu travailles",
      titleItalic: "seul",
      desc: "Prépare photos, vidéos, posts et rapports professionnels pour chaque bien, en quelques minutes.",
      button: "Essaie gratuitement",
      requestInfo: "Demander des informations",
    },
    howItWorks: {
      step1Title: "Crée ton compte gratuitement",
      step1Desc: "Tu t'inscris en quelques secondes. Aucune carte requise.",
      step2Title: "Pars de l'annonce",
      step2Desc: "Tu colles le lien du portail ou tu charges tes photos et les données du bien.",
      step3Title: "Publie en quelques minutes",
      step3Desc: "Photos, vidéos, posts et rapports prêts, avec ton logo. Tout depuis un seul endroit.",
      cta: "Essaie gratuitement",
      videoTitle: "GetNearMe : comment ça marche",
    },
    footer: {
      desc: "L'assistant AI pour les agents immobiliers. Ce qui te coûte des heures aujourd'hui — photos, vidéos, posts et présentations — avec GetNearMe tu le fais en quelques minutes, en partant de l'annonce.",
      product: "Produit",
      legal: "Légal",
      privacy: "Politique de Confidentialité",
      cookie: "Politique relative aux Cookies",
      terms: "Conditions d'Utilisation",
      dataDeletion: "Suppression des Données",
      rights: "Tous droits réservés."
    },
    privacy: {
      update: "Dernière mise à jour : 23/01/2026",
      intro: "La présente Politique de Confidentialité décrit les modalités de traitement des données personnelles des utilisateurs qui utilisent le site web getnearme.it et l'extension de navigateur GetNearMe (ci-après, le « Service »).",
      sections: [
        {
          t: "1. Responsable du traitement",
          c: "Le responsable du traitement est une personne physique, identifiée comme GetNearMe. Pour toute demande relative au traitement des données personnelles, il est possible de contacter : info@getnearme.it"
        },
        {
          t: "2. Types de données traitées",
          c: "Au cours de l'utilisation du Service, les catégories de données suivantes peuvent être traitées : données fournies volontairement par l'utilisateur (par exemple, adresse e-mail lors de l'inscription) ; données techniques et de navigation (adresse IP, type de navigateur, système d'exploitation, date et heure d'accès) ; données relatives à l'utilisation du Service (analyses effectuées, crédits utilisés, préférences d'utilisation). Les données personnelles sensibles ne sont pas traitées."
        },
        {
          t: "3. Authentification",
          c: "L'extension utilise Supabase pour l'authentification des utilisateurs. Lorsque vous créez un compte, nous stockons : adresse e-mail, identifiant utilisateur unique, date d'inscription et statut de l'abonnement. Ces données sont conservées sur les serveurs Supabase (UE) et sont nécessaires pour gérer les crédits et l'accès aux fonctionnalités premium."
        },
        {
          t: "4. Paiements",
          c: "Les paiements sont traités par Stripe. GetNearMe ne stocke PAS les données de cartes de crédit. Stripe gère toutes les informations de paiement conformément aux normes PCI-DSS. Nous ne conservons que : l'identifiant client Stripe (pour lier les achats à votre compte) et l'historique des crédits achetés."
        },
        {
          t: "5. Génération d'Images IA",
          c: "La fonctionnalité « Virtual Staging » utilise l'API Replicate pour générer des images. Lorsque vous utilisez cette fonction : l'image sélectionnée est envoyée à Replicate pour traitement ; les images générées sont temporaires et ne sont pas conservées de manière permanente ; Replicate peut conserver des journaux à des fins de débogage (consultez leur politique de confidentialité pour plus de détails)."
        },
        {
          t: "6. Finalités du traitement",
          c: "Les données personnelles sont traitées pour les finalités suivantes : permettre l'inscription et la gestion du compte utilisateur ; fournir les fonctionnalités d'analyse et de comparaison offertes par le Service ; gérer le système de crédits et l'accès aux fonctionnalités ; envoyer des communications de service nécessaires au fonctionnement du Service ; envoyer des communications informatives uniquement avec le consentement explicite de l'utilisateur ; améliorer le fonctionnement et la sécurité du Service."
        },
        {
          t: "7. Base juridique du traitement",
          c: "Le traitement des données est basé sur : l'exécution d'un contrat ou de mesures précontractuelles ; le consentement de l'utilisateur, le cas échéant ; l'intérêt légitime du responsable au bon fonctionnement et à l'amélioration du Service."
        },
        {
          t: "8. Modalités de traitement",
          c: "Le traitement des données est effectué au moyen d'outils informatiques, en adoptant des mesures de sécurité appropriées pour garantir la confidentialité, l'intégrité et la disponibilité des informations."
        },
        {
          t: "9. Conservation des données",
          c: "Données de navigation locales : supprimées à la fermeture du navigateur. Cache des biens analysés : conservé localement jusqu'à suppression manuelle. Compte utilisateur : conservé jusqu'à demande de suppression. Pour supprimer votre compte et toutes les données associées, contactez info@getnearme.it ou utilisez l'option « Supprimer le compte » dans les paramètres de l'extension."
        },
        {
          t: "10. Partage des données",
          c: "Les données peuvent être partagées avec des prestataires de services techniques et opérationnels (Supabase pour l'authentification, Stripe pour les paiements, Replicate pour le traitement d'images IA), exclusivement pour des finalités liées à la fourniture du Service."
        },
        {
          t: "11. Droits de l'utilisateur",
          c: "L'utilisateur peut exercer les droits prévus par le Règlement UE 2016/679 (RGPD), y compris l'accès, la rectification, la suppression et l'opposition, en écrivant à info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Dernière mise à jour : 23/01/2026",
      intro: "Les présentes Conditions régissent l'utilisation du site web getnearme.it et de l'extension de navigateur GetNearMe.",
      sections: [
        {
          t: "1. Nature du Service",
          c: "GetNearMe est un outil d'aide à la décision qui organise et compare les données disponibles sur les biens immobiliers et les quartiers. GetNearMe n'est pas une agence immobilière et ne fournit pas de conseils professionnels, juridiques, fiscaux ou immobiliers."
        },
        {
          t: "2. Origine des données",
          c: "Les informations affichées proviennent d'annonces immobilières tierces et de sources publiques disponibles. GetNearMe n'a aucun contrôle sur le contenu des annonces et n'est pas responsable des erreurs, omissions ou modifications ultérieures."
        },
        {
          t: "3. Analyses et estimations",
          c: "Les analyses et estimations fournies sont purement indicatives, basées sur des valeurs moyennes et des données disponibles, et ne constituent pas une expertise immobilière officielle. Toute décision prise par l'utilisateur relève de sa seule responsabilité."
        },
        {
          t: "4. Compte et crédits",
          c: "Certaines fonctionnalités du Service nécessitent la création d'un compte. Les crédits : sont associés au compte de l'utilisateur ; n'ont pas de date d'expiration ; ne sont pas remboursables."
        },
        {
          t: "5. Utilisation autorisée",
          c: "Il est interdit : d'utiliser le Service à des fins illicites ou non autorisées ; de tenter de contourner les systèmes de sécurité ou le système de crédits ; d'effectuer un scraping massif ou une utilisation commerciale non autorisée des contenus."
        },
        {
          t: "6. Disponibilité du Service",
          c: "Certaines fonctionnalités peuvent varier selon la disponibilité des sources, le site analysé ou le navigateur utilisé. GetNearMe se réserve le droit de modifier, de suspendre ou d'interrompre le Service, en tout ou en partie, à tout moment."
        },
        {
          t: "7. Limitation de responsabilité",
          c: "Dans la mesure permise par la loi, GetNearMe n'est pas responsable des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le Service."
        }
      ]
    },
    cookie: {
      update: "Dernière mise à jour : 22/12/2025",
      intro: "La présente Politique relative aux Cookies s'applique exclusivement au site web getnearme.it.",
      sections: [
        {
          t: "1. Que sont les cookies ?",
          c: "Les cookies sont de petits fichiers texte que le site envoie à l'appareil de l'utilisateur pour améliorer l'expérience de navigation et le bon fonctionnement du site."
        },
        {
          t: "2. Types de cookies utilisés",
          c: "Le site utilise : des cookies techniques, nécessaires au fonctionnement du site et à la gestion des préférences de l'utilisateur ; d'éventuels cookies tiers liés à des services techniques ou de paiement."
        },
        {
          t: "3. Gestion des cookies",
          c: "L'utilisateur peut gérer ou désactiver les cookies via les paramètres de son navigateur. La désactivation des cookies techniques peut compromettre le bon fonctionnement du site."
        },
        {
          t: "4. Consentement",
          c: "Les cookies techniques ne nécessitent pas le consentement de l'utilisateur. Pour tout cookie non technique, le consentement est demandé via une bannière spécifique."
        }
      ]
    },
    bonus: {
      creditsClaimed: "Crédits Réclamés !",
      dayCompleted: "Jour {day} terminé !",
      weekComplete: "Fantastique ! Vous avez terminé la semaine ! Vous recevez 120 crédits bonus !",
      comeBackTomorrow: "Revenez demain pour le jour {day}.",
      goToHome: "Aller à GetNearMe",
      backToHome: "Retour à l'Accueil",
      error: {
        defaultTitle: "Erreur",
        defaultMessage: "Une erreur s'est produite.",
        alreadyClaimedTitle: "Bonus Déjà Réclamé",
        alreadyClaimedMessage: "Vous avez déjà réclamé le bonus d'aujourd'hui. Revenez demain !",
        expiredTitle: "Jeton Expiré",
        expiredMessage: "Ce lien n'est plus valide. Vérifiez l'e-mail d'aujourd'hui.",
        invalidTokenTitle: "Jeton Invalide",
        invalidTokenMessage: "Le lien que vous avez utilisé est invalide.",
        missingTokenTitle: "Jeton Manquant",
        missingTokenMessage: "Aucun jeton fourni.",
        serverErrorTitle: "Erreur Serveur",
        serverErrorMessage: "Une erreur s'est produite. Réessayez plus tard."
      },
      loading: "Chargement..."
    },
    confirm: {
      subtitle: "Bienvenue sur GetNearMe",
      description: "Votre inscription au service a ete confirmee avec succes. Retournez a l'extension et commencez a utiliser toutes les fonctionnalites de GetNearMe!",
      cta: "Commencer a explorer"
    },
    unsubscribe: {
      subtitle: "Desinscription terminee",
      description: "Vous avez ete supprime avec succes de notre liste de diffusion. Vous ne recevrez plus d'emails de GetNearMe."
    },
    featuresPage: {
      title: "Toutes les Fonctionnalités",
      titleItalic: "de GetNearMe",
      subtitle: "Découvre tous les outils conçus pour changer ton travail d'agent immobilier. De l'analyse de zone à l'intelligence artificielle, chaque fonction te donne un avantage concret.",
      feature6: {
        title: "Marketing Immobilier Automatique",
        desc: "Transforme les données du bien en posts professionnels, déjà optimisés pour les principaux réseaux sociaux.",
        badge: "NOUVEAU",
      },
      feature7: {
        title: "Vidéos Immobilières en quelques clics",
        desc: "Crée en quelques clics des contenus vidéo professionnels pour promouvoir chaque bien de manière moderne et immédiate.",
        badge: "NOUVEAU",
      },
      ctaTitle: "Prêt à commencer ?",
      ctaDesc: "Rejoins les agents immobiliers qui changent déjà leur façon de travailler avec GetNearMe.",
      ctaButton: "Essaie gratuitement",
      ctaContact: "Contacte-nous",
    },
    landing: {
      topBar: {
        promo: "Offre de lancement :",
        discount: "Prix de lancement limité",
        expiresIn: "expire dans",
        freeTrialShort: "",
      },
      hero: {
        badge: "",
        title1: "L'assistant AI pour les agents immobiliers.",
        title2: "Gagne plus d'une journée et demie par semaine.",
        desc: "Home staging, vidéos, posts sociaux et rapports pour chaque bien, prêts en quelques minutes. Ce qui te prend des heures aujourd'hui, tu le fais depuis un seul endroit.",
        ctaPrimary: "Essaie gratuitement",
        ctaSecondary: "Regarde comment ça marche",
        ctaDemo: "Réserve une démo",
        stats: ["Sans carte de crédit", "Prêt en quelques minutes", "Tes annonces, avec ton logo"],
      },
      problem: {
        emoji: "frown",
        title: "Pour une seule annonce, tu ouvres dix programmes différents.",
        desc: "Photos à retoucher, vidéos à monter, posts pour les réseaux sociaux, le PDF à envoyer au client. Des outils qui coûtent cher, ne communiquent pas entre eux et te volent des heures chaque semaine. Et pendant ce temps, un autre agent te devance.",
      },
      solution: {
        emoji: "rocket",
        title: "Un seul assistant. Tout le travail sur l'annonce, terminé.",
        desc: "Pars de l'annonce — tu colles le lien du portail ou tu charges tes photos — et GetNearMe te restitue home staging, vidéos, posts sociaux et rapports avec ton logo. En quelques minutes, sans ouvrir d'autres programmes et sans rien apprendre de nouveau.",
      },
      features: {
        title: "Six outils professionnels.",
        titleHighlight: "Un seul assistant.",
        subtitle: "GetNearMe fait le travail de Canva, éditeur vidéo, designer, social media manager et PowerPoint. Et tu n'as rien de nouveau à apprendre.",
        items: [
          { num: "01", title: "Home staging AI", desc: "Meuble, vide ou transforme une pièce en quelques secondes. Tu montres l'avant/après au client ou tu le publies directement sur les portails et les réseaux sociaux.", icon: "sparkles", color: "#6366f1" },
          { num: "02", title: "Vidéo AI pour le bien", desc: "Reels, walkthroughs, before/after, vidéos avec avatar parlant et bien plus. Prêts en quelques clics, sans montage et sans vidéaste.", icon: "clapperboard", color: "#10b981" },
          { num: "03", title: "Posts, reels et stories sociaux", desc: "Contenus prêts pour Instagram, Facebook, TikTok et LinkedIn à partir des données de l'annonce. Ton logo et tes couleurs appliqués automatiquement.", icon: "smartphone", color: "#ec4899" },
          { num: "04", title: "Rapport PDF avec ton logo", desc: "Tu compares plusieurs biens dans un document organisé avec ton logo, tes couleurs et ta police. Prêt à envoyer au client après la visite.", icon: "file-text", color: "#f97316" },
          { num: "05", title: "Analyse de zone interactive", desc: "Services, transports, écoles, santé, parcs et distances réelles affichés sur carte. Tu présentes le quartier au client avec des données concrètes, sans ouvrir vingt onglets.", icon: "map", color: "#0ea5e9" },
          { num: "06", title: "Prix moyen de zone au m²", desc: "Le prix moyen €/m² de la zone et la comparaison entre biens similaires, pour préparer la négociation avec les chiffres en main. Données de marché à titre indicatif, pas une expertise.", icon: "trending-up", color: "#f59e0b" },
        ],
      },
      testimonials: {
        title: "Moins d'outils, plus de résultats.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Marco R.", role: "Agent immobilier", text: "J'ai essayé les vidéos AI pour un trois-pièces qui stagnait depuis deux mois. Je l'ai mis sur Instagram et en une semaine j'ai reçu trois demandes de visite. Je ne m'y attendais pas, honnêtement.", avatar: "MR", color: "#f59e0b", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
          { name: "Giulia T.", role: "Agent immobilier", text: "J'envoie le rapport après la visite, comme ça le client compare les biens tranquillement. Avec les photos AI je lui montre la même pièce meublée de trois façons différentes : il se convainc bien plus vite.", avatar: "GT", color: "#6366f1", photo: "https://randomuser.me/api/portraits/women/65.jpg" },
          { name: "Davide M.", role: "Agent immobilier", text: "Je charge les photos, je choisis le style et en une minute le reel est prêt. Avant je devais appeler le vidéaste et attendre des jours, maintenant je le fais pendant que j'attends le client au bureau.", avatar: "DM", color: "#10b981", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
        ],
      },
      pricing: {
        title1: "Un seul prix.",
        title2: "Rentabilisé dès le",
        titleHighlight: "premier bien",
        subtitle: "Essaie gratuitement. Ensuite un seul abonnement à la place de Canva, éditeur vidéo, designer et des heures de travail : ça coûte moins que la somme.",
        countdownLabel: "Prix de lancement, expire dans",
        trustBadges: ["🔒 Paiement sécurisé Stripe", "⚡ Activation immédiate"],
        savingsLabel: "ÉCONOMIE",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "free", name: "Gratuit", users: "Pour commencer", oldPrice: null, price: 0, period: "",
            savingsYear: null, badge: null, popular: false,
            features: ["Tu essaies toutes les fonctions", "Crédits d'essai inclus", "Aucune carte requise"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Commence gratuitement",
          },
          {
            id: "agency_monthly", name: "Mensuel", users: "Toutes les fonctions incluses", oldPrice: 150, price: 59, period: "/mois",
            savingsYear: null, badge: null, popular: false,
            features: ["Tout du plan Gratuit", "Rapports avec ton logo", "Home staging AI", "Vidéos AI pour les biens", "Posts et stories sociaux", "Prix au m² en temps réel", "Support par e-mail"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Choisir ce plan",
          },
          {
            id: "agency_annual", name: "Annuel", users: "Toutes les fonctions incluses", oldPrice: 1800, price: 590, period: "/an",
            savingsYear: null, badge: "Le plus choisi", popular: true,
            features: ["Tout du plan Mensuel", "2 mois offerts par rapport au mensuel", "Prix bloqué 12 mois", "Support prioritaire"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Choisir ce plan",
          },
        ],
      },
      howItWorks: {
        title: "Opérationnel en",
        titleHighlight: "2 minutes",
        subtitle: "Rien à installer, rien à apprendre. Tu crées le compte, tu pars de l'annonce et tu as tout prêt.",
        steps: [
          { step: "1", title: "Crée ton compte gratuitement", desc: "Tu t'inscris en quelques secondes, directement depuis le navigateur. Aucune carte requise.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Pars de l'annonce", desc: "Tu colles le lien du portail ou tu charges tes photos et les données du bien.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Publie en quelques minutes", desc: "Home staging, vidéos, posts sociaux et rapports prêts, avec ton logo. Tout depuis un seul endroit.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Des questions ?",
        titleHighlight: "Des réponses.",
        items: [
          { q: "Qu'est-ce que GetNearMe ?", a: "C'est l'assistant AI qui prépare tous les supports de tes annonces : home staging, vidéos, posts sociaux, rapports et analyse de zone. Pars du lien du portail ou de tes photos et en quelques minutes tu as tout prêt, avec ton logo." },
          { q: "Dois-je installer quelque chose ?", a: "Non. GetNearMe est en ligne : tu accèdes depuis le navigateur et tu commences à travailler. Rien à télécharger, aucun logiciel à apprendre." },
          { q: "Comment l'essayer ?", a: "Gratuitement et sans carte. Tu crées le compte et tu essaies aussitôt les fonctions : tu vois le résultat avant de décider si tu t'abonnes." },
          { q: "Ça marche si je travaille seul ?", a: "Oui, c'est conçu justement pour l'agent individuel. Tu fais seul le travail d'une petite équipe : photos, vidéos, posts et rapports, sans prestataires externes." },
          { q: "Quels outils remplace-t-il ?", a: "Canva, éditeur vidéo, PowerPoint, designer, social media manager et des heures de recherche manuelle. Un seul assistant à la place de nombreux outils, avec moins de coûts et moins de temps par bien." },
          { q: "Dois-je savoir monter des vidéos ou utiliser la graphisme ?", a: "Non. Tu choisis un modèle (avatar parlant, écran partagé, walkthrough, before/after, montage automatique, timelapse AI) et l'AI génère la vidéo avec musique et sous-titres. Les posts sortent déjà avec ton logo." },
          { q: "Les données de zone sont-elles une évaluation ?", a: "Non. Les prix moyens au m² et les données de zone sont des informations de marché à titre indicatif, utiles pour présenter le bien et préparer la négociation. Elles ne remplacent pas une expertise officielle." },
          { q: "Puis-je annuler quand je veux ?", a: "Oui. Avec le plan mensuel tu annules quand tu veux depuis le tableau de bord, sans engagement. Le plan annuel est facturé à l'avance et offre le prix mensuel le plus bas." },
        ],
      },
      finalCta: {
        title1: "Arrête de jongler entre dix programmes.",
        title2: "Prépare tes annonces avec un seul assistant.",
        desc: "Photos, vidéos, posts et rapports professionnels pour chaque bien, en quelques minutes. Essaie gratuitement, sans carte.",
        button: "Essaie gratuitement",
        buttonDemo: "Réserve une démo",
        footer: "🔒 Paiement sécurisé Stripe. Tu essaies gratuitement, annule quand tu veux.",
      },
      roiCalculator: {
        title: "Combien tu gagnes avec",
        titleHighlight: "GetNearMe ?",
        subtitle: "Calcule combien de temps et d'argent tu économises.",
        inputProperties: "Biens que tu gères par mois",
        inputHours: "Heures pour préparer les supports d'un bien",
        inputRate: "Combien vaut une heure de ton travail",
        outputHoursSaved: "Heures économisées par mois",
        outputValueRecovered: "Valeur du temps récupéré",
        outputCost: "Coût de GetNearMe",
        outputNetSavings: "Économie nette mensuelle",
        outputROI: "de retour pour chaque euro dépensé",
        perMonth: "/mois",
        cta: "Choisir ce plan",
        note: "Avec GetNearMe chaque bien nécessite environ 3 minutes au lieu de plusieurs heures. On utilise 80 % comme estimation conservative du temps économisé.",
      },
      demo: {
        pageTitle: "Réserve une démo",
        pageSubtitle: "Remplis le formulaire et on te recontacte pour organiser une démo personnalisée de GetNearMe.",
        fieldName: "Prénom et nom",
        fieldEmail: "E-mail",
        fieldAgencyName: "Agence ou équipe (facultatif)",
        fieldPhone: "Téléphone (facultatif)",
        fieldMessage: "Message (facultatif)",
        submit: "Réserver la démo",
        submitting: "Envoi en cours...",
        successTitle: "Demande envoyée !",
        successMessage: "On te contactera dès que possible pour organiser la démo.",
        errorMessage: "Une erreur s'est produite. Réessaie plus tard.",
        backToHome: "Retour à l'accueil",
      },
      modal: {
        emoji: "rocket",
        title: "Excellent choix.",
        planLabel: "Plan",
        desc: "Connecte-toi ou inscris-toi pour activer le",
        descBold: "plan choisi",
        descEnd: "avec accès complet à toutes les fonctions.",
        cta: "Activer le plan",
        footer: "🔒 Paiement sécurisé Stripe. Annule en un clic.",
      },
      popups: [
        { icon: "circle", text: "Un agent vient d'activer le plan", time: "il y a 3 min" },
        { icon: "clapperboard", text: "Un agent a généré une vidéo promotionnelle avec l'AI", time: "" },
        { icon: "users", text: "Agents au travail sur GetNearMe en ce moment", time: "" },
        { icon: "rocket", text: "Un agent vient de commencer l'essai gratuit", time: "il y a 12 min" },
        { icon: "flame", text: "De plus en plus d'agents choisissent GetNearMe", time: "" },
        { icon: "sparkles", text: "Un agent a meublé une pièce avec le home staging AI", time: "il y a 5 min" },
        { icon: "star", text: "Un agent est passé au plan annuel", time: "il y a 18 min" },
        { icon: "smartphone", text: "Posts sociaux créés avec GetNearMe", time: "" },
        { icon: "target", text: "Un agent a exporté un rapport PDF avec son logo", time: "il y a 7 min" },
        { icon: "briefcase", text: "Un agent vient de s'inscrire sur GetNearMe", time: "il y a 2 min" },
        { icon: "trophy", text: "GetNearMe utilisé par des agents immobiliers dans toute l'Italie", time: "" },
        { icon: "map", text: "Un agent a généré l'analyse de zone d'un bien", time: "il y a 9 min" },
      ],
    },
  },
  ru: {
    nav: {
      features: "Возможности",
      examples: "Примеры",
      pricing: "Цены",
      faq: "FAQ",
      blog: "Блог",
      tutorial: "Обучение",
      startAnalysis: "Попробуй бесплатно",
      backToHome: "← Вернуться на главную",
      dashboard: "Панель управления",
      myAccount: "Мой аккаунт"
    },
    hero: {
      title1: "Ассистент на базе ИИ для агентов по недвижимости.",
      title2: "Экономь больше полутора дней в неделю",
      title3: "",
      description: "Home staging, видео, посты для соцсетей и отчёты по каждому объекту — готовы за несколько минут. То, что сейчас занимает часы, делаешь из одного места.",
      cta: "Попробуй бесплатно",
      ctaSecondary: "Как это работает",
      subMockup: "GetNearMe — это ИИ-ассистент для агентов по недвижимости: начинаешь с объявления или своих фото и получаешь home staging, видео, посты для соцсетей, отчёт с твоим брендом и анализ района. Всё в одном месте, без изучения новых инструментов."
    },
    features: {
      title: "Всё, что ты можешь",
      titleItalic: "сделать с GetNearMe",
      description: "Один ассистент вместо Canva, видеоредактора, дизайнера и часов работы. Анализируешь объект, улучшаешь фото и готовишь отчёты и контент за несколько минут.",
      card1: {
        title: "Полный анализ объекта",
        desc: "Сразу получаешь чёткую и структурированную картину ключевых данных по объекту — без поиска информации по сотням страниц."
      },
      card2: {
        title: "Интерактивный анализ района",
        desc: "Показываешь клиенту, каково жить в этом районе: сервисы, транспорт и реальные расстояния — на карте, в реальном времени."
      },
      card3: {
        title: "Средняя цена по району за м²",
        desc: "Средняя цена €/м² в районе — чтобы идти на переговоры с конкретными цифрами."
      },
      card4: {
        title: "Сравнительные отчёты с твоим брендом",
        desc: "Представляешь несколько объектов в аккуратном документе с твоим логотипом, готовом к отправке клиенту."
      },
      card5: {
        title: "Home staging с помощью ИИ",
        desc: "Редактируешь фото с ИИ и показываешь сравнение до/после: пустые или обставленные комнаты, улучшенный свет и преображённые пространства за секунды."
      },
      disclaimer: "Данные по районам — это рыночная информация в иллюстративных целях и не являются оценкой или профессиональной экспертизой недвижимости.",
      addExtension: "Попробуй бесплатно",
      comingSoonTitle: "Скоро",
      comingSoonDesc: "Мы разрабатываем новые функции, чтобы сделать твою работу ещё быстрее и профессиональнее.",
    },
    faq: {
      title: "Часто задаваемые",
      titleItalic: "вопросы",
      items: [
        {
          q: "Что такое GetNearMe?",
          a: "Это ИИ-ассистент, который готовит все материалы для твоих объявлений: home staging, видео, посты для соцсетей, отчёты и анализ района. Начинаешь со ссылки на портал или своих фото — и за несколько минут всё готово, с твоим брендом."
        },
        {
          q: "Нужно что-то устанавливать?",
          a: "Нет. GetNearMe работает онлайн: заходишь через браузер и сразу начинаешь работать. Ничего скачивать, никакого нового软件 учить не нужно."
        },
        {
          q: "Как попробовать?",
          a: "Бесплатно и без карты. Создаёшь аккаунт и сразу пробуешь функции: видишь результат до того, как решаешь."
        },
        {
          q: "Работает, если работаю один?",
          a: "Да, именно для такого агента и создано. Делаешь в одиночку работу небольшой команды: фото, видео, посты и отчёты — без внешних подрядчиков."
        },
        {
          q: "Нужно уметь монтировать видео или работать в графических редакторах?",
          a: "Нет. Выбираешь шаблон — ИИ делает остальное: видео с музыкой и субтитрами, посты с твоим логотипом, уже свёрстанные отчёты."
        },
        {
          q: "Данные по районам — это оценка?",
          a: "Нет. Это рыночная информация в иллюстративных целях, полезная для рассказа об объекте и подготовки к переговорам. Не заменяет официальную экспертизу."
        }
      ]
    },
    pricing: {
      title: "Одна цена",
      titleItalic: "за всё",
      description: "Один тариф со всеми функциями: home staging, видео, посты для соцсетей, отчёты и анализ района. Пробуешь бесплатно — потом платишь.",
      free: "Бесплатно",
      buyNow: "Купить сейчас",
      registerNow: "Зарегистрироваться",
      mostChosen: "Самый популярный",
      footer1: "Безопасная оплата картой, PayPal и другими способами.",
      footer2: "Пробуешь бесплатно, без карты. Отменяешь когда угодно.",
      footer3: "",
      plans: [
        {
          name: "Бесплатно",
          subtitle: "Чтобы начать",
          desc: "Попробуй GetNearMe бесплатно и без карты: создаёшь аккаунт и сразу используешь функции с включёнными пробными кредитами."
        },
        {
          name: "Месячный план",
          subtitle: "Все функции включены",
          desc: "Полный доступ к GetNearMe для одного агента: ИИ home staging, видео, посты для соцсетей, отчёты с твоим брендом и анализ района. Инструмент для поддержки твоей работы, не система оценки недвижимости."
        },
        {
          name: "Годовой план",
          subtitle: "Самый выгодный",
          desc: "Все функции месячного плана плюс два месяца бесплатно и приоритетная поддержка."
        }
      ]
    },
    cta: {
      title: "Выглядишь как крупное агентство",
      title2: "даже если работаешь",
      titleItalic: "один",
      desc: "Готовишь профессиональные фото, видео, посты и отчёты по каждому объекту за несколько минут.",
      button: "Попробуй бесплатно",
      requestInfo: "Запросить информацию",
    },
    howItWorks: {
      step1Title: "Создай аккаунт бесплатно",
      step1Desc: "Регистрируешься за несколько секунд. Карта не нужна.",
      step2Title: "Начни с объявления",
      step2Desc: "Вставляешь ссылку на портал или загружаешь свои фото и данные объекта.",
      step3Title: "Публикуй за несколько минут",
      step3Desc: "Фото, видео, посты и отчёты готовы, с твоим брендом. Всё из одного места.",
      cta: "Попробуй бесплатно",
      videoTitle: "GetNearMe: как это работает",
    },
    footer: {
      desc: "ИИ-ассистент для агентов по недвижимости. То, что сейчас занимает часы — фото, видео, посты и презентации — с GetNearMe делаешь за несколько минут, начиная с объявления.",
      product: "Продукт",
      legal: "Юридическая информация",
      privacy: "Политика конфиденциальности",
      cookie: "Политика cookie",
      terms: "Условия использования",
      dataDeletion: "Удаление данных",
      rights: "Все права защищены."
    },
    privacy: {
      update: "Последнее обновление: 23.01.2026",
      intro: "Настоящая Политика конфиденциальности описывает способы обработки персональных данных пользователей, которые используют веб-сайт getnearme.it и расширение браузера GetNearMe (далее — «Сервис»).",
      sections: [
        {
          t: "1. Оператор обработки данных",
          c: "Оператором обработки данных является физическое лицо, идентифицируемое как GetNearMe. По любым запросам, связанным с обработкой персональных данных, можно обращаться по адресу: info@getnearme.it"
        },
        {
          t: "2. Типы обрабатываемых данных",
          c: "В процессе использования Сервиса могут обрабатываться следующие категории данных: данные, предоставленные пользователем добровольно (например, адрес электронной почты при регистрации); технические и навигационные данные (IP-адрес, тип браузера, операционная система, дата и время доступа); данные, относящиеся к использованию Сервиса (выполненные анализы, использованные кредиты, предпочтения в использовании). Особые категории персональных данных не обрабатываются."
        },
        {
          t: "3. Аутентификация",
          c: "Расширение использует Supabase для аутентификации пользователей. При создании учетной записи мы сохраняем: адрес электронной почты, уникальный идентификатор пользователя, дату регистрации и статус подписки. Эти данные хранятся на серверах Supabase (ЕС) и необходимы для управления кредитами и доступом к премиум-функциям."
        },
        {
          t: "4. Платежи",
          c: "Платежи обрабатываются через Stripe. GetNearMe НЕ хранит данные кредитных карт. Stripe обрабатывает всю платежную информацию в соответствии со стандартами PCI-DSS. Мы храним только: идентификатор клиента Stripe (для привязки покупок к вашему аккаунту) и историю приобретенных кредитов."
        },
        {
          t: "5. Генерация изображений с помощью ИИ",
          c: "Функция «Virtual Staging» использует API Replicate для генерации изображений. При использовании этой функции: выбранное изображение отправляется в Replicate для обработки; сгенерированные изображения являются временными и не сохраняются постоянно; Replicate может хранить журналы для целей отладки (подробнее см. их политику конфиденциальности)."
        },
        {
          t: "6. Цели обработки",
          c: "Персональные данные обрабатываются в следующих целях: обеспечение регистрации и управления учетной записью пользователя; предоставление функций анализа и сравнения, предлагаемых Сервисом; управление системой кредитов и доступом к функциям; отправка сервисных сообщений, необходимых для работы Сервиса; отправка информационных сообщений только при наличии явного согласия пользователя; улучшение работы и безопасности Сервиса."
        },
        {
          t: "7. Правовая основа обработки",
          c: "Обработка данных основывается на: исполнении договора или преддоговорных мерах; согласии пользователя, где это требуется; законном интересе оператора в правильном функционировании и улучшении Сервиса."
        },
        {
          t: "8. Способы обработки",
          c: "Обработка данных осуществляется с использованием компьютерных средств с принятием соответствующих мер безопасности для обеспечения конфиденциальности, целостности и доступности информации."
        },
        {
          t: "9. Хранение данных",
          c: "Локальные данные навигации: удаляются при закрытии браузера. Кэш проанализированных объектов: хранится локально до ручного удаления. Учетная запись пользователя: сохраняется до запроса на удаление. Чтобы удалить свою учетную запись и все связанные данные, свяжитесь с info@getnearme.it или используйте опцию «Удалить аккаунт» в настройках расширения."
        },
        {
          t: "10. Обмен данными",
          c: "Данные могут передаваться поставщикам технических и операционных услуг (Supabase для аутентификации, Stripe для платежей, Replicate для обработки изображений с помощью ИИ) исключительно в целях, связанных с предоставлением Сервиса."
        },
        {
          t: "11. Права пользователя",
          c: "Пользователь может осуществлять права, предусмотренные Регламентом ЕС 2016/679 (GDPR), включая доступ, исправление, удаление и возражение, написав по адресу info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Последнее обновление: 23.01.2026",
      intro: "Настоящие Условия регулируют использование веб-сайта getnearme.it и расширения браузера GetNearMe.",
      sections: [
        {
          t: "1. Характер Сервиса",
          c: "GetNearMe — это инструмент поддержки принятия решений, который организует и сравнивает доступные данные о недвижимости и районах. GetNearMe не является агентством недвижимости и не предоставляет профессиональных, юридических, налоговых или риелторских консультаций."
        },
        {
          t: "2. Происхождение данных",
          c: "Отображаемая информация поступает из объявлений о недвижимости третьих лиц и доступных государственных источников. GetNearMe не контролирует содержание объявлений и не несет ответственности за ошибки, упущения или последующие изменения."
        },
        {
          t: "3. Анализы и оценки",
          c: "Предоставляемые анализы и оценки носят исключительно ознакомительный характер, основаны на средних значениях и доступных данных и не являются официальной оценкой недвижимости. Любое решение, принятое пользователем, остается под его исключительную ответственность."
        },
        {
          t: "4. Учетная запись и кредиты",
          c: "Для использования некоторых функций Сервиса требуется создание учетной записи. Кредиты: связаны с учетной записью пользователя; не имеют срока действия; не подлежат возврату."
        },
        {
          t: "5. Разрешенное использование",
          c: "Запрещается: использовать Сервис в незаконных или несанкционированных целях; пытаться обойти системы безопасности или систему кредитов; выполнять массовый парсинг или несанкционированное коммерческое использование контента."
        },
        {
          t: "6. Доступность Сервиса",
          c: "Некоторые функции могут варьироваться в зависимости от доступности источников, анализируемого сайта или используемого браузера. GetNearMe оставляет за собой право изменять, приостанавливать или прекращать работу Сервиса, полностью или частично, в любое время."
        },
        {
          t: "7. Ограничение ответственности",
          c: "В пределах, разрешенных законом, GetNearMe не несет ответственности за любой ущерб, возникший в результате использования или невозможности использования Сервиса."
        }
      ]
    },
    cookie: {
      update: "Последнее обновление: 22.12.2025",
      intro: "Настоящая Политика использования файлов cookie применяется исключительно к веб-сайту getnearme.it.",
      sections: [
        {
          t: "1. Что такое файлы cookie",
          c: "Файлы cookie — это небольшие текстовые файлы, которые сайт отправляет на устройство пользователя для улучшения опыта навигации и обеспечения правильной работы сайта."
        },
        {
          t: "2. Используемые типы файлов cookie",
          c: "Сайт использует: технические файлы cookie, необходимые для работы сайта и управления предпочтениями пользователя; возможные сторонние файлы cookie, связанные с техническими или платежными услугами."
        },
        {
          t: "3. Управление файлами cookie",
          c: "Пользователь может управлять файлами cookie или отключать их в настройках своего браузера. Отключение технических файлов cookie может нарушить правильную работу сайта."
        },
        {
          t: "4. Согласие",
          c: "Технические файлы cookie не требуют согласия пользователя. Для любых нетехнических файлов cookie согласие запрашивается через специальный баннер."
        }
      ]
    },
    bonus: {
      creditsClaimed: "Кредиты Получены!",
      dayCompleted: "День {day} завершен!",
      weekComplete: "Фантастика! Вы завершили неделю! Получите 120 бонусных кредитов!",
      comeBackTomorrow: "Возвращайтесь завтра на {day} день.",
      goToHome: "Перейти в GetNearMe",
      backToHome: "Вернуться на Главную",
      error: {
        defaultTitle: "Ошибка",
        defaultMessage: "Произошла ошибка.",
        alreadyClaimedTitle: "Бонус Уже Получен",
        alreadyClaimedMessage: "Вы уже получили сегодняшний бонус. Возвращайтесь завтра!",
        expiredTitle: "Токен Истек",
        expiredMessage: "Эта ссылка больше не действительна. Проверьте сегодняшнее письмо.",
        invalidTokenTitle: "Неверный Токен",
        invalidTokenMessage: "Ссылка, которую вы использовали, недействительна.",
        missingTokenTitle: "Токен Отсутствует",
        missingTokenMessage: "Токен не предоставлен.",
        serverErrorTitle: "Ошибка Сервера",
        serverErrorMessage: "Произошла ошибка. Попробуйте позже."
      },
      loading: "Загрузка..."
    },
    confirm: {
      subtitle: "Добро пожаловать в GetNearMe",
      description: "Ваша подписка на сервис успешно подтверждена. Вернитесь к расширению и начните использовать все возможности GetNearMe!",
      cta: "Начать исследование"
    },
    unsubscribe: {
      subtitle: "Отписка завершена",
      description: "Вы были успешно удалены из нашей рассылки. Вы больше не будете получать письма от GetNearMe."
    },
    featuresPage: {
      title: "Все возможности",
      titleItalic: "GetNearMe",
      subtitle: "Узнай обо всех инструментах, созданных чтобы изменить твою работу агента по недвижимости. От анализа района до искусственного интеллекта — каждая функция даёт тебе реальное преимущество.",
      feature6: {
        title: "Автоматический маркетинг недвижимости",
        desc: "Превращаешь данные объекта в профессиональные посты, уже оптимизированные для основных социальных сетей.",
        badge: "НОВОЕ",
      },
      feature7: {
        title: "Видео об объекте за несколько кликов",
        desc: "Создаёшь за несколько кликов профессиональные видеоматериалы для продвижения каждого объекта — современно и эффективно.",
        badge: "НОВОЕ",
      },
      ctaTitle: "Готов начать?",
      ctaDesc: "Присоединяйся к агентам по недвижимости, которые уже меняют свой подход к работе с GetNearMe.",
      ctaButton: "Попробуй бесплатно",
      ctaContact: "Связаться с нами",
    },
    landing: {
      topBar: {
        promo: "Акционное предложение:",
        discount: "Ограниченная стартовая цена",
        expiresIn: "истекает через",
        freeTrialShort: "",
      },
      hero: {
        badge: "",
        title1: "Ассистент на базе ИИ для агентов по недвижимости.",
        title2: "Экономь больше полутора дней в неделю.",
        desc: "Home staging, видео, посты для соцсетей и отчёты по каждому объекту — готовы за несколько минут. То, что сейчас занимает часы, делаешь из одного места.",
        ctaPrimary: "Попробуй бесплатно",
        ctaSecondary: "Посмотри как работает",
        ctaDemo: "Записаться на демо",
        stats: ["Пробуешь без карты", "Готово за несколько минут", "Твои объявления, с твоим брендом"],
      },
      problem: {
        emoji: "frown",
        title: "Для одного объявления открываешь десять разных программ.",
        desc: "Фото нужно обработать, видео смонтировать, посты для соцсетей подготовить, PDF отправить клиенту. Инструменты стоят денег, не работают вместе и крадут часы каждую неделю. А в это время другой агент опережает тебя.",
      },
      solution: {
        emoji: "rocket",
        title: "Один ассистент. Вся работа по объявлению — готова.",
        desc: "Начинаешь с объявления — вставляешь ссылку на портал или загружаешь свои фото — и GetNearMe возвращает home staging, видео, посты для соцсетей и отчёт с твоим логотипом. За несколько минут, без открытия других программ и без изучения чего-то нового.",
      },
      features: {
        title: "Шесть профессиональных инструментов.",
        titleHighlight: "Один ассистент.",
        subtitle: "GetNearMe делает работу Canva, видеоредактора, дизайнера, SMM-специалиста и PowerPoint. И не нужно ничему учиться.",
        items: [
          { num: "01", title: "ИИ home staging", desc: "Обставляешь, освобождаешь или преображаешь комнату за секунды. Показываешь клиенту до/после или сразу публикуешь на порталах и в соцсетях.", icon: "sparkles", color: "#6366f1" },
          { num: "02", title: "ИИ-видео об объекте", desc: "Reels, walkthrough, before/after, видео с говорящим аватаром и многое другое. Готово за несколько кликов, без монтажа и без видеографа.", icon: "clapperboard", color: "#10b981" },
          { num: "03", title: "Посты, reels и сторис для соцсетей", desc: "Готовый контент для Instagram, Facebook, TikTok и LinkedIn на основе данных объявления. Твой логотип и твои цвета применяются автоматически.", icon: "smartphone", color: "#ec4899" },
          { num: "04", title: "PDF-отчёт с твоим брендом", desc: "Сравниваешь несколько объектов в аккуратном документе с твоим логотипом, цветами и шрифтом. Готов к отправке клиенту после просмотра.", icon: "file-text", color: "#f97316" },
          { num: "05", title: "Интерактивный анализ района", desc: "Сервисы, транспорт, школы, здравоохранение, парки и реальные расстояния на карте. Рассказываешь клиенту о районе с конкретными данными, не открывая двадцать вкладок.", icon: "map", color: "#0ea5e9" },
          { num: "06", title: "Средняя цена по району за м²", desc: "Средняя цена €/м² в районе и сравнение с похожими объектами — чтобы идти на переговоры с конкретными цифрами. Рыночные данные в иллюстративных целях, не экспертиза.", icon: "trending-up", color: "#f59e0b" },
        ],
      },
      testimonials: {
        title: "Меньше инструментов, больше результата.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Marco R.", role: "Агент по недвижимости", text: "Попробовал ИИ-видео для трёшки, которая простояла два месяца. Выложил в Instagram — за неделю получил три запроса на просмотр. Честно говоря, не ожидал.", avatar: "MR", color: "#f59e0b", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
          { name: "Giulia T.", role: "Агент по недвижимости", text: "Отправляю отчёт после просмотра — клиент спокойно сравнивает квартиры дома. С ИИ-фото показываю одну и ту же комнату обставленной тремя разными способами: решение принимается гораздо быстрее.", avatar: "GT", color: "#6366f1", photo: "https://randomuser.me/api/portraits/women/65.jpg" },
          { name: "Davide M.", role: "Агент по недвижимости", text: "Загружаю фото, выбираю стиль — через минуту reel готов. Раньше приходилось звонить видеографу и ждать несколько дней, теперь делаю это пока жду клиента в офисе.", avatar: "DM", color: "#10b981", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
        ],
      },
      pricing: {
        title1: "Одна цена.",
        title2: "Окупается с",
        titleHighlight: "первого объекта",
        subtitle: "Пробуешь бесплатно. Потом один тариф вместо Canva, видеоредактора, дизайнера и часов работы: стоит меньше, чем всё вместе.",
        countdownLabel: "Стартовая цена, истекает через",
        trustBadges: ["🔒 Безопасная оплата Stripe", "⚡ Мгновенная активация"],
        savingsLabel: "ЭКОНОМИЯ",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "free", name: "Free", users: "Чтобы начать", oldPrice: null, price: 0, period: "",
            savingsYear: null, badge: null, popular: false,
            features: ["Пробуешь все функции", "Пробные кредиты включены", "Карта не нужна"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Начать бесплатно",
          },
          {
            id: "agency_monthly", name: "Месячный", users: "Все функции включены", oldPrice: 150, price: 59, period: "/мес",
            savingsYear: null, badge: null, popular: false,
            features: ["Всё из бесплатного плана", "Отчёты с твоим логотипом", "ИИ home staging", "ИИ-видео об объектах", "Посты и сторис для соцсетей", "Цена за м² в реальном времени", "Поддержка по email"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Выбрать этот план",
          },
          {
            id: "agency_annual", name: "Годовой", users: "Все функции включены", oldPrice: 1800, price: 590, period: "/год",
            savingsYear: null, badge: "Самый популярный", popular: true,
            features: ["Всё из месячного плана", "2 месяца бесплатно по сравнению с месячным", "Цена зафиксирована на 12 месяцев", "Приоритетная поддержка"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Выбрать этот план",
          },
        ],
      },
      howItWorks: {
        title: "Готов к работе за",
        titleHighlight: "2 минуты",
        subtitle: "Ничего устанавливать, ничему учиться. Создаёшь аккаунт, начинаешь с объявления — и всё готово.",
        steps: [
          { step: "1", title: "Создай аккаунт бесплатно", desc: "Регистрируешься за несколько секунд прямо в браузере. Карта не нужна.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Начни с объявления", desc: "Вставляешь ссылку на портал или загружаешь свои фото и данные объекта.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Публикуй за несколько минут", desc: "Home staging, видео, посты для соцсетей и отчёты готовы, с твоим брендом. Всё из одного места.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Вопросы?",
        titleHighlight: "Ответы.",
        items: [
          { q: "Что такое GetNearMe?", a: "Это ИИ-ассистент, который готовит все материалы для твоих объявлений: home staging, видео, посты для соцсетей, отчёты и анализ района. Начинаешь со ссылки на портал или своих фото — и за несколько минут всё готово, с твоим брендом." },
          { q: "Нужно что-то устанавливать?", a: "Нет. GetNearMe работает онлайн: заходишь через браузер и сразу начинаешь работать. Ничего скачивать, никакого нового программного обеспечения." },
          { q: "Как попробовать?", a: "Бесплатно и без карты. Создаёшь аккаунт и сразу пробуешь функции: видишь результат до того, как решаешь оформить подписку." },
          { q: "Работает, если работаю один?", a: "Да, именно для такого агента и создано. Делаешь в одиночку работу небольшой команды: фото, видео, посты и отчёты — без внешних подрядчиков." },
          { q: "Какие инструменты заменяет?", a: "Canva, видеоредактор, PowerPoint, дизайнера, SMM-специалиста и часы ручного поиска. Один ассистент вместо множества инструментов — меньше затрат и меньше времени на каждый объект." },
          { q: "Нужно уметь монтировать видео или работать с графикой?", a: "Нет. Выбираешь шаблон (говорящий аватар, разделённый экран, walkthrough, before/after, автомонтаж, ИИ-таймлапс) — и ИИ создаёт видео с музыкой и субтитрами. Посты выходят уже с твоим логотипом." },
          { q: "Данные по районам — это оценка?", a: "Нет. Средние цены за м² и данные по районам — это рыночная информация в иллюстративных целях, полезная для рассказа об объекте и подготовки к переговорам. Не заменяет официальную экспертизу." },
          { q: "Можно отменить в любой момент?", a: "Да. С месячным планом отменяешь когда угодно из личного кабинета, без обязательств. Годовой план оплачивается авансом и имеет самую низкую цену в месяц." },
        ],
      },
      finalCta: {
        title1: "Перестань переключаться между десятью программами.",
        title2: "Готовь свои объявления с одним ассистентом.",
        desc: "Профессиональные фото, видео, посты и отчёты по каждому объекту за несколько минут. Пробуй бесплатно, без карты.",
        button: "Попробуй бесплатно",
        buttonDemo: "Записаться на демо",
        footer: "🔒 Безопасная оплата Stripe. Пробуешь бесплатно, отменяешь когда угодно.",
      },
      roiCalculator: {
        title: "Сколько ты экономишь с",
        titleHighlight: "GetNearMe?",
        subtitle: "Рассчитай, сколько времени и денег ты сэкономишь.",
        inputProperties: "Объектов в работе в месяц",
        inputHours: "Часов на подготовку материалов по одному объекту",
        inputRate: "Сколько стоит один час твоей работы",
        outputHoursSaved: "Сэкономленных часов в месяц",
        outputValueRecovered: "Стоимость возвращённого времени",
        outputCost: "Стоимость GetNearMe",
        outputNetSavings: "Чистая экономия в месяц",
        outputROI: "возврат на каждый потраченный евро",
        perMonth: "/мес",
        cta: "Выбрать этот план",
        note: "С GetNearMe каждый объект занимает около 3 минут вместо часов. Используем 80% как консервативную оценку экономии времени.",
      },
      demo: {
        pageTitle: "Записаться на демо",
        pageSubtitle: "Заполни форму и мы свяжемся с тобой, чтобы организовать персональную демонстрацию GetNearMe.",
        fieldName: "Имя и фамилия",
        fieldEmail: "Email",
        fieldAgencyName: "Агентство или команда (необязательно)",
        fieldPhone: "Телефон (необязательно)",
        fieldMessage: "Сообщение (необязательно)",
        submit: "Записаться на демо",
        submitting: "Отправка...",
        successTitle: "Заявка отправлена!",
        successMessage: "Мы свяжемся с тобой как можно скорее, чтобы организовать демо.",
        errorMessage: "Произошла ошибка. Попробуй позже.",
        backToHome: "Вернуться на главную",
      },
      modal: {
        emoji: "rocket",
        title: "Отличный выбор.",
        planLabel: "План",
        desc: "Войди или зарегистрируйся, чтобы активировать",
        descBold: "выбранный план",
        descEnd: "с полным доступом ко всем функциям.",
        cta: "Активировать план",
        footer: "🔒 Безопасная оплата Stripe. Отменяешь одним кликом.",
      },
      popups: [
        { icon: "circle", text: "Агент только что активировал план", time: "3 мин назад" },
        { icon: "clapperboard", text: "Агент создал промо-видео с помощью ИИ", time: "" },
        { icon: "users", text: "Агентов работают с GetNearMe прямо сейчас", time: "" },
        { icon: "rocket", text: "Агент только что начал бесплатную пробную версию", time: "12 мин назад" },
        { icon: "flame", text: "Всё больше агентов выбирают GetNearMe", time: "" },
        { icon: "sparkles", text: "Агент обставил комнату с помощью ИИ home staging", time: "5 мин назад" },
        { icon: "star", text: "Агент перешёл на годовой план", time: "18 мин назад" },
        { icon: "smartphone", text: "Постов для соцсетей создано с GetNearMe", time: "" },
        { icon: "target", text: "Агент экспортировал PDF-отчёт с собственным логотипом", time: "7 мин назад" },
        { icon: "briefcase", text: "Агент только что зарегистрировался в GetNearMe", time: "2 мин назад" },
        { icon: "trophy", text: "GetNearMe используют агенты по всей Италии", time: "" },
        { icon: "map", text: "Агент сгенерировал анализ района для объекта", time: "9 мин назад" },
      ],
    },
  },
  uk: {
    nav: {
      features: "Можливості",
      examples: "Приклади",
      pricing: "Ціни",
      faq: "FAQ",
      blog: "Блог",
      tutorial: "Навчання",
      startAnalysis: "Спробуй безкоштовно",
      backToHome: "← Повернутися на головну",
      dashboard: "Панель керування",
      myAccount: "Мій акаунт"
    },
    hero: {
      title1: "Асистент AI для агентів нерухомості.",
      title2: "Заощаджуй більше ніж півтора дня на тиждень",
      title3: "",
      description: "Хоум стейджинг, відео, пости для соцмереж і звіти для кожного об'єкта — готові за кілька хвилин. Те, що сьогодні забирає години, тепер робиш в одному місці.",
      cta: "Спробуй безкоштовно",
      ctaSecondary: "Як це працює",
      subMockup: "GetNearMe — це AI-асистент для агентів нерухомості: починаєш з оголошення або своїх фото і отримуєш хоум стейджинг, відео, пости для соцмереж, звіт з твоїм брендом і аналіз района. Все в одному місці, без необхідності вчитися чомусь новому."
    },
    features: {
      title: "Все, що можна",
      titleItalic: "зробити з GetNearMe",
      description: "Один асистент замість Canva, відеоредактора, дизайнера і годин роботи. Аналізуєш об'єкт, покращуєш фото і готуєш звіти та контент за кілька хвилин.",
      card1: {
        title: "Повний аналіз об'єкта",
        desc: "Відразу маєш чітку і впорядковану картину ключових даних об'єкта — без пошуку інформації по сотнях сторінок."
      },
      card2: {
        title: "Інтерактивний аналіз района",
        desc: "Показуєш клієнту, що означає жити в цьому районі: сервіси, транспорт і реальні відстані на карті в режимі реального часу."
      },
      card3: {
        title: "Середня ціна в районі за м²",
        desc: "Середня ціна €/м² в районі, щоб підготуватися до переговорів з конкретними цифрами в руках."
      },
      card4: {
        title: "Порівняльні звіти з твоїм брендом",
        desc: "Представляєш кілька об'єктів в одному впорядкованому документі з твоїм логотипом, готовому для відправки клієнту."
      },
      card5: {
        title: "Хоум стейджинг за допомогою AI",
        desc: "Редагуєш фото за допомогою AI і показуєш порівняння до/після: порожні або меблі кімнати, покращене освітлення і перетворені простори за лічені секунди."
      },
      disclaimer: "Дані по районах є ринковою інформацією в ілюстративних цілях і не є оцінкою або експертизою нерухомості.",
      addExtension: "Спробуй безкоштовно",
      comingSoonTitle: "Незабаром",
      comingSoonDesc: "Ми розробляємо нові функції, щоб зробити твою роботу ще швидшою і професійнішою.",
    },
    faq: {
      title: "Часті",
      titleItalic: "запитання",
      items: [
        {
          q: "Що таке GetNearMe?",
          a: "Це AI-асистент, який готує всі матеріали для твоїх оголошень: хоум стейджинг, відео, пости для соцмереж, звіти й аналіз района. Починаєш з посилання на портал або своїх фото і за кілька хвилин маєш все готове з твоїм брендом."
        },
        {
          q: "Потрібно щось встановлювати?",
          a: "Ні. GetNearMe — онлайн-сервіс: відкриваєш у браузері і починаєш працювати. Нічого завантажувати, нічого вчитися."
        },
        {
          q: "Як його спробувати?",
          a: "Безкоштовно і без картки. Створюєш акаунт і відразу пробуєш функції — бачиш результат ще до того, як вирішиш."
        },
        {
          q: "Підходить, якщо я працюю самостійно?",
          a: "Так, він створений саме для індивідуального агента. Сам робиш роботу невеликої команди: фото, відео, пости і звіти — без сторонніх підрядників."
        },
        {
          q: "Потрібно вміти монтувати відео або користуватися графічними програмами?",
          a: "Ні. Обираєш шаблон — і AI робить решту: відео з музикою і субтитрами, пости з твоїм логотипом, звіти вже готові до друку."
        },
        {
          q: "Дані по районах — це офіційна оцінка?",
          a: "Ні. Це ринкова інформація в ілюстративних цілях, корисна для розповіді про об'єкт і підготовки до переговорів. Вона не замінює офіційну експертизу."
        }
      ]
    },
    pricing: {
      title: "Одна ціна",
      titleItalic: "за все",
      description: "Єдиний план з усіма функціями: хоум стейджинг, відео, пости для соцмереж, звіти й аналіз района. Спробуй безкоштовно ще до оплати.",
      free: "Безкоштовно",
      buyNow: "Купити зараз",
      registerNow: "Зареєструватися зараз",
      mostChosen: "Найпопулярніший",
      footer1: "Безпечна оплата карткою, PayPal та основними провайдерами.",
      footer2: "Пробуєш безкоштовно, без картки. Скасовуєш коли завгодно.",
      footer3: "",
      plans: [
        {
          name: "Free",
          subtitle: "Для початку",
          desc: "Пробуєш GetNearMe безкоштовно і без картки: створюєш акаунт і відразу користуєшся функціями з включеними тестовими кредитами."
        },
        {
          name: "Місячний план",
          subtitle: "Всі функції включені",
          desc: "Повний доступ до GetNearMe для індивідуального агента: AI хоум стейджинг, відео, пости для соцмереж, звіти з твоїм брендом і аналіз района. Інструмент для підтримки твоєї роботи, а не система оцінки нерухомості."
        },
        {
          name: "Річний план",
          subtitle: "Найвигідніший",
          desc: "Всі функції місячного плану плюс два місяці безкоштовно і пріоритетна підтримка."
        }
      ]
    },
    cta: {
      title: "Виглядай як велике агентство",
      title2: "навіть якщо працюєш",
      titleItalic: "сам",
      desc: "Готуй професійні фото, відео, пости і звіти для кожного об'єкта за кілька хвилин.",
      button: "Спробуй безкоштовно",
      requestInfo: "Запитати інформацію",
    },
    howItWorks: {
      step1Title: "Створи безкоштовний акаунт",
      step1Desc: "Реєструєшся за кілька секунд. Картка не потрібна.",
      step2Title: "Починай з оголошення",
      step2Desc: "Вставляєш посилання на портал або завантажуєш свої фото і дані об'єкта.",
      step3Title: "Публікуй за кілька хвилин",
      step3Desc: "Фото, відео, пости і звіти готові з твоїм брендом. Все в одному місці.",
      cta: "Спробуй безкоштовно",
      videoTitle: "GetNearMe: як це працює",
    },
    footer: {
      desc: "AI-асистент для агентів нерухомості. Те, що сьогодні коштує тобі годин — фото, відео, пости і презентації — з GetNearMe робиш за кілька хвилин, починаючи з оголошення.",
      product: "Продукт",
      legal: "Юридична інформація",
      privacy: "Політика конфіденційності",
      cookie: "Політика використання файлів cookie",
      terms: "Умови використання",
      dataDeletion: "Видалення даних",
      rights: "Всі права застережені."
    },
    privacy: {
      update: "Останнє оновлення: 23.01.2026",
      intro: "Ця Політика конфіденційності описує методи обробки персональних даних користувачів, які використовують веб-сайт getnearme.it та розширення браузера GetNearMe (далі — «Сервіс»).",
      sections: [
        {
          t: "1. Володілець персональних даних",
          c: "Володільцем персональних даних є фізична особа, ідентифікована як GetNearMe. З будь-яких запитів щодо обробки персональних даних можна звертатися за адресою: info@getnearme.it"
        },
        {
          t: "2. Типи даних, що обробляються",
          c: "Протягом використання Сервісу можуть оброблятися такі категорії даних: дані, надані користувачем добровільно (наприклад, електронна адреса під час реєстрації); технічні та навігаційні дані (IP-адрес, тип браузера, операційна система, дата і час доступу); дані щодо використання Сервісу (виконані аналізи, використані кредити, уподобання у використанні). Особливі категорії персональних даних не обробляються."
        },
        {
          t: "3. Автентифікація",
          c: "Розширення використовує Supabase для автентифікації користувачів. При створенні облікового запису ми зберігаємо: електронну адресу, унікальний ідентифікатор користувача, дату реєстрації та статус підписки. Ці дані зберігаються на серверах Supabase (ЄС) і необхідні для управління кредитами та доступом до преміум-функцій."
        },
        {
          t: "4. Платежі",
          c: "Платежі обробляються через Stripe. GetNearMe НЕ зберігає дані кредитних карток. Stripe обробляє всю платіжну інформацію відповідно до стандартів PCI-DSS. Ми зберігаємо лише: ідентифікатор клієнта Stripe (для прив'язки покупок до вашого облікового запису) та історію придбаних кредитів."
        },
        {
          t: "5. Генерація зображень за допомогою ШІ",
          c: "Функція «Virtual Staging» використовує API Replicate для генерації зображень. При використанні цієї функції: вибране зображення надсилається до Replicate для обробки; згенеровані зображення є тимчасовими і не зберігаються постійно; Replicate може зберігати журнали для цілей налагодження (детальніше див. їхню політику конфіденційності)."
        },
        {
          t: "6. Мета обробки",
          c: "Персональні дані обробляються з наступною метою: забезпечення реєстрації та управління обліковим записом користувача; надання функцій аналізу та порівняння, що пропонуються Сервісом; управління системою кредитів та доступом до функцій; надсилання сервісних повідомлень, необхідних для роботи Сервісу; надсилання інформаційних повідомлень лише за наявності явної згоди користувача; покращення роботи та безпеки Сервісу."
        },
        {
          t: "7. Правова основа обробки",
          c: "Обробка даних ґрунтується на: виконанні договору або переддоговірних заходів; згоді користувача, де це потрібно; законному інтересі володільця у правильному функціонуванні та покращенні Сервісу."
        },
        {
          t: "8. Способи обробки",
          c: "Обробка даних здійснюється за допомогою комп'ютерних засобів із вжиттям відповідних заходів безпеки для забезпечення конфіденційності, цілісності та доступності інформації."
        },
        {
          t: "9. Зберігання даних",
          c: "Локальні дані навігації: видаляються при закритті браузера. Кеш проаналізованих об'єктів: зберігається локально до ручного видалення. Обліковий запис користувача: зберігається до запиту на видалення. Щоб видалити свій обліковий запис та всі пов'язані дані, зверніться за адресою info@getnearme.it або скористайтеся опцією «Видалити обліковий запис» у налаштуваннях розширення."
        },
        {
          t: "10. Обмін даними",
          c: "Дані можуть передаватися постачальникам технічних та операційних послуг (Supabase для автентифікації, Stripe для платежів, Replicate для обробки зображень за допомогою ШІ) виключно з метою, пов'язаною з наданням Сервісу."
        },
        {
          t: "11. Права користувача",
          c: "Користувач може здійснювати права, передбачені Регламентом ЄС 2016/679 (GDPR), включаючи доступ, виправлення, видалення та заперечення, написавши за адресою info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Останнє оновлення: 23.01.2026",
      intro: "Ці Умови регулюють використання веб-сайту getnearme.it та розширення браузера GetNearMe.",
      sections: [
        {
          t: "1. Характер Сервісу",
          c: "GetNearMe — це інструмент підтримки прийняття рішень, який організовує та порівнює доступні дані про нерухомість та райони. GetNearMe не є агентством нерухомості та не надає професійних, юридичних, податкових або ріелторських консультацій."
        },
        {
          t: "2. Походження даних",
          c: "Відображена інформація надходить з оголошень про нерухомість третіх осіб та доступних державних джерел. GetNearMe не контролює зміст оголошень і не несе відповідальності за помилки, упущення або подальші зміни."
        },
        {
          t: "3. Аналізи та оцінки",
          c: "Надані аналізи та оцінки мають виключно ознайомчий характер, базуються на середніх значеннях та доступних даних і не є офіційною оцінкою нерухомості. Будь-яке рішення, прийняте користувачем, залишається під його виключну відповідальність."
        },
        {
          t: "4. Обліковий запис та кредити",
          c: "Для використання деяких функцій Сервісу потрібне створення облікового запису. Кредити: пов'язані з обліковим записом користувача; не мають терміну дії; не підлягають поверненню."
        },
        {
          t: "5. Дозволене використання",
          c: "Забороняється: використовувати Сервіс у незаконних або несанкціонованих цілях; намагатися обійти системи безпеки або систему кредитів; виконувати масовий парсинг або несанкціоноване комерційне використання контенту."
        },
        {
          t: "6. Доступність Сервісу",
          c: "Деякі функції можуть варіюватися залежно від доступності джерел, сайту, що аналізується, або використовуваного браузера. GetNearMe залишає за собою право змінювати, призупиняти або припиняти роботу Сервісу, повністю або частково, у будь-який час."
        },
        {
          t: "7. Обмеження відповідальності",
          c: "У межах, дозволених законом, GetNearMe не несе відповідальності за будь-які збитки, що виникли внаслідок використання або неможливості використання Сервісу."
        }
      ]
    },
    cookie: {
      update: "Останнє оновлення: 22.12.2025",
      intro: "Ця Політика використання файлів cookie застосовується виключно до веб-сайту getnearme.it.",
      sections: [
        {
          t: "1. Що таке файли cookie",
          c: "Файли cookie — це невеликі текстові файли, які сайт надсилає на пристрій користувача для покращення досвіду навігації та забезпечення правильної роботи сайту."
        },
        {
          t: "2. Типи файлів cookie, що використовуються",
          c: "Сайт використовує: технічні файли cookie, необхідні для роботи сайту та управління уподобаннями користувача; можливі сторонні файли cookie, пов'язані з технічними або платіжними послугами."
        },
        {
          t: "3. Управління файлами cookie",
          c: "Користувач може керувати файлами cookie або вимикати їх у налаштуваннях свого браузера. Вимкнення технічних файлів cookie може порушити правильну роботу сайту."
        },
        {
          t: "4. Згода",
          c: "Технічні файли cookie не потребують згоди користувача. Для будь-яких нетехнічних файлів cookie згода запитується через спеціальний банер."
        }
      ]
    },
    bonus: {
      creditsClaimed: "Кредити Отримано!",
      dayCompleted: "День {day} завершено!",
      weekComplete: "Фантастика! Ти завершив тиждень! Отримуєш 120 бонусних кредитів!",
      comeBackTomorrow: "Повертайся завтра на {day} день.",
      goToHome: "Перейти в GetNearMe",
      backToHome: "Повернутися на Головну",
      error: {
        defaultTitle: "Помилка",
        defaultMessage: "Сталася помилка.",
        alreadyClaimedTitle: "Бонус Вже Отримано",
        alreadyClaimedMessage: "Ти вже отримав сьогоднішній бонус. Повертайся завтра!",
        expiredTitle: "Токен Вичерпано",
        expiredMessage: "Це посилання більше не дійсне. Перевір сьогоднішній лист.",
        invalidTokenTitle: "Недійсний Токен",
        invalidTokenMessage: "Посилання, яке ти використав, недійсне.",
        missingTokenTitle: "Токен Відсутній",
        missingTokenMessage: "Токен не надано.",
        serverErrorTitle: "Помилка Сервера",
        serverErrorMessage: "Сталася помилка. Спробуй пізніше."
      },
      loading: "Завантаження..."
    },
    confirm: {
      subtitle: "Ласкаво просимо до GetNearMe",
      description: "Твою підписку на сервіс підтверджено. Увійди в GetNearMe і починай користуватися всіма функціями.",
      cta: "Почати досліджувати"
    },
    unsubscribe: {
      subtitle: "Відписку завершено",
      description: "Тебе успішно видалено з нашого списку розсилки. Ти більше не отримуватимеш листів від GetNearMe."
    },
    featuresPage: {
      title: "Всі Можливості",
      titleItalic: "GetNearMe",
      subtitle: "Відкрий для себе всі інструменти, створені для того, щоб змінити твою роботу агента нерухомості. Від аналізу района до штучного інтелекту — кожна функція дає тобі реальну перевагу.",
      feature6: {
        title: "Автоматичний Маркетинг Нерухомості",
        desc: "Перетворюй дані об'єкта на професійні пости, вже оптимізовані для основних соціальних мереж.",
        badge: "НОВЕ",
      },
      feature7: {
        title: "Відео для Нерухомості за кілька кліків",
        desc: "Створюй за кілька кліків професійні відеоматеріали для просування кожного об'єкта сучасно та ефективно.",
        badge: "НОВЕ",
      },
      ctaTitle: "Готовий почати?",
      ctaDesc: "Приєднуйся до агентів нерухомості, які вже змінюють свій спосіб роботи з GetNearMe.",
      ctaButton: "Спробуй безкоштовно",
      ctaContact: "Зв'яжись з нами",
    },
    landing: {
      topBar: {
        promo: "Стартова пропозиція:",
        discount: "Обмежена стартова ціна",
        expiresIn: "закінчується через",
        freeTrialShort: "",
      },
      hero: {
        badge: "",
        title1: "Асистент AI для агентів нерухомості.",
        title2: "Заощаджуй більше ніж півтора дня на тиждень.",
        desc: "Хоум стейджинг, відео, пости для соцмереж і звіти для кожного об'єкта — готові за кілька хвилин. Те, що сьогодні забирає години, тепер робиш в одному місці.",
        ctaPrimary: "Спробуй безкоштовно",
        ctaSecondary: "Подивись як це працює",
        ctaDemo: "Замов демо",
        stats: ["Пробуєш без картки", "Готово за кілька хвилин", "Твої оголошення, з твоїм брендом"],
      },
      problem: {
        emoji: "frown",
        title: "Для одного оголошення відкриваєш десять різних програм.",
        desc: "Фото треба відретушувати, відео змонтувати, пости для соцмереж підготувати, PDF відправити клієнту. Інструменти, які коштують грошей, не взаємодіють між собою і крадуть години щотижня. А тим часом інший агент встигає раніше за тебе.",
      },
      solution: {
        emoji: "rocket",
        title: "Один асистент. Вся робота по оголошенню — готова.",
        desc: "Починаєш з оголошення — вставляєш посилання на портал або завантажуєш свої фото — і GetNearMe повертає тобі хоум стейджинг, відео, пости для соцмереж і звіт з твоїм логотипом. За кілька хвилин, без відкриття інших програм і без необхідності вчитися чомусь новому.",
      },
      features: {
        title: "Шість професійних інструментів.",
        titleHighlight: "Один асистент.",
        subtitle: "GetNearMe робить роботу Canva, відеоредактора, дизайнера, SMM-спеціаліста і PowerPoint. І тобі не треба нічому вчитися.",
        items: [
          { num: "01", title: "Хоум стейджинг AI", desc: "Меблюєш, прибираєш або перетворюєш кімнату за лічені секунди. Показуєш клієнту порівняння до/після або відразу публікуєш на порталах і в соцмережах.", icon: "sparkles", color: "#6366f1" },
          { num: "02", title: "AI відео для об'єкта", desc: "Reel, walkthrough, before/after, відео з аватаром, що говорить, та багато іншого. Готові за кілька кліків, без монтажу і без відеографа.", icon: "clapperboard", color: "#10b981" },
          { num: "03", title: "Пости, reel і stories для соцмереж", desc: "Контент готовий для Instagram, Facebook, TikTok і LinkedIn на основі даних оголошення. Твій логотип і кольори застосовуються самі.", icon: "smartphone", color: "#ec4899" },
          { num: "04", title: "PDF звіт з твоїм брендом", desc: "Порівнюєш кілька об'єктів в одному впорядкованому документі з твоїм логотипом, кольорами і шрифтами. Готовий до відправки клієнту після візиту.", icon: "file-text", color: "#f97316" },
          { num: "05", title: "Інтерактивний аналіз района", desc: "Сервіси, транспорт, школи, медицина, парки і реальні відстані на карті. Розповідаєш клієнту про район з конкретними даними, не відкриваючи двадцять вкладок.", icon: "map", color: "#0ea5e9" },
          { num: "06", title: "Середня ціна в районі за м²", desc: "Середня ціна €/м² в районі і порівняння з аналогічними об'єктами, щоб підготуватися до переговорів з цифрами в руках. Ринкові дані в ілюстративних цілях, не експертиза.", icon: "trending-up", color: "#f59e0b" },
        ],
      },
      testimonials: {
        title: "Менше інструментів, більше результатів.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Marco R.", role: "Агент нерухомості", text: "Спробував AI відео для триімнатної квартири, яка не продавалась два місяці. Виклав в Instagram і за тиждень отримав три запити на перегляд. Чесно кажучи, не очікував такого.", avatar: "MR", color: "#f59e0b", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
          { name: "Giulia T.", role: "Агент нерухомості", text: "Відправляю звіт після візиту — так клієнт спокійно порівнює об'єкти. Завдяки AI фото показую одну й ту саму кімнату в трьох різних варіантах меблювання: переконується набагато швидше.", avatar: "GT", color: "#6366f1", photo: "https://randomuser.me/api/portraits/women/65.jpg" },
          { name: "Davide M.", role: "Агент нерухомості", text: "Завантажую фото, обираю стиль і за хвилину reel готовий. Раніше доводилось дзвонити відеографу і чекати днями, тепер роблю це поки чекаю клієнта в офісі.", avatar: "DM", color: "#10b981", photo: "https://randomuser.me/api/portraits/men/76.jpg" },
        ],
      },
      pricing: {
        title1: "Одна ціна.",
        title2: "Окупається з",
        titleHighlight: "першого об'єкта",
        subtitle: "Пробуй безкоштовно. Потім один абонемент замість Canva, відеоредактора, дизайнера і годин роботи: коштує менше, ніж їх сума.",
        countdownLabel: "Стартова ціна, закінчується через",
        trustBadges: ["🔒 Безпечна оплата Stripe", "⚡ Миттєва активація"],
        savingsLabel: "ЕКОНОМІЯ",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "free", name: "Free", users: "Для початку", oldPrice: null, price: 0, period: "",
            savingsYear: null, badge: null, popular: false,
            features: ["Пробуєш всі функції", "Тестові кредити включені", "Картка не потрібна"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Починай безкоштовно",
          },
          {
            id: "agency_monthly", name: "Місячний", users: "Всі функції включені", oldPrice: 150, price: 59, period: "/міс",
            savingsYear: null, badge: null, popular: false,
            features: ["Все з плану Free", "Звіти з твоїм логотипом", "Хоум стейджинг AI", "AI відео для об'єктів", "Пости і stories для соцмереж", "Ціна за м² в реальному часі", "Підтримка через email"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Обрати цей план",
          },
          {
            id: "agency_annual", name: "Річний", users: "Всі функції включені", oldPrice: 1800, price: 590, period: "/рік",
            savingsYear: null, badge: "Найпопулярніший", popular: true,
            features: ["Все з місячного плану", "2 місяці безкоштовно порівняно з місячним", "Ціна заморожена на 12 місяців", "Пріоритетна підтримка"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Обрати цей план",
          },
        ],
      },
      howItWorks: {
        title: "Готовий до роботи за",
        titleHighlight: "2 хвилини",
        subtitle: "Нічого встановлювати, нічого вчити. Створюєш акаунт, починаєш з оголошення — і все готово.",
        steps: [
          { step: "1", title: "Створи безкоштовний акаунт", desc: "Реєструєшся за кілька секунд, прямо в браузері. Картка не потрібна.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Починай з оголошення", desc: "Вставляєш посилання на портал або завантажуєш свої фото і дані об'єкта.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Публікуй за кілька хвилин", desc: "Хоум стейджинг, відео, пости і звіти готові з твоїм брендом. Все в одному місці.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Питання?",
        titleHighlight: "Відповіді.",
        items: [
          { q: "Що таке GetNearMe?", a: "Це AI-асистент, який готує всі матеріали для твоїх оголошень: хоум стейджинг, відео, пости для соцмереж, звіти й аналіз района. Починаєш з посилання на портал або своїх фото і за кілька хвилин маєш все готове з твоїм брендом." },
          { q: "Потрібно щось встановлювати?", a: "Ні. GetNearMe — онлайн-сервіс: відкриваєш у браузері і починаєш працювати. Нічого завантажувати, нічого вчитися." },
          { q: "Як його спробувати?", a: "Безкоштовно і без картки. Створюєш акаунт і відразу пробуєш функції — бачиш результат ще до того, як вирішиш підписатися." },
          { q: "Підходить, якщо я працюю самостійно?", a: "Так, він створений саме для індивідуального агента. Сам робиш роботу невеликої команди: фото, відео, пости і звіти — без сторонніх підрядників." },
          { q: "Які інструменти замінює?", a: "Canva, відеоредактор, PowerPoint, дизайнер, SMM-спеціаліст і години ручного пошуку. Один асистент замість багатьох інструментів — менше витрат і менше часу на кожен об'єкт." },
          { q: "Потрібно вміти монтувати відео або користуватися графікою?", a: "Ні. Обираєш шаблон (аватар, що говорить, розділений екран, walkthrough, before/after, автоматичний монтаж, timelapse AI) — і AI генерує відео з музикою і субтитрами. Пости виходять вже з твоїм логотипом." },
          { q: "Дані по районах — це офіційна оцінка?", a: "Ні. Середні ціни за м² і дані по районах є ринковою інформацією в ілюстративних цілях, корисною для розповіді про об'єкт і підготовки до переговорів. Вони не замінюють офіційну експертизу." },
          { q: "Можна скасувати коли завгодно?", a: "Так. З місячним планом скасовуєш коли завгодно з панелі керування, без обмежень. Річний план оплачується наперед і має найнижчу ціну на місяць." },
        ],
      },
      finalCta: {
        title1: "Перестань перемикатися між десятьма програмами.",
        title2: "Готуй свої оголошення з одним асистентом.",
        desc: "Професійні фото, відео, пости і звіти для кожного об'єкта за кілька хвилин. Спробуй безкоштовно, без картки.",
        button: "Спробуй безкоштовно",
        buttonDemo: "Замов демо",
        footer: "🔒 Безпечна оплата Stripe. Пробуєш безкоштовно, скасовуєш коли завгодно.",
      },
      roiCalculator: {
        title: "Скільки заощаджуєш з",
        titleHighlight: "GetNearMe?",
        subtitle: "Розрахуй, скільки часу і грошей це тобі економить.",
        inputProperties: "Об'єктів, якими управляєш на місяць",
        inputHours: "Годин на підготовку матеріалів для одного об'єкта",
        inputRate: "Скільки коштує одна година твоєї роботи",
        outputHoursSaved: "Годин зекономлено на місяць",
        outputValueRecovered: "Вартість відновленого часу",
        outputCost: "Вартість GetNearMe",
        outputNetSavings: "Чиста економія на місяць",
        outputROI: "повернення на кожне витрачене євро",
        perMonth: "/міс",
        cta: "Обрати цей план",
        note: "З GetNearMe кожен об'єкт займає близько 3 хвилин замість годин. Використовуємо 80% як консервативну оцінку заощадженого часу.",
      },
      demo: {
        pageTitle: "Замов демо",
        pageSubtitle: "Заповни форму і ми зв'яжемося з тобою, щоб організувати персональне демо GetNearMe.",
        fieldName: "Ім'я та прізвище",
        fieldEmail: "Email",
        fieldAgencyName: "Агентство або команда (необов'язково)",
        fieldPhone: "Телефон (необов'язково)",
        fieldMessage: "Повідомлення (необов'язково)",
        submit: "Замовити демо",
        submitting: "Надсилаємо...",
        successTitle: "Запит надіслано!",
        successMessage: "Ми зв'яжемося з тобою якнайшвидше для організації демо.",
        errorMessage: "Сталася помилка. Спробуй пізніше.",
        backToHome: "Повернутися на головну",
      },
      modal: {
        emoji: "rocket",
        title: "Відмінний вибір.",
        planLabel: "План",
        desc: "Увійди або зареєструйся, щоб активувати",
        descBold: "обраний план",
        descEnd: "з повним доступом до всіх функцій.",
        cta: "Активувати план",
        footer: "🔒 Безпечна оплата Stripe. Скасовуєш одним кліком.",
      },
      popups: [
        { icon: "circle", text: "Агент щойно активував план", time: "3 хв тому" },
        { icon: "clapperboard", text: "Агент згенерував промо-відео за допомогою AI", time: "" },
        { icon: "users", text: "Агентів зараз працюють в GetNearMe", time: "" },
        { icon: "rocket", text: "Агент щойно почав безкоштовну пробну версію", time: "12 хв тому" },
        { icon: "flame", text: "Дедалі більше агентів обирають GetNearMe", time: "" },
        { icon: "sparkles", text: "Агент облаштував кімнату за допомогою AI хоум стейджингу", time: "5 хв тому" },
        { icon: "star", text: "Агент перейшов на річний план", time: "18 хв тому" },
        { icon: "smartphone", text: "Пости для соцмереж створені з GetNearMe", time: "" },
        { icon: "target", text: "Агент експортував PDF звіт зі своїм логотипом", time: "7 хв тому" },
        { icon: "briefcase", text: "Агент щойно зареєструвався в GetNearMe", time: "2 хв тому" },
        { icon: "trophy", text: "GetNearMe використовують агенти нерухомості по всій Італії", time: "" },
        { icon: "map", text: "Агент згенерував аналіз района для об'єкта", time: "9 хв тому" },
      ],
    },
  }
};
