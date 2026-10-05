// Mappa dei collegamenti tra le guide (link interni voluti, non a caso):
// - AGENT_TOPICS: le guide per agenti raggruppate per argomento (pilastro /it/agente-immobiliare, indice /it/guide, llms.txt)
// - OWNER_STEPS: le guide per chi vende casa nell'ordine del percorso (hub /it/vendere-casa)
// - RELATED: per ogni guida le 5 guide da proporre in "Leggi anche", scelte a mano per argomento
// Se aggiungi una guida: mettila in un gruppo e dalle 4-6 correlate; poi aggiungila tra le correlate di 2-3 guide vicine.

export const PILLAR = 'agente-immobiliare';

export const AGENT_TOPICS: { id: string; title: string; text: string; slugs: string[] }[] = [
  { id: 'mestiere', title: 'Il mestiere: diventare agente e guadagnare', text: 'Requisiti, esame, lavoro in proprio e provvigioni.', slugs: ['come-diventare-agente-immobiliare', 'agente-immobiliare-indipendente', 'provvigione-agente-immobiliare'] },
  { id: 'acquisizione', title: 'Acquisire incarichi e trovare clienti', text: 'Come convincere i proprietari ad affidarti la casa.', slugs: ['acquisire-incarichi-immobiliari', 'presentazione-acquisizione-immobile', 'valutazione-immobile-acquisizione', 'lettera-acquisizione-immobili', 'messaggi-acquisire-immobili', 'script-telefonata-proprietari', 'come-trovare-clienti-agente-immobiliare'] },
  { id: 'annunci', title: 'Annunci che vendono', text: 'Testi, dati obbligatori, planimetria e case ferme da mesi.', slugs: ['come-scrivere-annuncio-immobiliare', 'descrizione-immobile-esempi', 'ape-annunci-immobiliari', 'planimetria-annuncio-immobiliare', 'annuncio-immobiliare-senza-contatti', 'casa-che-non-si-vende'] },
  { id: 'foto', title: 'Foto e home staging', text: 'Foto migliori, stanze arredate con l\'AI e regole di correttezza.', slugs: ['home-staging-virtuale', 'home-staging-esempi', 'arredare-foto-con-ai', 'virtual-staging-legale', 'home-staging-costo', 'migliorare-foto-annuncio-immobiliare', 'foto-immobiliari-smartphone'] },
  { id: 'social', title: 'Video, social e personal branding', text: 'Farsi conoscere nella zona con video e contenuti costanti.', slugs: ['video-immobiliari-social', 'video-marketing-immobiliare', 'reel-immobiliari-instagram-tiktok', 'cosa-pubblicare-instagram-agente-immobiliare', 'personal-branding-agente-immobiliare'] },
  { id: 'zona', title: 'Farsi trovare in zona', text: 'Google Maps, recensioni, WhatsApp, vetrina, sito e contatti diretti.', slugs: ['agenzia-immobiliare-google-maps', 'recensioni-google-agenzia-immobiliare', 'whatsapp-business-agenzia-immobiliare', 'vetrina-agenzia-immobiliare', 'sito-web-agente-immobiliare', 'ricevere-contatti-senza-portali'] },
  { id: 'strumenti', title: 'Software, portali e intelligenza artificiale', text: 'Gestionale, CRM, costi dei portali e AI nel lavoro di tutti i giorni.', slugs: ['software-agenti-immobiliari', 'gestionale-immobiliare', 'gestionale-immobiliare-gratuito', 'alternative-getrix-miogest', 'crm-immobiliare', 'costo-immobiliare-it-agenzie', 'intelligenza-artificiale-agenti-immobiliari', 'chatgpt-agenti-immobiliari'] },
];

export const OWNER_STEPS: [string, string[]][] = [
  ['1. Capire quanto vale la casa', ['come-valutare-una-casa', 'quotazioni-omi', 'superficie-commerciale']],
  ['2. Costi, documenti e tasse', ['quanto-costa-vendere-casa', 'documenti-per-vendere-casa', 'plusvalenza-vendita-casa']],
  ['3. Preparare e vendere', ['quando-conviene-vendere-casa', 'cosa-fare-prima-di-vendere-casa', 'come-vendere-casa-velocemente', 'vendere-casa-senza-agenzia']],
];

export const RELATED: Record<string, string[]> = {
  // il mestiere
  'come-diventare-agente-immobiliare': ['agente-immobiliare-indipendente', 'provvigione-agente-immobiliare', 'come-trovare-clienti-agente-immobiliare', 'acquisire-incarichi-immobiliari', 'personal-branding-agente-immobiliare'],
  'agente-immobiliare-indipendente': ['come-diventare-agente-immobiliare', 'personal-branding-agente-immobiliare', 'come-trovare-clienti-agente-immobiliare', 'software-agenti-immobiliari', 'sito-web-agente-immobiliare'],
  'provvigione-agente-immobiliare': ['script-telefonata-proprietari', 'presentazione-acquisizione-immobile', 'valutazione-immobile-acquisizione', 'come-diventare-agente-immobiliare', 'quanto-costa-vendere-casa'],
  // acquisizione
  'acquisire-incarichi-immobiliari': ['presentazione-acquisizione-immobile', 'valutazione-immobile-acquisizione', 'lettera-acquisizione-immobili', 'messaggi-acquisire-immobili', 'script-telefonata-proprietari', 'come-trovare-clienti-agente-immobiliare'],
  'presentazione-acquisizione-immobile': ['valutazione-immobile-acquisizione', 'acquisire-incarichi-immobiliari', 'home-staging-virtuale', 'video-marketing-immobiliare', 'provvigione-agente-immobiliare'],
  'valutazione-immobile-acquisizione': ['presentazione-acquisizione-immobile', 'quotazioni-omi', 'come-valutare-una-casa', 'superficie-commerciale', 'casa-che-non-si-vende'],
  'lettera-acquisizione-immobili': ['messaggi-acquisire-immobili', 'script-telefonata-proprietari', 'acquisire-incarichi-immobiliari', 'vetrina-agenzia-immobiliare', 'crm-immobiliare'],
  'messaggi-acquisire-immobili': ['lettera-acquisizione-immobili', 'script-telefonata-proprietari', 'whatsapp-business-agenzia-immobiliare', 'crm-immobiliare', 'acquisire-incarichi-immobiliari'],
  'script-telefonata-proprietari': ['messaggi-acquisire-immobili', 'lettera-acquisizione-immobili', 'provvigione-agente-immobiliare', 'presentazione-acquisizione-immobile', 'crm-immobiliare'],
  'come-trovare-clienti-agente-immobiliare': ['acquisire-incarichi-immobiliari', 'personal-branding-agente-immobiliare', 'ricevere-contatti-senza-portali', 'agenzia-immobiliare-google-maps', 'cosa-pubblicare-instagram-agente-immobiliare'],
  // annunci
  'casa-che-non-si-vende': ['annuncio-immobiliare-senza-contatti', 'valutazione-immobile-acquisizione', 'home-staging-virtuale', 'migliorare-foto-annuncio-immobiliare', 'come-vendere-casa-velocemente'],
  'annuncio-immobiliare-senza-contatti': ['casa-che-non-si-vende', 'come-scrivere-annuncio-immobiliare', 'migliorare-foto-annuncio-immobiliare', 'descrizione-immobile-esempi', 'costo-immobiliare-it-agenzie'],
  'come-scrivere-annuncio-immobiliare': ['descrizione-immobile-esempi', 'ape-annunci-immobiliari', 'planimetria-annuncio-immobiliare', 'foto-immobiliari-smartphone', 'annuncio-immobiliare-senza-contatti'],
  'descrizione-immobile-esempi': ['come-scrivere-annuncio-immobiliare', 'chatgpt-agenti-immobiliari', 'planimetria-annuncio-immobiliare', 'ape-annunci-immobiliari', 'arredare-foto-con-ai'],
  'ape-annunci-immobiliari': ['come-scrivere-annuncio-immobiliare', 'virtual-staging-legale', 'planimetria-annuncio-immobiliare', 'descrizione-immobile-esempi', 'documenti-per-vendere-casa'],
  'planimetria-annuncio-immobiliare': ['come-scrivere-annuncio-immobiliare', 'superficie-commerciale', 'foto-immobiliari-smartphone', 'sito-web-agente-immobiliare', 'ape-annunci-immobiliari'],
  // foto e home staging
  'home-staging-virtuale': ['home-staging-esempi', 'arredare-foto-con-ai', 'virtual-staging-legale', 'home-staging-costo', 'migliorare-foto-annuncio-immobiliare'],
  'home-staging-esempi': ['home-staging-virtuale', 'arredare-foto-con-ai', 'home-staging-costo', 'foto-immobiliari-smartphone', 'cosa-fare-prima-di-vendere-casa'],
  'arredare-foto-con-ai': ['home-staging-virtuale', 'home-staging-esempi', 'virtual-staging-legale', 'intelligenza-artificiale-agenti-immobiliari', 'migliorare-foto-annuncio-immobiliare'],
  'virtual-staging-legale': ['home-staging-virtuale', 'ape-annunci-immobiliari', 'migliorare-foto-annuncio-immobiliare', 'arredare-foto-con-ai', 'come-scrivere-annuncio-immobiliare'],
  'home-staging-costo': ['home-staging-virtuale', 'home-staging-esempi', 'video-marketing-immobiliare', 'software-agenti-immobiliari', 'cosa-fare-prima-di-vendere-casa'],
  'migliorare-foto-annuncio-immobiliare': ['foto-immobiliari-smartphone', 'home-staging-virtuale', 'virtual-staging-legale', 'annuncio-immobiliare-senza-contatti', 'reel-immobiliari-instagram-tiktok'],
  'foto-immobiliari-smartphone': ['migliorare-foto-annuncio-immobiliare', 'arredare-foto-con-ai', 'planimetria-annuncio-immobiliare', 'come-scrivere-annuncio-immobiliare', 'video-immobiliari-social'],
  // video e social
  'video-immobiliari-social': ['video-marketing-immobiliare', 'reel-immobiliari-instagram-tiktok', 'cosa-pubblicare-instagram-agente-immobiliare', 'personal-branding-agente-immobiliare', 'intelligenza-artificiale-agenti-immobiliari'],
  'video-marketing-immobiliare': ['video-immobiliari-social', 'reel-immobiliari-instagram-tiktok', 'cosa-pubblicare-instagram-agente-immobiliare', 'presentazione-acquisizione-immobile', 'home-staging-costo'],
  'reel-immobiliari-instagram-tiktok': ['video-immobiliari-social', 'cosa-pubblicare-instagram-agente-immobiliare', 'video-marketing-immobiliare', 'personal-branding-agente-immobiliare', 'foto-immobiliari-smartphone'],
  'cosa-pubblicare-instagram-agente-immobiliare': ['reel-immobiliari-instagram-tiktok', 'personal-branding-agente-immobiliare', 'video-marketing-immobiliare', 'come-trovare-clienti-agente-immobiliare', 'recensioni-google-agenzia-immobiliare'],
  'personal-branding-agente-immobiliare': ['cosa-pubblicare-instagram-agente-immobiliare', 'sito-web-agente-immobiliare', 'recensioni-google-agenzia-immobiliare', 'agente-immobiliare-indipendente', 'video-immobiliari-social'],
  // farsi trovare in zona
  'agenzia-immobiliare-google-maps': ['recensioni-google-agenzia-immobiliare', 'sito-web-agente-immobiliare', 'ricevere-contatti-senza-portali', 'whatsapp-business-agenzia-immobiliare', 'vetrina-agenzia-immobiliare'],
  'recensioni-google-agenzia-immobiliare': ['agenzia-immobiliare-google-maps', 'whatsapp-business-agenzia-immobiliare', 'personal-branding-agente-immobiliare', 'vetrina-agenzia-immobiliare', 'sito-web-agente-immobiliare'],
  'whatsapp-business-agenzia-immobiliare': ['messaggi-acquisire-immobili', 'crm-immobiliare', 'agenzia-immobiliare-google-maps', 'recensioni-google-agenzia-immobiliare', 'ricevere-contatti-senza-portali'],
  'vetrina-agenzia-immobiliare': ['agenzia-immobiliare-google-maps', 'lettera-acquisizione-immobili', 'recensioni-google-agenzia-immobiliare', 'video-marketing-immobiliare', 'migliorare-foto-annuncio-immobiliare'],
  'sito-web-agente-immobiliare': ['ricevere-contatti-senza-portali', 'personal-branding-agente-immobiliare', 'agenzia-immobiliare-google-maps', 'software-agenti-immobiliari', 'crm-immobiliare'],
  'ricevere-contatti-senza-portali': ['costo-immobiliare-it-agenzie', 'sito-web-agente-immobiliare', 'agenzia-immobiliare-google-maps', 'cosa-pubblicare-instagram-agente-immobiliare', 'crm-immobiliare'],
  // software, portali e AI
  'software-agenti-immobiliari': ['gestionale-immobiliare', 'crm-immobiliare', 'sito-web-agente-immobiliare', 'intelligenza-artificiale-agenti-immobiliari', 'gestionale-immobiliare-gratuito', 'home-staging-virtuale'],
  'gestionale-immobiliare': ['crm-immobiliare', 'gestionale-immobiliare-gratuito', 'alternative-getrix-miogest', 'software-agenti-immobiliari', 'intelligenza-artificiale-agenti-immobiliari'],
  'gestionale-immobiliare-gratuito': ['gestionale-immobiliare', 'alternative-getrix-miogest', 'crm-immobiliare', 'software-agenti-immobiliari', 'chatgpt-agenti-immobiliari'],
  'alternative-getrix-miogest': ['gestionale-immobiliare', 'gestionale-immobiliare-gratuito', 'costo-immobiliare-it-agenzie', 'crm-immobiliare', 'software-agenti-immobiliari'],
  'crm-immobiliare': ['gestionale-immobiliare', 'whatsapp-business-agenzia-immobiliare', 'script-telefonata-proprietari', 'messaggi-acquisire-immobili', 'ricevere-contatti-senza-portali'],
  'costo-immobiliare-it-agenzie': ['ricevere-contatti-senza-portali', 'alternative-getrix-miogest', 'annuncio-immobiliare-senza-contatti', 'gestionale-immobiliare', 'sito-web-agente-immobiliare'],
  'intelligenza-artificiale-agenti-immobiliari': ['chatgpt-agenti-immobiliari', 'arredare-foto-con-ai', 'video-immobiliari-social', 'software-agenti-immobiliari', 'descrizione-immobile-esempi'],
  'chatgpt-agenti-immobiliari': ['intelligenza-artificiale-agenti-immobiliari', 'descrizione-immobile-esempi', 'come-scrivere-annuncio-immobiliare', 'messaggi-acquisire-immobili', 'cosa-pubblicare-instagram-agente-immobiliare'],
  // per chi vende casa
  'come-valutare-una-casa': ['quotazioni-omi', 'superficie-commerciale', 'quando-conviene-vendere-casa', 'quanto-costa-vendere-casa', 'cosa-fare-prima-di-vendere-casa'],
  'quotazioni-omi': ['come-valutare-una-casa', 'superficie-commerciale', 'quando-conviene-vendere-casa', 'vendere-casa-senza-agenzia', 'come-vendere-casa-velocemente'],
  'superficie-commerciale': ['come-valutare-una-casa', 'quotazioni-omi', 'documenti-per-vendere-casa', 'planimetria-annuncio-immobiliare', 'cosa-fare-prima-di-vendere-casa'],
  'quanto-costa-vendere-casa': ['plusvalenza-vendita-casa', 'documenti-per-vendere-casa', 'vendere-casa-senza-agenzia', 'provvigione-agente-immobiliare', 'come-valutare-una-casa'],
  'documenti-per-vendere-casa': ['quanto-costa-vendere-casa', 'plusvalenza-vendita-casa', 'cosa-fare-prima-di-vendere-casa', 'ape-annunci-immobiliari', 'vendere-casa-senza-agenzia'],
  'plusvalenza-vendita-casa': ['quanto-costa-vendere-casa', 'quando-conviene-vendere-casa', 'documenti-per-vendere-casa', 'come-valutare-una-casa', 'vendere-casa-senza-agenzia'],
  'quando-conviene-vendere-casa': ['come-valutare-una-casa', 'plusvalenza-vendita-casa', 'come-vendere-casa-velocemente', 'quanto-costa-vendere-casa', 'quotazioni-omi'],
  'cosa-fare-prima-di-vendere-casa': ['documenti-per-vendere-casa', 'come-valutare-una-casa', 'come-vendere-casa-velocemente', 'home-staging-esempi', 'quanto-costa-vendere-casa'],
  'come-vendere-casa-velocemente': ['cosa-fare-prima-di-vendere-casa', 'vendere-casa-senza-agenzia', 'come-valutare-una-casa', 'quando-conviene-vendere-casa', 'casa-che-non-si-vende'],
  'vendere-casa-senza-agenzia': ['quanto-costa-vendere-casa', 'documenti-per-vendere-casa', 'come-vendere-casa-velocemente', 'provvigione-agente-immobiliare', 'come-valutare-una-casa'],
};
