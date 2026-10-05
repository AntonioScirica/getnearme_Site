// Camminata in prima persona: occhi a 1,60 m, WASD/frecce + trascinamento per guardare, doppio clic per andare
// in un punto; su telefono joystick a sinistra e trascinamento per guardare. Collisioni con muri e mobili (griglia).
import * as THREE from 'three'

export class WalkControls {
  constructor(camera, dom, grid, { eye = 1.6, radius = 0.2, lowEnd = false } = {}) {
    Object.assign(this, { camera, dom, grid, eye, radius, enabled: false })
    this.yaw = 0; this.pitch = 0; this.pos = new THREE.Vector2(); this.keys = new Set(); this.joy = null; this.goal = null
    this.vel = new THREE.Vector2(); this.bob = 0
    const look = { id: null, x: 0, y: 0 }
    this._down = e => {
      if (!this.enabled) return
      if (this.joyEl && e.pointerType === 'touch' && e.clientX < dom.clientWidth * 0.4 && e.clientY > dom.clientHeight * 0.45) return this._joyStart(e)
      look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; this.goal = null
      dom.setPointerCapture(e.pointerId)
    }
    this._move = e => {
      if (!this.enabled) return
      if (this.joy && e.pointerId === this.joy.id) return this._joyMove(e)
      if (look.id !== e.pointerId) return
      const k = e.pointerType === 'touch' ? 0.006 : 0.0042
      this.yaw -= (e.clientX - look.x) * k; this.pitch = THREE.MathUtils.clamp(this.pitch + (e.clientY - look.y) * k, -1.1, 1.1)
      look.x = e.clientX; look.y = e.clientY
    }
    this._up = e => { if (this.joy && e.pointerId === this.joy.id) return this._joyEnd(); if (look.id === e.pointerId) look.id = null }
    this._key = e => { if (!this.enabled) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { e.type === 'keydown' ? this.keys.add(k) : this.keys.delete(k); e.preventDefault() } }
    this._dbl = e => { // doppio clic sul pavimento: ci si va
      if (!this.enabled) return
      const r = dom.getBoundingClientRect(), ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera)
      const t = -ray.ray.origin.y / ray.ray.direction.y
      if (t > 0 && t < 15) { const p = ray.ray.origin.clone().addScaledVector(ray.ray.direction, t); this.goal = new THREE.Vector2(p.x, p.z) }
    }
    this._wheel = e => { if (!this.enabled) return; e.preventDefault(); this._try(-Math.sin(this.yaw) * -e.deltaY * 0.004, -Math.cos(this.yaw) * -e.deltaY * 0.004) }
    dom.addEventListener('pointerdown', this._down); addEventListener('pointermove', this._move); addEventListener('pointerup', this._up); addEventListener('pointercancel', this._up)
    addEventListener('keydown', this._key); addEventListener('keyup', this._key); dom.addEventListener('dblclick', this._dbl); dom.addEventListener('wheel', this._wheel, { passive: false })
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) this._makeJoystick()
  }
  _makeJoystick() {
    const el = document.createElement('div'), knob = document.createElement('div')
    el.className = 'v3d-joy'; knob.className = 'v3d-joy-knob'; el.appendChild(knob)
    el.style.display = 'none'
    this.dom.parentElement.appendChild(el); this.joyEl = el; this.knob = knob
  }
  _joyStart(e) { this.joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; this.dom.setPointerCapture(e.pointerId) }
  _joyMove(e) {
    const dx = e.clientX - this.joy.x, dy = e.clientY - this.joy.y, L = Math.hypot(dx, dy), m = Math.min(L, 50) / (L || 1)
    this.joy.dx = dx * m / 50; this.joy.dy = dy * m / 50
    this.knob.style.transform = `translate(${dx * m}px, ${dy * m}px)`
  }
  _joyEnd() { this.joy = null; this.knob.style.transform = '' }
  set showJoystick(v) { if (this.joyEl) this.joyEl.style.display = v ? 'block' : 'none' }
  clearAround(x, z, r = this.radius) {
    for (let a = 0; a < 6.283; a += 0.785) if (!this.grid.free(x + Math.cos(a) * r, z + Math.sin(a) * r)) return false
    return this.grid.free(x, z)
  }
  _try(dx, dz) { // scivola lungo i muri
    const { x, y } = this.pos
    if (this.clearAround(x + dx, y + dz)) this.pos.set(x + dx, y + dz)
    else if (this.clearAround(x + dx, y)) this.pos.set(x + dx, y)
    else if (this.clearAround(x, y + dz)) this.pos.set(x, y + dz)
    else return false
    return true
  }
  poseFor(x, z, yaw, pitch) {
    const pos = new THREE.Vector3(x, this.eye, z)
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, -yaw, 0, 'YXZ'))
    return { pos, quat }
  }
  setPose(x, z, yaw, pitch = 0) { this.pos.set(x, z); this.yaw = yaw; this.pitch = pitch; this.showJoystick = true }
  set enabledFlag(v) { this.enabled = v }
  update(dt) {
    if (!this.enabled) { this.showJoystick = false; return }
    this.showJoystick = true
    const k = this.keys, run = k.has('shift') ? 2.2 : 1.3
    let f = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0)
    let s = (k.has('d') ? 1 : 0) - (k.has('a') ? 1 : 0)
    if (k.has('arrowleft')) this.yaw -= dt * 1.6
    if (k.has('arrowright')) this.yaw += dt * 1.6
    if (this.joy) { f = -this.joy.dy; s = this.joy.dx }
    let mx = 0, mz = 0
    const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw)
    if (f || s) { mx = (fx * f + -fz * s); mz = (fz * f + fx * s); this.goal = null }
    else if (this.goal) {
      const dx = this.goal.x - this.pos.x, dz = this.goal.y - this.pos.y, L = Math.hypot(dx, dz)
      if (L < 0.08) this.goal = null; else { mx = dx / L; mz = dz / L }
    }
    const L = Math.hypot(mx, mz)
    const target = new THREE.Vector2(L ? mx / Math.max(1, L) * run : 0, L ? mz / Math.max(1, L) * run : 0)
    this.vel.lerp(target, Math.min(1, dt * 8))
    if (this.vel.lengthSq() > 1e-5 && !this._try(this.vel.x * dt, this.vel.y * dt)) this.goal = null
    const p = this.poseFor(this.pos.x, this.pos.y, this.yaw, this.pitch)
    this.camera.position.copy(p.pos); this.camera.quaternion.copy(p.quat)
  }
  dispose() {
    this.dom.removeEventListener('pointerdown', this._down); removeEventListener('pointermove', this._move); removeEventListener('pointerup', this._up)
    removeEventListener('keydown', this._key); removeEventListener('keyup', this._key); this.joyEl?.remove()
  }
}
