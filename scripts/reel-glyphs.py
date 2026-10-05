# Contorni dei caratteri di Plus Jakarta Sans per i video Annuncio e Venduto (src/lib/reel/glyphs.json).
# Sul server (Vercel) non ci sono font installati: il testo diventa <path> SVG, sharp lo disegna senza font.
# Uso: python3 scripts/reel-glyphs.py (serve fontTools)
import json
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen

SRC = 'src/fonts/PlusJakartaSans-normal.woff2'
out = {}
for w in (500, 700, 800):
    f = TTFont(SRC)
    f = instancer.instantiateVariableFont(f, {'wght': w})
    cmap = f.getBestCmap(); gs = f.getGlyphSet(); upm = f['head'].unitsPerEm
    glyphs = {}
    for cp, name in cmap.items():
        if cp < 0x20 or cp > 0x2122: continue
        pen = SVGPathPen(gs, lambda v: str(round(v)))
        gs[name].draw(pen)
        glyphs[chr(cp)] = [round(gs[name].width), pen.getCommands()]
    names = {name: chr(cp) for cp, name in cmap.items() if chr(cp) in glyphs}
    kern = {}
    gpos = f['GPOS'].table
    idx = set()
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == 'kern': idx.update(fr.Feature.LookupListIndex)
    for li in sorted(idx):
        lk = gpos.LookupList.Lookup[li]
        subs = lk.SubTable
        if lk.LookupType == 9: subs = [s.ExtSubTable for s in subs]
        for st in subs:
            if getattr(st, 'LookupType', 2) != 2: continue
            cov = st.Coverage.glyphs
            if st.Format == 1:
                for i, g1 in enumerate(cov):
                    for pvr in st.PairSet[i].PairValueRecord:
                        v = getattr(pvr.Value1, 'XAdvance', 0) if pvr.Value1 else 0
                        a, b = names.get(g1), names.get(pvr.SecondGlyph)
                        if v and a and b and a + b not in kern: kern[a + b] = v
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs; c2 = st.ClassDef2.classDefs
                for g1 in cov:
                    a = names.get(g1)
                    if not a: continue
                    r = st.Class1Record[c1.get(g1, 0)]
                    for g2, b in names.items():
                        v = r.Class2Record[c2.get(g2, 0)].Value1
                        v = getattr(v, 'XAdvance', 0) if v else 0
                        if v and a + b not in kern: kern[a + b] = v
    hh = f['hhea']
    out[str(w)] = {'upm': upm, 'asc': hh.ascent, 'desc': hh.descent, 'glyphs': glyphs, 'kern': kern}
json.dump(out, open('src/lib/reel/glyphs.json', 'w'), separators=(',', ':'), ensure_ascii=False)
