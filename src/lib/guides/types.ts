// Guide SEO su agenteimmo.me/it/<slug>: testo in HTML semplice (stile .guide in globals.css).
export type Guide = {
  slug: string
  label: string // nome breve, per briciole e link correlati
  title: string // <title>, max ~65 caratteri utili
  description: string
  h1: string
  intro: string
  updated: string // AAAA-MM-GG
  sections: { id: string; title: string; html: string }[]
  faq: [string, string][]
  // 'proprietari' = guida per chi vende casa: invito alla valutazione gratuita al posto della prova per agenti,
  // briciole sotto "Vendere casa" (/it/vendere-casa), "Leggi anche" solo tra guide per proprietari
  audience?: 'proprietari'
}
