// Prompt di home staging, portati dalle edge function Nano Banana di GetNearMe
// (GetNearMe/supabase/functions/replicate-staging): stessi 6 stili x interno/facciata/giardino,
// le 6 viste, la planimetria e le protezioni per il testo libero. Qui li usa Qwen-Image
// (/api/platform/photo-edit). Il tipo di stanza per gli interni vuoti non c'e' ancora:
// sulle edge function lo classificava Groq, qui arriva quando ci serve.

export type SceneType = 'interno' | 'esterno' | 'giardino';

// Interni: formulati come modifica "additiva" della stessa foto. Qwen-Image con i prompt lunghi di
// Nano Banana ridisegnava la stanza da un'altra inquadratura; "aggiungi mobili a questa foto, tutto il
// resto uguale" tiene prospettiva, finestre e pavimento (prova del 24/09 su stanze vuote).
// Resa di riferimento (foto dell'utente del 25/09): foto professionale di un annuncio immobiliare italiano,
// casa vera ristrutturata e arredata con mobili normali. Vale per tutti gli stili e per le richieste libere.
const LISTING_PHOTO = "The result must look like a professional photo of a real Italian apartment for a real estate listing: bright and even natural daylight, clean and tidy, straight vertical lines, true colors, real materials and real furniture. NOT a Pinterest, magazine or CGI render: no dramatic mood lighting, no golden hour, no heavy styling.";
const stage = (style: string, look: string) =>
  `Add ${style} furniture and decor to this exact photo (${look}), only the pieces that suit this room, placed on the existing floor inside the visible space; if there is already furniture, replace it with ${style} pieces of the same kind. Remove anything old, broken or out of place: loose boards and panels, boxes, junk, clutter, worn furniture and personal items, including objects in the foreground or cut by the edges of the photo (replace them with the wall or floor behind). This is an additive edit: the camera position, zoom, framing, walls, windows, doors and floor stay exactly the same. Do not zoom out and do not show more of the room. Use real furniture that Italian families actually buy today (IKEA, Mondo Convenienza, a mid-range Italian kitchen or furniture store): simple shapes, white or light wood fronts, fabric sofas and armchairs, a plain rug, a simple pendant or floor lamp; in kitchens flat handle-less cabinets, a light worktop and built-in steel appliances. Neutral base (white, beige, light grey, light oak) with at most one or two soft color accents (sage green, blue, mustard). Only a few simple accessories: a vase, a couple of books, a throw, one or two plants; nothing on the walls unless it was already there. Tidy and ready to show, no clutter and no personal items. ${LISTING_PHOTO}`;

const STYLE_PROMPTS: Record<string, string> = {
  modern: stage('simple modern', 'white fronts and light oak, a light grey fabric sofa, a simple round coffee table, one or two cushions in soft blue or mustard'),
  nordic: stage('simple Scandinavian', 'light oak and white, a wooden armchair with a linen cushion, a wool rug, linen curtains, a white pendant lamp'),
  industrial: stage('good quality contemporary', 'white and warm grey fronts, concrete-look or light stone surfaces, a wall unit with open oak shelves and a soft warm LED strip, calm colors'),
  boho: stage('warm natural', 'light wood, linen and cotton, a jute rug, one plant, warm sand, terracotta and sage tones'),
  daynight: "Analyze the lighting in this photo. If daytime: convert to nighttime — dark blue sky through windows, all light fixtures ON with warm glow and halos, deep shadows. If nighttime: convert to daytime — bright blue sky, natural sunlight through windows, morning light. CRITICAL: do NOT add, remove, move or change ANY object, furniture, door, window or wall. ONLY change lighting and sky. Photorealistic, 8k.",
  // Qwen-Image segue meglio istruzioni corte: il prompt lungo di Nano Banana gli faceva rifare il pavimento.
  empty: "Remove all furniture and movable objects from this room so it becomes an empty, vacant room: sofas, armchairs, chairs, tables, beds, wardrobes, cabinets, shelves, TV, lamps, plants, loose rugs, curtains, pictures and personal items. Keep the floor EXACTLY the same as in the photo: same material, color, pattern and texture (if it is carpet keep the same carpet, if it is wood keep the same wood, if it is tiles keep the same tiles); where furniture stood, continue that same floor. Keep walls, ceiling, windows, doors, radiators, built-in fixtures, light and camera angle unchanged. Photorealistic.",
};

const STYLE_PROMPTS_ESTERNO: Record<string, string> = {
  modern: "Edit this photo of a house exterior/facade: restyle it in a Modern Contemporary architectural style. Change the facade render, cladding and paint to clean neutral tones (white, grey, anthracite), sleek dark-framed windows and doors, minimalist entrance, clean geometric lines. STRICT RULES: preserve EXACTLY the building's structure, roofline, the position and size of every window and door, the number of floors, and the camera angle/perspective. Do NOT add, remove or resize any window, door or architectural opening. Only restyle materials, colors and finishes. Photorealistic, 8k.",
  nordic: "Edit this photo of a house exterior/facade: restyle it in a Scandinavian Nordic exterior style. Light timber cladding, white or pale grey render, black window frames, minimal clean entrance, natural wood accents. STRICT RULES: preserve EXACTLY the building's structure, roofline, the position and size of every window and door, the number of floors, and the camera angle/perspective. Do NOT add, remove or resize any window, door or architectural opening. Only restyle materials, colors and finishes. Photorealistic, 8k.",
  industrial: "Edit this photo of a house exterior/facade: restyle it in a Luxury Contemporary exterior style. Premium stone or travertine cladding, brushed metal accents, elegant entrance lighting, sophisticated dark or warm-toned palette. STRICT RULES: preserve EXACTLY the building's structure, roofline, the position and size of every window and door, the number of floors, and the camera angle/perspective. Do NOT add, remove or resize any window, door or architectural opening. Only restyle materials, colors and finishes. Photorealistic, 8k.",
  boho: "Edit this photo of a house exterior/facade: restyle it in a Mediterranean villa exterior style. Warm terracotta or ochre stucco render, white or pastel trim, wooden shutters, terracotta roof tiles, climbing plants near the entrance. STRICT RULES: preserve EXACTLY the building's structure, roofline, the position and size of every window and door, the number of floors, and the camera angle/perspective. Do NOT add, remove or resize any window, door or architectural opening. Only restyle materials, colors and finishes. Photorealistic, 8k.",
  daynight: "Analyze the lighting in this photo of a building exterior/facade. If daytime: convert to nighttime — dark sky, warm exterior lights ON (entrance lights, facade uplighting, warm glow from windows), landscape lighting. If nighttime: convert to daytime — bright blue sky, natural sunlight on the facade. CRITICAL: do NOT add, remove, move or change any structural element, window, door or wall. ONLY change lighting and sky. Photorealistic, 8k.",
  empty: "Edit this photo to FULLY RENOVATE and restore the building facade to a like-new condition. MANDATORY: repair and completely smooth over EVERY crack, fissure, water stain, mold patch and area of missing or flaking plaster — the wall surface must end up perfectly uniform and intact, matching the surrounding color and texture, with NO crack or damage visible anywhere. Remove ALL dead, dry, wilted, or overgrown weeds, wild plants and dead climbing vines from the walls and ground. Repair any broken, cracked or missing window glass. Remove parked cars, trash bins, cables, satellite dishes, clutter and any temporary object blocking the view of the building. Clean the facade thoroughly, removing all dirt, mold and grime. KEEP EXACTLY AS-IS: the building structure, roofline, all windows and doors (position, size, count), and the camera angle. The result must look like a freshly renovated, impeccably maintained building. Photorealistic, 8k.",
};

// Esterni: niente piscine, laghetti o quadri inventati (su un balcone aveva messo una piscina e tele al muro)
const OUTDOOR_LOCK = ' Never add a swimming pool, pond, fountain or any water feature, and never add paintings or pictures on outdoor walls, unless explicitly requested. Keep the floor and paving exactly where they are.';
const GARDEN_REPAIR = "Also repair any visible damage on the surrounding walls, windows or structure (broken glass, cracks, peeling paint, moss, decay, rust) and remove any wild, overgrown or dead climbing vines and vegetation growing on the windows, walls or facade, so the result looks coherently upgraded — keep the same structure, position and size, just restore its condition. STRICT RULES: preserve the existing layout boundaries, any visible building structure, paths orientation and the camera angle/perspective. Do NOT add or remove any building structure. Photorealistic, 8k.";
const STYLE_PROMPTS_GIARDINO: Record<string, string> = {
  modern: `Edit this photo of a garden/outdoor space: COMPLETELY REDESIGN it in a Modern Minimalist landscaping style. MANDATORY: replace the existing lawn/planting with a clean geometric layout — sharp-edged lawn panels or gravel beds, structured low hedges, a minimal palette of architectural plants (ornamental grasses, boxwood balls), clean concrete or large-format paving pathways, sleek modern outdoor furniture. Remove ALL wild grass, weeds, clutter, garden tools and mismatched pots — the transformation must be clearly visible, not a subtle tweak. ${GARDEN_REPAIR}`,
  nordic: `Edit this photo of a garden/outdoor space: COMPLETELY REDESIGN it in a Natural Woodland-inspired style. MANDATORY: introduce informal native planting drifts, birch or light-bark trees, ornamental grasses and wildflower patches, a natural gravel or bark path, soft dappled light feel. Remove ALL clutter, tools, dead plants and artificial/urban elements — the transformation must be clearly visible, not a subtle tweak. ${GARDEN_REPAIR}`,
  industrial: `Edit this photo of a garden/outdoor space: COMPLETELY REDESIGN it in a Lush Luxury garden style. MANDATORY: fill the space with dense, elegant, perfectly manicured greenery, refined natural stone pathways, integrated ambient garden lighting, upscale outdoor lounge furniture with premium fabrics. Remove ALL clutter, tools, weeds and low-quality or mismatched elements — the transformation must be clearly visible, not a subtle tweak. ${GARDEN_REPAIR}`,
  boho: `Edit this photo of a garden/outdoor space: COMPLETELY REDESIGN it in a Mediterranean garden style. MANDATORY: add mature olive trees, fragrant lavender bushes, large terracotta pots with vibrant flowers, a warm gravel or stone ground cover, a rustic stone pathway, and a wooden pergola with climbing bougainvillea or grapevines. Remove ALL clutter, tools, weeds and modern/urban elements that clash with the style — the transformation must be clearly visible, not a subtle tweak. ${GARDEN_REPAIR}`,
  daynight: "Analyze the lighting in this garden/outdoor photo. If daytime: convert to nighttime — dark sky, warm garden lighting ON (string lights, path lighting, uplighting on trees and plants). If nighttime: convert to daytime — bright natural sunlight, blue sky. CRITICAL: do NOT add, remove or move any plant, structure, furniture or path. ONLY change lighting and sky. Photorealistic, 8k.",
  empty: "Edit this photo to FULLY TIDY UP and restore the garden to a perfectly maintained condition. MANDATORY: completely remove ALL weeds, wild grass, dry thistles and overgrown wild plants — the lawn must become a uniform, evenly mown, healthy green lawn with NO patches of dirt, weeds or dead grass visible anywhere. Clear all walkways and paths completely of grass, weeds and debris growing through the cracks. Remove all garden tools, wheelbarrows, trash, litter, cans, bags and clutter lying on the ground. Trim any overgrown hedges or bushes neatly. KEEP EXACTLY AS-IS: any visible building structure, the layout, paths orientation, existing healthy trees and flower pots, and the camera angle. The result must look like a freshly tended, immaculately maintained garden. Photorealistic, 8k.",
};

// Vietare qualsiasi testo: i modelli a volte inventano scritte su poster e insegne.
const NO_TEXT = ' ABSOLUTELY NO TEXT: do not render any letters, words, writing, captions, signage, neon signs, posters with text, logos, brand names, watermarks, or numbers anywhere in the image. Wall art and decor must be purely abstract or pictorial with zero text.';

// Per le richieste libere: niente scritte, ma senza nominare quadri o decorazioni (il modello li aggiungeva)
const NO_TEXT_PLAIN = ' Do not add any text, letters, logos or watermarks.';
// Solo quello che e' chiesto: niente oggetti in piu' (prima aggiungeva quadri e mobili anche per "togli la sedia")
const ONLY_REQUESTED = ' Do not add anything that was not requested: no new furniture, decorations, wall art, pictures, plants, lamps or objects. If the request is to remove something, remove only that and show the same wall, floor and light that are behind it.';

const LIGHTING_LOCK = 'This is a LIGHTING-ONLY edit. DO NOT remove, add, move, resize, reshape, recolor, or alter ANY object in the scene — every piece of furniture, wall, ceiling, floor, door, window, curtain, rug, lamp, painting, shelf, plant, and decorative item must remain EXACTLY as in the original photo with identical shape, position, size, color, material, and texture. DO NOT change the camera angle, perspective, framing, or composition in any way.';

// Viste: stesse di Foto AI (src/lib/staging.ts STAGING_ANGLES), avvolte nel modello "nuova inquadratura".
export const ANGLES: { id: string; label: string; prompt: string }[] = [
  { id: 'night', label: 'Notte', prompt: `${LIGHTING_LOCK} Transform to nighttime — replace sky with deep dark-blue night sky with subtle stars. ALL visible light fixtures (chandeliers, table lamps, bedside lamps, wall sconces, floor lamps, ceiling lights, spotlights, outdoor lanterns, garden lights) MUST be turned ON emitting warm realistic light with soft halos and proper light falloff on nearby surfaces. Windows should show warm interior glow. Deep natural shadows, soft ambient fill. Every single structural and decorative element must be preserved pixel-for-pixel. Photorealistic result.` },
  { id: 'day', label: 'Giorno pieno', prompt: `${LIGHTING_LOCK} Transform this scene to BRIGHT MIDDAY DAYLIGHT. The sky visible through windows must be vivid blue with white clouds. Intense natural sunlight floods through every window creating strong, crisp sun beams and well-defined shadows on floors and walls. The overall exposure must be significantly BRIGHTER than the original — lift shadows aggressively, fill dark corners with bounced daylight, increase ambient brightness across the entire frame. All artificial lights (lamps, sconces, ceiling fixtures) should be OFF — the room is lit entirely by abundant natural sunlight. Surfaces should appear warm and sun-kissed. The transformation must be dramatic and unmistakable — the viewer should immediately perceive this as a sun-drenched daytime scene. Every single structural and decorative element must be preserved pixel-for-pixel. Photorealistic result.` },
  { id: 'closeup', label: 'Dettaglio', prompt: 'Ricrea un dettaglio ravvicinato (close-up) dell’elemento principale di questa stanza. Avvicinati significativamente mostrando i dettagli dei materiali, le texture e le finiture. Mantieni gli stessi colori e materiali. Risultato fotorealistico.' },
  { id: 'top', label: 'Dall’alto', prompt: 'Ricrea questa stessa stanza vista dall’alto, con una prospettiva a volo d’uccello (bird’s eye view). Mostra il pavimento e i mobili visti dal soffitto, guardando in basso con un angolo di circa 90 gradi. Mantieni gli stessi mobili, colori e materiali. Risultato fotorealistico.' },
  { id: 'low', label: 'Dal basso', prompt: 'Ricrea questa stessa stanza da un’angolazione bassa (low angle), con la camera posizionata vicino al pavimento e rivolta verso l’alto. I mobili appaiono più imponenti e il soffitto è ben visibile. Mantieni gli stessi mobili, colori e materiali. Risultato fotorealistico.' },
  { id: 'wide', label: 'Grandangolo', prompt: 'Ricrea questa stessa stanza con un obiettivo grandangolare (ultra-wide angle lens, 14mm). Mostra una visuale molto ampia che include più pareti e angoli della stanza. La distorsione prospettica tipica del grandangolo deve essere visibile. Mantieni gli stessi mobili, colori e materiali. Risultato fotorealistico.' },
];

const PLANIMETRIA_BASE = "This image is a 2D architectural floor plan (planimetria). Redraw it as a clean, elegant, COLORED and FURNISHED 2D floor plan seen strictly from directly above (top-down orthographic view, NO perspective, NO 3D, NO isometric, NO tilt). ABSOLUTELY CRITICAL — preserve the geometry EXACTLY: keep the same outer footprint and aspect ratio, and keep every interior wall, every separate room, the corridor/hallway, and all door and window openings in the IDENTICAL position, size, count and proportion as the input. Do NOT add, remove, merge, split, move, rotate or resize any room, wall, corridor or opening. Trace the original walls precisely. Only ADD, inside the existing rooms: realistic per-room floor colors and materials (wood, tile, stone), neat top-view furniture (beds, sofas, dining table and chairs, kitchen counters and appliances, bathroom fixtures, wardrobes), rugs and soft drop shadows. Thin crisp dark walls, light rooms. Output: a professional, readable real-estate 2D rendered floor plan with the SAME layout as the original.";
const FURNISH: Record<string, string> = {
  modern: ' Furnish (top-view) in a clean modern contemporary style: neutral palette with accent colors, minimalist pieces, wood and tile floors.',
  nordic: ' Furnish (top-view) in a Scandinavian Nordic style: light oak/birch wood, white and grey palette, minimal functional pieces, cozy uncluttered look.',
  industrial: ' Furnish (top-view) in a luxury contemporary style: marble and travertine, brass accents, dark walnut wood, elegant upscale textures.',
  boho: ' Furnish (top-view) in a bohemian style: rattan and wicker, natural wood, indoor plants, earthy tones, eclectic patterns.',
};

// Stessa logica di buildFinalPrompt delle edge function: planimetria > vista > testo libero
// (con la protezione adatta alla scena) > stile preset.
// "Altra versione": il seme da solo cambia poco (stessa richiesta = quasi la stessa foto). Ogni variante
// combina legno, tessuti, forme, colore d'accento e un dettaglio scelti tra quelli adatti allo stile:
// 4-6 opzioni per voce danno centinaia di combinazioni diverse per ogni stile.
type Pool = { wood: string[]; fabric: string[]; shape: string[]; accent: string[]; detail: string[] };
const POOLS: Record<string, Pool> = {
  modern: {
    wood: ['warm oak', 'light oak', 'walnut details', 'white lacquered fronts', 'grey-washed oak', 'natural ash'],
    fabric: ['light grey fabric', 'off-white bouclé', 'beige linen', 'warm taupe fabric', 'pale grey velvet'],
    shape: ['clean rectangular shapes', 'soft rounded shapes', 'slim metal legs', 'low wide proportions'],
    accent: ['sage green', 'navy blue', 'mustard yellow', 'terracotta', 'dusty pink', 'olive green'],
    detail: ['a round coffee table', 'a striped rug', 'a globe pendant lamp', 'linen curtains', 'a large plant in a ceramic pot'],
  },
  nordic: {
    wood: ['birch', 'light oak', 'pale ash', 'whitewashed pine', 'natural beech'],
    fabric: ['white linen', 'soft grey wool', 'cream bouclé', 'light beige cotton', 'pale blue fabric'],
    shape: ['simple Scandinavian shapes', 'tapered wooden legs', 'rounded edges', 'slatted wood details'],
    accent: ['pale blue', 'sage green', 'warm grey', 'soft yellow', 'dusty rose'],
    detail: ['a wool rug with a subtle pattern', 'a white pendant lamp', 'a sheepskin throw', 'a wooden wall shelf', 'a paper lamp', 'linen curtains'],
  },
  industrial: {
    wood: ['smoked oak', 'walnut', 'dark oak accents', 'concrete-look surfaces', 'light stone surfaces'],
    fabric: ['stone grey fabric', 'charcoal fabric', 'warm beige', 'cognac leather', 'ivory bouclé'],
    shape: ['black metal details', 'strong rectangular shapes', 'open oak shelves with warm LED light', 'slim brushed steel legs'],
    accent: ['olive green', 'deep blue', 'rust orange', 'warm white', 'bronze'],
    detail: ['a large grey rug', 'a black arc floor lamp', 'a low media unit', 'sheer white curtains', 'a round travertine side table', 'a tall plant'],
  },
  boho: {
    wood: ['honey oak', 'light teak', 'natural pine', 'bamboo', 'rattan and cane'],
    fabric: ['ivory cotton', 'sand linen', 'oatmeal fabric', 'warm cream bouclé', 'light terracotta cotton'],
    shape: ['soft organic shapes', 'woven cane details', 'low rounded furniture', 'natural fibre textures'],
    accent: ['terracotta', 'deep green', 'ochre', 'sage', 'rust', 'warm pink'],
    detail: ['a jute rug', 'a woven pendant lamp', 'linen curtains', 'a large plant in a basket', 'a striped cotton throw'],
  },
};
const variantPool = (style?: string | null) => POOLS[style && POOLS[style] ? style : 'modern'];
export const variantCount = (style?: string | null) => { const p = variantPool(style); return p.wood.length * p.fabric.length * p.shape.length * p.accent.length * p.detail.length; };
// n -> combinazione (numero in base mista: ogni voce ha il suo indice)
export function variantText(style: string | null | undefined, n: number): string {
  const p = variantPool(style);
  let k = Math.abs(Math.floor(n));
  const pick = (a: string[]) => { const x = a[k % a.length]; k = Math.floor(k / a.length); return x; };
  const wood = pick(p.wood), fabric = pick(p.fabric), shape = pick(p.shape), accent = pick(p.accent), detail = pick(p.detail);
  return `For this version use a different combination in the same style: ${wood}, ${fabric}, ${shape}, ${accent} accents and ${detail}.`;
}


// Cosa mettere per tipo di stanza negli stili: senza, in una cucina aperta arredava solo i pensili e lasciava vuoto il resto
const ROOM_FURNISH: Record<string, string> = {
  cucina: 'This room is a kitchen: furnish it completely, the kitchen units AND the free floor space: a dining table with four chairs, a pendant lamp above the table; if part of the room is a living area, a sofa and a coffee table there.',
  soggiorno: 'This room is a living room: a sofa, an armchair, a coffee table, a TV unit, a rug, a floor lamp and curtains; fill the whole visible floor in a natural way.',
  sala: 'This room is a dining room: a dining table with six chairs, a sideboard, a pendant lamp above the table.',
  camera: 'This room is a bedroom: a double bed with bedding and cushions, two bedside tables with lamps, a wardrobe, a rug and curtains.',
  cameretta: "This room is a child's bedroom: a single bed, a desk with a chair, a bookcase, a rug, soft colors.",
  studio: 'This room is a home office: a desk with an office chair, a bookcase, a lamp, a rug.',
  ingresso: 'This room is an entrance hall: a slim shoe cabinet, a mirror, a coat rack, a small rug.',
  corridoio: 'This room is a hallway: a slim console, a runner rug, simple wall lights.',
  bagno: 'This room is a bathroom: a vanity unit with sink and mirror, towels, a small plant; keep sanitary fixtures where they are.',
  balcone: 'This is a balcony: a small outdoor table with two chairs and some potted plants.',
}
export const roomKey = (label?: string | null) => Object.keys(ROOM_FURNISH).find(k => label?.toLowerCase().includes(k === 'camera' ? 'camera da letto' : k)) ?? ''

// Richieste a parole che chiedono di arredare o cambiare stile ("balcone stile moderno", "arredala nordica"):
// con la formula "cambia solo quello che chiedo" il modello non toccava nulla. Vanno trattate come uno stile.
const RESTYLE = /\b(stile|moderno|moderna|nordico|nordica|scandinavo|scandinava|minimal|contemporaneo|contemporanea|industriale|boho|arreda\w*|rinnova\w*|rifai|rifalla|trasforma\w*|ristruttura\w*|home staging)\b/i;
export const isRestyle = (text?: string | null) => !!text && RESTYLE.test(text) && !/\b(togli|rimuovi|elimina|cancella)\b/i.test(text);

export function buildStagingPrompt(o: { style?: string | null; customPrompt?: string | null; angle?: string | null; planimetria?: boolean; scene?: SceneType; room?: string; restyle?: boolean }): string {
  const scene = o.scene ?? 'interno';
  if (o.planimetria) return PLANIMETRIA_BASE + (FURNISH[o.style || ''] || FURNISH.modern) + NO_TEXT;
  const styles = scene === 'esterno' ? STYLE_PROMPTS_ESTERNO : scene === 'giardino' ? STYLE_PROMPTS_GIARDINO : STYLE_PROMPTS;
  const custom = o.customPrompt?.trim();
  const angle = ANGLES.find(a => a.id === o.angle);
  if (angle) {
    return `ROOM ANALYSIS REQUIRED: Study every detail — furniture pieces, materials, colors, textures, wall finishes, window placement, door positions, architectural features, lighting fixtures, decorative objects. TASK: Regenerate this IDENTICAL room from a new camera position: ${angle.prompt}. Every object must appear in the same position relative to the room. Same furniture, same colors, same materials, same lighting conditions, same time of day. FORBIDDEN: adding new objects, removing existing objects, changing any material or color, altering room dimensions, modifying architectural features. Output: photorealistic interior photograph, 8K, consistent with input image lighting.${NO_TEXT}`;
  }
  if (custom) {
    if (scene === 'esterno') return `BUILDING LOCKED: Preserve EXACTLY the house facade, roofline, windows, doors, walls, materials, colors, and the camera angle/perspective. FORBIDDEN: changing the building's structure, adding new floors, altering the facade shape. ALLOWED: adding or modifying garden elements, terrace furniture, landscaping, driveway, plants as requested. USER EDIT REQUEST (apply in any language): "${custom}". Apply the requested changes to the surroundings while keeping the building itself identical. Photorealistic result, 8K architectural photography.${OUTDOOR_LOCK}${NO_TEXT}`;
    if (scene === 'giardino') return `GARDEN EDIT: Preserve the existing layout, any visible building structure, paths, boundaries and the camera angle/perspective exactly. ALLOWED: freely adding or modifying plants, furniture, decking, lighting as requested. USER EDIT REQUEST (apply in any language): "${custom}". Photorealistic result, 8K outdoor photography.${OUTDOOR_LOCK}${NO_TEXT}`;
    if (o.restyle && scene === 'interno') {
      const furnishRoom = o.room && ROOM_FURNISH[o.room] ? ` ${ROOM_FURNISH[o.room]}` : '';
      return stage('new', `as requested: ${custom}`) + furnishRoom + NO_TEXT_PLAIN;
    }
    // Stessa formula "additiva" degli stili: cambia solo quello che chiede l'agente, la foto resta quella.
    return `Edit this exact photo: ${custom}. Change only what is requested; everything else stays exactly the same: camera position, zoom, framing, perspective, walls, windows, doors, furniture, decorations and light (unless the request is about them). Do not zoom out and do not show more of the room.${ONLY_REQUESTED} If new furniture is requested, it must be real furniture that Italian families actually buy today (IKEA, Mondo Convenienza, mid-range Italian stores). ${LISTING_PHOTO}${NO_TEXT_PLAIN}`;
  }
  const furnish = scene === 'interno' && o.style !== 'empty' && o.style !== 'daynight' && o.room && ROOM_FURNISH[o.room] ? ` ${ROOM_FURNISH[o.room]}` : '';
  return (styles[o.style || ''] || styles.modern) + furnish + (scene === 'interno' ? '' : OUTDOOR_LOCK) + NO_TEXT;
}
