'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Footprints, House, Maximize2, Minimize2 } from 'lucide-react';
import { FLOOR, type Plan, type Room } from '@/lib/floorplan';

// Tour 3D di una casa dalla planimetria: dollhouse (dall'alto, ruotabile, senza soffitto) e passeggiata
// ad altezza uomo (frecce o WASD per muoversi, trascina per guardarti intorno). Le foto della casa
// stanno sulle pareti delle stanze. Tutto nel browser con three.js, nessun server.

type Mode = 'dollhouse' | 'walk';
type Seg = { x1: number; z1: number; x2: number; z2: number }; // pezzi di muro pieni, per non attraversarli
const H = 2.7, T = 0.12, EYE = 1.6, DOOR_H = 2.1, SILL = 0.9;

export default function Tour3D({ plan, className = '' }: { plan: Plan; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('dollhouse');
  const [full, setFull] = useState(false);
  const api = useRef<{ setMode: (m: Mode) => void; goto: (r: Room) => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 200);
    const cx = plan.width / 2, cz = plan.depth / 2;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb0a08a, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(cx + 6, 12, cz - 8); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15 });
    scene.add(sun);

    // Terreno sotto la casa (solo per la dollhouse)
    const ground = new THREE.Mesh(new THREE.CircleGeometry(Math.max(plan.width, plan.depth) * 1.3, 64), new THREE.MeshStandardMaterial({ color: 0xeeeae2 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(cx, -0.02, cz); ground.receiveShadow = true; scene.add(ground);

    // Pavimenti per stanza + etichette; soffitto solo nella passeggiata
    const labels: THREE.Sprite[] = [];
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(plan.width, plan.depth), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.BackSide }));
    ceiling.rotation.x = -Math.PI / 2; ceiling.position.set(cx, H, cz); scene.add(ceiling);
    for (const r of plan.rooms) {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), new THREE.MeshStandardMaterial({ color: FLOOR[r.type], roughness: 0.9 }));
      floor.rotation.x = -Math.PI / 2; floor.position.set(r.x + r.w / 2, 0, r.y + r.d / 2); floor.receiveShadow = true; scene.add(floor);
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const g = c.getContext('2d')!; g.fillStyle = 'rgba(17,17,17,.82)'; g.beginPath(); g.roundRect(60, 24, 392, 80, 40); g.fill();
      g.fillStyle = '#fff'; g.font = '600 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(r.name, 256, 66);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
      sp.scale.set(2.2, 0.55, 1); sp.position.set(r.x + r.w / 2, H + 0.4, r.y + r.d / 2); sp.renderOrder = 10; scene.add(sp); labels.push(sp);
    }

    // Muri: lati unici delle stanze, spezzati dove ci sono porte e finestre
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.95 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9fc9e8, transparent: true, opacity: 0.35, roughness: 0.1 });
    const solids: Seg[] = [];
    const box = (x: number, z: number, len: number, horizontal: boolean, y0: number, y1: number, mat = wallMat, blocks = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(horizontal ? len : T, y1 - y0, horizontal ? T : len), mat);
      m.position.set(horizontal ? x + len / 2 : x, (y0 + y1) / 2, horizontal ? z : z + len / 2);
      m.castShadow = m.receiveShadow = true; scene.add(m);
      if (blocks) solids.push(horizontal ? { x1: x, z1: z, x2: x + len, z2: z } : { x1: x, z1: z, x2: x, z2: z + len });
    };
    const edges = new Map<string, { x: number; z: number; len: number; horizontal: boolean }>();
    for (const r of plan.rooms) {
      const add = (x: number, z: number, len: number, horizontal: boolean) => edges.set(`${horizontal ? 'h' : 'v'}:${x.toFixed(2)}:${z.toFixed(2)}:${len.toFixed(2)}`, { x, z, len, horizontal });
      add(r.x, r.y, r.w, true); add(r.x, r.y + r.d, r.w, true); add(r.x, r.y, r.d, false); add(r.x + r.w, r.y, r.d, false);
    }
    for (const e of edges.values()) {
      const along = (o: { x: number; y: number; w: number; horizontal: boolean }) => o.horizontal === e.horizontal && (e.horizontal ? Math.abs(o.y - e.z) < 0.01 && o.x >= e.x - 0.01 && o.x + o.w <= e.x + e.len + 0.01 : Math.abs(o.x - e.x) < 0.01 && o.y >= e.z - 0.01 && o.y + o.w <= e.z + e.len + 0.01);
      const ops = [
        ...plan.doors.filter(along).map(o => ({ from: e.horizontal ? o.x : o.y, to: (e.horizontal ? o.x : o.y) + o.w, kind: 'door' as const })),
        ...plan.windows.filter(along).map(o => ({ from: e.horizontal ? o.x : o.y, to: (e.horizontal ? o.x : o.y) + o.w, kind: 'window' as const })),
      ].sort((a, b) => a.from - b.from);
      const start = e.horizontal ? e.x : e.z;
      let cur = start;
      const piece = (from: number, to: number) => e.horizontal ? box(from, e.z, to - from, true, 0, H) : box(e.x, from, to - from, false, 0, H);
      for (const o of ops) {
        if (o.from > cur) piece(cur, o.from);
        const at = (y0: number, y1: number, mat = wallMat, blocks = true) => e.horizontal ? box(o.from, e.z, o.to - o.from, true, y0, y1, mat, blocks) : box(e.x, o.from, o.to - o.from, false, y0, y1, mat, blocks);
        if (o.kind === 'door') at(DOOR_H, H, wallMat, false);
        else { at(0, SILL); at(DOOR_H, H, wallMat, false); at(SILL, DOOR_H, glassMat); }
        cur = o.to;
      }
      if (cur < start + e.len) piece(cur, start + e.len);
    }

    // Foto sulle pareti: sul muro esterno della stanza (in alto per la fila giorno, in basso per la notte)
    const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    for (const r of plan.rooms) {
      if (!r.photo) continue;
      const top = r.y < 0.01;
      const bottom = Math.abs(r.y + r.d - plan.depth) < 0.01;
      if (!top && !bottom) continue;
      // tramite il proxy, cosi' la texture ha i permessi CORS
      const src = `/api/site/img?u=${encodeURIComponent(r.photo)}`;
      loader.load(src, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const ar = tex.image.width / tex.image.height;
        const h = 1.5, w = Math.min(r.w - 0.5, h * ar);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
        m.position.set(r.x + r.w / 2, 1.45, top ? r.y + T / 2 + 0.01 : r.y + r.d - T / 2 - 0.01);
        if (bottom) m.rotation.y = Math.PI;
        scene.add(m);
      }, undefined, () => {});
    }

    // Comandi: orbita per la dollhouse, tastiera + trascinamento per la passeggiata
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(cx, 0, cz); orbit.maxPolarAngle = Math.PI / 2.05; orbit.minDistance = 4; orbit.maxDistance = 40; orbit.enableDamping = true;
    const walk = { yaw: 0, pitch: 0, keys: new Set<string>(), drag: null as null | { x: number; y: number } };
    let current: Mode = 'dollhouse';
    const applyMode = (m: Mode) => {
      current = m;
      orbit.enabled = m === 'dollhouse';
      labels.forEach(l => { l.visible = m === 'dollhouse'; });
      ground.visible = m === 'dollhouse'; ceiling.visible = m === 'walk';
      if (m === 'dollhouse') { camera.position.set(cx + plan.width * 0.9, Math.max(plan.width, plan.depth) * 1.1, cz + plan.depth * 1.2); orbit.update(); }
      else { const hall = plan.rooms.find(r => r.type === 'corridoio') ?? plan.rooms[0]; camera.position.set(hall.x + 0.8, EYE, hall.y + hall.d / 2); walk.yaw = Math.PI / 2; walk.pitch = 0; }
    };
    const goto = (r: Room) => { setMode('walk'); applyMode('walk'); camera.position.set(r.x + r.w / 2, EYE, r.y + r.d / 2); walk.yaw = r.y < 0.01 ? Math.PI : 0; };
    api.current = { setMode: applyMode, goto };
    applyMode('dollhouse');

    const onKey = (e: KeyboardEvent, down: boolean) => { if (current !== 'walk') return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { e.preventDefault(); down ? walk.keys.add(k) : walk.keys.delete(k); } };
    const kd = (e: KeyboardEvent) => onKey(e, true), ku = (e: KeyboardEvent) => onKey(e, false);
    const pd = (e: PointerEvent) => { if (current === 'walk') { walk.drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); } };
    const pm = (e: PointerEvent) => { if (walk.drag) { walk.yaw -= (e.clientX - walk.drag.x) * 0.005; walk.pitch = Math.max(-1, Math.min(1, walk.pitch - (e.clientY - walk.drag.y) * 0.004)); walk.drag = { x: e.clientX, y: e.clientY }; } };
    const pu = () => { walk.drag = null; };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
    el.tabIndex = 0;

    // Movimento con muri: un passo e' valido se resta a piu' di 25 cm dai pezzi pieni
    const clear = (x: number, z: number) => solids.every(s => {
      const dx = s.x2 - s.x1, dz = s.z2 - s.z1, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (z - s.z1) * dz) / l2));
      const px = s.x1 + t * dx, pz = s.z1 + t * dz;
      return Math.hypot(x - px, z - pz) > 0.25;
    }) && x > 0.2 && z > 0.2 && x < plan.width - 0.2 && z < plan.depth - 0.2;

    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (current === 'walk') {
        const k = walk.keys, sp = 1.8 * dt;
        const f = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
        const r = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
        const dirX = Math.sin(walk.yaw), dirZ = Math.cos(walk.yaw);
        const nx = camera.position.x + (dirX * f + dirZ * r) * sp, nz = camera.position.z + (dirZ * f - dirX * r) * sp;
        if (clear(nx, camera.position.z)) camera.position.x = nx;
        if (clear(camera.position.x, nz)) camera.position.z = nz;
        camera.rotation.set(0, 0, 0); camera.rotation.order = 'YXZ'; camera.rotation.y = walk.yaw + Math.PI; camera.rotation.x = walk.pitch;
      } else orbit.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu);
      orbit.dispose(); renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [plan]);

  const pick = (m: Mode) => { setMode(m); api.current?.setMode(m); host.current?.focus(); };
  const btn = (on: boolean) => `flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${on ? 'bg-neutral-900 text-white' : 'bg-white/90 text-neutral-800 hover:bg-white'}`;
  return (
    <div className={`${full ? 'fixed inset-0 z-[100] bg-[#efece5]' : `relative overflow-hidden rounded-[inherit] bg-[#efece5] ${className}`}`}>
      <div ref={host} className="h-full w-full cursor-grab outline-none active:cursor-grabbing [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex gap-1.5 rounded-full bg-black/10 p-1 backdrop-blur">
          <button onClick={() => pick('dollhouse')} className={btn(mode === 'dollhouse')}><House size={14} /> Dall’alto</button>
          <button onClick={() => pick('walk')} className={btn(mode === 'walk')}><Footprints size={14} /> Cammina</button>
        </div>
        <button onClick={() => setFull(v => !v)} aria-label={full ? 'Riduci' : 'Schermo intero'} className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-800 hover:bg-white">{full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
        <div className="pointer-events-auto flex flex-wrap gap-1.5">
          {plan.rooms.filter(r => r.type !== 'corridoio').map(r => <button key={r.id} onClick={() => { setMode('walk'); api.current?.goto(r); host.current?.focus(); }} className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-white">{r.name}</button>)}
        </div>
        <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">{mode === 'walk' ? 'Frecce o WASD per muoverti, trascina per guardare' : 'Trascina per ruotare, rotella per avvicinare'}</span>
      </div>
      {mode === 'walk' && <WalkPad onKey={(k, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { key: k }))} />}
    </div>
  );
}

// Frecce a schermo per chi non ha la tastiera (telefono)
function WalkPad({ onKey }: { onKey: (k: string, down: boolean) => void }) {
  const b = (k: string, label: string, cls: string) => (
    <button key={k} aria-label={label} className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-neutral-800 shadow ${cls}`}
      onPointerDown={e => { e.preventDefault(); onKey(k, true); }} onPointerUp={() => onKey(k, false)} onPointerLeave={() => onKey(k, false)}>{label}</button>
  );
  return (
    <div className="pointer-events-auto absolute bottom-14 right-3 grid grid-cols-3 gap-1 md:hidden">
      <span />{b('w', '↑', '')}<span />
      {b('a', '←', '')}{b('s', '↓', '')}{b('d', '→', '')}
    </div>
  );
}
