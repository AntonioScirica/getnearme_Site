// Stili d'arredo del visore. Per ogni stile: materiali dei mobili per "slot" (legni, laccati, tessuti, metalli, tende,
// tappeti, scala, arredo da esterno), varianti dei modelli CC0 Poly Haven per tipo di mobile, pavimenti consigliati
// (solo nelle stanze senza pavimento letto dalle foto o scelto dall'agente), colore di base dei muri (stanze senza
// colore letto) e tono delle luci. Il cambio e' dal vivo: materiali e mobili, la casa resta com'e'.
// Spec di un materiale: { tex: texture CC0 (o null = tinta unita), scale, color, rough, metal }. color puo' essere
// [r, g, b] lineari anche sopra 1 per schiarire una texture (legno chiaro dal rovere medio).
export const STYLE_IDS = ['moderno', 'nordico', 'classico', 'industriale', 'lusso', 'boho']
export const STYLE_LABEL = { moderno: 'Moderno', nordico: 'Nordico', classico: 'Classico', industriale: 'Industriale', lusso: 'Luxury', boho: 'Boho', vuota: 'Vuota' }

const OAK = 'oak_veneer_01', COTTON = 'cotton_jersey', WOOL = 'poly_wool_herringbone', HESSIAN = 'hessian_230', LEATHER = 'leather_white', MARBLE = 'marble_01'
const wood = (color, rough = 0.6) => ({ tex: OAK, color, rough, normal: 0.4 })
const plain = (color, rough = 0.45, metal = 0) => ({ tex: null, color, rough, metal })
const cloth = color => ({ tex: null, nor: 'stretch_poplin', scale: 1.3, color, rough: 1, normal: 0.8 }) // tinta unita con la trama del tessuto
const metal = (color, rough = 0.45, m = 0.75) => ({ tex: null, color, rough, metal: m })
const fabric = (tex, color, scale = 1.6, rough = 1) => ({ tex, color, scale, rough, normal: 0.8 })
const marble = (color = 0xffffff, rough = 0.38) => ({ tex: MARBLE, color, rough, scale: 0.8, normal: 0.5 })

// pavimenti consigliati per tipo di stanza (chiavi dei materiali del visore, vedi materials.js)
const F = (base, over = {}) => ({ soggiorno: base, camera: base, cameretta: base, studio: base, ingresso: base, corridoio: base, ripostiglio: base, cucina: 'tiles', bagno: 'marble', lavanderia: 'tiles', balcone: 'tiles', terrazzo: 'tiles', scala: 'marble', ...over })

export const STYLES = {
  moderno: {
    floors: F('parquet'), wall: 0xf1ece4, light: { warm: 0xffd3a3, day: 0xfff6ec, k: 1 },
    mats: {
      wood: wood(0xffffff), cabinet: plain(0xf3f1ec, 0.38), kitchen: plain(0xe9e3d8), top: wood(0xffffff), metal: metal(0x1d1d1d),
      sofa: fabric(COTTON, 0xd8d2c8), accent: fabric(WOOL, 0x9a8f7f, 1.3), accent2: fabric(WOOL, 0xb9b2a8, 1.2), blanket: fabric(COTTON, 0xb7a58e, 1.3),
      headboard: fabric(WOOL, 0xc8c0b4), rug: fabric(HESSIAN, 0xe0d6c4, 2.5), curtain: cloth(0xf2eee6), shade: cloth(0xf1e8da),
      duvet: cloth(0xf3f1ec), pillow: cloth(0xeeeae2), linen: cloth(0xf2efe9),
      stairTread: marble(), stairRiser: marble(0xf4f2ee), stairBody: plain(0xeee9e1, 0.95), rail: metal(0x1d1d1d), handrail: metal(0x1d1d1d),
      outMetal: metal(0x3a3c3e, 0.5, 0.6), outWood: wood(0xffffff, 0.7), outFabric: cloth(0xe8e2d6),
    },
    models: {},
  },
  nordico: {
    floors: F('parquetPale', { cucina: 'parquetPale', bagno: 'tilesLight', scala: 'parquetPale', lavanderia: 'tilesLight', balcone: 'parquetPale', terrazzo: 'parquetPale' }), wall: 0xf6f5f1, light: { warm: 0xffdcb6, day: 0xf7f9ff, k: 0.95 },
    mats: {
      wood: wood([1.25, 1.17, 1.06], 0.65), cabinet: plain(0xf7f6f2, 0.42), kitchen: plain(0xf4f3ef, 0.42), top: wood([1.25, 1.17, 1.06], 0.62), metal: metal(0x2a2a2a, 0.6, 0.3),
      sofa: fabric(COTTON, 0xe6e3dd), accent: fabric(WOOL, 0x9fb0b5, 1.3), accent2: fabric(WOOL, 0xd8cfc0, 1.2), blanket: fabric(COTTON, 0xcfc6b6, 1.3),
      headboard: fabric(WOOL, 0xe2ddd4), rug: fabric(HESSIAN, 0xf2eee6, 2.5), curtain: cloth(0xf8f6f1), shade: cloth(0xf7f4ee),
      duvet: cloth(0xf7f6f3), pillow: cloth(0xf1efea), linen: cloth(0xf5f3ef),
      stairTread: wood([1.25, 1.17, 1.06], 0.55), stairRiser: plain(0xf4f2ee, 0.5), stairBody: plain(0xf3f1ec, 0.95), rail: metal(0xf2f2f0, 0.5, 0.2), handrail: wood([1.25, 1.17, 1.06], 0.5),
      outMetal: metal(0xf0efea, 0.5, 0.2), outWood: wood([1.25, 1.17, 1.06], 0.7), outFabric: cloth(0xeceae4),
    },
    models: { chair: 'painted_wooden_chair_01', vaseTall: 'ceramic_vase_02' },
  },
  classico: {
    floors: F('herringbone', { cucina: 'cotto', ingresso: 'graniglia', corridoio: 'graniglia', bagno: 'marble' }), wall: 0xefe5d2, light: { warm: 0xffc285, day: 0xfff1e0, k: 1 },
    mats: {
      wood: wood(0x6e4b33, 0.5), cabinet: wood(0x6e4b33, 0.62), kitchen: plain(0xe4d9c2, 0.5), top: marble(), metal: metal(0x6d5634, 0.4, 0.8),
      sofa: fabric(COTTON, 0xb88f6a), accent: fabric(WOOL, 0x7a2e2a, 1.3), accent2: fabric(WOOL, 0xc9a86a, 1.2), blanket: fabric(COTTON, 0x8a3b30, 1.3),
      headboard: fabric(COTTON, 0x8c6a4f), rug: fabric(HESSIAN, 0x8e3f33, 2.5), curtain: cloth(0xd9c49a), shade: cloth(0xf0e3c8),
      duvet: cloth(0xf4efe4), pillow: cloth(0xefe7d6), linen: cloth(0xf3eee3),
      stairTread: marble(), stairRiser: marble(0xf6f1e8), stairBody: plain(0xefe5d2, 0.95), rail: metal(0x2b2622, 0.5, 0.6), handrail: wood(0x6e4b33, 0.4),
      outMetal: metal(0x2c3a2e, 0.55, 0.6), outWood: wood(0x6e4b33, 0.6), outFabric: cloth(0xe8dcc0),
    },
    models: { armchair: 'ArmChair_01', nightstand: 'ClassicNightstand_01', pendant: 'Chandelier_02', picture1: 'fancy_picture_frame_01', picture2: 'fancy_picture_frame_01', vaseTall: 'antique_ceramic_vase_01' },
  },
  industriale: {
    floors: F('resina', { camera: 'parquetDark', cameretta: 'parquetDark', bagno: 'tilesDark', cucina: 'resina', scala: 'resina', balcone: 'tilesDark', terrazzo: 'tilesDark' }), wall: 0xe3e1dc, light: { warm: 0xffb46b, day: 0xfff3e6, k: 1 },
    mats: {
      wood: wood(0x5c4434, 0.55), cabinet: plain(0x3a3b3c, 0.5, 0.2), kitchen: plain(0x2f3133, 0.45, 0.1), top: wood(0x5c4434, 0.55), metal: metal(0x161616, 0.5, 0.8),
      sofa: { tex: LEATHER, color: 0x7a4626, scale: 1, rough: 0.55, normal: 1 }, accent: fabric(WOOL, 0x55595c, 1.3), accent2: fabric(WOOL, 0xa0522d, 1.2), blanket: fabric(COTTON, 0x4f5357, 1.3),
      headboard: { tex: LEATHER, color: 0x5a3a26, scale: 1, rough: 0.55, normal: 1 }, rug: fabric(HESSIAN, 0x77716a, 2.5), curtain: cloth(0x9a968f), shade: plain(0x2e2e2e, 0.6),
      duvet: cloth(0xe9e7e2), pillow: cloth(0xd6d3cd), linen: cloth(0xe6e3dd),
      stairTread: wood(0x5c4434, 0.5), stairRiser: metal(0x1e1e1e, 0.55, 0.6), stairBody: plain(0x9a9792, 0.9), rail: metal(0x161616, 0.5, 0.8), handrail: metal(0x161616, 0.5, 0.8),
      outMetal: metal(0x161616, 0.5, 0.8), outWood: wood(0x5c4434, 0.7), outFabric: cloth(0x6b6e70),
    },
    models: { armchair: 'mid_century_lounge_chair', coffee: 'industrial_coffee_table', pendant: 'hanging_industrial_lamp', shelves: 'steel_frame_shelves_01', chest: 'vintage_wooden_drawer_01', deskLamp: 'industrial_pipe_lamp' },
  },
  lusso: {
    floors: F('marble', { camera: 'herringbone', cameretta: 'herringbone', studio: 'herringbone', cucina: 'marble' }), wall: 0xece5da, light: { warm: 0xffcf99, day: 0xfff7ee, k: 1.15 },
    mats: {
      wood: wood(0x4a3123, 0.4), cabinet: wood(0x4a3123, 0.55), kitchen: plain(0x23332c, 0.35), top: marble(), metal: metal(0xc8a050, 0.28, 1),
      sofa: fabric(COTTON, 0x2f5048, 1.6, 0.85), accent: fabric(WOOL, 0xc6a15b, 1.3), accent2: fabric(WOOL, 0xe8e0d0, 1.2), blanket: fabric(COTTON, 0xc9b48a, 1.3),
      headboard: fabric(COTTON, 0x2f5048), rug: fabric(HESSIAN, 0xd8cfc0, 2.5), curtain: cloth(0xd6c8ae), shade: cloth(0xf4ead7),
      duvet: cloth(0xfaf8f4), pillow: cloth(0xf3eee4), linen: cloth(0xf7f4ee),
      stairTread: marble(), stairRiser: marble(), stairBody: plain(0xece5da, 0.9), rail: metal(0xc8a050, 0.3, 1), handrail: metal(0xc8a050, 0.3, 1),
      outMetal: metal(0x2b2b2b, 0.4, 0.6), outWood: wood(0x8a6040, 0.5), outFabric: cloth(0xf2ede4), loungers: true,
    },
    models: { armchair: 'GreenChair_01', pendant: 'Chandelier_01', vaseTall: 'brass_vase_01', picture1: 'fancy_picture_frame_01', picture2: 'fancy_picture_frame_01' },
  },
  boho: {
    floors: F('parquet', { soggiorno: 'cotto', cucina: 'cotto', ingresso: 'cotto', corridoio: 'cotto', bagno: 'graniglia', scala: 'cotto' }), wall: 0xf1e4d1, light: { warm: 0xffbf80, day: 0xfff4e6, k: 1 },
    mats: {
      wood: wood([1.08, 0.88, 0.62], 0.6), cabinet: plain(0xeadfca, 0.5), kitchen: plain(0x9aa58a, 0.5), top: wood([1.08, 0.88, 0.62], 0.6), metal: metal(0x2a2a2a, 0.55, 0.6),
      sofa: fabric(COTTON, 0xd9c6a5), accent: fabric(WOOL, 0xb5532e, 1.3), accent2: fabric(WOOL, 0xd7a53c, 1.2), blanket: fabric(COTTON, 0xc06a3e, 1.3),
      headboard: fabric(HESSIAN, 0xcbb38f, 1.2), rug: fabric(HESSIAN, 0xcaa47a, 2.5), curtain: cloth(0xefe2cc), shade: cloth(0xe9d6b4),
      duvet: cloth(0xf3ece0), pillow: cloth(0xe9dcc6), linen: cloth(0xf1e9dc),
      stairTread: wood([1.08, 0.88, 0.62], 0.55), stairRiser: plain(0xf1e4d1, 0.6), stairBody: plain(0xf1e4d1, 0.95), rail: metal(0x2a2a2a, 0.55, 0.6), handrail: wood([1.08, 0.88, 0.62], 0.5),
      outMetal: metal(0x2a2a2a, 0.55, 0.6), outWood: wood([1.08, 0.88, 0.62], 0.7), outFabric: cloth(0xc8643c),
    },
    models: { armchair: 'Rockingchair_01', nightstand: 'painted_wooden_nightstand', basket: 'wicker_basket_02', vaseTall: 'ceramic_vase_04' },
  },
}
// "Vuota": la casa senza mobili, con i materiali neutri del Moderno
export const styleOf = id => STYLES[id] || STYLES.moderno
export const validStyle = id => id === 'vuota' || !!STYLES[id]
