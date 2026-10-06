# Verifica di fedelta' di una casa 3D: vista ortografica dall'alto del visore (scripts/casa3d-shots.mjs) riportata
# sull'originale con toImage (stessa scala e rotazione), sovrapposizione al 50% e differenze contate senza AI:
# stanze lette sull'originale (lettura Gemini) senza stanza nel 3D e viceversa, porte lette senza apertura vicina e
# viceversa, muri del 3D senza inchiostro sotto, combacio dei contorni delle stanze con l'inchiostro (px).
#   python3 scripts/casa3d-fidelity.py <originale> <plan.json> <orto.png> <orto.json> <read.json|-> <uscita.png> [titolo]
import json, sys
import cv2, numpy as np

orig_f, plan_f, orto_f, meta_f, read_f, out_f = sys.argv[1:7]
title = sys.argv[7] if len(sys.argv) > 7 else ''
img = cv2.imread(orig_f); H, W = img.shape[:2]
plan = json.load(open(plan_f)); meta = json.load(open(meta_f))
a, b, c, d, e, f = plan['image']['toImage']; iw, ih = plan['image']['w'], plan['image']['h']
sx, sy = W / iw, H / ih
P = lambda x, z: ((a * x + c * z + e) * sx, (b * x + d * z + f) * sy)
ppm = (abs(a * d - b * c)) ** 0.5 * sx  # pixel dell'originale per metro
# render ortografico -> pixel dell'originale
k = meta['PX']; x0, z0 = meta['x0'], meta['z0']
A = np.array([[a / k * sx, c / k * sx, (a * x0 + c * z0 + e) * sx], [b / k * sy, d / k * sy, (b * x0 + d * z0 + f) * sy]], np.float32)
orto = cv2.imread(orto_f, cv2.IMREAD_UNCHANGED)
if orto.shape[2] == 4:  # fondo trasparente -> bianco
    al = orto[:, :, 3:4] / 255.0; orto = (orto[:, :, :3] * al + 255 * (1 - al)).astype(np.uint8)
warped = cv2.warpAffine(orto, A, (W, H), flags=cv2.INTER_AREA, borderValue=(255, 255, 255))
over = cv2.addWeighted(img, 0.5, warped, 0.5, 0)

# inchiostro dell'originale e distanza dall'inchiostro
g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY); ink = (g < 140).astype(np.uint8)
dist = cv2.distanceTransform(1 - ink, cv2.DIST_L2, 5)
inside = [r for r in plan['rooms'] if r['type'] not in ('esterno', 'cortile', 'giardino', 'terrazzo', 'balcone') and not (r.get('stair') or {}).get('outdoor')]
def edge_fit(poly):
    s = []
    for i in range(len(poly)):
        p0, p1 = np.array(poly[i]), np.array(poly[(i + 1) % len(poly)])
        for t in np.linspace(0, 1, max(2, int(np.linalg.norm(p1 - p0) / 3))):
            x, y = (p0 + (p1 - p0) * t).astype(int)
            if 0 <= x < W and 0 <= y < H: s.append(dist[y, x])
    return float(np.mean(s)) if s else 0
fit = [edge_fit([P(*q) for q in r['poly']]) for r in inside]
# muri del 3D senza inchiostro sotto (piu' di meta' della linea a oltre 4 px dall'inchiostro)
extra_walls = 0
for w in plan['walls']:
    pts = np.array([P(*q) for q in w['outer']]); m = pts.mean(0)
    L = max(np.linalg.norm(pts[1] - pts[0]), np.linalg.norm(pts[2] - pts[1]))
    if L < 0.4 * ppm: continue
    i = 0 if np.linalg.norm(pts[1] - pts[0]) >= np.linalg.norm(pts[2] - pts[1]) else 1
    q0, q1 = (pts[i] + pts[(i + 3) % 4]) / 2, (pts[i + 1] + pts[(i + 2) % 4]) / 2
    ok = [dist[int(y), int(x)] <= 4 for x, y in (q0 + (q1 - q0) * t for t in np.linspace(0.05, 0.95, 20)) if 0 <= x < W and 0 <= y < H]
    if ok and sum(ok) / len(ok) < 0.5: extra_walls += 1

lines = []
if read_f != '-':
    R = json.load(open(read_f)); R = R.get('read', R)
    G = lambda q: (q[0] / 1000 * W, q[1] / 1000 * H)
    def mask(poly):
        m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(poly, np.int32)], 1); return m
    gm = {r['id']: mask([G(q) for q in r['poly']]) for r in R['rooms']}
    pm = {r['id']: mask([P(*q) for q in r['poly']]) for r in plan['rooms']}
    names = {r['id']: (r['name'] or r['type']) for r in R['rooms']}
    missing = [names[i] for i, m in gm.items() if not any((m & pm[j]).sum() > 0.4 * max(1, m.sum()) or (m & pm[j]).sum() > 0.5 * max(1, pm[j].sum()) for j in pm)]
    lab = {r['id']: r.get('label') or r['type'] for r in plan['rooms']}
    extra = [f"{lab[j]} {r['area']}" for r in inside for j in [r['id']] if r['type'] != 'scala' and not any((pm[j] & m).sum() > 0.4 * max(1, pm[j].sum()) for m in gm.values())]
    # porte lette senza apertura del 3D entro 60 cm, e viceversa
    dc = [((o['rect'][0] + o['rect'][2]) / 2, (o['rect'][1] + o['rect'][3]) / 2) for o in plan['doors'] + plan['windows']]
    dpx = [P(*q) for q in dc]
    miss_d = [l for l in R['links'] if l['conf'] >= 0.5 and not any(np.hypot(x - l['x'] / 1000 * W, y - l['y'] / 1000 * H) < 0.6 * ppm for x, y in dpx)]
    links_px = [(l['x'] / 1000 * W, l['y'] / 1000 * H) for l in R['links']] + [(w['x'] / 1000 * W, w['y'] / 1000 * H) for w in R['windows']]
    extra_d = [o for o, (x, y) in zip(plan['doors'], [P(*q) for q in dc[:len(plan['doors'])]]) if not any(np.hypot(x - u, y - v) < 0.6 * ppm for u, v in links_px)]
    lines += [f"stanze lette {len(R['rooms'])}, nel 3D {len(inside)} interne (+{len(plan['rooms']) - len(inside)} esterne/fuori)",
              f"mancanti: {', '.join(missing) or 'nessuna'}", f"in piu': {', '.join(extra) or 'nessuna'}",
              f"porte lette senza apertura nel 3D: {len(miss_d)}  porte del 3D non lette: {len(extra_d)}"]
    for l in miss_d: cv2.circle(over, (int(l['x'] / 1000 * W), int(l['y'] / 1000 * H)), int(0.45 * ppm), (0, 0, 220), 3)
    for o in extra_d:
        x, y = P((o['rect'][0] + o['rect'][2]) / 2, (o['rect'][1] + o['rect'][3]) / 2); cv2.circle(over, (int(x), int(y)), int(0.45 * ppm), (220, 120, 0), 3)
lines += [f"muri del 3D senza inchiostro sotto: {extra_walls} su {len(plan['walls'])}", f"combacio contorni stanze/inchiostro: {np.mean(fit):.1f} px medio, peggiore {max(fit) if fit else 0:.1f} px ({ppm:.0f} px/m)"]

sep = np.full((H, 14, 3), 255, np.uint8)
row = np.hstack([img, sep, warped, sep, over])
lab_h = 40
heads = np.full((lab_h, row.shape[1], 3), 255, np.uint8)
for i, t in enumerate(['ORIGINALE', '3D DALL\'ALTO (stessa scala)', 'SOVRAPPOSIZIONE 50%  (rosso: porta letta mancante, blu: porta in piu\')']):
    cv2.putText(heads, t, (10 + i * (W + 14), 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
foot = np.full((30 * (len(lines) + 1) + 10, row.shape[1], 3), 255, np.uint8)
cv2.putText(foot, title, (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2, cv2.LINE_AA)
for i, t in enumerate(lines): cv2.putText(foot, t, (10, 56 + 30 * i), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (40, 40, 40), 1, cv2.LINE_AA)
out = np.vstack([heads, row, foot])
if out.shape[1] > 3000: out = cv2.resize(out, None, fx=3000 / out.shape[1], fy=3000 / out.shape[1], interpolation=cv2.INTER_AREA)
cv2.imwrite(out_f, out)
print(json.dumps({'fit_px': round(float(np.mean(fit)), 2) if fit else None, 'stanze_interne': len(inside), 'muri_senza_inchiostro': extra_walls, 'righe': lines}, ensure_ascii=False))
