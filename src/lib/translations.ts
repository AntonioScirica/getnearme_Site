export type Locale = 'it' | 'en' | 'es' | 'fr' | 'ru' | 'uk';

export const translations = {
  it: {
    nav: {
      features: "Funzionalità",
      pricing: "Prezzi",
      faq: "FAQ",
      blog: "Blog",
      startAnalysis: "Inizia Analisi",
      backToHome: "← Torna alla home"
    },
    hero: {
      title1: "Scegli casa tua",
      title2: "con più",
      title3: "consapevolezza",
      description: "GetNearMe è uno strumento di supporto decisionale che analizza immobili e quartieri, confronta i dati disponibili e fornisce stime indicative dei costi per aiutarti a valutare più opzioni in modo strutturato.",
      cta: "Aggiungi Estensione",
      subMockup: "GetNearMe è un’estensione per Google Chrome che ti aiuta a prendere decisioni migliori quando cerchi casa. Non vedi solo le informazioni di base: organizza i dati dell’annuncio, confronta più immobili, analizza i servizi attorno e confronta prezzi reali della zona… tutto in automatico mentre navighi sui portali immobiliari che già usi."
    },
    features: {
      title: "L'immobile, nei",
      titleItalic: "suoi dati essenziali",
      description: "GetNearMe organizza le informazioni in passaggi chiari, per aiutarti a confrontare immobili e contesto in modo strutturato.",
      card1: {
        title: "I dati dell'immobile",
        desc: "Prezzo, superficie, €/m², tipologia e caratteristiche principali vengono raccolti e organizzati a partire dai dati dell'annuncio."
      },
      card2: {
        title: "Il contesto intorno all'immobile",
        desc: "Servizi, trasporti, scuole, aree verdi e punti di interesse vengono analizzati in base alla posizione e alle distanze."
      },
      card3: {
        title: "Prezzi in relazione alla zona",
        desc: "Il prezzo dell'annuncio viene confrontato con i valori medi di riferimento disponibili per la zona."
      },
      card4: {
        title: "Una vista comparativa",
        desc: "Le informazioni vengono affiancate per evidenziare differenze rilevanti tra più opzioni analizzate."
      },
      disclaimer: "Le analisi e le stime mostrate sono indicative e non costituiscono una valutazione immobiliare."
    },
    faq: {
      title: "Domande",
      titleItalic: "frequenti",
      items: [
        {
          q: "Che tipo di informazioni mostra?",
          a: "GetNearMe mostra dati organizzati provenienti da annunci immobiliari e fonti pubbliche, relativi all'immobile, al quartiere e a indicatori di prezzo e costo."
        },
        {
          q: "È un portale immobiliare o un'agenzia?",
          a: "No. GetNearMe non pubblica annunci e non svolge attività di intermediazione immobiliare. È uno strumento di analisi e confronto dei dati disponibili."
        },
        {
          q: "Sono tutte valutazioni ufficiali?",
          a: "No. Le analisi e le stime mostrate sono indicative e non costituiscono una valutazione immobiliare né una consulenza professionale."
        },
        {
          q: "Da dove provengono i dati?",
          a: "I dati derivano dagli annunci immobiliari analizzati e da fonti pubbliche disponibili. Le informazioni vengono elaborate per facilitarne la lettura e il confronto."
        },
        {
          q: "Le stime dei costi sono precise?",
          a: "No. Le stime dei costi sono proiezioni indicative basate su valori medi e possono variare in base alle caratteristiche specifiche dell'immobile e dell'operazione."
        },
        {
          q: "Posso confrontare più immobili tra loro?",
          a: "Sì. GetNearMe consente di affiancare più immobili per confrontare dati, contesto e indicatori in una vista comparativa."
        }
      ]
    },
    pricing: {
      title: "Accesso alle",
      titleItalic: "analisi",
      description: "Scegli il livello di accesso più adatto al numero di analisi che desideri effettuare.",
      free: "Free",
      buyNow: "Acquista ora",
      registerNow: "Registrati ora",
      mostChosen: "Più scelto",
      footer1: "Pagamento sicuro con carta, PayPal e principali provider.",
      footer2: "Crediti disponibili immediatamente dopo l'acquisto.",
      footer3: "Nessun abbonamento. Nessuna scadenza.",
      plans: [
        {
          name: "500 crediti",
          subtitle: "Per iniziare",
          desc: "Consente di effettuare alcune analisi complete per confrontare immobili e contesto in modo strutturato."
        },
        {
          name: "500 crediti",
          subtitle: "Per iniziare",
          desc: "Consente di effettuare alcune analisi complete per confrontare immobili e contesto in modo strutturato."
        },
        {
          name: "1.500 crediti",
          subtitle: "Confronti approfonditi",
          desc: "Adatto a confrontare più opzioni e approfondire le differenze tra immobili, quartieri e costi stimati."
        },
        {
          name: "5.000 crediti",
          subtitle: "Analisi estese",
          desc: "Pensato per chi analizza molte opzioni e desidera confronti più approfonditi nel tempo."
        }
      ]
    },
    cta: {
      title: "Confronta immobili",
      title2: "in modo",
      titleItalic: "strutturato",
      desc: "GetNearMe ti aiuta a organizzare e confrontare i dati disponibili per valutare più opzioni con maggiore chiarezza.",
      button: "Aggiungi estensione"
    },
    footer: {
      desc: "Strumento di supporto decisionale per l'analisi comparativa di immobili e quartieri.",
      product: "Prodotto",
      legal: "Legale",
      privacy: "Privacy Policy",
      cookie: "Cookie Policy",
      terms: "Termini di Servizio",
      rights: "Tutti i diritti riservati."
    },
    privacy: {
      update: "Ultimo aggiornamento: 22/12/2025",
      intro: "La presente Privacy Policy descrive le modalità di trattamento dei dati personali degli utenti che utilizzano il sito web getnearme.it e l’estensione browser GetNearMe (di seguito, il “Servizio”).",
      sections: [
        {
          t: "1. Titolare del trattamento",
          c: "Il titolare del trattamento è persona fisica, identificata come GetNearMe. Per qualsiasi richiesta relativa al trattamento dei dati personali è possibile contattare: info@getnearme.it"
        },
        {
          t: "2. Tipologie di dati trattati",
          c: "Nel corso dell’utilizzo del Servizio possono essere trattate le seguenti categorie di dati: dati forniti volontariamente dall’utente (ad esempio indirizzo email in fase di registrazione); dati tecnici e di navigazione (indirizzo IP, tipo di browser, sistema operativo, data e ora di accesso); dati relativi all’utilizzo del Servizio (analisi effettuate, crediti utilizzati, preferenze di utilizzo). Non vengono trattati dati personali sensibili."
        },
        {
          t: "3. Finalità del trattamento",
          c: "I dati personali sono trattati per le seguenti finalità: consentire la registrazione e la gestione dell’account utente; fornire le funzionalità di analisi e confronto offerte dal Servizio; gestire il sistema di crediti e l’accesso alle funzionalità; inviare comunicazioni di servizio necessarie al funzionamento del Servizio; inviare comunicazioni informative solo previo consenso esplicito dell’utente; migliorare il funzionamento e la sicurezza del Servizio."
        },
        {
          t: "4. Base giuridica del trattamento",
          c: "Il trattamento dei dati si basa su: esecuzione di un contratto o di misure precontrattuali; consenso dell’utente, ove richiesto; legittimo interesse del titolare al corretto funzionamento e miglioramento del Servizio."
        },
        {
          t: "5. Modalità di trattamento",
          c: "Il trattamento dei dati avviene mediante strumenti informatici, adottando misure di sicurezza adeguate a garantire riservatezza, integrità e disponibilità delle informazioni."
        },
        {
          t: "6. Conservazione dei dati",
          c: "I dati personali sono conservati per il tempo necessario alle finalità per cui sono stati raccolti o fino alla cancellazione dell’account da parte dell’utente, salvo obblighi di legge."
        },
        {
          t: "7. Condivisione dei dati",
          c: "I dati possono essere condivisi con fornitori di servizi tecnici e operativi (ad esempio servizi di hosting, pagamento o invio email), esclusivamente per finalità connesse all’erogazione del Servizio."
        },
        {
          t: "8. Diritti dell’utente",
          c: "L’utente può esercitare i diritti previsti dal Regolamento UE 2016/679 (GDPR), inclusi accesso, rettifica, cancellazione e opposizione, scrivendo a info@getnearme.it."
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
    }
  },
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
      blog: "Blog",
      startAnalysis: "Start Analysis",
      backToHome: "← Back to home"
    },
    hero: {
      title1: "Choose your home",
      title2: "with more",
      title3: "awareness",
      description: "GetNearMe is a decision support tool that analyzes real estate and neighborhoods, compares available data and provides indicative cost estimates to help you evaluate multiple options in a structured way.",
      cta: "Add Extension",
      subMockup: "GetNearMe is a Google Chrome extension that helps you make better decisions when searching for a home. You don't just see the basic information: it organizes listing data, compares multiple properties, analyzes surrounding services and compares real area prices... all automatically while you browse the real estate portals you already use."
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
        title: "Prices relative to area",
        desc: "The listing price is compared with available reference average values for the area."
      },
      card4: {
        title: "Comparative view",
        desc: "Information is displayed side-by-side to highlight relevant differences between multiple analyzed options."
      },
      disclaimer: "The analyzes and estimates shown are indicative and do not constitute a real estate appraisal."
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
      button: "Add extension"
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
      update: "Last update: 12/22/2025",
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
          t: "3. Purpose of the processing",
          c: "Personal data are processed for the following purposes: to allow registration and management of the user account; provide the analysis and comparison features offered by the Service; manage the credit system and access to features; send service communications necessary for the operation of the Service; send informative communications only with the explicit consent of the user; improve the operation and security of the Service."
        },
        {
          t: "4. Legal basis of processing",
          c: "The data processing is based on: execution of a contract or pre-contractual measures; user consent, where required; legitimate interest of the controller in the correct functioning and improvement of the Service."
        },
        {
          t: "5. Processing methods",
          c: "The data processing is carried out by means of computer tools, adopting appropriate security measures to guarantee confidentiality, integrity and availability of information."
        },
        {
          t: "6. Data retention",
          c: "Personal data are kept for the time necessary for the purposes for which they were collected or until the account is deleted by the user, unless legal obligations."
        },
        {
          t: "7. Data sharing",
          c: "The data can be shared with technical and operational service providers (for example hosting, payment or email sending services), exclusively for purposes related to the provision of the Service."
        },
        {
          t: "8. User rights",
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
    }
  },
  es: {
    nav: {
      features: "Funcionalidades",
      pricing: "Precios",
      faq: "FAQ",
      blog: "Blog",
      startAnalysis: "Iniciar Análisis",
      backToHome: "← Volver al inicio"
    },
    hero: {
      title1: "Elige tu casa",
      title2: "con más",
      title3: "conciencia",
      description: "GetNearMe è una herramienta de soporte a la decisión que analiza inmuebles y barrios, compara los datos disponibles y ofrece estimaciones indicativas de costes para ayudarte a evaluar múltiples opciones de forma estructurada.",
      cta: "Añadir Extensión",
      subMockup: "GetNearMe es una extensión de Google Chrome que te ayuda a tomar mejores decisiones al buscar casa. No solo ves la información básica: organiza los datos del anuncio, compara múltiples inmuebles, analiza los servicios del entorno y compara precios reales de la zona… todo automáticamente mientras navegas por los portales inmobiliarios que ya usas."
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
        title: "Precios respecto a la zona",
        desc: "El precio del anuncio se compara con los valores medios de referencia disponibles para la zona."
      },
      card4: {
        title: "Vista comparativa",
        desc: "La información se muestra en paralelo para resaltar las diferencias relevantes entre varias opciones analizadas."
      },
      disclaimer: "Los análisis y estimaciones mostrados son indicativos y no constituyen una tasación inmobiliaria."
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
      button: "Añadir extensión"
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
      update: "Última actualización: 22/12/2025",
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
          t: "3. Finalidad del tratamiento",
          c: "Los datos personales se tratan con las siguientes finalidades: permitir el registro y la gestión de la cuenta de usuario; proporcionar las funcionalidades de análisis y comparación que ofrece el Servicio; gestionar el sistema de créditos y el acceso a las funcionalidades; enviar comunicaciones de servicio necesarias para el funcionamiento del Servicio; enviar comunicaciones informativas solo previo consentimiento explícito del usuario; mejorar el funcionamiento y la seguridad del Servicio."
        },
        {
          t: "4. Base jurídica del tratamiento",
          c: "El tratamiento de los datos se basa en: ejecución de un contrato o de medidas precontractuales; consentimiento del usuario, cuando sea requerido; interés legítimo del responsable en el correcto funcionamiento y mejora del Servicio."
        },
        {
          t: "5. Modalidades de tratamiento",
          c: "El tratamiento de los datos se realiza mediante herramientas informáticas, adoptando las medidas de seguridad adecuadas para garantizar la confidencialidad, integridad y disponibilidad de la información."
        },
        {
          t: "6. Conservación de los datos",
          c: "Los datos personales se conservan durante el tiempo necesario para las finalidades para las que fueron recogidos o hasta que el usuario elimine la cuenta, salvo obligaciones legales."
        },
        {
          t: "7. Intercambio de datos",
          c: "Los datos pueden compartirse con proveedores de servicios técnicos y operativos (por ejemplo, servicios de alojamiento, pago o envío de correos electrónicos), exclusivamente para finalidades relacionadas con la prestación del Servicio."
        },
        {
          t: "8. Derechos del usuario",
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
    }
  },
  fr: {
    nav: {
      features: "Fonctionnalités",
      pricing: "Tarifs",
      faq: "FAQ",
      blog: "Blog",
      startAnalysis: "Lancer l'Analyse",
      backToHome: "← Retour à l'accueil"
    },
    hero: {
      title1: "Choisissez votre maison",
      title2: "avec plus de",
      title3: "conscience",
      description: "GetNearMe est un outil d'aide à la décision qui analyse l'immobilier et les quartiers, compare les données disponibles et fournit des estimations de coûts indicatives pour vous aider à évaluer plusieurs options de manière structurée.",
      cta: "Ajouter l'Extension",
      subMockup: "GetNearMe est une extension Google Chrome qui vous aide à prendre de meilleures décisions lors de votre recherche de logement. Vous ne voyez pas seulement les informations de base : elle organise les données de l'annonce, compare plusieurs biens, analyse les services environnants et compare les prix réels du secteur… tout cela automatiquement pendant que vous naviguez sur les portails immobiliers que vous utilisez déjà."
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
        title: "Prix par rapport au secteur",
        desc: "Le prix de l'annonce est comparé aux valeurs moyennes de référence disponibles pour le secteur."
      },
      card4: {
        title: "Vue comparative",
        desc: "Les informations sont affichées côte à côte pour mettre en évidence les différences pertinentes entre plusieurs options analysées."
      },
      disclaimer: "Les analyses et estimations affichées sont indicatives et ne constituent pas une expertise immobilière."
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
      button: "Ajouter l'extension"
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
      update: "Dernière mise à jour : 22/12/2025",
      intro: "La présente Politique de Confidentialité décrit les modalités de traitement des données personnelles des utilisateurs qui utilisent le site web getnearme.it et l’extension de navigateur GetNearMe (ci-après, le « Service »).",
      sections: [
        {
          t: "1. Responsable du traitement",
          c: "Le responsable du traitement est une personne physique, identifiée comme GetNearMe. Pour toute demande relative au traitement des données personnelles, il est possible de contacter : info@getnearme.it"
        },
        {
          t: "2. Types de données traitées",
          c: "Au cours de l’utilisation du Service, les catégories de données suivantes peuvent être traitées : données fournies volontairement par l’utilisateur (par exemple, adresse e-mail lors de l’inscription) ; données techniques et de navigation (adresse IP, type de navigateur, système d’exploitation, date et heure d’accès) ; données relatives à l’utilisation du Service (analyses effectuées, crédits utilisés, préférences d’utilisation). Les données personnelles sensibles ne sont pas traitées."
        },
        {
          t: "3. Finalités du traitement",
          c: "Les données personnelles sont traitées pour les finalités suivantes : permettre l’inscription et la gestion du compte utilisateur ; fournir les fonctionnalités d’analyse et de comparaison offertes par le Service ; gérer le système de crédits et l’accès aux fonctionnalités ; envoyer des communications de service nécessaires au fonctionnement du Service ; envoyer des communications informatives uniquement avec le consentement explicite de l’utilisateur ; améliorer le fonctionnement et la sécurité du Service."
        },
        {
          t: "4. Base juridique du traitement",
          c: "Le traitement des données est basé sur : l’exécution d’un contrat ou de mesures précontractuelles ; le consentement de l’utilisateur, le cas échéant ; l’intérêt légitime du responsable au bon fonctionnement et à l’amélioration du Service."
        },
        {
          t: "5. Modalités de traitement",
          c: "Le traitement des données est effectué au moyen d’outils informatiques, en adoptant des mesures de sécurité appropriées pour garantir la confidentialité, l’intégrité et la disponibilité des informations."
        },
        {
          t: "6. Conservation des données",
          c: "Les données personnelles sont conservées pendant le temps nécessaire aux finalités pour lesquelles elles ont été collectées ou jusqu’à la suppression du compte par l’utilisateur, sauf obligations légales."
        },
        {
          t: "7. Partage des données",
          c: "Les données peuvent être partagées avec des prestataires de services techniques et opérationnels (par exemple, services d’hébergement, de paiement ou d’envoi d’e-mails), exclusivement pour des finalités liées à la fourniture du Service."
        },
        {
          t: "8. Droits de l’utilisateur",
          c: "L’utilisateur peut exercer les droits prévus par le Règlement UE 2016/679 (RGPD), y compris l’accès, la rectification, la suppression et l’opposition, en écrivant à info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Dernière mise à jour : 22/12/2025",
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
    }
  },
  ru: {
    nav: {
      features: "Возможности",
      pricing: "Цены",
      faq: "FAQ",
      blog: "Блог",
      startAnalysis: "Начать Анализ",
      backToHome: "← Вернуться на главную"
    },
    hero: {
      title1: "Выбирайте дом",
      title2: "с большей",
      title3: "осознанностью",
      description: "GetNearMe — это инструмент поддержки принятия решений, который анализирует недвижимость и районы, сравнивает доступные данные и предоставляет ориентировочную оценку затрат, чтобы помочь вам оценить несколько вариантов структурированным образом.",
      cta: "Добавить Расширение",
      subMockup: "GetNearMe — это расширение для Google Chrome, которое помогает вам принимать лучшие решения при поиске дома. Вы видите не только основную информацию: оно организует данные объявлений, сравнивает несколько объектов, анализирует окружающие услуги и сравнивает реальные цены в районе… и все это автоматически, пока вы просматриваете порталы недвижимости, которыми уже пользуетесь."
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
        title: "Цены относительно района",
        desc: "Цена объявления сравнивается с доступными справочными средними значениями для данного района."
      },
      card4: {
        title: "Сравнительный вид",
        desc: "Информация отображается рядом, чтобы подчеркнуть существенные различия между несколькими проанализированными вариантами."
      },
      disclaimer: "Представленные анализы и оценки носят ориентировочный характер и не являются официальной оценкой недвижимости."
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
      button: "Добавить расширение"
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
      update: "Последнее обновление: 22.12.2025",
      intro: "Настоящая Политика конфиденциальности описывает способы обработки персональных данных пользователей, которые используют веб-сайт getnearme.it и расширение браузера GetNearMe (далее — «Сервис»).",
      sections: [
        {
          t: "1. Оператор обработки данных",
          c: "Оператором обработки данных является физическое лицо, идентифицируемое как GetNearMe. По любым запросам, связанным с обработкой персональных данных, можно обращаться по адресу: info@getnearme.it"
        },
        {
          t: "2. Типы обрабатываемых данных",
          c: "В процессе использования Сервиса могут обрабатываться следующие категории данных: данные, предоставленные пользователем добровольно (наприклад, адрес электронной почты при регистрации); технические и навигационные данные (IP-адрес, тип браузера, операционная система, дата и время доступа); данные, относящиеся к использованию Сервиса (выполненные анализы, использованные кредиты, предпочтения в использовании). Особые категории персональных данных не обрабатываются."
        },
        {
          t: "3. Цели обработки",
          c: "Персональные данные обрабатываются в следующих целях: обеспечение регистрации и управления учетной записью пользователя; предоставление функций анализа и сравнения, предлагаемых Сервисом; управление системой кредитов и доступом к функциям; отправка сервисных сообщений, необходимых для работы Сервиса; отправка информационных сообщений только при наличии явного согласия пользователя; улучшение работы и безопасности Сервиса."
        },
        {
          t: "4. Правовая основа обработки",
          c: "Обработка данных основывается на: исполнении договора или преддоговорных мерах; согласии пользователя, где это требуется; законном интересе оператора в правильном функционировании и улучшении Сервиса."
        },
        {
          t: "5. Способы обработки",
          c: "Обработка данных осуществляется с использованием компьютерных средств с принятием соответствующих мер безопасности для обеспечения конфиденциальности, целостности и доступности информации."
        },
        {
          t: "6. Хранение данных",
          c: "Персональные данные хранятся в течение времени, необходимого для целей, в которых они были собраны, или до удаления учетной записи пользователем, за исключением случаев, предусмотренных законом."
        },
        {
          t: "7. Обмен данными",
          c: "Данные могут передаваться поставщикам технических и операционных услуг (например, услуги хостинга, оплаты или рассылки электронной почты) исключительно в целях, связанных с предоставлением Сервиса."
        },
        {
          t: "8. Права пользователя",
          c: "Пользователь может осуществлять права, предусмотренные Регламентом ЕС 2016/679 (GDPR), включая доступ, исправление, удаление и возражение, написав по адресу info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Последнее обновление: 22.12.2025",
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
    }
  },
  uk: {
    nav: {
      features: "Можливості",
      pricing: "Ціни",
      faq: "FAQ",
      blog: "Блог",
      startAnalysis: "Почати Аналіз",
      backToHome: "← Повернутися на головну"
    },
    hero: {
      title1: "Обирайте дім",
      title2: "з більшою",
      title3: "усвідомленістю",
      description: "GetNearMe — це інструмент підтримки прийняття рішень, який аналізує нерухомість та райони, порівнює доступні дані та надає орієнтовну оцінку витрат, щоб допомогти вам оцінити кілька варіантів структурованим чином.",
      cta: "Додати Розширення",
      subMockup: "GetNearMe — це розширення для Google Chrome, яке допомагає вам приймати кращі рішення під час пошуку житла. Ви бачите не тільки основну інформацію: воно організовує дані оголошень, порівнює кілька об'єктів, аналізує навколишні послуги та порівнює реальні ціни в районі… і все це автоматично, поки ви переглядаєте портали нерухомості, якими вже користуєтеся."
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
        title: "Ціни відносно району",
        desc: "Ціна оголошення порівнюється з доступними довідковими середніми значеннями для даного району."
      },
      card4: {
        title: "Порівняльний вигляд",
        desc: "Інформація відображається поруч, щоб підкреслити суттєві відмінності між кількома проаналізованими варіантами."
      },
      disclaimer: "Представлені аналізи та оцінки носять орієнтовний характер і не є офіційною оцінкою нерухомості."
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
      button: "Додати розширення"
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
      update: "Останнє оновлення: 22.12.2025",
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
          t: "3. Мета обробки",
          c: "Персональні дані обробляються з наступною метою: забезпечення реєстрації та управління обліковим записом користувача; надання функцій аналізу та порівняння, що пропонуються Сервісом; управління системою кредитів та доступом до функцій; надсилання сервісних повідомлень, необхідних для роботи Сервісу; надсилання інформаційних повідомлень лише за наявності явної згоди користувача; покращення роботи та безпеки Сервісу."
        },
        {
          t: "4. Правова основа обробки",
          c: "Обробка даних ґрунтується на: виконанні договору або переддоговірних заходах; згоді користувача, де це потрібно; законному інтересі володільця у правильному функціонуванні та покращенні Сервісу."
        },
        {
          t: "5. Способи обробки",
          c: "Обробка даних здійснюється за допомогою комп'ютерних засобів із вжиттям відповідних заходів безпеки для забезпечення конфіденційності, цілісності та доступності інформації."
        },
        {
          t: "6. Зберігання даних",
          c: "Персональні дані зберігаються протягом часу, необхідного для цілей, з якими вони були зібрані, або до видалення облікового запису користувачем, за винятком випадків, передбачених законом."
        },
        {
          t: "7. Обмін даними",
          c: "Дані можуть передаватися постачальникам технічних та операційних послуг (наприклад, послуги хостингу, оплати або розсилки електронної пошти) виключно з метою, пов'язаною з наданням Сервісу."
        },
        {
          t: "8. Права користувача",
          c: "Користувач може здійснювати права, передбачені Регламентом ЄС 2016/679 (GDPR), включаючи доступ, виправлення, видалення та заперечення, написавши за адресою info@getnearme.it."
        }
      ]
    },
    terms: {
      update: "Останнє оновлення: 22.12.2025",
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
    }
  }
};
