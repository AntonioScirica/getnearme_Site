// Stampa un documento HTML (il report di un immobile) da un iframe nascosto: il browser offre "Salva come PDF".
// Aspetta foto e font, poi apre la finestra di stampa. Usato dal sito dell'agente e dalla piattaforma.
export async function printHtml(html: string, title = 'report'): Promise<void> {
  const f = Object.assign(document.createElement('iframe'), { title })
  Object.assign(f.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(f)
  const doc = f.contentDocument!
  doc.open(); doc.write(html); doc.close()
  await Promise.race([Promise.all([...doc.images].map(img => (img.complete ? null : new Promise(ok => { img.onload = img.onerror = ok })))), new Promise(ok => setTimeout(ok, 5000))])
  await doc.fonts?.ready
  f.contentWindow?.focus()
  f.contentWindow?.print()
  setTimeout(() => f.remove(), 60000)
}
