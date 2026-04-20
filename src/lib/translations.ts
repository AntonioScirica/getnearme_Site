export type Locale = 'it' | 'en' | 'es' | 'fr' | 'ru' | 'uk';

export const translations = {
  it: {
    nav: {
      features: "Funzionalità",
      pricing: "Prezzi",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutorial",
      startAnalysis: "Prova ora!",
      backToHome: "← Torna alla home",
      dashboard: "Dashboard",
      myAccount: "Il mio account"
    },
    hero: {
      title1: "Il vantaggio competitivo",
      title2: "che distingue la",
      title3: "tua agenzia",
      description: "Estensione per Google Chrome con AI per agenti immobiliari. Semplifica le attività quotidiane dell'agenzia: analisi di zona, render foto con AI, video, post social e report PDF direttamente su Immobiliare.it, Idealista, Casa.it, Airbnb e Booking. Non è un sistema di valutazione immobiliare. 7 giorni di prova gratuita senza limiti.",
      cta: "Aggiungi Estensione",
      ctaSecondary: "Come funziona",
      subMockup: "GetNearMe è l'estensione Chrome con AI per agenti immobiliari: si integra in 2 secondi nei portali Immobiliare.it, Idealista, Casa.it, Airbnb e Booking, sostituendo Canva, Photoshop, video editor, PowerPoint e social media manager con un'unica estensione professionale."
    },
    features: {
      title: "Tutto ciò che puoi",
      titleItalic: "fare con GetNearMe",
      description: "Una suite completa per analizzare immobili, confrontare dati di zona, creare report professionali e valorizzare annunci con l'intelligenza artificiale.",
      card1: {
        title: "Analisi completa dell'immobile",
        desc: "Hai subito una visione chiara e strutturata dei dati chiave dell'immobile, senza dover cercare informazioni sparse tra più pagine."
      },
      card2: {
        title: "Analisi territoriale interattiva",
        desc: "Mostra ai clienti cosa significa davvero vivere in quella zona: servizi, trasporti e distanze reali consultabili in tempo reale."
      },
      card3: {
        title: "Valore di mercato in tempo reale",
        desc: "Ottieni il prezzo medio €/m² della zona per supportare valutazioni, acquisizioni e trattative con dati concreti."
      },
      card4: {
        title: "Report comparativi personalizzabili",
        desc: "Presenta più immobili in modo professionale, con documenti personalizzati che rafforzano l'autorevolezza della tua agenzia."
      },
      card5: {
        title: "Mostra il Potenziale con l'AI",
        desc: "Modifica le foto con l'AI e mostra il confronto prima/dopo: ambienti vuoti o arredati, luce migliorata e spazi valorizzati in pochi secondi."
      },
      disclaimer: "Le analisi e le stime mostrate sono indicative e non costituiscono una valutazione immobiliare.",
      addExtension: "Aggiungi estensione",
      comingSoonTitle: "In arrivo",
      comingSoonDesc: "Stiamo sviluppando nuove funzionalità pensate per rendere il lavoro della tua agenzia ancora più strutturato ed efficiente.",
    },
    faq: {
      title: "Domande",
      titleItalic: "frequenti",
      items: [
        {
          q: "GetNearMe è un portale immobiliare?",
          a: "No. Si integra nei portali che già utilizzi e aggiunge analisi di zona, confronti di mercato, report professionali e strumenti AI direttamente durante la navigazione."
        },
        {
          q: "Devo cambiare il mio modo di lavorare?",
          a: "No. Continui a usare i portali che conosci. GetNearMe si integra automaticamente, senza nuovi software da imparare."
        },
        {
          q: "Mi aiuta nelle trattative?",
          a: "Sì. Puoi supportare prezzo e posizionamento con dati di zona e comparazioni oggettive, aumentando credibilità e forza negoziale."
        },
        {
          q: "Posso creare report per i clienti?",
          a: "Sì. Generi report comparativi personalizzati con il logo della tua agenzia, pronti da condividere."
        },
        {
          q: "Posso migliorare immagini e descrizioni?",
          a: "Sì. L'AI ti aiuta a valorizzare le foto e rendere le descrizioni più professionali e persuasive."
        },
        {
          q: "I dati sono affidabili?",
          a: "Le analisi si basano su dati pubblici e annunci disponibili online. Sono un supporto professionale alle valutazioni, non sostituiscono una perizia ufficiale."
        }
      ]
    },
    pricing: {
      title: "Accesso professionale",
      titleItalic: "alla piattaforma",
      description: "Un unico piano, completo di tutte le funzionalità, pensato per integrare analisi e strumenti avanzati nel tuo lavoro quotidiano.",
      free: "Free",
      buyNow: "Acquista ora",
      registerNow: "Registrati ora",
      mostChosen: "Più scelto",
      footer1: "Pagamento sicuro con carta, PayPal e principali provider.",
      footer2: "Nessun vincolo annuale. Disdici quando vuoi.",
      footer3: "",
      plans: [
        {
          name: "Piano Agenzia Mensile",
          subtitle: "Tutte le funzioni incluse",
          desc: "Accesso completo all'estensione Chrome GetNearMe per agenti immobiliari: analisi di zona, render AI, video, post social e report PDF white-label. Strumento di supporto al lavoro quotidiano dell'agenzia, non un sistema di valutazione immobiliare. Fino a 5 agenti, 7 giorni di prova gratuita senza limiti."
        },
        {
          name: "Piano Agenzia Mensile",
          subtitle: "Tutte le funzioni incluse",
          desc: "Accesso completo all'estensione Chrome GetNearMe per agenti immobiliari: analisi di zona, render AI, video, post social e report PDF white-label. Strumento di supporto al lavoro quotidiano dell'agenzia, non un sistema di valutazione immobiliare. Fino a 5 agenti, 7 giorni di prova gratuita senza limiti."
        },
        {
          name: "Piano Agenzia Trimestrale",
          subtitle: "Tutte le funzioni incluse",
          desc: "Accesso completo per 3 mesi a tutte le funzionalità di GetNearMe con risparmio rispetto al mensile. Fino a 5 agenti, 7 giorni di prova gratuita."
        },
        {
          name: "Piano Agenzia Annuale",
          subtitle: "Il più conveniente",
          desc: "Accesso completo per 12 mesi a tutte le funzionalità di GetNearMe con il massimo risparmio e supporto prioritario. Fino a 5 agenti, 7 giorni di prova gratuita."
        }
      ]
    },
    cta: {
      title: "Distingui la tua agenzia",
      title2: "con strumenti professionali",
      titleItalic: "avanzati",
      desc: "Semplifica i processi e rafforza la qualità delle tue presentazioni.",
      button: "Aggiungi estensione",
      requestInfo: "Richiedi informazioni",
    },
    howItWorks: {
      step1Title: "Crea il tuo account",
      step1Desc: "Registrati in pochi secondi e accedi alla piattaforma.",
      step2Title: "Attiva il piano Agenzia",
      step2Desc: "Dal tuo profilo, accedi alla sezione abbonamento e attiva il piano professionale mensile.",
      step3Title: "Inizia subito a lavorare",
      step3Desc: "L'accesso è immediato: puoi utilizzare tutte le funzionalità direttamente nei portali immobiliari che già utilizzi.",
      cta: "Inizia con GetNearMe",
      videoTitle: "GetNearMe — Come funziona",
    },
    footer: {
      desc: "L'estensione Chrome con AI per agenti immobiliari. Semplifica il lavoro quotidiano: analisi di zona, render foto, video, post social e report PDF direttamente sui portali che usi ogni giorno.",
      product: "Prodotto",
      legal: "Legale",
      privacy: "Privacy Policy",
      cookie: "Cookie Policy",
      terms: "Termini di Servizio",
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
      description: "La tua iscrizione al servizio è stata confermata con successo. Ritorna all'estensione ed inizia a utilizzare tutte le funzionalità di GetNearMe!",
      cta: "Inizia ad esplorare"
    },
    unsubscribe: {
      subtitle: "Disiscrizione completata",
      description: "Sei stato rimosso con successo dalla nostra mailing list. Non riceverai più email da GetNearMe."
    },
    featuresPage: {
      title: "Tutte le Funzionalità",
      titleItalic: "di GetNearMe",
      subtitle: "Scopri tutti gli strumenti avanzati pensati per trasformare il lavoro della tua agenzia immobiliare. Dall'analisi territoriale all'intelligenza artificiale, ogni funzionalità è progettata per offrirti un vantaggio competitivo reale.",
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
      ctaDesc: "Unisciti alle agenzie immobiliari che stanno già trasformando il loro modo di lavorare con GetNearMe.",
      ctaButton: "Aggiungi Estensione",
      ctaContact: "Contattaci",
    },
    landing: {
      topBar: {
        promo: "Offerta lancio:",
        discount: "7 giorni gratis, senza limiti",
        expiresIn: "scade tra",
        freeTrialShort: "nessuna carta richiesta",
      },
      hero: {
        badge: "",
        title1: "Risparmia ore di lavoro",
        title2: "con la migliore AI per agenti immobiliari.",
        desc: "GetNearMe è l'estensione per Google Chrome che vive dentro Immobiliare.it, Idealista, Casa.it, Airbnb e Booking. Semplifica le attività quotidiane dell'agenzia: analisi di zona, post social, reel, render AI delle foto e report PDF.",
        ctaPrimary: "Aggiungi estensione — 7 giorni gratis",
        ctaSecondary: "Guarda la demo",
        stats: ["7 giorni gratis senza limiti", "Si installa in 2 secondi", "Integrato con 5 portali", "GDPR compliant"],
      },
      problem: {
        emoji: "frown",
        title: "Canva, Photoshop, PowerPoint, CapCut, Google Maps: 10 tab aperte per un solo annuncio.",
        desc: "Per valutare una zona, sistemare le foto, preparare un post Instagram o un PDF da mandare al cliente ti servono cinque software diversi — che costano, non si parlano tra loro e ti rubano ore di lavoro ogni settimana. Nel frattempo il cliente aspetta.",
      },
      solution: {
        emoji: "rocket",
        title: "Un'estensione Chrome. Tutto il lavoro sull'annuncio, finito.",
        desc: "GetNearMe si attiva con un click sui portali che già usi. Apri un immobile su Immobiliare.it, Idealista, Casa.it, Airbnb o Booking e ottieni analisi di zona, render AI, video, post social e report PDF col tuo brand — senza aprire altro software. Uno strumento per semplificare il lavoro quotidiano dell'agente, non per sostituire valutazioni o perizie professionali.",
      },
      features: {
        title: "Sei strumenti professionali.",
        titleHighlight: "Dentro il browser.",
        subtitle: "GetNearMe sostituisce Canva, Photoshop, video editor, interior designer, social media manager e PowerPoint con un'unica estensione Chrome. Funziona su Immobiliare.it, Idealista, Casa.it, Airbnb e Booking.",
        items: [
          { num: "01", title: "Analisi di zona interattiva", desc: "Servizi, trasporti, scuole, sanità, parchi e punti di interesse reali mostrati su mappa in tempo reale. Racconta il quartiere al cliente con dati concreti.", icon: "map", color: "#0ea5e9" },
          { num: "02", title: "Prezzo medio di zona al m²", desc: "Dati di riferimento sul prezzo medio €/m² della zona e confronti tra immobili simili, utili per preparare presentazioni al cliente e impostare trattative. Sono informazioni di mercato a scopo illustrativo, non costituiscono una perizia o valutazione ufficiale.", icon: "trending-up", color: "#f59e0b" },
          { num: "03", title: "Homestaging AI", desc: "Arreda stanze vuote, corregge la luce e libera gli ambienti in circa 10 secondi. Otto stili selezionabili, prima/dopo pronti per cliente o social. Sostituisce Photoshop e interior designer.", icon: "sparkles", color: "#6366f1" },
          { num: "04", title: "Video AI per l'immobile", desc: "Reel e video promozionali con avatar parlante, sottotitoli, walkthrough e before/after. Sei template, zero editing. Sostituisce CapCut, Premiere e video maker.", icon: "clapperboard", color: "#10b981" },
          { num: "05", title: "Post, reel e storie social", desc: "Contenuti pronti per Instagram, Facebook, TikTok e LinkedIn partendo dai dati dell'annuncio. Logo, colori e identità della tua agenzia applicati in automatico. Sostituisce Canva e social media manager.", icon: "smartphone", color: "#ec4899" },
          { num: "06", title: "Report PDF white-label", desc: "Presentazioni comparative col tuo logo, colori e font. Confronta più immobili in un documento professionale, pronto da inviare. Sostituisce PowerPoint e graphic designer.", icon: "file-text", color: "#f97316" },
        ],
      },
      testimonials: {
        title: "Pensata per come lavori davvero.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Agenzia immobiliare", role: "Titolare — Nord Italia", text: "Apro l'annuncio su Immobiliare.it e in cinque minuti ho l'analisi di zona, le foto arredate con AI, il post Instagram e il PDF da mandare al cliente. Prima era una giornata di lavoro tra Canva, Photoshop e PowerPoint.", avatar: "AI", color: "#f59e0b" },
          { name: "Agente immobiliare", role: "Senior — Centro Italia", text: "L'homestaging AI convince il proprietario. Gli mostro la stanza vuota, poi arredata in 10 secondi. È l'unica cosa che uso per chiudere l'acquisizione al primo incontro.", avatar: "AI", color: "#6366f1" },
          { name: "Gruppo immobiliare", role: "Direttore — Sud Italia", text: "Abbiamo smesso di pagare Canva, CapCut e un grafico esterno. Con GetNearMe l'intera agenzia produce contenuti coerenti col brand, direttamente dai portali che già usiamo ogni giorno.", avatar: "GI", color: "#10b981" },
        ],
      },
      pricing: {
        title1: "Un piano.",
        title2: "Tutti gli strumenti.",
        titleHighlight: "7 giorni gratis.",
        subtitle: "Accesso completo a tutte le funzioni durante la prova. Nessun vincolo annuale. Disdici quando vuoi.",
        countdownLabel: "Prezzo lancio — scade tra",
        trustBadges: ["🔒 Pagamento sicuro Stripe", "✅ Nessun addebito per 7 giorni", "⚡ Attivazione immediata"],
        savingsLabel: "RISPARMI",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "agency_monthly", name: "Mensile", users: "Tutte le funzioni incluse", oldPrice: null, price: 399,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agenti inclusi", "Analisi di zona illimitate", "Prezzo medio di zona al m²", "Homestaging AI", "Video AI con avatar e sottotitoli", "Post social per IG, FB, TikTok, LinkedIn", "Report PDF white-label col tuo logo", "Integrazione Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Inizia 7 giorni gratis",
          },
          {
            id: "agency_quarterly", name: "Trimestrale", users: "Tutte le funzioni incluse", oldPrice: null, price: 349,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agenti inclusi", "Analisi di zona illimitate", "Prezzo medio di zona al m²", "Homestaging AI", "Video AI con avatar e sottotitoli", "Post social per IG, FB, TikTok, LinkedIn", "Report PDF white-label col tuo logo", "Integrazione Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Inizia 7 giorni gratis",
          },
          {
            id: "agency_annual", name: "Annuale", users: "Tutte le funzioni incluse", oldPrice: null, price: 300,
            savingsYear: null, badge: "Più conveniente", popular: false,
            features: ["5 agenti inclusi", "Analisi di zona illimitate", "Prezzo medio di zona al m²", "Homestaging AI", "Video AI con avatar e sottotitoli", "Post social per IG, FB, TikTok, LinkedIn", "Report PDF white-label col tuo logo", "Integrazione Immobiliare.it, Idealista, Casa.it, Airbnb, Booking", "Supporto prioritario"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Inizia 7 giorni gratis",
          },
        ],
      },
      howItWorks: {
        title: "Operativo in",
        titleHighlight: "2 secondi",
        subtitle: "Nessun software da installare. Nessuna formazione. L'estensione si integra nei portali che usi già ogni giorno.",
        steps: [
          { step: "1", title: "Aggiungi a Chrome", desc: "Un click dal Chrome Web Store. L'estensione GetNearMe si installa nel browser in meno di 2 secondi.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Apri un annuncio", desc: "Immobiliare.it, Idealista, Casa.it, Airbnb o Booking: i portali che già usi ogni giorno. GetNearMe si attiva in automatico sull'annuncio.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Genera tutto col click", desc: "Analisi di zona, render AI, video, post social e PDF col tuo brand. Pronti da mostrare al cliente, senza aprire altro software.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Domande?",
        titleHighlight: "Risposte.",
        items: [
          { q: "Cos'è esattamente GetNearMe?", a: "Un'estensione per il browser Google Chrome, pensata per agenti e agenzie immobiliari. È un servizio online che semplifica alcune attività quotidiane dell'agenzia — analisi di zona, creazione di contenuti, presentazioni al cliente — direttamente dentro i portali che usi ogni giorno. Si installa dal Chrome Web Store in 2 secondi." },
          { q: "GetNearMe fa valutazioni immobiliari ufficiali?", a: "No. GetNearMe non è un sistema di valutazione immobiliare e non sostituisce in alcun modo una perizia, una stima o una certificazione professionale. I dati di zona e i prezzi medi al m² sono informazioni di mercato a scopo illustrativo, utili per preparare presentazioni e trattative. Ogni valutazione formale resta responsabilità dell'agente, del perito o del tecnico abilitato." },
          { q: "Su quali portali funziona?", a: "Immobiliare.it, Idealista, Casa.it, Airbnb e Booking. Apri l'annuncio e GetNearMe legge in automatico i dati dell'immobile per generare analisi di zona, contenuti e report." },
          { q: "Quali tool sostituisce?", a: "GetNearMe concentra in un'unica estensione lavori che oggi fai con Canva, Photoshop, video editor, PowerPoint, tool di analisi di zona e servizi esterni di home staging o grafica. L'obiettivo è farti risparmiare ore di lavoro per ogni immobile." },
          { q: "Come funziona l'homestaging AI?", a: "Scegli la foto di una stanza vuota o arredata, selezioni uno degli stili disponibili e l'AI restituisce la versione arredata in circa 10 secondi. Puoi usare il prima/dopo direttamente nei post social, nei video o nel PDF cliente." },
          { q: "Posso creare video senza saper montare?", a: "Sì. Scegli un template (avatar parlante, sottotitoli, walkthrough, before/after, split screen, video di staging) e GetNearMe monta musica, testi e clip partendo dall'annuncio. Nessun software di editing richiesto." },
          { q: "Il mio brand viene applicato automaticamente?", a: "Sì. Carichi logo, colori e font una volta sola: vengono applicati in automatico su PDF, video e post social per tutti gli agenti dell'agenzia." },
          { q: "Quanti agenti posso aggiungere?", a: "Ogni piano include 5 agenti con accesso condiviso allo stesso branding. Ogni agente ha il proprio account ma lavora sotto l'identità dell'agenzia." },
          { q: "Come funziona la prova gratuita?", a: "7 giorni di accesso completo, senza limiti di utilizzo. Disdici con un click dalla dashboard, nessun addebito se cancelli entro 7 giorni." },
        ],
      },
      finalCta: {
        title1: "Smetti di saltare tra 10 software.",
        title2: "Tutto il lavoro sull'annuncio, in un'estensione.",
        desc: "Prova GetNearMe 7 giorni gratis, senza limiti. Disdici quando vuoi.",
        button: "Aggiungi estensione — 7 giorni gratis",
        footer: "🔒 Nessun addebito durante la prova. Cancelli con un click.",
      },
      modal: {
        emoji: "rocket",
        title: "Ottima scelta!",
        planLabel: "Piano",
        desc: "Accedi o registrati per attivare i tuoi",
        descBold: "7 giorni di prova gratuita",
        descEnd: "con accesso completo a tutte le funzioni.",
        cta: "Attiva la prova gratuita",
        footer: "🔒 Nessun addebito per 7 giorni. Cancelli con un click.",
      },
      popups: [
        { icon: "circle", text: "Un'agenzia del Nord Italia ha attivato la prova gratuita", time: "3 min fa" },
        { icon: "clapperboard", text: "Un agente ha appena generato un video promozionale con AI", time: "" },
        { icon: "users", text: "Agenzie online in questo momento", time: "" },
        { icon: "rocket", text: "Un agente ha iniziato i 7 giorni di prova gratuita", time: "12 min fa" },
        { icon: "flame", text: "GetNearMe scelto da nuove agenzie questa settimana", time: "" },
        { icon: "sparkles", text: "Un agente ha arredato una stanza con Homestaging AI", time: "5 min fa" },
        { icon: "star", text: "Un'agenzia ha fatto upgrade al piano Annuale", time: "18 min fa" },
        { icon: "smartphone", text: "Post social generati questa settimana con GetNearMe", time: "" },
        { icon: "target", text: "Un agente ha esportato un PDF white-label col proprio logo", time: "7 min fa" },
        { icon: "briefcase", text: "Un'agenzia si è appena registrata alla prova gratuita", time: "2 min fa" },
        { icon: "trophy", text: "GetNearMe usato da agenti immobiliari in tutta Italia", time: "" },
        { icon: "map", text: "Un agente ha generato analisi di zona dai portali immobiliari", time: "9 min fa" },
      ],
    },
  },
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutorial",
      startAnalysis: "Start Analysis",
      backToHome: "← Back to home",
      dashboard: "Dashboard",
      myAccount: "My account"
    },
    hero: {
      title1: "The competitive edge",
      title2: "that sets your",
      title3: "agency apart",
      description: "Zone analysis, professional comparisons, and AI to enhance properties and presentations. Offer a service that goes beyond simple listings.",
      cta: "Add Extension",
      ctaSecondary: "How it works",
      subMockup: "GetNearMe is a Google Chrome extension that empowers your agency. It analyzes properties and neighborhoods, compares zone data, generates comparative estimates and professional presentations... all automatically while you browse the real estate portals you already use."
    },
    features: {
      title: "The property, in its",
      titleItalic: "essential data",
      description: "GetNearMe organizes information into clear steps, to help you compare properties and context in a structured way.",
      card1: {
        title: "Property data",
        desc: "Price, surface area, €/sqm, type and main features are collected and organized from listing data."
      },
      card2: {
        title: "Neighborhood context",
        desc: "Services, transport, schools, green areas and points of interest are analyzed based on location and distances."
      },
      card3: {
        title: "Real-time market value",
        desc: "Get the average price per m² in the area to support valuations, acquisitions, and negotiations with concrete data."
      },
      card4: {
        title: "Comparative view",
        desc: "Information is displayed side-by-side to highlight relevant differences between multiple analyzed options."
      },
      card5: {
        title: "Show the Potential with AI",
        desc: "Edit photos with AI and show before/after comparisons: empty or furnished rooms, improved lighting, and enhanced spaces in seconds."
      },
      disclaimer: "The analyzes and estimates shown are indicative and do not constitute a real estate appraisal.",
      addExtension: "Add extension",
      comingSoonTitle: "Coming soon",
      comingSoonDesc: "We are developing new features designed to make your agency's work even more structured and efficient.",
    },
    faq: {
      title: "Frequently Asked",
      titleItalic: "Questions",
      items: [
        {
          q: "What kind of information does it show?",
          a: "GetNearMe shows organized data from real estate listings and available public sources, regarding the property, neighborhood and price and cost indicators."
        },
        {
          q: "Is it a real estate portal or agency?",
          a: "No. GetNearMe does not publish listings and does not perform real estate brokerage. It is a tool for data analysis and comparison."
        },
        {
          q: "Are they all official evaluations?",
          a: "No. The analyzes and estimates shown are indicative and do not constitute a real estate appraisal or professional advice."
        },
        {
          q: "Where does the data come from?",
          a: "The data comes from the analyzed real estate listings and available public sources. The information is processed for easier reading and comparison."
        },
        {
          q: "Are the cost estimates accurate?",
          a: "No. Cost estimates are indicative projections based on average values and may vary based on specific property and transaction characteristics."
        },
        {
          q: "Can I compare multiple properties with each other?",
          a: "Yes. GetNearMe allows you to side-by-side multiple properties to compare data, context and indicators in a comparative view."
        }
      ]
    },
    pricing: {
      title: "Access to",
      titleItalic: "analyzes",
      description: "Choose the access level that best fits the number of analyzes you want to perform.",
      free: "Free",
      buyNow: "Buy now",
      registerNow: "Register now",
      mostChosen: "Most chosen",
      footer1: "Secure payment with card, PayPal and major providers.",
      footer2: "Credits available immediately after purchase.",
      footer3: "No subscription. No expiration.",
      plans: [
        {
          name: "500 credits",
          subtitle: "To start",
          desc: "Allows you to perform some complete analyzes to compare properties and context in a structured way."
        },
        {
          name: "500 credits",
          subtitle: "To start",
          desc: "Allows you to perform some complete analyzes to compare properties and context in a structured way."
        },
        {
          name: "1,500 credits",
          subtitle: "Deep comparisons",
          desc: "Suitable for comparing multiple options and deepening differences between properties, neighborhoods and estimated costs."
        },
        {
          name: "5,000 credits",
          subtitle: "Extended analyzes",
          desc: "Designed for those analyzing many options and wanting deeper comparisons over time."
        }
      ]
    },
    cta: {
      title: "Compare properties",
      title2: "in a",
      titleItalic: "structured way",
      desc: "GetNearMe helps you organize and compare available data to evaluate multiple options with greater clarity.",
      button: "Add extension",
      requestInfo: "Request information",
    },
    howItWorks: {
      step1Title: "Create your account",
      step1Desc: "Sign up in a few seconds and access the platform.",
      step2Title: "Activate the Agency plan",
      step2Desc: "From your profile, go to the subscription section and activate the professional monthly plan.",
      step3Title: "Start working right away",
      step3Desc: "Access is immediate: you can use all the features directly on the real estate portals you already use.",
      cta: "Start with GetNearMe",
      videoTitle: "GetNearMe — How it works",
    },
    footer: {
      desc: "Decision support tool for comparative analysis of properties and neighborhoods.",
      product: "Product",
      legal: "Legal",
      privacy: "Privacy Policy",
      cookie: "Cookie Policy",
      terms: "Terms of Service",
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
      title: "All Features",
      titleItalic: "of GetNearMe",
      subtitle: "Discover all the advanced tools designed to transform your real estate agency's workflow. From territorial analysis to artificial intelligence, every feature is built to give you a real competitive advantage.",
      feature6: {
        title: "Automated Real Estate Marketing",
        desc: "Turn property data into professional posts, already optimized for the major social networks.",
        badge: "NEW",
      },
      feature7: {
        title: "Property Videos in a Few Clicks",
        desc: "Create professional video content in just a few clicks to promote every property in a modern and impactful way.",
        badge: "NEW",
      },
      ctaTitle: "Ready to get started?",
      ctaDesc: "Join the real estate agencies already transforming their workflow with GetNearMe.",
      ctaButton: "Add Extension",
      ctaContact: "Contact Us",
    },
    landing: {
      topBar: {
        promo: "Launch offer:",
        discount: "7 days free, no limits",
        expiresIn: "expires in",
        freeTrialShort: "no card required",
      },
      hero: {
        badge: "",
        title1: "Save hours of work",
        title2: "with the best AI for real estate agents.",
        desc: "GetNearMe is the Google Chrome extension that lives inside Immobiliare.it, Idealista, Casa.it, Airbnb and Booking. Simplifies the agency's daily work: area analysis, social posts, reels, AI renders of photos and PDF reports.",
        ctaPrimary: "Add extension — 7 days free",
        ctaSecondary: "Watch the demo",
        stats: ["7 days free, no limits", "Installs in 2 seconds", "Integrated with 5 portals", "GDPR compliant"],
      },
      problem: {
        emoji: "frown",
        title: "Canva, Photoshop, PowerPoint, CapCut, Google Maps: 10 tabs open for a single listing.",
        desc: "To evaluate an area, fix photos, prepare an Instagram post or a PDF to send to the client you need five different tools — which cost money, don't talk to each other and steal hours of work every week. Meanwhile the client is waiting.",
      },
      solution: {
        emoji: "rocket",
        title: "One Chrome extension. All the work on the listing, done.",
        desc: "GetNearMe activates with one click on the portals you already use. Open a property on Immobiliare.it, Idealista, Casa.it, Airbnb or Booking and get area analysis, AI render, video, social posts and PDF report with your brand — without opening any other software. A tool to simplify the agent's daily work, not a substitute for professional valuations or appraisals.",
      },
      features: {
        title: "Six professional tools.",
        titleHighlight: "Inside the browser.",
        subtitle: "GetNearMe replaces Canva, Photoshop, video editor, interior designer, social media manager and PowerPoint with a single Chrome extension. Works on Immobiliare.it, Idealista, Casa.it, Airbnb and Booking.",
        items: [
          { num: "01", title: "Interactive area analysis", desc: "Services, transport, schools, healthcare, parks and real points of interest shown on a map in real time. Tell the client about the neighbourhood with concrete data.", icon: "map", color: "#0ea5e9" },
          { num: "02", title: "Average area €/m² price", desc: "Reference data on the average €/m² price in the area and comparisons between similar properties, useful for preparing client presentations and setting up negotiations. Market information for illustrative purposes — it does not constitute a professional appraisal or official valuation.", icon: "trending-up", color: "#f59e0b" },
          { num: "03", title: "AI Homestaging", desc: "Furnishes empty rooms, corrects lighting and clears spaces in about 10 seconds. Eight selectable styles, before/after ready for client or social. Replaces Photoshop and interior designer.", icon: "sparkles", color: "#6366f1" },
          { num: "04", title: "AI Video for the property", desc: "Reels and promotional videos with talking avatar, subtitles, walkthrough and before/after. Six templates, zero editing. Replaces CapCut, Premiere and video maker.", icon: "clapperboard", color: "#10b981" },
          { num: "05", title: "Posts, reels and social stories", desc: "Content ready for Instagram, Facebook, TikTok and LinkedIn starting from the listing data. Your agency's logo, colours and identity applied automatically. Replaces Canva and social media manager.", icon: "smartphone", color: "#ec4899" },
          { num: "06", title: "White-label PDF report", desc: "Comparative presentations with your logo, colours and font. Compare multiple properties in one professional document, ready to send. Replaces PowerPoint and graphic designer.", icon: "file-text", color: "#f97316" },
        ],
      },
      testimonials: {
        title: "Built for how you actually work.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Real estate agency", role: "Owner — Northern Italy", text: "I open the listing on Immobiliare.it and in five minutes I have area analysis, AI-furnished photos, Instagram post and PDF to send to the client. Before it was a full day's work between Canva, Photoshop and PowerPoint.", avatar: "AI", color: "#f59e0b" },
          { name: "Real estate agent", role: "Senior — Central Italy", text: "AI homestaging convinces the owner. I show the empty room, then furnished in 10 seconds. It's the only thing I use to close the acquisition at the first meeting.", avatar: "AI", color: "#6366f1" },
          { name: "Real estate group", role: "Director — Southern Italy", text: "We stopped paying for Canva, CapCut and an external graphic designer. With GetNearMe the entire agency produces brand-consistent content directly from the portals we already use every day.", avatar: "GI", color: "#10b981" },
        ],
      },
      pricing: {
        title1: "One plan.",
        title2: "All the tools.",
        titleHighlight: "7 days free.",
        subtitle: "Full access to all features during the trial. No annual commitment. Cancel anytime.",
        countdownLabel: "Launch price — expires in",
        trustBadges: ["🔒 Secure payment with Stripe", "✅ No charge for 7 days", "⚡ Instant activation"],
        savingsLabel: "YOU SAVE",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "agency_monthly", name: "Monthly", users: "All features included", oldPrice: null, price: 399,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agents included", "Unlimited area analyses", "Average area €/m² price", "AI Homestaging", "AI Video with avatar and subtitles", "Social posts for IG, FB, TikTok, LinkedIn", "White-label PDF report with your logo", "Integration with Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Start 7 days free",
          },
          {
            id: "agency_quarterly", name: "Quarterly", users: "All features included", oldPrice: null, price: 349,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agents included", "Unlimited area analyses", "Average area €/m² price", "AI Homestaging", "AI Video with avatar and subtitles", "Social posts for IG, FB, TikTok, LinkedIn", "White-label PDF report with your logo", "Integration with Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Start 7 days free",
          },
          {
            id: "agency_annual", name: "Annual", users: "All features included", oldPrice: null, price: 300,
            savingsYear: null, badge: "Best value", popular: false,
            features: ["5 agents included", "Unlimited area analyses", "Average area €/m² price", "AI Homestaging", "AI Video with avatar and subtitles", "Social posts for IG, FB, TikTok, LinkedIn", "White-label PDF report with your logo", "Integration with Immobiliare.it, Idealista, Casa.it, Airbnb, Booking", "Priority support"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Start 7 days free",
          },
        ],
      },
      howItWorks: {
        title: "Up and running in",
        titleHighlight: "2 seconds",
        subtitle: "No software to install. No training needed. The extension integrates into the portals you already use every day.",
        steps: [
          { step: "1", title: "Add to Chrome", desc: "One click from the Chrome Web Store. The GetNearMe extension installs in your browser in less than 2 seconds.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Open a listing", desc: "Immobiliare.it, Idealista, Casa.it, Airbnb or Booking: the portals you already use every day. GetNearMe activates automatically on the listing.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Generate everything with a click", desc: "Area analysis, AI render, video, social posts and PDF with your brand. Ready to show the client, without opening any other software.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Questions?",
        titleHighlight: "Answers.",
        items: [
          { q: "What exactly is GetNearMe?", a: "A browser extension for Google Chrome, designed for real estate agents and agencies. It installs from the Chrome Web Store in 2 seconds and is not software you need to learn: it activates automatically when you open a listing on supported portals." },
          { q: "Does GetNearMe perform official property valuations?", a: "No. GetNearMe is not a property valuation system and does not replace a professional appraisal, estimate, or certification in any way. Area data and average €/m² prices are market information for illustrative purposes, useful for preparing presentations and negotiations. Any formal valuation remains the responsibility of the agent, appraiser, or qualified professional." },
          { q: "Which portals does it work on?", a: "Immobiliare.it, Idealista, Casa.it, Airbnb and Booking. Open the listing and GetNearMe automatically reads the property data to generate analyses, content and reports." },
          { q: "Which tools does it replace?", a: "GetNearMe concentrates in a single extension work you currently do with Canva, Photoshop, video editors, PowerPoint, area analysis tools and external home staging or graphic design services. The goal is to save you hours of work for every property." },
          { q: "How does AI homestaging work?", a: "You choose a photo of an empty or furnished room, select one of the available styles and the AI returns the furnished version in about 10 seconds. You can use the before/after directly in social posts, videos or the client PDF." },
          { q: "Can I create videos without knowing how to edit?", a: "Yes. Choose a template (talking avatar, subtitles, walkthrough, before/after, split screen, staging video) and GetNearMe assembles music, text and clips from the listing. No editing software required." },
          { q: "Is my brand applied automatically?", a: "Yes. You upload your logo, colours and font once: they are applied automatically to PDFs, videos and social posts for all agents in the agency." },
          { q: "How many agents can I add?", a: "Every plan includes 5 agents with shared access to the same branding. Each agent has their own account but works under the agency's identity." },
          { q: "How does the free trial work?", a: "7 days of full access, with no usage limits. Cancel with one click from the dashboard, no charge if you cancel within 7 days." },
        ],
      },
      finalCta: {
        title1: "Stop jumping between 10 tools.",
        title2: "All the work on the listing, in one extension.",
        desc: "Try GetNearMe free for 7 days, with no limits. Cancel anytime.",
        button: "Add extension — 7 days free",
        footer: "🔒 No charge during the trial. Cancel with one click.",
      },
      modal: {
        emoji: "rocket",
        title: "Great choice!",
        planLabel: "Plan",
        desc: "Sign in or register to activate your",
        descBold: "7-day free trial",
        descEnd: "with full access to all features.",
        cta: "Activate free trial",
        footer: "🔒 No charge for 7 days. Cancel with one click.",
      },
      popups: [
        { icon: "circle", text: "An agency from Northern Italy activated the free trial", time: "3 min ago" },
        { icon: "clapperboard", text: "An agent just generated a promotional video with AI", time: "" },
        { icon: "users", text: "Agencies online right now", time: "" },
        { icon: "rocket", text: "An agent started the 7-day free trial", time: "12 min ago" },
        { icon: "flame", text: "GetNearMe chosen by new agencies this week", time: "" },
        { icon: "sparkles", text: "An agent furnished a room with AI Homestaging", time: "5 min ago" },
        { icon: "star", text: "An agency upgraded to the Annual plan", time: "18 min ago" },
        { icon: "smartphone", text: "Social posts generated this week with GetNearMe", time: "" },
        { icon: "target", text: "An agent exported a white-label PDF with their logo", time: "7 min ago" },
        { icon: "briefcase", text: "An agency just signed up for the free trial", time: "2 min ago" },
        { icon: "trophy", text: "GetNearMe used by real estate agents across Italy", time: "" },
        { icon: "map", text: "An agent generated area analysis from property portals", time: "9 min ago" },
      ],
    },
  },
  es: {
    nav: {
      features: "Funcionalidades",
      pricing: "Precios",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutorial",
      startAnalysis: "Iniciar Análisis",
      backToHome: "← Volver al inicio",
      dashboard: "Dashboard",
      myAccount: "Mi cuenta"
    },
    hero: {
      title1: "La ventaja competitiva",
      title2: "que distingue a",
      title3: "tu agencia",
      description: "Análisis de zona, comparaciones profesionales e IA para valorizar inmuebles y presentaciones. Ofrece un servicio que va más allá del simple anuncio.",
      cta: "Añadir Extensión",
      ctaSecondary: "Cómo funciona",
      subMockup: "GetNearMe es una extensión de Google Chrome que potencia el trabajo de tu agencia. Analiza inmuebles y barrios, compara datos de zona, genera estimaciones comparativas y presentaciones profesionales… todo automáticamente mientras navegas por los portales inmobiliarios que ya usas."
    },
    features: {
      title: "El inmueble, en sus datos",
      titleItalic: "esenciales",
      description: "GetNearMe organiza la información en pasos claros, para ayudarte a comparar inmuebles y contexto de forma estructurada.",
      card1: {
        title: "Datos del inmueble",
        desc: "Precio, superficie, €/m², tipologia y características principales se recogen y organizan a partir de los datos del anuncio."
      },
      card2: {
        title: "Contexto del barrio",
        desc: "Servicios, transporte, colegios, zonas verdes y puntos de interés se analizan en función de la ubicación y las distancias."
      },
      card3: {
        title: "Valor de mercado en tiempo real",
        desc: "Obtén el precio medio por m² de la zona para respaldar valoraciones, adquisiciones y negociaciones con datos concretos."
      },
      card4: {
        title: "Vista comparativa",
        desc: "La información se muestra en paralelo para resaltar las diferencias relevantes entre varias opciones analizadas."
      },
      card5: {
        title: "Muestra el Potencial con AI",
        desc: "Edita fotos con AI y muestra comparaciones antes/después: ambientes vacíos o amueblados, luz mejorada y espacios valorados en segundos."
      },
      disclaimer: "Los análisis y estimaciones mostrados son indicativos y no constituyen una tasación inmobiliaria.",
      addExtension: "Añadir extensión",
      comingSoonTitle: "Próximamente",
      comingSoonDesc: "Estamos desarrollando nuevas funcionalidades pensadas para hacer el trabajo de tu agencia aún más estructurado y eficiente.",
    },
    faq: {
      title: "Preguntas",
      titleItalic: "frecuentes",
      items: [
        {
          q: "¿Qué tipo de información muestra?",
          a: "GetNearMe muestra datos organizados procedentes de anuncios inmobiliarios y fuentes públicas disponibles, relativos al inmueble, al barrio y a indicadores de precio y coste."
        },
        {
          q: "¿Es un portal inmobiliario o una agencia?",
          a: "No. GetNearMe no publica anuncios y no realiza intermediación inmobiliaria. Es una herramienta de análisis y comparación de datos."
        },
        {
          q: "¿Son todas evaluaciones oficiales?",
          a: "No. Los análisis y estimaciones mostrados son indicativos y no constituyen una tasación inmobiliaria ni un asesoramiento profesional."
        },
        {
          q: "¿De dónde proceden los datos?",
          a: "Los datos proceden de los anuncios inmobiliarios analizados y de fuentes públicas disponibles. La información se procesa para facilitar su lectura y comparación."
        },
        {
          q: "¿Son precisas las estimaciones de costes?",
          a: "No. Las estimaciones de costes son proyecciones indicativas basadas en valores medios y pueden variar según las características específicas del inmueble y la operación."
        },
        {
          q: "¿Puedo comparar varios inmuebles entre sí?",
          a: "Sí. GetNearMe permite comparar varios inmuebles en paralelo para contrastar datos, contexto e indicadores en una vista comparativa."
        }
      ]
    },
    pricing: {
      title: "Acceso a los",
      titleItalic: "análisis",
      description: "Elige el nivel de acceso que mejor se adapte al número de análisis que desees realizar.",
      free: "Gratis",
      buyNow: "Comprar ahora",
      registerNow: "Regístrate ahora",
      mostChosen: "Más elegido",
      footer1: "Pago seguro con tarjeta, PayPal y principales proveedores.",
      footer2: "Créditos disponibles inmediatamente tras la compra.",
      footer3: "Sin suscripción. Sin caducidad.",
      plans: [
        {
          name: "500 créditos",
          subtitle: "Para empezar",
          desc: "Permite realizar algunos análisis completos para comparar inmuebles y contexto de forma estructurada."
        },
        {
          name: "500 créditos",
          subtitle: "Para empezar",
          desc: "Permite realizar algunos análisis completos para comparar inmuebles y contexto de forma estructurada."
        },
        {
          name: "1.500 créditos",
          subtitle: "Comparativas profundas",
          desc: "Adecuado para comparar varias opciones y profundizar en las diferencias entre inmuebles, barrios y costes estimados."
        },
        {
          name: "5.000 créditos",
          subtitle: "Análisis extendidos",
          desc: "Pensado para quienes analizan muchas opciones y desean comparativas más profundas en el tiempo."
        }
      ]
    },
    cta: {
      title: "Compara inmuebles",
      title2: "de forma",
      titleItalic: "estructurada",
      desc: "GetNearMe te ayuda a organizar y comparar los datos disponibles para evaluar múltiples opciones con mayor claridad.",
      button: "Añadir extensión",
      requestInfo: "Solicitar información",
    },
    howItWorks: {
      step1Title: "Crea tu cuenta",
      step1Desc: "Regístrate en pocos segundos y accede a la plataforma.",
      step2Title: "Activa el plan Agencia",
      step2Desc: "Desde tu perfil, accede a la sección de suscripción y activa el plan profesional mensual.",
      step3Title: "Empieza a trabajar de inmediato",
      step3Desc: "El acceso es inmediato: puedes utilizar todas las funcionalidades directamente en los portales inmobiliarios que ya usas.",
      cta: "Empieza con GetNearMe",
      videoTitle: "GetNearMe — Cómo funciona",
    },
    footer: {
      desc: "Herramienta de soporte a la decisión para el análisis comparativo de inmuebles y barrios.",
      product: "Producto",
      legal: "Legal",
      privacy: "Política de Privacidad",
      cookie: "Política de Cookies",
      terms: "Términos de Servicio",
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
      weekComplete: "¡Fantástico! ¡Has completado la semana! ¡Recibes 120 créditos extra!",
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
      subtitle: "Descubre todas las herramientas avanzadas diseñadas para transformar el trabajo de tu agencia inmobiliaria. Desde el análisis territorial hasta la inteligencia artificial, cada funcionalidad está diseñada para darte una ventaja competitiva real.",
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
      ctaDesc: "Únete a las agencias inmobiliarias que ya están transformando su forma de trabajar con GetNearMe.",
      ctaButton: "Añadir Extensión",
      ctaContact: "Contáctanos",
    },
    landing: {
      topBar: {
        promo: "Oferta de lanzamiento:",
        discount: "7 días gratis, sin límites",
        expiresIn: "expira en",
        freeTrialShort: "sin tarjeta requerida",
      },
      hero: {
        badge: "",
        title1: "Ahorra horas de trabajo",
        title2: "con la mejor IA para agentes inmobiliarios.",
        desc: "GetNearMe es la extensión para Google Chrome que vive dentro de Immobiliare.it, Idealista, Casa.it, Airbnb y Booking. Simplifica el trabajo diario de la agencia: análisis de zona, posts sociales, reels, renders AI de fotos e informes PDF.",
        ctaPrimary: "Añadir extensión — 7 días gratis",
        ctaSecondary: "Ver la demo",
        stats: ["7 días gratis sin límites", "Se instala en 2 segundos", "Integrado con 5 portales", "GDPR compliant"],
      },
      problem: {
        emoji: "frown",
        title: "Canva, Photoshop, PowerPoint, CapCut, Google Maps: 10 pestañas abiertas para un solo anuncio.",
        desc: "Para valorar una zona, arreglar fotos, preparar un post de Instagram o un PDF para enviar al cliente necesitas cinco software distintos — que cuestan, no se hablan entre sí y te roban horas de trabajo cada semana. Mientras tanto el cliente espera.",
      },
      solution: {
        emoji: "rocket",
        title: "Una extensión Chrome. Todo el trabajo sobre el anuncio, terminado.",
        desc: "GetNearMe se activa con un clic en los portales que ya usas. Abre un inmueble en Immobiliare.it, Idealista, Casa.it, Airbnb o Booking y obtén análisis de zona, render AI, vídeo, posts sociales e informe PDF con tu marca — sin abrir ningún otro software. Una herramienta para simplificar el trabajo diario del agente, no un sustituto de tasaciones o peritaciones profesionales.",
      },
      features: {
        title: "Seis herramientas profesionales.",
        titleHighlight: "Dentro del navegador.",
        subtitle: "GetNearMe sustituye a Canva, Photoshop, editor de vídeo, interiorista, social media manager y PowerPoint con una única extensión Chrome. Funciona en Immobiliare.it, Idealista, Casa.it, Airbnb y Booking.",
        items: [
          { num: "01", title: "Análisis de zona interactivo", desc: "Servicios, transportes, colegios, sanidad, parques y puntos de interés reales mostrados en mapa en tiempo real. Habla del barrio al cliente con datos concretos.", icon: "map", color: "#0ea5e9" },
          { num: "02", title: "Precio medio de zona por m²", desc: "Datos de referencia sobre el precio medio €/m² de la zona y comparativas entre inmuebles similares, útiles para preparar presentaciones al cliente e iniciar negociaciones. Información de mercado a título orientativo — no constituye una peritación o tasación oficial.", icon: "trending-up", color: "#f59e0b" },
          { num: "03", title: "Homestaging AI", desc: "Amuebla habitaciones vacías, corrige la luz y despeja los ambientes en unos 10 segundos. Ocho estilos seleccionables, antes/después listos para cliente o redes sociales. Sustituye a Photoshop e interiorista.", icon: "sparkles", color: "#6366f1" },
          { num: "04", title: "Vídeo AI para el inmueble", desc: "Reels y vídeos promocionales con avatar parlante, subtítulos, walkthrough y before/after. Seis plantillas, cero edición. Sustituye a CapCut, Premiere y video maker.", icon: "clapperboard", color: "#10b981" },
          { num: "05", title: "Posts, reels e historias sociales", desc: "Contenidos listos para Instagram, Facebook, TikTok y LinkedIn partiendo de los datos del anuncio. Logo, colores e identidad de tu agencia aplicados automáticamente. Sustituye a Canva y social media manager.", icon: "smartphone", color: "#ec4899" },
          { num: "06", title: "Informe PDF white-label", desc: "Presentaciones comparativas con tu logo, colores y tipografía. Compara varios inmuebles en un documento profesional, listo para enviar. Sustituye a PowerPoint y diseñador gráfico.", icon: "file-text", color: "#f97316" },
        ],
      },
      testimonials: {
        title: "Pensada para como trabajas de verdad.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Agencia inmobiliaria", role: "Propietario — Norte de Italia", text: "Abro el anuncio en Immobiliare.it y en cinco minutos tengo análisis de zona, fotos amuebladas con IA, post de Instagram y PDF para enviar al cliente. Antes era un día entero de trabajo entre Canva, Photoshop y PowerPoint.", avatar: "AI", color: "#f59e0b" },
          { name: "Agente inmobiliario", role: "Senior — Centro de Italia", text: "El homestaging AI convence al propietario. Le muestro la habitación vacía, luego amueblada en 10 segundos. Es lo único que uso para cerrar la captación en el primer encuentro.", avatar: "AI", color: "#6366f1" },
          { name: "Grupo inmobiliario", role: "Director — Sur de Italia", text: "Dejamos de pagar Canva, CapCut y un diseñador externo. Con GetNearMe toda la agencia produce contenidos coherentes con la marca, directamente desde los portales que ya usamos cada día.", avatar: "GI", color: "#10b981" },
        ],
      },
      pricing: {
        title1: "Un plan.",
        title2: "Todas las herramientas.",
        titleHighlight: "7 días gratis.",
        subtitle: "Acceso completo a todas las funciones durante la prueba. Sin compromiso anual. Cancela cuando quieras.",
        countdownLabel: "Precio de lanzamiento — expira en",
        trustBadges: ["🔒 Pago seguro con Stripe", "✅ Sin cobro durante 7 días", "⚡ Activación inmediata"],
        savingsLabel: "AHORRAS",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "agency_monthly", name: "Mensual", users: "Todas las funciones incluidas", oldPrice: null, price: 399,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agentes incluidos", "Análisis de zona ilimitados", "Precio medio de zona por m²", "Homestaging AI", "Vídeo AI con avatar y subtítulos", "Posts sociales para IG, FB, TikTok, LinkedIn", "Informe PDF white-label con tu logo", "Integración con Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Empieza 7 días gratis",
          },
          {
            id: "agency_quarterly", name: "Trimestral", users: "Todas las funciones incluidas", oldPrice: null, price: 349,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agentes incluidos", "Análisis de zona ilimitados", "Precio medio de zona por m²", "Homestaging AI", "Vídeo AI con avatar y subtítulos", "Posts sociales para IG, FB, TikTok, LinkedIn", "Informe PDF white-label con tu logo", "Integración con Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Empieza 7 días gratis",
          },
          {
            id: "agency_annual", name: "Anual", users: "Todas las funciones incluidas", oldPrice: null, price: 300,
            savingsYear: null, badge: "Más conveniente", popular: false,
            features: ["5 agentes incluidos", "Análisis de zona ilimitados", "Precio medio de zona por m²", "Homestaging AI", "Vídeo AI con avatar y subtítulos", "Posts sociales para IG, FB, TikTok, LinkedIn", "Informe PDF white-label con tu logo", "Integración con Immobiliare.it, Idealista, Casa.it, Airbnb, Booking", "Soporte prioritario"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Empieza 7 días gratis",
          },
        ],
      },
      howItWorks: {
        title: "Operativo en",
        titleHighlight: "2 segundos",
        subtitle: "Ningún software que instalar. Ninguna formación. La extensión se integra en los portales que ya usas cada día.",
        steps: [
          { step: "1", title: "Añade a Chrome", desc: "Un clic desde Chrome Web Store. La extensión GetNearMe se instala en el navegador en menos de 2 segundos.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Abre un anuncio", desc: "Immobiliare.it, Idealista, Casa.it, Airbnb o Booking: los portales que ya usas cada día. GetNearMe se activa automáticamente en el anuncio.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Genera todo con un clic", desc: "Análisis de zona, render AI, vídeo, posts sociales y PDF con tu marca. Listos para mostrar al cliente, sin abrir ningún otro software.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "¿Preguntas?",
        titleHighlight: "Respuestas.",
        items: [
          { q: "¿Qué es exactamente GetNearMe?", a: "Una extensión para el navegador Google Chrome, pensada para agentes y agencias inmobiliarias. Se instala desde Chrome Web Store en 2 segundos y no es un software que aprender: se activa automáticamente cuando abres un anuncio en los portales compatibles." },
          { q: "¿GetNearMe realiza tasaciones inmobiliarias oficiales?", a: "No. GetNearMe no es un sistema de tasación inmobiliaria y no sustituye en modo alguno una peritación, estimación o certificación profesional. Los datos de zona y los precios medios por m² son información de mercado a título orientativo, útiles para preparar presentaciones y negociaciones. Toda tasación formal sigue siendo responsabilidad del agente, perito o técnico habilitado." },
          { q: "¿En qué portales funciona?", a: "Immobiliare.it, Idealista, Casa.it, Airbnb y Booking. Abre el anuncio y GetNearMe lee automáticamente los datos del inmueble para generar análisis, contenidos e informes." },
          { q: "¿Qué herramientas sustituye?", a: "GetNearMe concentra en una sola extensión trabajos que hoy realizas con Canva, Photoshop, editores de vídeo, PowerPoint, herramientas de análisis de zona y servicios externos de home staging o diseño gráfico. El objetivo es ahorrarte horas de trabajo por cada inmueble." },
          { q: "¿Cómo funciona el homestaging AI?", a: "Eliges la foto de una habitación vacía o amueblada, seleccionas uno de los estilos disponibles y la IA devuelve la versión amueblada en unos 10 segundos. Puedes usar el antes/después directamente en posts sociales, vídeos o el PDF del cliente." },
          { q: "¿Puedo crear vídeos sin saber montar?", a: "Sí. Elige una plantilla (avatar parlante, subtítulos, walkthrough, before/after, pantalla dividida, vídeo de staging) y GetNearMe monta música, textos y clips partiendo del anuncio. No se requiere ningún software de edición." },
          { q: "¿Mi marca se aplica automáticamente?", a: "Sí. Subes logo, colores y tipografía una sola vez: se aplican automáticamente en PDF, vídeos y posts sociales para todos los agentes de la agencia." },
          { q: "¿Cuántos agentes puedo añadir?", a: "Cada plan incluye 5 agentes con acceso compartido al mismo branding. Cada agente tiene su propia cuenta pero trabaja bajo la identidad de la agencia." },
          { q: "¿Cómo funciona la prueba gratuita?", a: "7 días de acceso completo, sin límites de uso. Cancela con un clic desde el panel, sin cargo si cancelas antes de los 7 días." },
        ],
      },
      finalCta: {
        title1: "Deja de saltar entre 10 software.",
        title2: "Todo el trabajo sobre el anuncio, en una extensión.",
        desc: "Prueba GetNearMe 7 días gratis, sin límites. Cancela cuando quieras.",
        button: "Añadir extensión — 7 días gratis",
        footer: "🔒 Sin cargo durante la prueba. Cancelas con un clic.",
      },
      modal: {
        emoji: "rocket",
        title: "¡Gran elección!",
        planLabel: "Plan",
        desc: "Accede o regístrate para activar tus",
        descBold: "7 días de prueba gratuita",
        descEnd: "con acceso completo a todas las funciones.",
        cta: "Activar prueba gratuita",
        footer: "🔒 Sin cargo durante 7 días. Cancelas con un clic.",
      },
      popups: [
        { icon: "circle", text: "Una agencia del norte de Italia activó la prueba gratuita", time: "hace 3 min" },
        { icon: "clapperboard", text: "Un agente acaba de generar un vídeo promocional con IA", time: "" },
        { icon: "users", text: "Agencias online en este momento", time: "" },
        { icon: "rocket", text: "Un agente ha empezado los 7 días de prueba gratuita", time: "hace 12 min" },
        { icon: "flame", text: "GetNearMe elegido por nuevas agencias esta semana", time: "" },
        { icon: "sparkles", text: "Un agente ha amueblado una habitación con Homestaging AI", time: "hace 5 min" },
        { icon: "star", text: "Una agencia ha hecho upgrade al plan Anual", time: "hace 18 min" },
        { icon: "smartphone", text: "Posts sociales generados esta semana con GetNearMe", time: "" },
        { icon: "target", text: "Un agente ha exportado un PDF white-label con su logo", time: "hace 7 min" },
        { icon: "briefcase", text: "Una agencia acaba de registrarse en la prueba gratuita", time: "hace 2 min" },
        { icon: "trophy", text: "GetNearMe usado por agentes inmobiliarios en toda Italia", time: "" },
        { icon: "map", text: "Un agente ha generado análisis de zona desde los portales inmobiliarios", time: "hace 9 min" },
      ],
    },
  },
  fr: {
    nav: {
      features: "Fonctionnalités",
      pricing: "Tarifs",
      faq: "FAQ",
      blog: "Blog",
      tutorial: "Tutoriel",
      startAnalysis: "Lancer l'Analyse",
      backToHome: "← Retour à l'accueil",
      dashboard: "Tableau de bord",
      myAccount: "Mon compte"
    },
    hero: {
      title1: "L'avantage compétitif",
      title2: "qui distingue",
      title3: "votre agence",
      description: "Analyse de zone, comparaisons professionnelles et IA pour valoriser les biens et les présentations. Offrez un service qui va au-delà de la simple annonce.",
      cta: "Ajouter l'Extension",
      ctaSecondary: "Comment ça marche",
      subMockup: "GetNearMe est une extension Google Chrome qui renforce le travail de votre agence. Elle analyse les biens et les quartiers, compare les données de zone, génère des estimations comparatives et des présentations professionnelles… le tout automatiquement pendant que vous naviguez sur les portails immobiliers que vous utilisez déjà."
    },
    features: {
      title: "Le bien, dans ses données",
      titleItalic: "essentielles",
      description: "GetNearMe organise les informations en étapes claires, pour vous aider à comparer les biens et leur contexte de manière structurée.",
      card1: {
        title: "Données du bien",
        desc: "Le prix, la surface, le €/m², le type et les caractéristiques principales sont collectés et organisés à partir des données de l'annonce."
      },
      card2: {
        title: "Contexte du quartier",
        desc: "Les services, les transports, les écoles, les espaces verts et les points d'intérêt sont analysés en fonction de l'emplacement et des distances."
      },
      card3: {
        title: "Valeur de marché en temps réel",
        desc: "Obtenez le prix moyen au m² du secteur pour appuyer vos évaluations, acquisitions et négociations avec des données concrètes."
      },
      card4: {
        title: "Vue comparative",
        desc: "Les informations sont affichées côte à côte pour mettre en évidence les différences pertinentes entre plusieurs options analysées."
      },
      card5: {
        title: "Montrez le Potentiel avec l'IA",
        desc: "Modifiez les photos avec l'IA et montrez la comparaison avant/après : espaces vides ou meublés, lumière améliorée et pièces valorisées en quelques secondes."
      },
      disclaimer: "Les analyses et estimations affichées sont indicatives et ne constituent pas une expertise immobilière.",
      addExtension: "Ajouter l'extension",
      comingSoonTitle: "Bientôt disponible",
      comingSoonDesc: "Nous développons de nouvelles fonctionnalités conçues pour rendre le travail de votre agence encore plus structuré et efficace.",
    },
    faq: {
      title: "Questions",
      titleItalic: "fréquentes",
      items: [
        {
          q: "Quel type d'informations affiche-t-il ?",
          a: "GetNearMe affiche des données organisées provenant d'annonces immobilières et de sources publiques disponibles, concernant le bien, le quartier et les indicateurs de prix et de coût."
        },
        {
          q: "Est-il un portail immobilier ou une agence ?",
          a: "Non. GetNearMe ne publie pas d'annonces et ne fait pas d'intermédiation immobilière. C'est un outil d'analyse et de comparaison de données."
        },
        {
          q: "Sont-elles toutes des évaluations officielles ?",
          a: "Non. Les analyses et estimations affichées sont indicatives et ne constituent pas une expertise immobilière ni un conseil professionnel."
        },
        {
          q: "D'où proviennent les données ?",
          a: "Les données proviennent des annonces immobilières analysées et des sources publiques disponibles. Les informations sont traitées pour faciliter leur lecture et leur comparaison."
        },
        {
          q: "Les estimations de coûts sont-elles précises ?",
          a: "Non. Les estimations de coûts sont des projections indicatives basées sur des valeurs moyennes et peuvent varier en fonction des caractéristiques spécifiques du bien et de l'opération."
        },
        {
          q: "Puis-je comparer plusieurs biens entre eux ?",
          a: "Oui. GetNearMe permet de mettre côte à côte plusieurs biens pour comparer les données, le contexte et les indicateurs dans une vue comparative."
        }
      ]
    },
    pricing: {
      title: "Accès aux",
      titleItalic: "analyses",
      description: "Choisissez le niveau d'accès le mieux adapté au nombre d'analyses que vous souhaitez effectuer.",
      free: "Gratuit",
      buyNow: "Acheter maintenant",
      registerNow: "S'inscrire maintenant",
      mostChosen: "Le plus choisi",
      footer1: "Paiement sécurisé par carte, PayPal et principaux prestataires.",
      footer2: "Crédits disponibles immédiatement après l'achat.",
      footer3: "Pas d'abonnement. Pas d'expiration.",
      plans: [
        {
          name: "500 crédits",
          subtitle: "Pour commencer",
          desc: "Permet de réaliser quelques analyses complètes pour comparer les biens et leur contexte de manière structurée."
        },
        {
          name: "500 crédits",
          subtitle: "Pour commencer",
          desc: "Permet de réaliser quelques analyses complètes pour comparer les biens et leur contexte de manière structurée."
        },
        {
          name: "1 500 crédits",
          subtitle: "Comparaisons approfondies",
          desc: "Convient pour comparer plusieurs options et approfondir les différences entre les biens, les quartiers et les coûts estimés."
        },
        {
          name: "5 000 crédits",
          subtitle: "Analyses étendues",
          desc: "Conçu pour ceux qui analysent de nombreuses options et souhaitent des comparaisons plus approfondies dans le temps."
        }
      ]
    },
    cta: {
      title: "Comparez l'immobilier",
      title2: "de manière",
      titleItalic: "structurée",
      desc: "GetNearMe vous aide à organiser et comparer les données disponibles pour évaluer plusieurs options avec plus de clarté.",
      button: "Ajouter l'extension",
      requestInfo: "Demander des informations",
    },
    howItWorks: {
      step1Title: "Créez votre compte",
      step1Desc: "Inscrivez-vous en quelques secondes et accédez à la plateforme.",
      step2Title: "Activez le plan Agence",
      step2Desc: "Depuis votre profil, accédez à la section abonnement et activez le plan professionnel mensuel.",
      step3Title: "Commencez à travailler immédiatement",
      step3Desc: "L'accès est immédiat : vous pouvez utiliser toutes les fonctionnalités directement sur les portails immobiliers que vous utilisez déjà.",
      cta: "Commencez avec GetNearMe",
      videoTitle: "GetNearMe — Comment ça marche",
    },
    footer: {
      desc: "Outil d'aide à la décision pour l'analyse comparative de biens immobiliers et de quartiers.",
      product: "Produit",
      legal: "Légal",
      privacy: "Politique de Confidentialité",
      cookie: "Politique relative aux Cookies",
      terms: "Conditions d'Utilisation",
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
      intro: "Les présentes Conditions régissent l’utilisation du site web getnearme.it et de l’extension de navigateur GetNearMe.",
      sections: [
        {
          t: "1. Nature du Service",
          c: "GetNearMe est un outil d’aide à la décision qui organise et compare les données disponibles sur les biens immobiliers et les quartiers. GetNearMe n’est pas une agence immobilière et ne fournit pas de conseils professionnels, juridiques, fiscaux ou immobiliers."
        },
        {
          t: "2. Origine des données",
          c: "Les informations affichées proviennent d’annonces immobilières tierces et de sources publiques disponibles. GetNearMe n’a aucun contrôle sur le contenu des annonces et n’est pas responsable des erreurs, omissions ou modifications ultérieures."
        },
        {
          t: "3. Analyses et estimations",
          c: "Les analyses et estimations fournies sont purement indicatives, basées sur des valeurs moyennes et des données disponibles, et ne constituent pas une expertise immobilière officielle. Toute décision prise par l’utilisateur relève de sa seule responsabilité."
        },
        {
          t: "4. Compte et crédits",
          c: "Certaines fonctionnalités du Service nécessitent la création d’un compte. Les crédits : sont associés au compte de l’utilisateur ; n’ont pas de date d’expiration ; ne sont pas remboursables."
        },
        {
          t: "5. Utilisation autorisée",
          c: "Il est interdit : d’utiliser le Service à des fins illicites ou non autorisées ; de tenter de contourner les systèmes de sécurité ou le système de crédits ; d’effectuer un scraping massif ou une utilisation commerciale non autorisée des contenus."
        },
        {
          t: "6. Disponibilité du Service",
          c: "Certaines fonctionnalités peuvent varier selon la disponibilité des sources, le site analysé ou le navigateur utilisé. GetNearMe se réserve le droit de modifier, de suspendre ou d’interrompre le Service, en tout ou en partie, à tout moment."
        },
        {
          t: "7. Limitation de responsabilité",
          c: "Dans la mesure permise par la loi, GetNearMe n’est pas responsable des dommages résultant de l’utilisation ou de l’impossibilité d’utiliser le Service."
        }
      ]
    },
    cookie: {
      update: "Dernière mise à jour : 22/12/2025",
      intro: "La présente Politique relative aux Cookies s’applique exclusivement au site web getnearme.it.",
      sections: [
        {
          t: "1. Que sont les cookies ?",
          c: "Les cookies sont de petits fichiers texte que le site envoie à l’appareil de l’utilisateur pour améliorer l’expérience de navigation et le bon fonctionnement du site."
        },
        {
          t: "2. Types de cookies utilisés",
          c: "Le site utilise : des cookies techniques, nécessaires au fonctionnement du site et à la gestion des préférences de l’utilisateur ; d’éventuels cookies tiers liés à des services techniques ou de paiement."
        },
        {
          t: "3. Gestion des cookies",
          c: "L’utilisateur peut gérer ou désactiver les cookies via les paramètres de son navigateur. La désactivation des cookies techniques peut compromettre le bon fonctionnement du site."
        },
        {
          t: "4. Consentement",
          c: "Les cookies techniques ne nécessitent pas le consentement de l’utilisateur. Pour tout cookie non technique, le consentement est demandé via une bannière spécifique."
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
      subtitle: "Découvrez tous les outils avancés conçus pour transformer le travail de votre agence immobilière. De l'analyse territoriale à l'intelligence artificielle, chaque fonctionnalité est conçue pour vous donner un véritable avantage concurrentiel.",
      feature6: {
        title: "Marketing Immobilier Automatique",
        desc: "Transformez les données du bien en publications professionnelles, déjà optimisées pour les principaux réseaux sociaux.",
        badge: "NOUVEAU",
      },
      feature7: {
        title: "Vidéos Immobilières en quelques clics",
        desc: "Créez en quelques clics des contenus vidéo professionnels pour promouvoir chaque bien de manière moderne et percutante.",
        badge: "NOUVEAU",
      },
      ctaTitle: "Prêt à commencer ?",
      ctaDesc: "Rejoignez les agences immobilières qui transforment déjà leur façon de travailler avec GetNearMe.",
      ctaButton: "Ajouter l'Extension",
      ctaContact: "Contactez-nous",
    },
    landing: {
      topBar: {
        promo: "Offre de lancement :",
        discount: "7 jours gratuits, sans limites",
        expiresIn: "expire dans",
        freeTrialShort: "aucune carte requise",
      },
      hero: {
        badge: "",
        title1: "Gagnez des heures de travail",
        title2: "avec la meilleure IA pour les agents immobiliers.",
        desc: "GetNearMe est l'extension Google Chrome qui vit à l'intérieur d'Immobiliare.it, Idealista, Casa.it, Airbnb et Booking. Simplifie le travail quotidien de l'agence : analyse de zone, posts sociaux, reels, rendus AI des photos et rapports PDF.",
        ctaPrimary: "Ajouter l'extension — 7 jours gratuits",
        ctaSecondary: "Voir la démo",
        stats: ["7 jours gratuits sans limites", "S'installe en 2 secondes", "Intégré avec 5 portails", "GDPR compliant"],
      },
      problem: {
        emoji: "frown",
        title: "Canva, Photoshop, PowerPoint, CapCut, Google Maps : 10 onglets ouverts pour une seule annonce.",
        desc: "Pour évaluer un quartier, retoucher des photos, préparer un post Instagram ou un PDF à envoyer au client, tu as besoin de cinq logiciels différents — qui coûtent de l'argent, ne communiquent pas entre eux et te volent des heures de travail chaque semaine. Pendant ce temps, le client attend.",
      },
      solution: {
        emoji: "rocket",
        title: "Une extension Chrome. Tout le travail sur l'annonce, terminé.",
        desc: "GetNearMe s'active en un clic sur les portails que tu utilises déjà. Ouvre un bien sur Immobiliare.it, Idealista, Casa.it, Airbnb ou Booking et obtiens analyse de zone, rendu AI, vidéo, posts sociaux et rapport PDF avec ta marque — sans ouvrir aucun autre logiciel. Un outil pour simplifier le travail quotidien de l'agent, pas un substitut aux évaluations ou expertises professionnelles.",
      },
      features: {
        title: "Six outils professionnels.",
        titleHighlight: "Dans le navigateur.",
        subtitle: "GetNearMe remplace Canva, Photoshop, éditeur vidéo, architecte d'intérieur, social media manager et PowerPoint avec une seule extension Chrome. Fonctionne sur Immobiliare.it, Idealista, Casa.it, Airbnb et Booking.",
        items: [
          { num: "01", title: "Analyse de quartier interactive", desc: "Services, transports, écoles, santé, parcs et points d'intérêt réels affichés sur une carte en temps réel. Présente le quartier au client avec des données concrètes.", icon: "map", color: "#0ea5e9" },
          { num: "02", title: "Prix moyen du quartier au m²", desc: "Données de référence sur le prix moyen €/m² de la zone et comparaisons entre biens similaires, utiles pour préparer des présentations client et engager des négociations. Informations de marché à titre indicatif — elles ne constituent pas une expertise ou une évaluation officielle.", icon: "trending-up", color: "#f59e0b" },
          { num: "03", title: "Homestaging AI", desc: "Meuble les pièces vides, corrige la lumière et débarrasse les espaces en environ 10 secondes. Huit styles sélectionnables, avant/après prêts pour le client ou les réseaux sociaux. Remplace Photoshop et l'architecte d'intérieur.", icon: "sparkles", color: "#6366f1" },
          { num: "04", title: "Vidéo AI pour le bien", desc: "Reels et vidéos promotionnelles avec avatar parlant, sous-titres, walkthrough et before/after. Six templates, zéro montage. Remplace CapCut, Premiere et le vidéaste.", icon: "clapperboard", color: "#10b981" },
          { num: "05", title: "Posts, reels et stories sociaux", desc: "Contenus prêts pour Instagram, Facebook, TikTok et LinkedIn à partir des données de l'annonce. Logo, couleurs et identité de ton agence appliqués automatiquement. Remplace Canva et le social media manager.", icon: "smartphone", color: "#ec4899" },
          { num: "06", title: "Rapport PDF white-label", desc: "Présentations comparatives avec ton logo, tes couleurs et ta typographie. Compare plusieurs biens dans un document professionnel, prêt à envoyer. Remplace PowerPoint et le graphiste.", icon: "file-text", color: "#f97316" },
        ],
      },
      testimonials: {
        title: "Conçu pour ta vraie façon de travailler.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Agence immobilière", role: "Propriétaire — Nord de l'Italie", text: "J'ouvre l'annonce sur Immobiliare.it et en cinq minutes j'ai l'analyse de zone, les photos meublées par IA, le post Instagram et le PDF à envoyer au client. Avant c'était une journée entière entre Canva, Photoshop et PowerPoint.", avatar: "AI", color: "#f59e0b" },
          { name: "Agent immobilier", role: "Senior — Centre de l'Italie", text: "Le homestaging AI convainc le propriétaire. Je lui montre la pièce vide, puis meublée en 10 secondes. C'est la seule chose que j'utilise pour signer le mandat au premier rendez-vous.", avatar: "AI", color: "#6366f1" },
          { name: "Groupe immobilier", role: "Directeur — Sud de l'Italie", text: "On a arrêté de payer Canva, CapCut et un graphiste externe. Avec GetNearMe toute l'agence produit des contenus cohérents avec la marque, directement depuis les portails qu'on utilise déjà chaque jour.", avatar: "GI", color: "#10b981" },
        ],
      },
      pricing: {
        title1: "Un plan.",
        title2: "Tous les outils.",
        titleHighlight: "7 jours gratuits.",
        subtitle: "Accès complet à toutes les fonctionnalités pendant l'essai. Aucun engagement annuel. Annule quand tu veux.",
        countdownLabel: "Prix de lancement — expire dans",
        trustBadges: ["🔒 Paiement sécurisé avec Stripe", "✅ Aucun prélèvement pendant 7 jours", "⚡ Activation immédiate"],
        savingsLabel: "ÉCONOMIE",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "agency_monthly", name: "Mensuel", users: "Toutes les fonctionnalités incluses", oldPrice: null, price: 399,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agents inclus", "Analyses de quartier illimitées", "Prix moyen du quartier au m²", "Homestaging AI", "Vidéo AI avec avatar et sous-titres", "Posts sociaux pour IG, FB, TikTok, LinkedIn", "Rapport PDF white-label avec ton logo", "Intégration avec Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Commencer 7 jours gratuits",
          },
          {
            id: "agency_quarterly", name: "Trimestriel", users: "Toutes les fonctionnalités incluses", oldPrice: null, price: 349,
            savingsYear: null, badge: null, popular: false,
            features: ["5 agents inclus", "Analyses de quartier illimitées", "Prix moyen du quartier au m²", "Homestaging AI", "Vidéo AI avec avatar et sous-titres", "Posts sociaux pour IG, FB, TikTok, LinkedIn", "Rapport PDF white-label avec ton logo", "Intégration avec Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Commencer 7 jours gratuits",
          },
          {
            id: "agency_annual", name: "Annuel", users: "Toutes les fonctionnalités incluses", oldPrice: null, price: 300,
            savingsYear: null, badge: "Plus avantageux", popular: false,
            features: ["5 agents inclus", "Analyses de quartier illimitées", "Prix moyen du quartier au m²", "Homestaging AI", "Vidéo AI avec avatar et sous-titres", "Posts sociaux pour IG, FB, TikTok, LinkedIn", "Rapport PDF white-label avec ton logo", "Intégration avec Immobiliare.it, Idealista, Casa.it, Airbnb, Booking", "Support prioritaire"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Commencer 7 jours gratuits",
          },
        ],
      },
      howItWorks: {
        title: "Opérationnel en",
        titleHighlight: "2 secondes",
        subtitle: "Aucun logiciel à installer. Aucune formation. L'extension s'intègre dans les portails que tu utilises déjà chaque jour.",
        steps: [
          { step: "1", title: "Ajouter à Chrome", desc: "Un clic depuis Chrome Web Store. L'extension GetNearMe s'installe dans le navigateur en moins de 2 secondes.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Ouvre une annonce", desc: "Immobiliare.it, Idealista, Casa.it, Airbnb ou Booking : les portails que tu utilises déjà chaque jour. GetNearMe s'active automatiquement sur l'annonce.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Génère tout en un clic", desc: "Analyse de zone, rendu AI, vidéo, posts sociaux et PDF avec ta marque. Prêts à montrer au client, sans ouvrir aucun autre logiciel.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Questions ?",
        titleHighlight: "Réponses.",
        items: [
          { q: "Qu'est-ce que GetNearMe exactement ?", a: "Une extension pour le navigateur Google Chrome, conçue pour les agents et agences immobilières. Elle s'installe depuis Chrome Web Store en 2 secondes et n'est pas un logiciel à apprendre : elle s'active automatiquement quand tu ouvres une annonce sur les portails compatibles." },
          { q: "GetNearMe effectue-t-il des évaluations immobilières officielles ?", a: "Non. GetNearMe n'est pas un système d'évaluation immobilière et ne remplace en aucun cas une expertise, une estimation ou une certification professionnelle. Les données de zone et les prix moyens au m² sont des informations de marché à titre indicatif, utiles pour préparer des présentations et des négociations. Toute évaluation formelle reste de la responsabilité de l'agent, de l'expert ou du professionnel qualifié." },
          { q: "Sur quels portails fonctionne-t-elle ?", a: "Immobiliare.it, Idealista, Casa.it, Airbnb et Booking. Ouvre l'annonce et GetNearMe lit automatiquement les données du bien pour générer analyses, contenus et rapports." },
          { q: "Quels outils remplace-t-elle ?", a: "GetNearMe concentre en une seule extension des travaux que tu fais aujourd'hui avec Canva, Photoshop, des éditeurs vidéo, PowerPoint, des outils d'analyse de quartier et des services externes de home staging ou de graphisme. L'objectif est de te faire gagner des heures de travail pour chaque bien." },
          { q: "Comment fonctionne le homestaging AI ?", a: "Tu choisis la photo d'une pièce vide ou meublée, tu sélectionnes l'un des styles disponibles et l'IA renvoie la version meublée en environ 10 secondes. Tu peux utiliser l'avant/après directement dans les posts sociaux, les vidéos ou le PDF client." },
          { q: "Puis-je créer des vidéos sans savoir monter ?", a: "Oui. Choisis un template (avatar parlant, sous-titres, walkthrough, before/after, split screen, vidéo de staging) et GetNearMe assemble musique, textes et clips à partir de l'annonce. Aucun logiciel de montage requis." },
          { q: "Ma marque est-elle appliquée automatiquement ?", a: "Oui. Tu charges ton logo, tes couleurs et ta typographie une seule fois : ils sont appliqués automatiquement sur les PDF, vidéos et posts sociaux pour tous les agents de l'agence." },
          { q: "Combien d'agents puis-je ajouter ?", a: "Chaque plan inclut 5 agents avec accès partagé au même branding. Chaque agent a son propre compte mais travaille sous l'identité de l'agence." },
          { q: "Comment fonctionne l'essai gratuit ?", a: "7 jours d'accès complet, sans limites d'utilisation. Annule en un clic depuis le tableau de bord, aucun prélèvement si tu annules dans les 7 jours." },
        ],
      },
      finalCta: {
        title1: "Arrête de jongler entre 10 logiciels.",
        title2: "Tout le travail sur l'annonce, dans une extension.",
        desc: "Essaie GetNearMe 7 jours gratuits, sans limites. Annule quand tu veux.",
        button: "Ajouter l'extension — 7 jours gratuits",
        footer: "🔒 Aucun prélèvement pendant l'essai. Annule en un clic.",
      },
      modal: {
        emoji: "rocket",
        title: "Excellent choix !",
        planLabel: "Plan",
        desc: "Connecte-toi ou inscris-toi pour activer tes",
        descBold: "7 jours d'essai gratuit",
        descEnd: "avec accès complet à toutes les fonctionnalités.",
        cta: "Activer l'essai gratuit",
        footer: "🔒 Aucun prélèvement pendant 7 jours. Annule en un clic.",
      },
      popups: [
        { icon: "circle", text: "Une agence du nord de l'Italie a activé l'essai gratuit", time: "il y a 3 min" },
        { icon: "clapperboard", text: "Un agent vient de générer une vidéo promotionnelle avec IA", time: "" },
        { icon: "users", text: "Agences en ligne en ce moment", time: "" },
        { icon: "rocket", text: "Un agent a commencé les 7 jours d'essai gratuit", time: "il y a 12 min" },
        { icon: "flame", text: "GetNearMe choisi par de nouvelles agences cette semaine", time: "" },
        { icon: "sparkles", text: "Un agent a meublé une pièce avec Homestaging AI", time: "il y a 5 min" },
        { icon: "star", text: "Une agence est passée au plan Annuel", time: "il y a 18 min" },
        { icon: "smartphone", text: "Posts sociaux générés cette semaine avec GetNearMe", time: "" },
        { icon: "target", text: "Un agent a exporté un PDF white-label avec son logo", time: "il y a 7 min" },
        { icon: "briefcase", text: "Une agence vient de s'inscrire à l'essai gratuit", time: "il y a 2 min" },
        { icon: "trophy", text: "GetNearMe utilisé par des agents immobiliers dans toute l'Italie", time: "" },
        { icon: "map", text: "Un agent a généré une analyse de quartier depuis les portails immobiliers", time: "il y a 9 min" },
      ],
    },
  },
  ru: {
    nav: {
      features: "Возможности",
      pricing: "Цены",
      faq: "FAQ",
      blog: "Блог",
      tutorial: "Обучение",
      startAnalysis: "Начать Анализ",
      backToHome: "← Вернуться на главную",
      dashboard: "Панель управления",
      myAccount: "Мой аккаунт"
    },
    hero: {
      title1: "Конкурентное преимущество,",
      title2: "которое выделяет",
      title3: "ваше агентство",
      description: "Анализ районов, профессиональные сравнения и ИИ для повышения ценности объектов и презентаций. Предложите сервис, который выходит за рамки простого объявления.",
      cta: "Добавить Расширение",
      ctaSecondary: "Как это работает",
      subMockup: "GetNearMe — это расширение для Google Chrome, которое усиливает работу вашего агентства. Оно анализирует объекты и районы, сравнивает данные по зонам, генерирует сравнительные оценки и профессиональные презентации… и всё это автоматически, пока вы просматриваете порталы недвижимости, которыми уже пользуетесь."
    },
    features: {
      title: "Объект, в его",
      titleItalic: "основных данных",
      description: "GetNearMe организует информацию в виде четких шагов, чтобы помочь вам сравнить объекты и контекст структурированным образом.",
      card1: {
        title: "Данные объекта",
        desc: "Цена, площадь, €/м², тип и основные характеристики собираются и организуются на основе данных объявления."
      },
      card2: {
        title: "Контекст района",
        desc: "Услуги, транспорт, школы, зеленые зоны и достопримечательности анализируются на основе местоположения и расстояний."
      },
      card3: {
        title: "Рыночная стоимость в реальном времени",
        desc: "Получите среднюю цену за м² в районе для поддержки оценок, приобретений и переговоров на основе конкретных данных."
      },
      card4: {
        title: "Сравнительный вид",
        desc: "Информация отображается рядом, чтобы подчеркнуть существенные различия между несколькими проанализированными вариантами."
      },
      card5: {
        title: "Покажите Потенциал с ИИ",
        desc: "Редактируйте фото с помощью ИИ и показывайте сравнение до/после: пустые или меблированные комнаты, улучшенное освещение и преображённые пространства за секунды."
      },
      disclaimer: "Представленные анализы и оценки носят ориентировочный характер и не являются официальной оценкой недвижимости.",
      addExtension: "Добавить расширение",
      comingSoonTitle: "Скоро",
      comingSoonDesc: "Мы разрабатываем новые функции, призванные сделать работу вашего агентства ещё более структурированной и эффективной.",
    },
    faq: {
      title: "Часто задаваемые",
      titleItalic: "вопросы",
      items: [
        {
          q: "Какую информацию показывает?",
          a: "GetNearMe показывает организованные данные из объявлений о недвижимости и доступных государственных источников, касающиеся объекта, района, а также показателей цены и стоимости."
        },
        {
          q: "Является ли порталом недвижимости или агентством?",
          a: "Нет. GetNearMe не публикует объявления и не занимается брокерскими операциями с недвижимостью. Это инструмент для анализа и сравнения данных."
        },
        {
          q: "Являются ли все анализы официальными оценками?",
          a: "Нет. Представленные анализы и оценки носят ориентировочный характер и не являются официальной оценкой недвижимости или профессиональной консультацией."
        },
        {
          q: "Откуда берутся данные?",
          a: "Данные поступают из проанализированных объявлений о недвижимости и доступных государственных источников. Информация обрабатывается для удобства чтения и сравнения."
        },
        {
          q: "Насколько точны оценки затрат?",
          a: "Нет. Оценки затрат — это ориентировочные прогнозы, основанные на средних значениях, которые могут варьироваться в зависимости от конкретных характеристик объекта и сделки."
        },
        {
          q: "Могу ли я сравнить несколько объектов между собой?",
          a: "Да. GetNearMe позволяет сравнивать несколько объектов рядом, чтобы сопоставить данные, контекст и показатели в сравнительном виде."
        }
      ]
    },
    pricing: {
      title: "Доступ к",
      titleItalic: "анализам",
      description: "Выберите уровень доступа, наиболее подходящий для количества анализов, которые вы хотите провести.",
      free: "Бесплатно",
      buyNow: "Купить сейчас",
      registerNow: "Зарегистрироваться сейчас",
      mostChosen: "Самый популярный",
      footer1: "Безопасная оплата картой, PayPal и через основных провайдеров.",
      footer2: "Кредиты доступны сразу после покупки.",
      footer3: "Без подписки. Без ограничения срока действия.",
      plans: [
        {
          name: "500 кредитов",
          subtitle: "Для начала",
          desc: "Позволяет провести несколько полных анализов для сравнения объектов и контекста структурированным образом."
        },
        {
          name: "500 кредитов",
          subtitle: "Для начала",
          desc: "Позволяет провести несколько полных анализов для сравнения объектов и контекста структурированным образом."
        },
        {
          name: "1 500 кредитов",
          subtitle: "Глубокое сравнение",
          desc: "Подходит для сравнения нескольких вариантов и более детального изучения различий между объектами, районами и оценочными затратами."
        },
        {
          name: "5 000 кредитов",
          subtitle: "Расширенный анализ",
          desc: "Предназначен для тех, кто анализирует много вариантов и хочет проводить более глубокие сравнения с течением времени."
        }
      ]
    },
    cta: {
      title: "Сравнивайте недвижимость",
      title2: "структурированным",
      titleItalic: "способом",
      desc: "GetNearMe помогает вам организовать и сравнить доступные данные, чтобы оценить несколько вариантов с большей ясностью.",
      button: "Добавить расширение",
      requestInfo: "Запросить информацию",
    },
    howItWorks: {
      step1Title: "Создайте аккаунт",
      step1Desc: "Зарегистрируйтесь за несколько секунд и получите доступ к платформе.",
      step2Title: "Активируйте план Агентство",
      step2Desc: "В вашем профиле перейдите в раздел подписки и активируйте профессиональный ежемесячный план.",
      step3Title: "Начните работать сразу",
      step3Desc: "Доступ мгновенный: вы можете использовать все функции непосредственно на порталах недвижимости, которыми уже пользуетесь.",
      cta: "Начните с GetNearMe",
      videoTitle: "GetNearMe — Как это работает",
    },
    footer: {
      desc: "Инструмент поддержки принятия решений для сравнительного анализа недвижимости и районов.",
      product: "Продукт",
      legal: "Юридическая информация",
      privacy: "Политика конфиденциальности",
      cookie: "Политика использования файлов cookie",
      terms: "Условия использования",
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
      title: "Все Возможности",
      titleItalic: "GetNearMe",
      subtitle: "Откройте для себя все продвинутые инструменты, разработанные для преобразования работы вашего агентства недвижимости. От территориального анализа до искусственного интеллекта — каждая функция создана, чтобы дать вам реальное конкурентное преимущество.",
      feature6: {
        title: "Автоматический Маркетинг Недвижимости",
        desc: "Преобразуйте данные объекта в профессиональные публикации, уже оптимизированные для основных социальных сетей.",
        badge: "НОВОЕ",
      },
      feature7: {
        title: "Видео Недвижимости в несколько кликов",
        desc: "Создавайте в несколько кликов профессиональные видеоматериалы для продвижения каждого объекта современно и эффективно.",
        badge: "НОВОЕ",
      },
      ctaTitle: "Готовы начать?",
      ctaDesc: "Присоединяйтесь к агентствам недвижимости, которые уже трансформируют свою работу с GetNearMe.",
      ctaButton: "Добавить Расширение",
      ctaContact: "Связаться с нами",
    },
    landing: {
      topBar: {
        promo: "Стартовое предложение:",
        discount: "7 дней бесплатно, без ограничений",
        expiresIn: "истекает через",
        freeTrialShort: "карта не нужна",
      },
      hero: {
        badge: "",
        title1: "Экономьте часы работы",
        title2: "с лучшим ИИ для агентов по недвижимости.",
        desc: "GetNearMe — расширение для Google Chrome, которое работает внутри Immobiliare.it, Idealista, Casa.it, Airbnb и Booking. Упрощает ежедневную работу агентства: анализ района, посты в соцсетях, рилсы, ИИ-рендеры фотографий и PDF-отчёты",
        ctaPrimary: "Добавить расширение — 7 дней бесплатно",
        ctaSecondary: "Смотреть демо",
        stats: ["7 дней бесплатно без ограничений", "Устанавливается за 2 секунды", "Интеграция с 5 порталами", "GDPR compliant"],
      },
      problem: {
        emoji: "frown",
        title: "Canva, Photoshop, PowerPoint, CapCut, Google Maps: 10 вкладок открыто для одного объявления.",
        desc: "Чтобы оценить район, обработать фото, подготовить пост в Instagram или PDF для клиента, нужно пять разных инструментов — которые стоят денег, не взаимодействуют друг с другом и крадут часы работы каждую неделю. А клиент тем временем ждёт.",
      },
      solution: {
        emoji: "rocket",
        title: "Одно расширение Chrome. Вся работа по объявлению — готова.",
        desc: "GetNearMe активируется одним кликом на порталах, которые ты уже используешь. Открой объект на Immobiliare.it, Idealista, Casa.it, Airbnb или Booking и получи анализ района, ИИ-рендер, видео, посты в соцсетях и PDF-отчёт с твоим брендом — без открытия другого программного обеспечения. Инструмент для упрощения ежедневной работы агента, а не замена профессиональным оценкам или экспертизам.",
      },
      features: {
        title: "Шесть профессиональных инструментов.",
        titleHighlight: "Прямо в браузере.",
        subtitle: "GetNearMe заменяет Canva, Photoshop, видеоредактор, дизайнера интерьеров, SMM-специалиста и PowerPoint одним расширением Chrome. Работает на Immobiliare.it, Idealista, Casa.it, Airbnb и Booking.",
        items: [
          { num: "01", title: "Интерактивный анализ района", desc: "Сервисы, транспорт, школы, здравоохранение, парки и реальные объекты на карте в реальном времени. Расскажи клиенту о районе с конкретными данными.", icon: "map", color: "#0ea5e9" },
          { num: "02", title: "Средняя цена за м² в районе", desc: "Справочные данные о средней цене €/м² в районе и сравнения с похожими объектами, полезные для подготовки презентаций клиенту и проведения переговоров. Рыночная информация в иллюстративных целях — не является профессиональной экспертизой или официальной оценкой.", icon: "trending-up", color: "#f59e0b" },
          { num: "03", title: "ИИ-homestaging", desc: "Обставляет пустые комнаты, корректирует освещение и расчищает пространство примерно за 10 секунд. Восемь стилей на выбор, до/после — готово для клиента или соцсетей. Заменяет Photoshop и дизайнера интерьеров.", icon: "sparkles", color: "#6366f1" },
          { num: "04", title: "ИИ-видео для объекта", desc: "Рилсы и промо-видео с говорящим аватаром, субтитрами, walkthrough и before/after. Шесть шаблонов, ноль монтажа. Заменяет CapCut, Premiere и видеографа.", icon: "clapperboard", color: "#10b981" },
          { num: "05", title: "Посты, рилсы и сторис для соцсетей", desc: "Контент для Instagram, Facebook, TikTok и LinkedIn на основе данных объявления. Логотип, цвета и фирменный стиль агентства применяются автоматически. Заменяет Canva и SMM-специалиста.", icon: "smartphone", color: "#ec4899" },
          { num: "06", title: "PDF-отчёт white-label", desc: "Сравнительные презентации с твоим логотипом, цветами и шрифтами. Сравни несколько объектов в одном профессиональном документе, готовом к отправке. Заменяет PowerPoint и графического дизайнера.", icon: "file-text", color: "#f97316" },
        ],
      },
      testimonials: {
        title: "Создан для того, как ты работаешь на самом деле.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Агентство недвижимости", role: "Владелец — Северная Италия", text: "Открываю объявление на Immobiliare.it и за пять минут у меня есть анализ района, фотографии с ИИ-обстановкой, пост для Instagram и PDF для клиента. Раньше это занимало целый рабочий день между Canva, Photoshop и PowerPoint.", avatar: "AI", color: "#f59e0b" },
          { name: "Агент по недвижимости", role: "Старший — Центральная Италия", text: "ИИ-homestaging убеждает собственника. Показываю пустую комнату, потом обставленную за 10 секунд. Это единственное, что я использую, чтобы закрыть сделку на первой встрече.", avatar: "AI", color: "#6366f1" },
          { name: "Группа компаний недвижимости", role: "Директор — Южная Италия", text: "Мы перестали платить за Canva, CapCut и внешнего графического дизайнера. С GetNearMe всё агентство создаёт контент, соответствующий бренду, прямо с порталов, которые мы используем каждый день.", avatar: "GI", color: "#10b981" },
        ],
      },
      pricing: {
        title1: "Один план.",
        title2: "Все инструменты.",
        titleHighlight: "7 дней бесплатно.",
        subtitle: "Полный доступ ко всем функциям во время пробного периода. Без годовых обязательств. Отмена в любое время.",
        countdownLabel: "Стартовая цена — истекает через",
        trustBadges: ["🔒 Безопасная оплата через Stripe", "✅ Без списаний 7 дней", "⚡ Мгновенная активация"],
        savingsLabel: "ЭКОНОМИЯ",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "agency_monthly", name: "Ежемесячно", users: "Все функции включены", oldPrice: null, price: 399,
            savingsYear: null, badge: null, popular: false,
            features: ["5 агентов включено", "Неограниченный анализ района", "Средняя цена за м² в районе", "ИИ-homestaging", "ИИ-видео с аватаром и субтитрами", "Посты для IG, FB, TikTok, LinkedIn", "PDF-отчёт white-label с твоим логотипом", "Интеграция с Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Начать 7 дней бесплатно",
          },
          {
            id: "agency_quarterly", name: "Ежеквартально", users: "Все функции включены", oldPrice: null, price: 349,
            savingsYear: null, badge: null, popular: false,
            features: ["5 агентов включено", "Неограниченный анализ района", "Средняя цена за м² в районе", "ИИ-homestaging", "ИИ-видео с аватаром и субтитрами", "Посты для IG, FB, TikTok, LinkedIn", "PDF-отчёт white-label с твоим логотипом", "Интеграция с Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Начать 7 дней бесплатно",
          },
          {
            id: "agency_annual", name: "Ежегодно", users: "Все функции включены", oldPrice: null, price: 300,
            savingsYear: null, badge: "Самый выгодный", popular: false,
            features: ["5 агентов включено", "Неограниченный анализ района", "Средняя цена за м² в районе", "ИИ-homestaging", "ИИ-видео с аватаром и субтитрами", "Посты для IG, FB, TikTok, LinkedIn", "PDF-отчёт white-label с твоим логотипом", "Интеграция с Immobiliare.it, Idealista, Casa.it, Airbnb, Booking", "Приоритетная поддержка"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Начать 7 дней бесплатно",
          },
        ],
      },
      howItWorks: {
        title: "Готово к работе за",
        titleHighlight: "2 секунды",
        subtitle: "Никакого ПО для установки. Никакого обучения. Расширение интегрируется в порталы, которые ты уже используешь каждый день.",
        steps: [
          { step: "1", title: "Добавь в Chrome", desc: "Один клик в Chrome Web Store. Расширение GetNearMe устанавливается в браузере менее чем за 2 секунды.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Открой объявление", desc: "Immobiliare.it, Idealista, Casa.it, Airbnb или Booking: порталы, которые ты уже используешь каждый день. GetNearMe автоматически активируется на объявлении.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Генерируй всё одним кликом", desc: "Анализ района, ИИ-рендер, видео, посты и PDF с твоим брендом. Готовы показать клиенту, без открытия другого программного обеспечения.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Вопросы?",
        titleHighlight: "Ответы.",
        items: [
          { q: "Что именно такое GetNearMe?", a: "Расширение для браузера Google Chrome, созданное для агентов и агентств по недвижимости. Устанавливается из Chrome Web Store за 2 секунды и не требует обучения: активируется автоматически, когда открываешь объявление на поддерживаемых порталах." },
          { q: "Проводит ли GetNearMe официальную оценку недвижимости?", a: "Нет. GetNearMe не является системой оценки недвижимости и никоим образом не заменяет профессиональную экспертизу, оценку или сертификацию. Данные по району и средние цены за м² — это рыночная информация в иллюстративных целях, полезная для подготовки презентаций и переговоров. Любая официальная оценка остаётся ответственностью агента, оценщика или квалифицированного специалиста." },
          { q: "На каких порталах работает?", a: "Immobiliare.it, Idealista, Casa.it, Airbnb и Booking. Открой объявление, и GetNearMe автоматически считает данные объекта для генерации анализов, контента и отчётов." },
          { q: "Какие инструменты заменяет?", a: "GetNearMe концентрирует в одном расширении работу, которую ты сегодня выполняешь с Canva, Photoshop, видеоредакторами, PowerPoint, инструментами анализа района и внешними сервисами homestaging или графического дизайна. Цель — сэкономить тебе часы работы по каждому объекту." },
          { q: "Как работает ИИ-homestaging?", a: "Выбираешь фото пустой или обставленной комнаты, выбираешь один из доступных стилей, и ИИ возвращает обставленную версию примерно за 10 секунд. До/после можно использовать прямо в постах соцсетей, видео или PDF для клиента." },
          { q: "Можно ли создавать видео без навыков монтажа?", a: "Да. Выбери шаблон (говорящий аватар, субтитры, walkthrough, before/after, разделённый экран, видео стейджинга) и GetNearMe монтирует музыку, тексты и клипы на основе объявления. Никакое редактирующее ПО не требуется." },
          { q: "Мой бренд применяется автоматически?", a: "Да. Загружаешь логотип, цвета и шрифты один раз: они автоматически применяются к PDF, видео и постам в соцсетях для всех агентов агентства." },
          { q: "Сколько агентов можно добавить?", a: "Каждый план включает 5 агентов с общим доступом к одному брендингу. У каждого агента свой аккаунт, но работает под идентичностью агентства." },
          { q: "Как работает бесплатный пробный период?", a: "7 дней полного доступа без ограничений по использованию. Отмени одним кликом из дашборда — никаких списаний при отмене в течение 7 дней." },
        ],
      },
      finalCta: {
        title1: "Перестань переключаться между 10 инструментами.",
        title2: "Вся работа по объявлению — в одном расширении.",
        desc: "Попробуй GetNearMe 7 дней бесплатно, без ограничений. Отмени когда угодно.",
        button: "Добавить расширение — 7 дней бесплатно",
        footer: "🔒 Без списаний во время пробного периода. Отмена одним кликом.",
      },
      modal: {
        emoji: "rocket",
        title: "Отличный выбор!",
        planLabel: "План",
        desc: "Войди или зарегистрируйся, чтобы активировать",
        descBold: "7 дней бесплатного пробного периода",
        descEnd: "с полным доступом ко всем функциям.",
        cta: "Активировать бесплатный период",
        footer: "🔒 Без списаний 7 дней. Отмена одним кликом.",
      },
      popups: [
        { icon: "circle", text: "Агентство из Северной Италии активировало бесплатный период", time: "3 мин назад" },
        { icon: "clapperboard", text: "Агент только что сгенерировал промо-видео с ИИ", time: "" },
        { icon: "users", text: "Агентства онлайн прямо сейчас", time: "" },
        { icon: "rocket", text: "Агент начал 7 дней бесплатного пробного периода", time: "12 мин назад" },
        { icon: "flame", text: "GetNearMe выбрали новые агентства на этой неделе", time: "" },
        { icon: "sparkles", text: "Агент обставил комнату с помощью ИИ-homestaging", time: "5 мин назад" },
        { icon: "star", text: "Агентство перешло на годовой план", time: "18 мин назад" },
        { icon: "smartphone", text: "Постов в соцсетях сгенерировано на этой неделе с GetNearMe", time: "" },
        { icon: "target", text: "Агент экспортировал PDF white-label со своим логотипом", time: "7 мин назад" },
        { icon: "briefcase", text: "Агентство только что зарегистрировалось на бесплатный период", time: "2 мин назад" },
        { icon: "trophy", text: "GetNearMe используют агенты по недвижимости по всей Италии", time: "" },
        { icon: "map", text: "Агент сгенерировал анализ района с порталов недвижимости", time: "9 мин назад" },
      ],
    },
  },
  uk: {
    nav: {
      features: "Можливості",
      pricing: "Ціни",
      faq: "FAQ",
      blog: "Блог",
      tutorial: "Навчання",
      startAnalysis: "Почати Аналіз",
      backToHome: "← Повернутися на головну",
      dashboard: "Панель керування",
      myAccount: "Мій акаунт"
    },
    hero: {
      title1: "Конкурентна перевага,",
      title2: "яка вирізняє",
      title3: "вашу агенцію",
      description: "Аналіз районів, професійні порівняння та ШІ для підвищення цінності об'єктів та презентацій. Запропонуйте сервіс, що виходить за межі простого оголошення.",
      cta: "Додати Розширення",
      ctaSecondary: "Як це працює",
      subMockup: "GetNearMe — це розширення для Google Chrome, яке посилює роботу вашої агенції. Воно аналізує об'єкти та райони, порівнює дані по зонах, генерує порівняльні оцінки та професійні презентації… і все це автоматично, поки ви переглядаєте портали нерухомості, якими вже користуєтеся."
    },
    features: {
      title: "Об'єкт, у його",
      titleItalic: "основных даних",
      description: "GetNearMe організовує інформацію у вигляді чітких кроків, щоб допомогти вам порівняти об'єкти та контекст структурованим чином.",
      card1: {
        title: "Дані об'єкта",
        desc: "Ціна, площа, €/м², тип та основні характеристики збираються та організовуються на основі даних оголошення."
      },
      card2: {
        title: "Контекст району",
        desc: "Послуги, транспорт, школи, зелені зони та пам'ятки аналізуються на основі розташування та відстаней."
      },
      card3: {
        title: "Ринкова вартість у реальному часі",
        desc: "Отримайте середню ціну за м² у районі для підтримки оцінок, придбань та переговорів на основі конкретних даних."
      },
      card4: {
        title: "Порівняльний вигляд",
        desc: "Інформація відображається поруч, щоб підкреслити суттєві відмінності між кількома проаналізованими варіантами."
      },
      card5: {
        title: "Покажіть Потенціал з ШІ",
        desc: "Редагуйте фото за допомогою ШІ та показуйте порівняння до/після: порожні або мебльовані кімнати, покращене освітлення та перетворені простори за лічені секунди."
      },
      disclaimer: "Представлені аналізи та оцінки носять орієнтовний характер і не є офіційною оцінкою нерухомості.",
      addExtension: "Додати розширення",
      comingSoonTitle: "Незабаром",
      comingSoonDesc: "Ми розробляємо нові функції, покликані зробити роботу вашої агенції ще більш структурованою та ефективною.",
    },
    faq: {
      title: "Часті",
      titleItalic: "запитання",
      items: [
        {
          q: "Яку інформацію показує?",
          a: "GetNearMe показує організовані дані з оголошень про нерухомість та доступних державних джерел, що стосуються об'єкта, району, а також показників ціни та вартості."
        },
        {
          q: "Чи є порталом нерухомості або агентством?",
          a: "Ні. GetNearMe не публікує оголошення і не займається брокерськими операциями з нерухомістю. Це інструмент для аналізу та порівняння даних."
        },
        {
          q: "Чи є всі аналізи офіційними оцінками?",
          a: "Ні. Представлені аналізи та оцінки носять орієнтовний характер і не є офіційною оцінкою нерухомості або професійною консультацією."
        },
        {
          q: "Звідки беруться дані?",
          a: "Дані надходять із проаналізованих оголошень про нерухомість та доступних державних джерел. Інформація обробляється для зручності читання та порівняння."
        },
        {
          q: "Наскільки точними є оцінки витрат?",
          a: "Ні. Оцінки витрат — це орієнтовні прогнози, засновані на середніх значеннях, які можуть варіюватися залежно від конкретних характеристик об'єкта та угоди."
        },
        {
          q: "Чи можу я порівняти кілька об'єктів між собою?",
          a: "Так. GetNearMe дозволяє порівнювати кілька об'єктів поруч, щоб зіставити дані, контекст та показники у порівняльному вигляді."
        }
      ]
    },
    pricing: {
      title: "Доступ до",
      titleItalic: "аналізів",
      description: "Виберіть рівень доступу, який найкраще підходить для кількості аналізів, які ви хочете провести.",
      free: "Безкоштовно",
      buyNow: "Купити зараз",
      registerNow: "Зареєструватися зараз",
      mostChosen: "Найпопулярніший",
      footer1: "Безпечна оплата карткою, PayPal та через основних провайдерів.",
      footer2: "Кредити доступні відразу після покупки.",
      footer3: "Без підписки. Без обмеження терміну дії.",
      plans: [
        {
          name: "500 кредитів",
          subtitle: "Для початку",
          desc: "Дозволяє провести кілька повних аналізів для порівняння об'єктів та контексту структурованим чином."
        },
        {
          name: "500 кредитів",
          subtitle: "Для початку",
          desc: "Дозволяє провести кілька повних аналізів для порівняння об'єктів та контексту структурованим чином."
        },
        {
          name: "1 500 кредитів",
          subtitle: "Глубоке порівняння",
          desc: "Підходить для порівняння кількох варіантів та більш детального вивчення відмінностей між об'єктами, районами та оціночними витратами."
        },
        {
          name: "5 000 кредитів",
          subtitle: "Розширений аналіз",
          desc: "Призначений для тих, хто аналізує багато варіантів і хоче проводити більш глибокі порівняння з часом."
        }
      ]
    },
    cta: {
      title: "Порівнюйте нерухомість",
      title2: "структурованим",
      titleItalic: "способом",
      desc: "GetNearMe допомагає вам організувати та порівняти доступні дані, щоб оцінити кілька варіантів з більшою ясністю.",
      button: "Додати розширення",
      requestInfo: "Запитати інформацію",
    },
    howItWorks: {
      step1Title: "Створіть акаунт",
      step1Desc: "Зареєструйтесь за кілька секунд та отримайте доступ до платформи.",
      step2Title: "Активуйте план Агентство",
      step2Desc: "У вашому профілі перейдіть до розділу підписки та активуйте професійний щомісячний план.",
      step3Title: "Почніть працювати одразу",
      step3Desc: "Доступ миттєвий: ви можете використовувати всі функції безпосередньо на порталах нерухомості, якими вже користуєтесь.",
      cta: "Почніть з GetNearMe",
      videoTitle: "GetNearMe — Як це працює",
    },
    footer: {
      desc: "Інструмент підтримки прийняття рішень для порівняльного аналізу нерухомості та районів.",
      product: "Продукт",
      legal: "Юридична інформація",
      privacy: "Політика конфіденційності",
      cookie: "Політика використання файлів cookie",
      terms: "Умови використання",
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
          c: "Обробка даних ґрунтується на: виконанні договору або переддоговірних заходах; згоді користувача, де це потрібно; законному інтересі володільця у правильному функціонуванні та покращенні Сервісу."
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
          c: "Забороняється: використовувати Сервіс у незаконних або несанкцірованих цілях; намагатися обійти системи безпеки або систему кредитів; виконувати масовий парсинг або несанкціоноване комерційне використання контенту."
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
          c: "Файли cookie — це невеликі текстовые файли, які сайт надсилає на пристрій користувача для покращення досвіду навігації та забезпечення правильної роботи сайту."
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
      weekComplete: "Фантастика! Ви завершили тиждень! Отримайте 120 бонусних кредитів!",
      comeBackTomorrow: "Повертайтеся завтра на {day} день.",
      goToHome: "Перейти в GetNearMe",
      backToHome: "Повернутися на Головну",
      error: {
        defaultTitle: "Помилка",
        defaultMessage: "Сталася помилка.",
        alreadyClaimedTitle: "Бонус Вже Отримано",
        alreadyClaimedMessage: "Ви вже отримали сьогоднішній бонус. Повертайтеся завтра!",
        expiredTitle: "Токен Вичерпано",
        expiredMessage: "Це посилання більше не дійсне. Перевірте сьогоднішній лист.",
        invalidTokenTitle: "Недійсний Токен",
        invalidTokenMessage: "Посилання, яке ви використали, недійсне.",
        missingTokenTitle: "Токен Відсутній",
        missingTokenMessage: "Токен не надано.",
        serverErrorTitle: "Помилка Сервера",
        serverErrorMessage: "Сталася помилка. Спробуйте пізніше."
      },
      loading: "Завантаження..."
    },
    confirm: {
      subtitle: "Ласкаво просимо до GetNearMe",
      description: "Вашу пiдписку на сервiс успiшно пiдтверджено. Поверніться до розширення та почніть використовувати всі можливості GetNearMe!",
      cta: "Почати дослiдження"
    },
    unsubscribe: {
      subtitle: "Відписка завершена",
      description: "Вас було успішно видалено з нашої розсилки. Ви більше не отримуватимете листів від GetNearMe."
    },
    featuresPage: {
      title: "Всі Можливості",
      titleItalic: "GetNearMe",
      subtitle: "Відкрийте для себе всі передові інструменти, розроблені для трансформації роботи вашого агентства нерухомості. Від територіального аналізу до штучного інтелекту — кожна функція створена, щоб дати вам реальну конкурентну перевагу.",
      feature6: {
        title: "Автоматичний Маркетинг Нерухомості",
        desc: "Перетворюйте дані об'єкта на професійні публікації, вже оптимізовані для основних соціальних мереж.",
        badge: "НОВЕ",
      },
      feature7: {
        title: "Відео Нерухомості за кілька кліків",
        desc: "Створюйте за кілька кліків професійні відеоматеріали для просування кожного об'єкта сучасно та ефективно.",
        badge: "НОВЕ",
      },
      ctaTitle: "Готові почати?",
      ctaDesc: "Приєднуйтесь до агентств нерухомості, які вже трансформують свою роботу з GetNearMe.",
      ctaButton: "Додати Розширення",
      ctaContact: "Зв'яжіться з нами",
    },
    landing: {
      topBar: {
        promo: "Стартова пропозиція:",
        discount: "7 днів безкоштовно, без обмежень",
        expiresIn: "закінчується через",
        freeTrialShort: "картка не потрібна",
      },
      hero: {
        badge: "",
        title1: "Заощаджуй години роботи",
        title2: "з найкращим ШІ для агентів з нерухомості.",
        desc: "GetNearMe — розширення для Google Chrome, яке працює всередині Immobiliare.it, Idealista, Casa.it, Airbnb та Booking. Спрощує щоденну роботу агентства: аналіз району, пости в соцмережах, рілси, ШІ-рендери фотографій та PDF-звіти",
        ctaPrimary: "Додати розширення — 7 днів безкоштовно",
        ctaSecondary: "Дивитися демо",
        stats: ["7 днів безкоштовно без обмежень", "Встановлюється за 2 секунди", "Інтеграція з 5 порталами", "GDPR compliant"],
      },
      problem: {
        emoji: "frown",
        title: "Canva, Photoshop, PowerPoint, CapCut, Google Maps: 10 вкладок відкрито для одного оголошення.",
        desc: "Щоб оцінити район, обробити фото, підготувати пост в Instagram або PDF для клієнта, потрібно п'ять різних інструментів — які коштують грошей, не взаємодіють між собою і крадуть години роботи щотижня. А клієнт тим часом чекає.",
      },
      solution: {
        emoji: "rocket",
        title: "Одне розширення Chrome. Вся робота по оголошенню — готова.",
        desc: "GetNearMe активується одним кліком на порталах, які ти вже використовуєш. Відкрий об'єкт на Immobiliare.it, Idealista, Casa.it, Airbnb або Booking і отримай аналіз району, ШІ-рендер, відео, пости в соцмережах і PDF-звіт з твоїм брендом — без відкриття іншого програмного забезпечення. Інструмент для спрощення щоденної роботи агента, а не заміна професійним оцінкам або експертизам.",
      },
      features: {
        title: "Шість професійних інструментів.",
        titleHighlight: "Прямо в браузері.",
        subtitle: "GetNearMe замінює Canva, Photoshop, відеоредактор, дизайнера інтер'єрів, SMM-спеціаліста та PowerPoint одним розширенням Chrome. Працює на Immobiliare.it, Idealista, Casa.it, Airbnb та Booking.",
        items: [
          { num: "01", title: "Інтерактивний аналіз району", desc: "Сервіси, транспорт, школи, охорона здоров'я, парки та реальні об'єкти на карті в режимі реального часу. Розкажи клієнту про район з конкретними даними.", icon: "map", color: "#0ea5e9" },
          { num: "02", title: "Середня ціна за м² у районі", desc: "Довідкові дані про середню ціну €/м² у районі та порівняння з подібними об'єктами, корисні для підготовки презентацій клієнту та проведення переговорів. Ринкова інформація в ілюстративних цілях — не є професійною експертизою або офіційною оцінкою.", icon: "trending-up", color: "#f59e0b" },
          { num: "03", title: "ШІ-homestaging", desc: "Обставляє порожні кімнати, коригує освітлення та розчищає простір приблизно за 10 секунд. Вісім стилів на вибір, до/після — готово для клієнта або соцмереж. Замінює Photoshop і дизайнера інтер'єрів.", icon: "sparkles", color: "#6366f1" },
          { num: "04", title: "ШІ-відео для об'єкта", desc: "Рілси та промо-відео з говорячим аватаром, субтитрами, walkthrough та before/after. Шість шаблонів, нуль монтажу. Замінює CapCut, Premiere і відеографа.", icon: "clapperboard", color: "#10b981" },
          { num: "05", title: "Пости, рілси та сторіс для соцмереж", desc: "Контент для Instagram, Facebook, TikTok та LinkedIn на основі даних оголошення. Логотип, кольори та фірмовий стиль агентства застосовуються автоматично. Замінює Canva і SMM-спеціаліста.", icon: "smartphone", color: "#ec4899" },
          { num: "06", title: "PDF-звіт white-label", desc: "Порівняльні презентації з твоїм логотипом, кольорами та шрифтами. Порівняй кілька об'єктів в одному професійному документі, готовому до відправки. Замінює PowerPoint і графічного дизайнера.", icon: "file-text", color: "#f97316" },
        ],
      },
      testimonials: {
        title: "Створено для того, як ти працюєш насправді.",
        npsLabel: "",
        npsValue: "",
        retentionLabel: "",
        retentionValue: "",
        items: [
          { name: "Агентство нерухомості", role: "Власник — Північна Італія", text: "Відкриваю оголошення на Immobiliare.it і за п'ять хвилин маю аналіз району, фотографії з ШІ-обстановкою, пост для Instagram і PDF для клієнта. Раніше це займало цілий робочий день між Canva, Photoshop і PowerPoint.", avatar: "AI", color: "#f59e0b" },
          { name: "Агент з нерухомості", role: "Старший — Центральна Італія", text: "ШІ-homestaging переконує власника. Показую порожню кімнату, потім обставлену за 10 секунд. Це єдине, що я використовую, щоб закрити угоду на першій зустрічі.", avatar: "AI", color: "#6366f1" },
          { name: "Група компаній нерухомості", role: "Директор — Південна Італія", text: "Ми перестали платити за Canva, CapCut і зовнішнього графічного дизайнера. З GetNearMe все агентство створює контент, що відповідає бренду, прямо з порталів, які ми використовуємо щодня.", avatar: "GI", color: "#10b981" },
        ],
      },
      pricing: {
        title1: "Один план.",
        title2: "Всі інструменти.",
        titleHighlight: "7 днів безкоштовно.",
        subtitle: "Повний доступ до всіх функцій під час пробного періоду. Без річних зобов'язань. Скасування в будь-який час.",
        countdownLabel: "Стартова ціна — закінчується через",
        trustBadges: ["🔒 Безпечна оплата через Stripe", "✅ Без списань 7 днів", "⚡ Миттєва активація"],
        savingsLabel: "ЕКОНОМІЯ",
        progressAgencies: "",
        progressSpots: "",
        plans: [
          {
            id: "agency_monthly", name: "Щомісячно", users: "Усі функції включені", oldPrice: null, price: 399,
            savingsYear: null, badge: null, popular: false,
            features: ["5 агентів включено", "Необмежений аналіз району", "Середня ціна за м² у районі", "ШІ-homestaging", "ШІ-відео з аватаром і субтитрами", "Пости для IG, FB, TikTok, LinkedIn", "PDF-звіт white-label з твоїм логотипом", "Інтеграція з Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Почати 7 днів безкоштовно",
          },
          {
            id: "agency_quarterly", name: "Щоквартально", users: "Усі функції включені", oldPrice: null, price: 349,
            savingsYear: null, badge: null, popular: false,
            features: ["5 агентів включено", "Необмежений аналіз району", "Середня ціна за м² у районі", "ШІ-homestaging", "ШІ-відео з аватаром і субтитрами", "Пости для IG, FB, TikTok, LinkedIn", "PDF-звіт white-label з твоїм логотипом", "Інтеграція з Immobiliare.it, Idealista, Casa.it, Airbnb, Booking"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Почати 7 днів безкоштовно",
          },
          {
            id: "agency_annual", name: "Щорічно", users: "Усі функції включені", oldPrice: null, price: 300,
            savingsYear: null, badge: "Найвигідніший", popular: false,
            features: ["5 агентів включено", "Необмежений аналіз району", "Середня ціна за м² у районі", "ШІ-homestaging", "ШІ-відео з аватаром і субтитрами", "Пости для IG, FB, TikTok, LinkedIn", "PDF-звіт white-label з твоїм логотипом", "Інтеграція з Immobiliare.it, Idealista, Casa.it, Airbnb, Booking", "Пріоритетна підтримка"],
            extra: null, color: "#2563EB", bg: "#eff6ff", cta: "Почати 7 днів безкоштовно",
          },
        ],
      },
      howItWorks: {
        title: "Готово до роботи за",
        titleHighlight: "2 секунди",
        subtitle: "Жодного програмного забезпечення для встановлення. Жодного навчання. Розширення інтегрується в портали, які ти вже використовуєш щодня.",
        steps: [
          { step: "1", title: "Додай до Chrome", desc: "Один клік у Chrome Web Store. Розширення GetNearMe встановлюється в браузері менш ніж за 2 секунди.", color: "#6366f1", bg: "#eef2ff", emoji: "puzzle" },
          { step: "2", title: "Відкрий оголошення", desc: "Immobiliare.it, Idealista, Casa.it, Airbnb або Booking: портали, які ти вже використовуєш щодня. GetNearMe автоматично активується на оголошенні.", color: "#f59e0b", bg: "#fffbeb", emoji: "search" },
          { step: "3", title: "Генеруй все одним кліком", desc: "Аналіз району, ШІ-рендер, відео, пости та PDF з твоїм брендом. Готові показати клієнту, без відкриття іншого програмного забезпечення.", color: "#10b981", bg: "#ecfdf5", emoji: "sparkles" },
        ],
      },
      faq: {
        title: "Питання?",
        titleHighlight: "Відповіді.",
        items: [
          { q: "Що саме таке GetNearMe?", a: "Розширення для браузера Google Chrome, створене для агентів та агентств з нерухомості. Встановлюється з Chrome Web Store за 2 секунди і не потребує навчання: активується автоматично, коли відкриваєш оголошення на підтримуваних порталах." },
          { q: "На яких порталах працює?", a: "Immobiliare.it, Idealista, Casa.it, Airbnb та Booking. Відкрий оголошення, і GetNearMe автоматично зчитає дані об'єкта для генерації аналізів, контенту та звітів." },
          { q: "Які інструменти замінює?", a: "GetNearMe концентрує в одному розширенні роботу, яку ти сьогодні виконуєш з Canva, Photoshop, відеоредакторами, PowerPoint, інструментами аналізу району та зовнішніми сервісами homestaging або графічного дизайну. Мета — заощадити тобі години роботи по кожному об'єкту." },
          { q: "Як працює ШІ-homestaging?", a: "Вибираєш фото порожньої або обставленої кімнати, обираєш один із доступних стилів, і ШІ повертає обставлену версію приблизно за 10 секунд. До/після можна використовувати прямо в постах соцмереж, відео або PDF для клієнта." },
          { q: "Чи можна створювати відео без навичок монтажу?", a: "Так. Обери шаблон (говорячий аватар, субтитри, walkthrough, before/after, розділений екран, відео стейджингу) і GetNearMe монтує музику, тексти та кліпи на основі оголошення. Жодне редагуюче програмне забезпечення не потрібне." },
          { q: "Мій бренд застосовується автоматично?", a: "Так. Завантажуєш логотип, кольори та шрифти один раз: вони автоматично застосовуються до PDF, відео та постів у соцмережах для всіх агентів агентства." },
          { q: "Скільки агентів можна додати?", a: "Кожен план включає 5 агентів із спільним доступом до одного брендингу. У кожного агента свій акаунт, але він працює під ідентичністю агентства." },
          { q: "Як працює безкоштовний пробний період?", a: "7 днів повного доступу без обмежень використання. Скасуй одним кліком із дашборду — жодних списань при скасуванні протягом 7 днів." },
        ],
      },
      finalCta: {
        title1: "Припини перемикатися між 10 інструментами.",
        title2: "Вся робота по оголошенню — в одному розширенні.",
        desc: "Спробуй GetNearMe 7 днів безкоштовно, без обмежень. Скасуй коли завгодно.",
        button: "Додати розширення — 7 днів безкоштовно",
        footer: "🔒 Без списань під час пробного періоду. Скасування одним кліком.",
      },
      modal: {
        emoji: "rocket",
        title: "Чудовий вибір!",
        planLabel: "План",
        desc: "Увійди або зареєструйся, щоб активувати",
        descBold: "7 днів безкоштовного пробного періоду",
        descEnd: "з повним доступом до всіх функцій.",
        cta: "Активувати безкоштовний період",
        footer: "🔒 Без списань 7 днів. Скасування одним кліком.",
      },
      popups: [
        { icon: "circle", text: "Агентство з Північної Італії активувало безкоштовний період", time: "3 хв тому" },
        { icon: "clapperboard", text: "Агент щойно згенерував промо-відео з ШІ", time: "" },
        { icon: "users", text: "Агентства онлайн прямо зараз", time: "" },
        { icon: "rocket", text: "Агент почав 7 днів безкоштовного пробного періоду", time: "12 хв тому" },
        { icon: "flame", text: "GetNearMe обрали нові агентства цього тижня", time: "" },
        { icon: "sparkles", text: "Агент обставив кімнату за допомогою ШІ-homestaging", time: "5 хв тому" },
        { icon: "star", text: "Агентство перейшло на річний план", time: "18 хв тому" },
        { icon: "smartphone", text: "Постів у соцмережах згенеровано цього тижня з GetNearMe", time: "" },
        { icon: "target", text: "Агент експортував PDF white-label зі своїм логотипом", time: "7 хв тому" },
        { icon: "briefcase", text: "Агентство щойно зареєструвалось на безкоштовний період", time: "2 хв тому" },
        { icon: "trophy", text: "GetNearMe використовують агенти з нерухомості по всій Італії", time: "" },
        { icon: "map", text: "Агент згенерував аналіз району з порталів нерухомості", time: "9 хв тому" },
      ],
    },
  }
};
