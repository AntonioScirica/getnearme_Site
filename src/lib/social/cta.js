// Call-to-action for every social caption — varied by post, always driving to
// GetNearMe (comment a keyword, save the post, or visit getnearme.it).
// Single source of truth: used by the PED caption builder, the weekly command,
// and the cloud worker, so posts and videos stay consistent.

// Which CTA kind fits each rubric. Comment-keyword posts keep the IG auto-DM
// trigger; the rest rotate to save / link / engage so it's not all "Commenta".
const KIND_BY_RUBRIC = {
  education: 'save',
  tip: 'save',
  tools: 'comment',
  world: 'link',
  myths: 'link',
  people: 'engage',
  question: 'engage',
  // video templates
  video_slider: 'comment',
  video_before_after_stopmotion: 'comment',
  video_before_after_particle: 'comment',
  video_timelapse: 'save',
  video_day_night: 'link',
};

const KINDS = new Set(['save', 'comment', 'link', 'engage']);
function kindOf(x) { return KINDS.has(x) ? x : (KIND_BY_RUBRIC[x] || 'comment'); }

/** The CTA sentence for a rubric/template/kind. `pill` = the comment keyword. */
export function ctaText(rubricOrKind, pill = 'DEMO') {
  switch (kindOf(rubricOrKind)) {
    case 'save': return 'Salva questo post: ti servira al prossimo immobile. Lo fai tutto su getnearme.it.';
    case 'link': return 'Provalo gratis su getnearme.it (link in bio).';
    case 'engage': return 'Tu come la vedi? Scrivilo nei commenti. Scopri GetNearMe su getnearme.it.';
    default: return `Commenta "${pill}" e ti mandiamo il link per la prova gratuita.`;
  }
}

/**
 * Replace any existing CTA line in a caption with the rubric-appropriate one
 * (keeping the original comment keyword for comment-type), or append it if none.
 * Preserves a trailing hashtags block.
 */
export function applyCta(caption, rubricOrKind) {
  let c = (caption || '').trim();
  const pill = (c.match(/Commenta\s+"([^"]+)"/i) || [])[1] || 'DEMO';
  // peel off a trailing hashtags block
  const hashMatch = c.match(/\n+(#[\s\S]*?)\s*$/);
  const hashtags = hashMatch ? hashMatch[1].trim() : '';
  if (hashMatch) c = c.slice(0, hashMatch.index).trim();
  // strip any previous CTA line
  c = c.replace(/\n*Commenta\s+"[^"]*"[^\n]*$/i, '').trim();
  c = c.replace(/\n*(Salva questo post|Provalo gratis su getnearme|Tu come la vedi)[^\n]*$/i, '').trim();
  const cta = ctaText(rubricOrKind, pill);
  return hashtags ? `${c}\n\n${cta}\n\n${hashtags}` : `${c}\n\n${cta}`;
}
