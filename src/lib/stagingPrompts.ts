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
// Prompt CORTO: con il blocco lungo della stanza e le regole di arredo (versione del 25/09) Qwen allargava
// l'inquadratura (letto piu' piccolo, piu' stanza visibile, prova del 27/09 su 3 anteprime su 3); la forma
// "sostituisci solo i mobili ... tieni identico pixel per pixel ... stessa inquadratura" la tiene.
// Il tipo di stanza (ROOM_FURNISH) va in TESTA, prima dello stile (vedi buildStagingPrompt).
const stage = (style: string, look: string) =>
  `Replace only the furniture and decor with ${style} furniture (${look}), real pieces that Italian families buy today, tidy, no clutter. Keep exactly the same, pixel for pixel: walls, ceiling, windows, curtains, doors, mirrors, wardrobes, radiators, the floor, the light, and the camera position, zoom and framing. Photorealistic real estate listing photo.`

// Svuota: "togli solo i mobili, tieni identico pixel per pixel" tiene l'inquadratura e la stanza (prove del 27/09);
// la versione vecchia toglieva anche tende, mensole, parete TV e cucina. Primo passo anche dell'arredo (vedi photo-edit).
// NON nominare cucina, TV, ecc. tra le cose da tenere: se nella foto non ci sono Qwen le inventa (27/09: cucina al posto della parete TV)
export const EMPTY_KEEP = 'Empty this room completely, as for a listing of an empty apartment. Remove all the movable furniture (sofas, armchairs, chairs, stools, tables, beds, freestanding cabinets and bookcases, rugs, lamps, plants) and every loose object, including everything standing on worktops, shelves and on top of cabinets, and the pictures, frames and calendars hanging on the walls. Do not add anything new. Keep exactly the same, pixel for pixel, everything that is built into the room: walls, ceiling and ceiling lights, windows and doors, curtains, mirrors, built-in wardrobes and fitted units with their built-in appliances, radiators, the floor with its exact material and color (continue the same floor where things stood), the daylight and the camera position, zoom and framing. Photorealistic.';

// Arredo in due passi (photo-edit): 1) EMPTY_KEEP svuota, 2) Claude guarda la stanza vuota e decide QUALI mobili e DOVE
// (furnishPlanPrompt), 3) Qwen li aggiunge alla foto vuota (addFurniturePrompt). Sostituire i mobili in un colpo solo
// faceva reinventare la stanza (muretto sparito, pareti e finestre spostate) e arredare senza logica (27/09).
// Materiali veri e con contrasto (non la solita ricetta bianco + rovere + divano grigio + cuscino senape, "sempre standard"):
// Claude sceglie da qui la combinazione adatta alla stanza (vedi editPlanPrompt)
export const STYLE_LOOK: Record<string, string> = {
  modern: 'contemporary Italian style: matt anthracite or warm grey handle-less fronts combined with natural oak, concrete-look or grey stone worktop and backsplash, black metal details, a textured grey or taupe fabric sofa, walnut or oak wood accents, a few dark teal or cream cushions, one large abstract print',
  nordic: 'Scandinavian style: light oak and white with black metal details, linen and wool in off-white, sand and soft grey, a textured wool rug, rattan or paper pendant, green plants',
  industrial: 'elegant contemporary style: walnut wood, warm greige fronts, marble or light stone surfaces, brushed brass or black details, velvet or boucle upholstery in deep green, camel or cream',
  boho: 'warm natural Mediterranean style: light wood, rattan and cane, linen and cotton, a jute rug, terracotta, sand and sage tones, ceramics and plants',
};
// Piano di Claude sulla foto ORIGINALE: elenchi con solo cio' che c'e' davvero (Qwen inventa le cose nominate che non ci
// sono e da solo non distingue fisso da mobile: 27/09 cucina inventata al posto della parete TV, armadio a specchio tolto).
export type EditPlan = { remove: string[]; keep: string[]; restyle: string[]; add: string[] };
export const editPlanPrompt = (room: string, task: 'empty' | 'furnish' | 'edit', style: string) => `You are directing an AI photo editor that edits photos of real Italian apartments for real estate listings. It follows literal lists only, and it invents things that are named but not visible, so name ONLY things that are really visible in this photo, each with where it is in the photo.
Room type: ${room || 'decide it from the photo'}.
Task: ${task === 'empty'
    ? 'empty the room completely for an unfurnished listing, as a bare shell: remove the furniture, every loose object AND the fitted kitchen if there is one (cabinets, worktop, appliances, hood, sink), showing the bare wall behind it. Keep only the architecture: walls, pillars, ceiling, windows, doors, radiators, floor, built-in wardrobes.'
    : task === 'edit'
    ? `apply ONLY this request of the real estate agent (written in Italian): "${style}". Change nothing else: everything the request does not mention stays exactly as it is.`
    : `restage the room in this style: ${style}. Remove the current furniture and loose objects, then furnish it again in the style. Choose ONE coherent design for this room from the style (specific colors and materials that suit its light, floor and size, with real contrast, not everything white). If there is a fitted kitchen, restyle its cabinet fronts, handles, worktop and backsplash in that design keeping the same layout and the appliances where they are.`}
Reply with JSON only:
{"remove": [...], "keep": [...], "restyle": [...], "add": [...]}
- remove: ${task === 'edit' ? 'only what the request asks to remove (for a request to tidy up or declutter: the loose objects and clutter, not the furniture), [] if nothing' : 'every movable piece of furniture and every loose object visible'}, GROUPED by area in at most 8 short sentences (the editor ignores long lists), each saying where: for example "all the objects on the kitchen worktop and on top of the wall cabinets", "all the pictures and frames on the right wall", "the sofa, the ottoman, the coffee table and the rug in the foreground". Include furniture (sofas, armchairs, chairs, stools, tables, beds, bedside tables, freestanding cabinets and bookcases, rugs, lamps, plants) and everything on worktops, counters, shelves, tops of cabinets, pictures and calendars on walls, towels, bins, boxes, personal items.
- keep: every built-in element visible that must stay exactly the same, in at most 6 short sentences with positions: walls and half walls, pillars, beams, ceiling and ceiling lights, windows, doors, curtains, mirrors, built-in or mirrored wardrobes, ${task === 'empty' ? '' : 'fitted kitchen units and built-in appliances, '}TV wall units fixed to the wall, radiators, air conditioners, the floor material.
- restyle: ${task === 'empty' ? 'always []' : task === 'edit' ? 'elements the request asks to change and how (colors, materials, walls, floor, a piece of furniture), [] if none' : 'fixed elements to restyle in the style and how (for example the fitted kitchen: fronts and worktop), [] if none'}.
- add: ${task === 'empty' ? 'always []' : task === 'edit' ? 'only the new things the request asks for, each with exactly where it goes (real furniture Italian families buy today), [] if none' : 'what a professional Italian home stager would put in THIS room: 3 to 7 pieces that belong in this room type and fit the visible floor, then at most 3 small accessories; real furniture Italian families buy today (IKEA, Mondo Convenienza) in the style; for each, what it is, color and material, and exactly where it stands; never block doors, windows, radiators or passages'}.`;
// Controllo dopo la rimozione: cosa della lista e' ancora visibile (un secondo passaggio con la lista corta di solito basta;
// 27/09 il letto e il divano in primo piano restavano al primo colpo)
export const leftoverPrompt = (remove: string[]) => `Image 1 is the original photo, image 2 is the same photo after an AI editor was asked to remove these things: ${remove.join(' | ')}.
Look carefully at image 2: which of those things are still visible, even partially or cut by the edge of the photo? For each one give a short name of the object (a noun phrase, e.g. "the purple floral armchair") and a generous box around the whole object and its shadow, in fractions of image 2 width and height (x, y = top left corner, 0..1).
Reply with JSON only: {"left": [{"what": "...", "box": {"x": 0, "y": 0, "w": 0, "h": 0}}]} (empty list if everything was removed).`;
// Rimozione dentro un riquadro: il worker manda al modello la foto e la stessa con il rettangolo rosso ("mark") e fuori
// dal riquadro rimette la foto originale. Serve per gli oggetti che la rimozione su tutta la foto lascia (poltrona tagliata dal bordo).
export const removeInBoxPrompt = (what: string) => `Edit the first image: remove ${what} completely, including all its parts, its legs and its shadow. It is inside the area marked by the red rectangle in the second image. Show the floor and the walls that continue behind it, with the same material, color and light as around it. Do not add any new object. Keep everything outside the red rectangle exactly the same, same framing and perspective. The result must not contain any red rectangle. Photorealistic.`;
export const removePrompt = (p: Pick<EditPlan, 'remove' | 'keep'>) => `Remove from this photo only these things: ${p.remove.join(' ')} Where they were, show the same walls and floor continuing behind them. Keep exactly the same, pixel for pixel: ${p.keep.join(' ')} Also keep the daylight and the camera position, zoom and framing exactly the same. Do not add anything. Photorealistic.`;
export const addFurniturePrompt = (p: EditPlan) => `Edit this exact photo without changing the room. The camera position, zoom, framing and perspective stay exactly the same, and these stay exactly where they are, pixel for pixel: ${p.keep.join(' ')} ${p.restyle.length ? `Change only: ${p.restyle.join(' ')} ` : ''}${p.add.length ? `Add only these pieces, standing on the visible floor, exactly where described: ${p.add.join(' ')} ` : ''}Nothing else. Same daylight as the photo. Professional interior photography: realistic materials and textures, natural soft shadows under and behind every piece, real reflections, true contrast, not overexposed, not a flat or plastic render. Do not add any text, letters, logos or watermarks.`;

const STYLE_PROMPTS: Record<string, string> = {
  // lo stile dice solo materiali e colori: QUALI mobili li decide il tipo di stanza (ROOM_FURNISH). Con "divano e
  // tavolino" nello stile Qwen li metteva anche in camera da letto (prova del 27/09).
  modern: stage('simple modern', 'white fronts and light oak, light grey fabrics, simple rounded shapes, one or two cushions in soft blue or mustard'),
  nordic: stage('simple Scandinavian', 'light oak and white, linen fabrics, a wool rug, a white pendant lamp'),
  industrial: stage('good quality contemporary', 'white and warm grey fronts, concrete-look or light stone surfaces, open oak shelves, a soft warm LED strip, calm colors'),
  boho: stage('warm natural', 'light wood, linen and cotton, a jute rug, one plant, warm sand, terracotta and sage tones'),
  daynight: "Analyze the lighting in this photo. If daytime: convert to nighttime — dark blue sky through windows, all light fixtures ON with warm glow and halos, deep shadows. If nighttime: convert to daytime — bright blue sky, natural sunlight through windows, morning light. CRITICAL: do NOT add, remove, move or change ANY object, furniture, door, window or wall. ONLY change lighting and sky. Photorealistic, 8k.",
  // Qwen-Image segue meglio istruzioni corte: il prompt lungo di Nano Banana gli faceva rifare il pavimento.
  empty: EMPTY_KEEP,
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
    detail: ['round shapes', 'a striped rug', 'a globe pendant lamp', 'a linen throw', 'a large plant in a ceramic pot'],
  },
  nordic: {
    wood: ['birch', 'light oak', 'pale ash', 'whitewashed pine', 'natural beech'],
    fabric: ['white linen', 'soft grey wool', 'cream bouclé', 'light beige cotton', 'pale blue fabric'],
    shape: ['simple Scandinavian shapes', 'tapered wooden legs', 'rounded edges', 'slatted wood details'],
    accent: ['pale blue', 'sage green', 'warm grey', 'soft yellow', 'dusty rose'],
    detail: ['a wool rug with a subtle pattern', 'a white pendant lamp', 'a sheepskin throw', 'a wooden wall shelf', 'a paper lamp', 'a linen throw'],
  },
  industrial: {
    wood: ['smoked oak', 'walnut', 'dark oak accents', 'concrete-look surfaces', 'light stone surfaces'],
    fabric: ['stone grey fabric', 'charcoal fabric', 'warm beige', 'cognac leather', 'ivory bouclé'],
    shape: ['black metal details', 'strong rectangular shapes', 'open oak shelves with warm LED light', 'slim brushed steel legs'],
    accent: ['olive green', 'deep blue', 'rust orange', 'warm white', 'bronze'],
    detail: ['a large grey rug', 'a black arc floor lamp', 'low profiles', 'a wool throw', 'travertine accents', 'a tall plant'],
  },
  boho: {
    wood: ['honey oak', 'light teak', 'natural pine', 'bamboo', 'rattan and cane'],
    fabric: ['ivory cotton', 'sand linen', 'oatmeal fabric', 'warm cream bouclé', 'light terracotta cotton'],
    shape: ['soft organic shapes', 'woven cane details', 'low rounded furniture', 'natural fibre textures'],
    accent: ['terracotta', 'deep green', 'ochre', 'sage', 'rust', 'warm pink'],
    detail: ['a jute rug', 'a woven pendant lamp', 'a linen throw', 'a large plant in a basket', 'a striped cotton throw'],
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
  return `Use ${wood}, ${fabric}, ${shape}, ${accent} accents and ${detail}.`;
}


// Cosa mettere per tipo di stanza negli stili: senza, in una cucina aperta arredava solo i pensili e lasciava vuoto il resto
const ROOM_FURNISH: Record<string, string> = {
  cucina: 'This room is a kitchen: furnish it completely, the kitchen units AND the free floor space: a dining table with four chairs, a pendant lamp above the table; if part of the room is a living area, a sofa and a coffee table there.',
  soggiorno: 'This room is a living room: a sofa, an armchair, a coffee table, a TV unit, a rug and a floor lamp, curtains only if the windows have none; fill the whole visible floor in a natural way.',
  sala: 'This room is a dining room: a dining table with six chairs, a sideboard, a pendant lamp above the table.',
  camera: 'This room is a bedroom: a double bed with bedding and cushions, two bedside tables with lamps, a rug; a wardrobe only if there is free wall space for it, curtains only if the windows have none.',
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
const RESTYLE = /\b(stile|moderno|moderna|nordico|nordica|scandinavo|scandinava|minimal|contemporaneo|contemporanea|industriale|boho|arreda\w*|riarreda\w*|rinnova\w*|rifai|rifalla|trasforma\w*|ristruttura\w*|home staging)\b/i;
export const isRestyle = (text?: string | null) => !!text && RESTYLE.test(text) && !/\b(togli|rimuovi|elimina|cancella)\b/i.test(text);

export function buildStagingPrompt(o: { style?: string | null; customPrompt?: string | null; angle?: string | null; planimetria?: boolean; scene?: SceneType; room?: string; restyle?: boolean }): string {
  const scene = o.scene ?? 'interno';
  if (o.planimetria) return PLANIMETRIA_BASE + (FURNISH[o.style || ''] || FURNISH.modern) + NO_TEXT;
  const styles = scene === 'esterno' ? STYLE_PROMPTS_ESTERNO : scene === 'giardino' ? STYLE_PROMPTS_GIARDINO : STYLE_PROMPTS;
  const custom = o.customPrompt?.trim();
  const angle = ANGLES.find(a => a.id === o.angle);
  // luce (giorno/notte): si cambia solo la luce della STESSA foto. Il modello "nuova inquadratura" qui sotto diceva
  // "from a new camera position" e spostava la camera anche per "Piu' luce".
  if (angle && (angle.id === 'day' || angle.id === 'night')) {
    const light = angle.id === 'day'
      ? 'make it brighter and more luminous, as on a sunny day: higher exposure, lifted shadows, whiter and cleaner walls and ceiling, bright sky only where a window already shows the outside. Never add windows, doors, openings or lamps'  // con "luce dalle finestre" inventava finestre sulle pareti piene (27/09)
      : 'evening: dark blue sky outside, all the lamps and ceiling lights on with a warm glow';
    return `Change only the light of this exact photo: ${light}. Every wall, window, door, piece of furniture and object stays exactly the same, pixel for pixel, and the camera position, zoom and framing stay exactly the same. Photorealistic.${NO_TEXT_PLAIN}`;
  }
  if (angle) {
    return `ROOM ANALYSIS REQUIRED: Study every detail — furniture pieces, materials, colors, textures, wall finishes, window placement, door positions, architectural features, lighting fixtures, decorative objects. TASK: Regenerate this IDENTICAL room from a new camera position: ${angle.prompt}. Every object must appear in the same position relative to the room. Same furniture, same colors, same materials, same lighting conditions, same time of day. FORBIDDEN: adding new objects, removing existing objects, changing any material or color, altering room dimensions, modifying architectural features. Output: photorealistic interior photograph, 8K, consistent with input image lighting.${NO_TEXT}`;
  }
  if (custom) {
    if (scene === 'esterno') return `BUILDING LOCKED: Preserve EXACTLY the house facade, roofline, windows, doors, walls, materials, colors, and the camera angle/perspective. FORBIDDEN: changing the building's structure, adding new floors, altering the facade shape. ALLOWED: adding or modifying garden elements, terrace furniture, landscaping, driveway, plants as requested. USER EDIT REQUEST (apply in any language): "${custom}". Apply the requested changes to the surroundings while keeping the building itself identical. Photorealistic result, 8K architectural photography.${OUTDOOR_LOCK}${NO_TEXT}`;
    if (scene === 'giardino') return `GARDEN EDIT: Preserve the existing layout, any visible building structure, paths, boundaries and the camera angle/perspective exactly. ALLOWED: freely adding or modifying plants, furniture, decking, lighting as requested. USER EDIT REQUEST (apply in any language): "${custom}". Photorealistic result, 8K outdoor photography.${OUTDOOR_LOCK}${NO_TEXT}`;
    if (o.restyle && scene === 'interno') {
      const furnishRoom = o.room && ROOM_FURNISH[o.room] ? ` ${ROOM_FURNISH[o.room]}` : '';
      return (furnishRoom.trim() + ' ' + stage('new', `as requested: ${custom}`)).trim() + NO_TEXT_PLAIN;
    }
    // Stessa formula "additiva" degli stili: cambia solo quello che chiede l'agente, la foto resta quella.
    // corto: i prompt lunghi facevano reinventare la stanza a Qwen (27/09)
    return `Edit this exact photo: ${custom}. Change only that. Everything else stays exactly the same, pixel for pixel: walls, windows, doors, furniture, decor, light, and the camera position, zoom and framing.${ONLY_REQUESTED} Photorealistic.${NO_TEXT_PLAIN}`;
  }
  const furnish = scene === 'interno' && o.style !== 'empty' && o.style !== 'daynight' && o.room && ROOM_FURNISH[o.room] ? ` ${ROOM_FURNISH[o.room]}` : '';
  // tipo di stanza in testa: in coda a un prompt Qwen lo pesava poco e seguiva i mobili dello stile
  // interni: prompt corto (vedi stage), niente blocco lungo sul testo
  return (scene === 'interno' && furnish ? furnish.trim() + ' ' : '') + (styles[o.style || ''] || styles.modern) + (scene === 'interno' ? NO_TEXT_PLAIN : OUTDOOR_LOCK + NO_TEXT);
}

// Arredo in due passi (svuota, piano di Claude, aggiunta): stili d'interni e richieste di arredo ("arreda moderno")
export const isFurnishing = (o: { style?: string | null; customPrompt?: string | null; angle?: string | null; planimetria?: boolean; scene?: SceneType; restyle?: boolean }) =>
  (o.scene ?? 'interno') === 'interno' && !o.angle && !o.planimetria && (!!(o.style && STYLE_LOOK[o.style]) || (!!o.customPrompt?.trim() && !!o.restyle));
export const roomLabel = (key: string) => ({ cucina: 'kitchen', soggiorno: 'living room', sala: 'dining room', camera: 'double bedroom', cameretta: "child's bedroom", studio: 'home office', ingresso: 'entrance hall', corridoio: 'hallway', bagno: 'bathroom', balcone: 'balcony' } as Record<string, string>)[key] ?? '';
