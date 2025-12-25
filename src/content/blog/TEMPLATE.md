# Template Articolo Blog MDX

Questo file descrive la struttura obbligatoria per ogni articolo MDX.

## Struttura File

Ogni articolo va creato in:
```
src/content/blog/{locale}/{slug}.mdx
```

**Esempio:**
- `src/content/blog/it/come-valutare-immobile.mdx`
- `src/content/blog/en/how-to-evaluate-property.mdx`

## Frontmatter Obbligatorio

```yaml
---
title: "Titolo dell'Articolo - Max 60 caratteri per SEO"
description: "Descrizione meta per SEO. Max 155 caratteri. Deve essere unica e descrivere il contenuto."
date: "2025-01-15"           # Data pubblicazione YYYY-MM-DD
updatedAt: "2025-01-20"      # Opzionale - Data ultimo aggiornamento
author:
  name: "GetNearMe"
  url: "https://getnearme.it"
image:
  src: "/assets/blog/nome-immagine.jpg"
  alt: "Descrizione accessibile dell'immagine"
draft: false                 # true = non pubblicato, false = pubblicato
tags:                        # Opzionale
  - "valutazione"
  - "immobiliare"
readingTime: 5               # Opzionale - Calcolato automaticamente se omesso
---
```

## Campi Obbligatori

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `title` | string | Titolo SEO (H1). Max 60 caratteri. |
| `description` | string | Meta description. Max 155 caratteri. |
| `date` | string | Data pubblicazione ISO 8601 (YYYY-MM-DD). |
| `author.name` | string | Nome autore/organizzazione. |
| `image.src` | string | Path immagine copertina. |
| `image.alt` | string | Alt text descrittivo. |
| `draft` | boolean | `true` = nascosto, `false` = pubblicato. |

## Campi Opzionali

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `updatedAt` | string | Data ultimo aggiornamento (YYYY-MM-DD). |
| `author.url` | string | URL autore. |
| `tags` | string[] | Categorie per articoli correlati. |
| `readingTime` | number | Tempo lettura in minuti. |

## Contenuto Markdown Supportato

### Headers (per Table of Contents)

```markdown
## Titolo Sezione    ← Genera entry in TOC (se ≥3 H2)
### Sottotitolo      ← Non in TOC
```

### Testo

```markdown
Paragrafo normale.

**Testo in grassetto** per enfasi.
```

### Liste

```markdown
- Elemento lista puntata
- Altro elemento

1. Lista numerata
2. Secondo punto
```

## Immagini Articolo

Salva le immagini in:
```
public/assets/blog/
```

Usa sempre:
- Formato WebP o JPEG ottimizzato
- Dimensioni ragionevoli (max 1200px larghezza per copertina)
- Nome file descrittivo (kebab-case)

**Esempio immagine copertina:**
```
public/assets/blog/come-valutare-immobile-cover.webp
```

Nel frontmatter:
```yaml
image:
  src: "/assets/blog/come-valutare-immobile-cover.webp"
  alt: "Dashboard GetNearMe che mostra l'analisi di un appartamento"
```

## Checklist Pre-Pubblicazione

- [ ] `title` ≤ 60 caratteri
- [ ] `description` ≤ 155 caratteri, unica
- [ ] `date` corretta
- [ ] `image.src` esiste in `/public/assets/blog/`
- [ ] `image.alt` descrittivo (non vuoto)
- [ ] `draft: false` per pubblicare
- [ ] Almeno un H2 nel contenuto
- [ ] Nessun link rotto
- [ ] Contenuto originale (no duplicati)

## Esempio Articolo Completo

```mdx
---
title: "Come Valutare un Immobile: Guida Completa 2025"
description: "Scopri i criteri fondamentali per valutare correttamente un immobile prima dell'acquisto. Guida pratica con checklist."
date: "2025-01-15"
author:
  name: "GetNearMe"
  url: "https://getnearme.it"
image:
  src: "/assets/blog/valutazione-immobile-cover.webp"
  alt: "Analisi dettagliata di un appartamento con GetNearMe"
draft: false
tags:
  - "valutazione"
  - "guida"
  - "acquisto"
---

Introduzione all'articolo che cattura l'attenzione del lettore e anticipa il contenuto.

## Perché la Valutazione è Fondamentale

Contenuto della prima sezione...

## I 5 Criteri Chiave

Elenco dei criteri:

- Posizione e quartiere
- Condizioni strutturali
- Prezzo al metro quadro
- Servizi nelle vicinanze
- Potenziale di rivalutazione

## Come GetNearMe Ti Aiuta

Descrizione di come l'estensione supporta la valutazione...

## Conclusioni

Riepilogo e call-to-action.
```

## Note Importanti

1. **NO fallback tra lingue**: Ogni articolo deve esistere solo nella sua lingua.
2. **Slug coerente**: Usa lo stesso slug per versioni multilingua dello stesso concetto.
3. **Draft**: Imposta `draft: true` durante la scrittura, cambia a `false` solo quando pronto.
4. **Validazione**: Il build fallirà se manca un campo obbligatorio nel frontmatter.

