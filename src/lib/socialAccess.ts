// Pubblicazione social degli agenti (Facebook, Instagram, TikTok), 07/10/2026: finche' Meta e TikTok non approvano l'app
// la vedono solo gli utenti di prova. Variabile d'ambiente lato server SOCIAL_PUBLISH_EMAILS: email separate da virgola
// (es. "revisore@agenteimmo.me,as.scirica@gmail.com"); "*" = tutti, da mettere dopo l'approvazione. Vuota o assente:
// nessuno, e la piattaforma resta com'era (niente "I tuoi social", niente passo Pubblica, niente "I tuoi post").
// Solo server: la lista non finisce nel codice che arriva al browser.
export function socialPublishAllowed(email?: string | null) {
  const list = (process.env.SOCIAL_PUBLISH_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (list.includes('*')) return true
  return !!email && list.includes(email.trim().toLowerCase())
}
