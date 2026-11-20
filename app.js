// Dog Planet · Planet ID site (@followerverse). Built by build_site.py: head.js + ../video/builders.js + shared.js + main.js -> app.js
import * as THREE from 'three';
const QS = new URLSearchParams(location.search);
const LOOK = 'C', STYLE = 'B';
const L = {
  planet: { ocean: '#4a3aa8', shallow: '#7d6ee6', sand: '#ffd1e8', land1: '#5fc4a8', land2: '#2f8f86', mount: '#8a5fc4', snow: '#f4ecff', cloud: '#fff0ff', atmos: '#e0a8ff', rings: true },
  grass: ['#5fb9a0', '#3d9484'], grassBlade: '#6dcbb0', dirt: '#8f6fa8',
  sky: { top: '#8f74f0', mid: '#c9a8ff', hor: '#ffd1e8' }, sun: '#fff0f8', fogDay: '#f1d8ff',
  trees: 'pine', leaves: ['#e2475a', '#9b5de5', '#f15bb5', '#2f8f86'], trunk: '#6b4630',
  mountains: '#8a6fd0', rock: '#9d8fb5', water: '#7ad7ff',
  night: { top: '#07020f', mid: '#1a0a2e', hor: '#3a1458', fog: '#1a0a2c', moon: '#ffd8f4' },
  monster: { skin: '#2a1d33', vein: '#7a1430', eyes: '#ff2a1a', mouth: '#ff5a2a' },
};
let NIGHT = false;
let scene;
const lerp = (a, b, k) => a + (b - a) * k, clamp01 = (v) => Math.min(1, Math.max(0, v));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- utils
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let R = rng(42);
const C = (c) => new THREE.Color(c);
const mix = (a, b, t) => C(a).lerp(C(b), t);
const css = (c) => '#' + c.getHexString();
const shade = (hex, k) => css(C(hex).multiplyScalar(k));
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function h2(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function h3(x, y, z) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vn(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function vn3(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  const c00 = l(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), c10 = l(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u);
  const c01 = l(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u), c11 = l(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u);
  return l(l(c00, c10, v), l(c01, c11, v), w); }
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f); n += a; f *= 2.03; a *= 0.5; } return s / n; }
function fbm3(x, y, z, o = 5) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * vn3(x * f, y * f, z * f); n += a; f *= 2.03; a *= 0.5; } return s / n; }

function tex(w, h, draw, repeat = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); return t;
}
function speckle(g, w, h, n, cols, size = [1, 3], alpha = 0.35, r = R) {
  for (let i = 0; i < n; i++) { g.globalAlpha = alpha * (0.4 + r() * 0.6); g.fillStyle = cols[i % cols.length];
    const s = size[0] + r() * (size[1] - size[0]); g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1;
}
// textures -------------------------------------------------------------
const TX = {};
function grassTex() {
  return TX.grass ||= tex(512, 512, (g, w, h) => {
    g.fillStyle = '#d8d8d0'; g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 9000; i++) { const x = r() * w, y = r() * h, len = 5 + r() * 12, a = -Math.PI / 2 + (r() - 0.5) * 0.8;
      g.strokeStyle = r() < 0.5 ? '#a8aa98' : '#f4f6ea'; g.globalAlpha = 0.45; g.lineWidth = 1 + r() * 1.5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); }
    g.globalAlpha = 1; speckle(g, w, h, 1500, ['#9a8f78', '#8e9480'], [1, 2.5], 0.3, r);
  }, 70);
}
function furTex(base, alt, spots = null) {
  const key = 'fur' + base + alt + spots; return TX[key] ||= tex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); const r = rng(base.length * 7 + 11);
    if (spots) { g.fillStyle = spots; for (let i = 0; i < 16; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 12, 5 + r() * 9, r() * 3, 0, 7); g.fill(); } }
    for (let i = 0; i < 4200; i++) { const x = r() * w, y = r() * h, len = 3 + r() * 7, a = Math.PI * 0.5 + (r() - 0.5) * 0.9;
      g.strokeStyle = r() < 0.5 ? shade(base, 0.78) : css(mix(base, '#ffffff', 0.35)); g.globalAlpha = 0.28; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); }
    g.globalAlpha = 1;
  });
}
function barkTex(col) { return TX['bark' + col] ||= tex(128, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rng(9);
  for (let i = 0; i < 70; i++) { g.strokeStyle = r() < 0.6 ? shade(col, 0.6) : shade(col, 1.25); g.lineWidth = 1 + r() * 3; g.globalAlpha = 0.6;
    const x = r() * w; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y < h; y += 16) g.lineTo(x + (r() - 0.5) * 6, y); g.stroke(); } g.globalAlpha = 1; }); }
function leafTex(col) { return TX['leaf' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rng(col.length + 5);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? shade(col, 0.72) : css(mix(col, '#ffffff', 0.3)); g.globalAlpha = 0.5;
    g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; }); }
function stoneTex(col) { return TX['stone' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rng(77);
  speckle(g, w, h, 5000, [shade(col, 0.7), shade(col, 1.2), shade(col, 0.85)], [1, 4], 0.45, r);
  for (let i = 0; i < 14; i++) { g.strokeStyle = shade(col, 0.55); g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; }); }
function monsterTex() { const M = L.monster; return TX.mon ||= tex(512, 512, (g, w, h) => { g.fillStyle = M.skin; g.fillRect(0, 0, w, h); const r = rng(666);
  for (let i = 0; i < 900; i++) { g.strokeStyle = r() < 0.5 ? shade(M.skin, 0.55) : shade(M.skin, 1.6); g.globalAlpha = 0.6; g.lineWidth = 1.5;
    const x = r() * w, y = r() * h, s = 5 + r() * 9; g.beginPath(); g.arc(x, y, s, 0.2, Math.PI - 0.2); g.stroke(); }
  for (let i = 0; i < 26; i++) { g.strokeStyle = M.vein; g.globalAlpha = 0.75; g.lineWidth = 1 + r() * 2.5; let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (r() - 0.5) * 34; y += (r() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); }
  g.globalAlpha = 1; speckle(g, w, h, 3000, ['#000000', shade(M.skin, 1.8)], [1, 3], 0.35, r); }); }
function capTex(col) { return TX['cap' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rng(5);
  speckle(g, w, h, 1500, [shade(col, 0.8), shade(col, 1.15)], [1, 4], 0.4, r);
  g.fillStyle = '#fff8f0'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(r() * w, r() * h, 6 + r() * 12, 0, 7); g.fill(); } }); }
function bladeTex() { return TX.blade ||= tex(128, 128, (g, w, h) => { const r = rng(12);
  for (let i = 0; i < 14; i++) { const x = 10 + r() * (w - 20), top = 10 + r() * 50, bend = (r() - 0.5) * 30;
    const gr = g.createLinearGradient(0, h, 0, top); gr.addColorStop(0, shade(L.grassBlade, 0.82)); gr.addColorStop(1, css(mix(L.grassBlade, '#ffffff', 0.3)));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 4, h); g.quadraticCurveTo(x + bend * 0.5, (h + top) / 2, x + bend, top); g.quadraticCurveTo(x + bend * 0.5 + 2, (h + top) / 2, x + 4, h); g.fill(); } }); }
function glowTex() { return TX.glow ||= tex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); }
function moonTex(col) { return TX.moon ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill(); const r = rng(4);
  for (let i = 0; i < 26; i++) { g.fillStyle = shade(col, 0.82); g.globalAlpha = 0.6; const x = 128 + (r() - 0.5) * 180, y = 128 + (r() - 0.5) * 180;
    if (Math.hypot(x - 128, y - 128) < 105) { g.beginPath(); g.arc(x, y, 4 + r() * 16, 0, 7); g.fill(); } } g.globalAlpha = 1; }); }

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...o });
function mesh(geo, mat, parent, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; if (parent) parent.add(m); return m; }
const SPH = (r, s = 24) => new THREE.SphereGeometry(r, s, Math.max(8, Math.round(s * 0.7)));

// ---------------------------------------------------------------- sky
function skyDome(top, mid, hor, bottom = hor) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: C(top) }, mid: { value: C(mid) }, hor: { value: C(hor) }, bot: { value: C(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, hor, bot; varying vec3 vP;
      void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(mix(hor, mid, smoothstep(0.0, 0.18, y)), top, smoothstep(0.18, 0.75, y)) : bot;
      gl_FragColor = vec4(c, 1.0); }` });
  const s = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), m); s.renderOrder = -10; scene.add(s); return s;
}
function sprite(color, size, pos, opacity = 1, additive = true, map = glowTex()) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, fog: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  s.scale.set(size, size, 1); s.position.copy(pos); scene.add(s); return s;
}
function stars(n, radius, minY = -1) {
  const pos = [], col = [], r = rng(8);
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, y = minY + r() * (1 - minY), q = Math.sqrt(1 - y * y);
    pos.push(Math.cos(a) * q * radius, y * radius, Math.sin(a) * q * radius); const c = mix('#ffffff', r() < 0.5 ? '#ffd9a8' : '#a8c8ff', r() * 0.6); col.push(c.r, c.g, c.b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false, transparent: true, opacity: 0.95 }));
  scene.add(p); return p;
}

// ================================================================= SPACE
function buildPlanet(radius) {
  const P = L.planet, w = 1024, h = 512;
  const surf = tex(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data;
    const cols = { ocean: C(P.ocean), shallow: C(P.shallow), sand: C(P.sand), l1: C(P.land1), l2: C(P.land2), mount: C(P.mount), snow: C(P.snow) };
    for (let y = 0; y < h; y++) { const lat = (0.5 - y / h) * Math.PI;
      for (let x = 0; x < w; x++) { const lon = x / w * Math.PI * 2, X = Math.cos(lat) * Math.cos(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.sin(lon);
        const e = fbm3(X * 1.6 + 5, Y * 1.6 + 2, Z * 1.6 + 9, 6), dd = fbm3(X * 6, Y * 6, Z * 6, 3);
        let c; const sea = 0.5;
        if (e < sea - 0.06) c = cols.ocean.clone().lerp(cols.shallow, smooth(sea - 0.2, sea - 0.06, e) * 0.6);
        else if (e < sea) c = cols.shallow.clone().lerp(cols.sand, smooth(sea - 0.03, sea, e));
        else if (e < sea + 0.02) c = cols.sand.clone();
        else if (e < sea + 0.17) c = cols.l1.clone().lerp(cols.l2, dd);
        else if (e < sea + 0.22) c = cols.l2.clone().lerp(cols.mount, smooth(sea + 0.17, sea + 0.22, e));
        else c = cols.mount.clone().lerp(cols.snow, smooth(sea + 0.22, sea + 0.27, e));
        if (Math.abs(Y) > 0.88) c.lerp(cols.snow, smooth(0.88, 0.95, Math.abs(Y)));
        c.multiplyScalar(0.9 + dd * 0.2);
        const i = (y * w + x) * 4; d[i] = c.r * 255; d[i + 1] = c.g * 255; d[i + 2] = c.b * 255; d[i + 3] = 255; } }
    g.putImageData(img, 0, 0);
  });
  surf.wrapT = THREE.ClampToEdgeWrapping; surf.repeat.set(1, 1);
  const cloud = tex(w, h, (g) => {
    const img = g.createImageData(w, h), d = img.data, cc = C(P.cloud);
    for (let y = 0; y < h; y++) { const lat = (0.5 - y / h) * Math.PI;
      for (let x = 0; x < w; x++) { const lon = x / w * Math.PI * 2, X = Math.cos(lat) * Math.cos(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.sin(lon);
        const n = fbm3(X * 2.4 + 20, Y * 7 + 1, Z * 2.4 + 4, 6); const a = smooth(0.56, 0.74, n) * 0.85;
        const i = (y * w + x) * 4; d[i] = cc.r * 255; d[i + 1] = cc.g * 255; d[i + 2] = cc.b * 255; d[i + 3] = a * 235; } }
    g.putImageData(img, 0, 0);
  });
  cloud.wrapT = THREE.ClampToEdgeWrapping; cloud.repeat.set(1, 1);
  const grp = new THREE.Group(); scene.add(grp);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 96), std({ map: surf, roughness: 0.85, bumpMap: surf, bumpScale: 2 })); grp.add(planet);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.012, 128, 96), std({ map: cloud, transparent: true, depthWrite: false, roughness: 1 })); grp.add(clouds);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.06, 96, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { c: { value: C(P.atmos) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(clamp(1.0 + dot(vN, vV) * 1.05, 0.0, 1.0), 2.2); gl_FragColor = vec4(c * f * 1.6, f); }' }));
  // soft glow behind the planet instead of a hard halo ring
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: P.atmos, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(radius * 2.9); halo.position.set(0, 0, -radius * 1.2); grp.add(halo); halo.renderOrder = -1;
  const rim = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.003, 96, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: C(P.atmos) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.0); gl_FragColor = vec4(c, f * 0.9); }' }));
  grp.add(rim);
  if (P.rings) {
    const rt = tex(1024, 8, (g, w) => { for (let x = 0; x < w; x++) { const n = fbm(x * 0.03, 0.5, 4); const a = smooth(0.35, 0.6, n) * (x > 60 && x < 980 ? 1 : 0);
      g.fillStyle = `rgba(255,${200 + n * 55 | 0},${230 + n * 25 | 0},${a * 0.8})`; g.fillRect(x, 0, 1, 8); } });
    rt.repeat.set(1, 1);
    const rg = new THREE.RingGeometry(radius * 1.35, radius * 2.2, 160, 1);
    const p = rg.attributes.position, uv = rg.attributes.uv; for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (r - radius * 1.35) / (radius * 0.85), 0.5); }
    const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2 + 0.32; ring.rotation.y = 0.2; grp.add(ring);
  }
  return { grp, planet, clouds };
}

function shotSpace() {
  scene.background = C('#02030a'); stars(5000, 1200);
  const { grp } = buildPlanet(10);
  grp.position.set(0, -3.5, 0); grp.rotation.set(0.35, LOOK === 'B' ? 2.2 : LOOK === 'C' ? 4.1 : 0.9, 0.12);
  const sun = new THREE.DirectionalLight('#fff4e0', 3.2); sun.position.set(-30, 26, 18); scene.add(sun);
  scene.add(new THREE.AmbientLight('#4a5a8a', 0.18));
  sprite('#fff1d6', 26, new THREE.Vector3(-17, 21, -30), 0.9); sprite('#ffd9a0', 70, new THREE.Vector3(-17, 21, -32), 0.25);
  const moon = new THREE.Mesh(SPH(1.3, 48), std({ map: moonTex('#d9d4cc'), roughness: 1 })); moon.position.set(7.5, 13, -8); scene.add(moon);
  // a tiny pod streaking toward the planet (story hint)
  
  cam.fov = 38; cam.position.set(0, 2.5, 50); cam.lookAt(0, 0.5, 0); cam.updateProjectionMatrix();
}

// ================================================================= GROUND WORLD
const PX = -15, PZ = -9, PR = 7.5;
function GH(x, z) {
  const r = Math.hypot(x, z);
  let h = (fbm(x * 0.011 + 7, z * 0.011 + 3, 5) - 0.42) * 30 * smooth(26, 120, r);
  h += (fbm(x * 0.07, z * 0.07, 3) - 0.5) * 1.1 * smooth(5, 18, r);
  const far = smooth(170, 330, r); if (far > 0) { const rid = 1 - Math.abs(2 * fbm(x * 0.012 + 3, z * 0.012 + 8, 5) - 1);
    h += far * (rid * rid * 95 + fbm(x * 0.04, z * 0.04, 4) * 30) + Math.max(0, r - 260) * 0.25; }
  if (z < -24 && Math.abs(x) < 70) h += smooth(-24, -40, z) * 6 * (0.6 + fbm(x * 0.05, 3, 3));   // the ridge the monsters come over
  const pd = Math.hypot(x - PX, z - PZ); if (pd < PR + 3) h -= (1 - smooth(PR - 2, PR + 3, pd)) * 1.4;
  return h;
}
function buildGround() {
  const size = 900, seg = 300, g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = [];
  const c1 = C(L.grass[0]), c2 = C(L.grass[1]), dirt = C(L.dirt), mtn = C(L.mountains);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = GH(x, z); p.setY(i, y);
    const n = fbm(x * 0.03 + 9, z * 0.03, 4); const c = c1.clone().lerp(c2, smooth(0.35, 0.7, n));
    c.lerp(dirt, smooth(0.62, 0.8, fbm(x * 0.05, z * 0.05 + 4, 3)) * 0.35);
    c.lerp(mtn, smooth(12, 40, y)); c.lerp(C('#ffffff'), smooth(80, 105, y)); const pd = Math.hypot(x - PX, z - PZ); if (pd < PR + 1.2) c.lerp(C(L.dirt), 0.6);
    cols.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, std({ map: grassTex(), vertexColors: true, bumpMap: grassTex(), bumpScale: 1.2, roughness: 1, color: '#ffffff' }));
  m.receiveShadow = true; scene.add(m);
  // tint: vertexColors multiply the texture, so lighten the texture influence by keeping it near white
  const water = new THREE.Mesh(new THREE.CircleGeometry(PR + 0.6, 64), new THREE.MeshStandardMaterial({ color: L.water, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.88 }));
  water.rotation.x = -Math.PI / 2; water.position.set(PX, GH(PX, PZ) + 0.95, PZ); scene.add(water);
  // lily pads / shore stones
  for (let i = 0; i < 18; i++) { const a = R() * 6.28, rr = PR + 0.4 + R() * 0.8; rock(PX + Math.cos(a) * rr, PZ + Math.sin(a) * rr, 0.25 + R() * 0.3); }
}
function rock(x, z, s) {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const k = 0.8 + fbm(v.x * 2 + x, v.y * 2 + z, 3) * 0.45; p.setXYZ(i, v.x * k, v.y * k * 0.75, v.z * k); }
  g.computeVertexNormals();
  return mesh(g, std({ map: stoneTex(L.rock), bumpMap: stoneTex(L.rock), bumpScale: 3, flatShading: true }), scene, x, GH(x, z) + s * 0.35, z).scale.setScalar(s);
}
let CAMXZ = [999, 999];
const nearCam = (x, z, d) => Math.hypot(x - CAMXZ[0], z - CAMXZ[1]) < d;
function grassTufts(n, radius, avoid = () => false) {
  const geo = new THREE.PlaneGeometry(0.5, 0.36); geo.translate(0, 0.17, 0);
  const mat = new THREE.MeshStandardMaterial({ map: bladeTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1 });
  const im = new THREE.InstancedMesh(geo, mat, n); const o = new THREE.Object3D(); let k = 0; const r = rng(21);
  for (let i = 0; i < n * 3 && k < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * radius, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (avoid(x, z) || Math.hypot(x - PX, z - PZ) < PR + 0.5 || nearCam(x, z, 1.6)) continue;
    o.position.set(x, GH(x, z) - 0.02, z); o.rotation.set(0, r() * 6.28, 0); const s = 0.7 + r() * 0.9; o.scale.set(s, s * (0.8 + r() * 0.6), s); o.updateMatrix();
    im.setMatrixAt(k, o.matrix); im.setColorAt(k, mix('#ffffff', r() < 0.5 ? L.grass[1] : '#ffffff', r() * 0.5)); k++; }
  im.count = k; im.castShadow = false; im.receiveShadow = true; scene.add(im);
}
function flowers(n, radius, avoid = () => false) {
  const hg = new THREE.CylinderGeometry(0.05, 0.02, 0.025, 6); const head = new THREE.InstancedMesh(hg, std({ roughness: 0.6 }), n);
  const stem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.008, 0.22, 4), std({ color: shade(L.grassBlade, 0.8) }), n);
  const o = new THREE.Object3D(); const pal = ['#ff6b8b', '#ffd23f', '#ffffff', '#b388ff', '#ff9f43', '#7fd1ff']; let k = 0; const r = rng(31);
  for (let i = 0; i < n * 3 && k < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * radius, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (avoid(x, z) || Math.hypot(x - PX, z - PZ) < PR + 0.5 || nearCam(x, z, 2.2)) continue; const y = GH(x, z), s = 0.7 + r() * 0.6;
    o.position.set(x, y + 0.11 * s, z); o.rotation.set((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4); o.scale.set(s, s, s); o.updateMatrix(); stem.setMatrixAt(k, o.matrix);
    o.position.set(x, y + 0.22 * s, z); o.updateMatrix(); head.setMatrixAt(k, o.matrix); head.setColorAt(k, C(pal[(r() * pal.length) | 0])); k++; }
  head.count = stem.count = k; scene.add(head, stem);
}
// trees ------------------------------------------------------------------
function puffyTree(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, GH(x, z), z); g.scale.setScalar(s); scene.add(g);
  mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.4, 10), std({ map: barkTex(L.trunk), bumpMap: barkTex(L.trunk), bumpScale: 2 }), g, 0, 1.2, 0);
  const col = L.leaves[(R() * 3) | 0];
  const lm = std({ map: leafTex(col), bumpMap: leafTex(col), bumpScale: 4, roughness: 0.85 });
  for (let i = 0; i < 6; i++) mesh(new THREE.IcosahedronGeometry(0.9 + R() * 0.5, 3), lm, g, (R() - 0.5) * 1.4, 2.6 + R() * 1.4, (R() - 0.5) * 1.4);
}
function pineTree(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, GH(x, z), z); g.scale.setScalar(s); scene.add(g);
  mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.6, 8), std({ map: barkTex(L.trunk) }), g, 0, 0.8, 0);
  const col = L.leaves[3]; const lm = std({ map: leafTex(col), bumpMap: leafTex(col), bumpScale: 3 });
  for (let i = 0; i < 4; i++) mesh(new THREE.ConeGeometry(1.5 - i * 0.3, 1.6, 12), lm, g, 0, 1.6 + i * 0.85, 0);
}
function autumnTree(x, z, s) { puffyTree(x, z, s); }
function mushroom(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, GH(x, z), z); g.scale.setScalar(s); scene.add(g);
  const st = mesh(new THREE.CylinderGeometry(0.35, 0.55, 3, 16), std({ map: barkTex(L.trunk), color: '#ffffff' }), g, 0, 1.5, 0); st.rotation.z = (R() - 0.5) * 0.15;
  const col = L.leaves[(R() * 4) | 0];
  const cap = mesh(new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std({ map: capTex(col), roughness: 0.55, emissive: NIGHT ? C(col).multiplyScalar(0.35) : C('#000') }), g, 0, 2.9, 0);
  cap.scale.set(1, 0.65, 1);
  mesh(new THREE.CircleGeometry(1.58, 32), std({ color: shade(col, 1.25), side: THREE.DoubleSide, emissive: NIGHT ? C(col).multiplyScalar(0.5) : C('#000') }), g, 0, 2.9, 0).rotation.x = Math.PI / 2;
}
function crystal(x, z, s) {
  const g = new THREE.Group(); g.position.set(x, GH(x, z), z); g.scale.setScalar(s); scene.add(g);
  for (let i = 0; i < 4; i++) { const c = mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: '#8ff3ff', roughness: 0.1, metalness: 0.1, emissive: '#3fd8ff', emissiveIntensity: NIGHT ? 1.4 : 0.35, transparent: true, opacity: 0.9 }), g, (R() - 0.5) * 0.6, 0.6, (R() - 0.5) * 0.6);
    c.scale.set(0.6, 1.8 + R() * 1.5, 0.6); c.rotation.set((R() - 0.5) * 0.6, R() * 3, (R() - 0.5) * 0.6); }
}
function forest(n, rMin, rMax, avoid) {
  const r = rng(55); let k = 0;
  for (let i = 0; i < n * 4 && k < n; i++) { const a = r() * 6.28, d = rMin + Math.sqrt(r()) * (rMax - rMin), x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (avoid(x, z) || Math.hypot(x - PX, z - PZ) < PR + 2.5) continue; const s = 0.9 + r() * 1.1;
    if (L.trees === 'puffy') puffyTree(x, z, s);
    else if (L.trees === 'pine') (r() < 0.55 ? pineTree : autumnTree)(x, z, s);
    else (r() < 0.7 ? mushroom : crystal)(x, z, s);
    k++; }
}
function mountainsFar() { return;
  const r = rng(91);
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = 330 + r() * 120, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 60 + r() * 90;
    const g = new THREE.ConeGeometry(50 + r() * 50, h, 9, 4); const p = g.attributes.position;
    for (let j = 0; j < p.count; j++) p.setXYZ(j, p.getX(j) * (0.85 + r() * 0.3), p.getY(j), p.getZ(j) * (0.85 + r() * 0.3));
    g.computeVertexNormals(); const m = mesh(g, std({ color: L.mountains, flatShading: true, map: stoneTex(L.mountains) }), scene, x, GH(x, z) + h / 2 - 8, z); m.castShadow = false; }
}
function cloudPuff(x, y, z, s, col = '#ffffff', op = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const m = new THREE.MeshStandardMaterial({ color: col, roughness: 1, emissive: C(col).multiplyScalar(0.25), transparent: op < 1, opacity: op });
  for (let i = 0; i < 7; i++) { const c = mesh(new THREE.IcosahedronGeometry(1, 3), m, g, (R() - 0.5) * 3.2 * s, (R() - 0.3) * 0.9 * s, (R() - 0.5) * 1.6 * s); c.scale.setScalar(s * (0.8 + R() * 0.8)); c.castShadow = false; }
  return g;
}

function lights() {
  if (!NIGHT) {
    skyDome(L.sky.top, L.sky.mid, L.sky.hor);
    scene.fog = new THREE.Fog(L.fogDay, 90, 760);
    scene.add(new THREE.HemisphereLight(L.sky.mid, L.grass[1], 1.0));
    const sun = new THREE.DirectionalLight(L.sun, 3.0); sun.position.set(-40, 60, 35); sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
    scene.add(sun);
    sprite(L.sun, 70, new THREE.Vector3(-480, 420, -900), 0.9); sprite(L.sky.hor, 300, new THREE.Vector3(-480, 420, -900), 0.25);
    if (LOOK === 'C') { const pl = new THREE.Mesh(SPH(60, 48), std({ color: '#ffb3d9', emissive: '#a05080', emissiveIntensity: 0.25, fog: false })); pl.position.set(420, 380, -1100); scene.add(pl); }
    const r = rng(17); for (let i = 0; i < 22; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.6, d = 250 + r() * 300; cloudPuff(Math.cos(a) * d, 70 + r() * 70, Math.sin(a) * d, 7 + r() * 8, '#ffffff'); }
  } else {
    const N = L.night; skyDome(N.top, N.mid, N.hor); stars(4000, 1400, 0.02);
    scene.fog = new THREE.FogExp2(css(mix(N.fog, N.hor, 0.55)), 0.016);
    scene.add(new THREE.HemisphereLight(N.mid, '#05060a', 0.55));
    const moonL = new THREE.DirectionalLight(N.moon, 3.2); moonL.position.set(25, 50, -70); moonL.castShadow = true;   // from behind: rim-lights the monsters
    moonL.shadow.mapSize.set(4096, 4096); Object.assign(moonL.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: 1, far: 250 }); scene.add(moonL);
    const fill = new THREE.DirectionalLight('#7f96e8', 0.8); fill.position.set(-20, 15, 40); scene.add(fill);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(N.moon), fog: false, transparent: true })); moon.scale.set(110, 110, 1); moon.position.set(260, 330, -900); scene.add(moon);
    sprite(N.moon, 420, new THREE.Vector3(260, 330, -905), 0.28);
  }
}

// ================================================================= DOG (cute puppy proportions: big head, short legs)
const BREEDS = [
  { coat: '#e2a85a', coat2: '#f7deaf', ears: 'flop' }, { coat: '#f4efe6', coat2: '#ffffff', ears: 'flop', spots: '#2b2b2e' },
  { coat: '#e08a3c', coat2: '#fff3e2', ears: 'point' }, { coat: '#7d8794', coat2: '#f4f4f2', ears: 'point' },
  { coat: '#6b4430', coat2: '#d9a066', ears: 'flop' }, { coat: '#2e2a2c', coat2: '#c8874a', ears: 'point' },
  { coat: '#f2e6d8', coat2: '#ffffff', ears: 'flop' }, { coat: '#c9a27a', coat2: '#4a3a30', ears: 'flop' },
];
// faces local +x. ry = -PI/2 faces the +z (toward a camera at +z)
function dog({ breed = 0, mood = 'happy', pose = 'stand', size = 1, x = 0, z = 0, ry = 0, y = null, headTurn = 0, headUp = 0 } = {}) {
  const B = BREEDS[breed % BREEDS.length];
  const fur = std({ map: furTex(B.coat, B.coat2, B.spots), bumpMap: furTex(B.coat, B.coat2, B.spots), bumpScale: 1.5, roughness: 0.95 });
  const fur2 = std({ map: furTex(B.coat2, B.coat), roughness: 0.95 });
  const dark = std({ color: '#140f0e', roughness: 0.12 }), white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const root = new THREE.Group(); root.position.set(x, y ?? GH(x, z), z); root.rotation.y = ry; root.scale.setScalar(size); scene.add(root);
  const scared = mood === 'scared';
  const body = new THREE.Group(); root.add(body);
  const legs = [];
  for (const [lx, lz] of [[0.17, 0.11], [0.17, -0.11], [-0.17, 0.11], [-0.17, -0.11]]) {
    const hip = new THREE.Group(); hip.position.set(lx, 0.3, lz); body.add(hip);
    mesh(new THREE.CapsuleGeometry(0.072, 0.12, 6, 12), fur, hip, 0, -0.13, 0);
    const paw = mesh(SPH(0.085, 16), fur2, hip, 0.025, -0.25, 0); paw.scale.set(1.3, 0.72, 1.1);
    legs.push(hip);
  }
  const tg0 = new THREE.CapsuleGeometry(0.235, 0.26, 10, 24); tg0.rotateZ(Math.PI / 2);
  mesh(tg0, fur, body, 0, 0.4, 0).scale.set(1, 1, 0.92);
  mesh(SPH(0.19, 24), fur2, body, 0.22, 0.37, 0).scale.set(0.75, 1.0, 1.05);   // chest fluff
  const tail = new THREE.Group(); tail.position.set(-0.36, 0.5, 0); body.add(tail);
  const tg = new THREE.CapsuleGeometry(0.048, 0.18, 6, 10); tg.translate(0, 0.13, 0); mesh(tg, fur, tail);
  const head = new THREE.Group(); head.position.set(0.36, 0.72, 0); head.rotation.y = headTurn; head.rotation.z = headUp; body.add(head);
  mesh(SPH(0.3, 36), fur, head).scale.set(0.95, 0.95, 1.02);
  for (const s of [-1, 1]) mesh(SPH(0.15, 24), fur2, head, 0.09, -0.12, s * 0.16).scale.set(0.85, 0.75, 0.6);   // cheeks
  const muzzle = mesh(SPH(0.14, 28), fur2, head, 0.22, -0.09, 0); muzzle.scale.set(1.05, 0.78, 1.1);
  mesh(SPH(0.05, 18), dark, head, 0.355, -0.04, 0).scale.set(0.9, 0.78, 1.25);
  mesh(SPH(0.014, 8), white, head, 0.375, -0.02, 0.018);
  const eyeS = scared ? 1.22 : 1.05;
  for (const s of [-1, 1]) {
    mesh(SPH(0.075 * eyeS, 24), dark, head, 0.215, 0.06, s * 0.125);
    mesh(SPH(0.028 * eyeS, 12), white, head, 0.272, 0.092, s * 0.125 + 0.024);
    mesh(SPH(0.012 * eyeS, 8), white, head, 0.282, 0.04, s * 0.125 - 0.022);
    if (scared) {
      const br = mesh(new THREE.CapsuleGeometry(0.014, 0.075, 4, 8), std({ color: shade(B.coat, 0.4) }), head, 0.24, 0.175, s * 0.115);
      br.rotation.order = 'YXZ'; br.rotation.set(s * 0.55, 0, Math.PI / 2);
      const tear = mesh(SPH(0.024, 12), new THREE.MeshStandardMaterial({ color: '#cfeeff', roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.9 }), head, 0.255, -0.04, s * 0.16); tear.scale.set(0.8, 1.3, 0.8);
    }
  }
  if (!scared) {
    mesh(SPH(0.062, 16), std({ color: '#3a1414', roughness: 0.5 }), head, 0.285, -0.165, 0).scale.set(0.9, 0.65, 1.3);
    mesh(SPH(0.054, 16), std({ color: '#f07a8e', roughness: 0.35 }), head, 0.305, -0.215, 0).scale.set(1.1, 0.45, 0.9);
  } else {
    const m = mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12, Math.PI), dark, head, 0.32, -0.155, 0); m.rotation.set(0, Math.PI / 2, 0);
  }
  for (const s of [-1, 1]) {
    if (B.ears === 'flop') {
      const eg = SPH(0.13, 20); eg.translate(0, -0.11, 0); const ear = mesh(eg, std({ map: furTex(shade(B.coat, 0.8), B.coat) }), head, -0.03, 0.16, s * 0.25);
      ear.scale.set(0.62, 1.25, 0.32); ear.rotation.order = 'YXZ'; ear.rotation.set(s * (scared ? 0.05 : 0.35), 0, scared ? 0.85 : 0.08);
    } else {
      const eg = new THREE.ConeGeometry(0.095, 0.24, 14); eg.translate(0, 0.12, 0); const ear = mesh(eg, fur, head, -0.03, 0.21, s * 0.14);
      ear.scale.z = 0.55; ear.rotation.order = 'YXZ'; ear.rotation.set(s * -0.28, 0, scared ? 1.35 : 0.0);
    }
  }
  if (pose === 'sit') { body.rotation.z = 0.5; body.position.set(0.02, 0.0, 0); legs[2].rotation.z = -1.35; legs[3].rotation.z = -1.35; legs[2].position.y = 0.36; legs[3].position.y = 0.36;
    legs[0].rotation.z = -0.5; legs[1].rotation.z = -0.5; legs[0].scale.y = 1.25; legs[1].scale.y = 1.25; head.rotation.z = -0.5 + headUp; tail.rotation.z = 2.2; }
  if (pose === 'run') { legs[0].rotation.z = 0.75; legs[1].rotation.z = 0.45; legs[2].rotation.z = -0.75; legs[3].rotation.z = -0.45; body.position.y = 0.07; }
  if (pose === 'play') { body.rotation.z = -0.28; body.position.y = -0.03; legs[0].rotation.z = 1.0; legs[1].rotation.z = 1.0; legs[2].rotation.z = 0.28; legs[3].rotation.z = 0.28; head.rotation.z = 0.3 + headUp; }
  if (pose === 'lie') { body.position.y = -0.2; legs[0].rotation.z = 1.4; legs[1].rotation.z = 1.4; legs[2].rotation.z = -1.4; legs[3].rotation.z = -1.4; }
  if (scared) { body.position.y -= 0.09; body.rotation.z = -0.12; legs.forEach(l => { l.scale.y = 0.6; }); head.position.y -= 0.05; head.rotation.z = 0.18 + headUp; tail.rotation.z = 2.75; }
  else if (pose !== 'sit') tail.rotation.z = 0.5;
  root.userData = { body, legs, tail, head, base: { tz: tail.rotation.z, hz: head.rotation.z, by: body.position.y } };
  return root;
}

// ================================================================= PERSON (real proportions, ~1.75 m)
function person({ skin = '#d9a67c', hair = '#2a1c14', hairStyle = 'short', shirt = '#3f7cc4', pants = '#3b4a6b', shoes = '#f2f2ee', x = 0, z = 0, ry = 0, pose = 'stand' } = {}) {
  const root = new THREE.Group(); root.position.set(x, GH(x, z), z); root.rotation.y = ry; scene.add(root);
  const S = std({ color: skin, roughness: 0.55 });
  const SH = std({ map: furTex(shirt, shade(shirt, 0.88)), roughness: 0.85 }), P = std({ map: furTex(pants, shade(pants, 0.8)), roughness: 0.9 });
  const HR = std({ map: furTex(hair, shade(hair, 1.5)), roughness: 0.5 }), SO = std({ color: shoes, roughness: 0.6 }), SOLE = std({ color: '#3a3a3a' });
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * 0.095, 0.9, 0); root.add(hip); legs.push(hip);
    mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.44, 18), P, hip, 0, -0.22, 0);
    const knee = new THREE.Group(); knee.position.set(0, -0.44, 0); hip.add(knee); hip.userData.knee = knee;
    mesh(SPH(0.068, 16), P, knee);
    mesh(new THREE.CylinderGeometry(0.066, 0.052, 0.4, 18), P, knee, 0, -0.2, 0);
    const shoe = mesh(new THREE.CapsuleGeometry(0.055, 0.15, 6, 14), SO, knee, 0, -0.42, 0.05); shoe.rotation.x = Math.PI / 2; shoe.scale.set(1.2, 1, 0.8);
    const sole = mesh(new THREE.BoxGeometry(0.11, 0.02, 0.26), SOLE, knee, 0, -0.455, 0.05);
  }
  // torso: a lathe with hips, waist, chest, shoulders
  const prof = [[0.0, 0], [0.155, 0.0], [0.165, 0.06], [0.148, 0.2], [0.162, 0.32], [0.185, 0.44], [0.19, 0.5], [0.15, 0.56], [0.07, 0.6], [0.0, 0.6]].map(([r, y]) => new THREE.Vector2(r, y));
  const tg = new THREE.LatheGeometry(prof, 32); tg.scale(1, 1, 0.66);
  const torso = new THREE.Group(); torso.position.set(0, 0.88, 0); root.add(torso);
  mesh(tg, SH, torso, 0, 0, 0);
  mesh(new THREE.CylinderGeometry(0.162, 0.16, 0.08, 24), P, torso, 0, 0.03, 0).scale.z = 0.68;   // waistband
  mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.11, 14), S, torso, 0, 0.64, 0);
  const head = new THREE.Group(); head.position.set(0, 0.82, 0.01); torso.add(head);
  mesh(SPH(0.112, 36), S, head).scale.set(0.88, 1.08, 0.98);
  mesh(SPH(0.085, 24), S, head, 0, -0.06, 0.03).scale.set(0.95, 0.8, 0.95);   // jaw/chin
  const nose = mesh(SPH(0.022, 14), S, head, 0, -0.005, 0.106); nose.scale.set(0.85, 1.2, 1);
  for (const s of [-1, 1]) {
    mesh(SPH(0.026, 12), S, head, s * 0.098, 0.0, -0.005).scale.set(0.45, 1, 0.8);
    mesh(SPH(0.02, 16), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }), head, s * 0.038, 0.025, 0.09).scale.set(1.15, 0.85, 0.55);
    mesh(SPH(0.0125, 14), std({ color: '#3a2416', roughness: 0.1 }), head, s * 0.038, 0.024, 0.099);
    mesh(SPH(0.004, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), head, s * 0.038 + 0.004, 0.029, 0.11);
    const br = mesh(new THREE.CapsuleGeometry(0.0055, 0.03, 4, 6), HR, head, s * 0.04, 0.056, 0.098); br.rotation.z = Math.PI / 2 + s * 0.12;
    mesh(SPH(0.014, 10), std({ color: shade(skin, 0.95) }), head, s * 0.06, -0.035, 0.085).scale.set(1, 0.6, 0.4);
  }
  const smile = mesh(new THREE.TorusGeometry(0.024, 0.0055, 6, 16, Math.PI), std({ color: '#8a3a32' }), head, 0, -0.05, 0.098); smile.rotation.z = Math.PI;
  const cap = new THREE.SphereGeometry(0.121, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.56); const hc = mesh(cap, HR, head, 0, 0.012, -0.014); hc.rotation.x = -0.28; hc.scale.set(0.93, 1.1, 1.04);
  if (hairStyle === 'long') { const b = mesh(SPH(0.12, 24), HR, head, 0, -0.1, -0.055); b.scale.set(0.98, 1.9, 0.55); }
  if (hairStyle === 'bun') mesh(SPH(0.055, 16), HR, head, 0, 0.1, -0.08);
  if (hairStyle === 'curly') for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, rr = 0.09 + (i % 2) * 0.015; mesh(SPH(0.04, 12), HR, head, Math.cos(a) * rr, 0.075 + Math.sin(i * 2.7) * 0.025, Math.sin(a) * rr * 0.95 - 0.02); }
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.195, 0.5, 0); torso.add(sh); arms.push(sh);
    mesh(SPH(0.062, 16), SH, sh);
    mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.28, 16), SH, sh, 0, -0.14, 0);
    const el = new THREE.Group(); el.position.set(0, -0.29, 0); sh.add(el); sh.userData.el = el;
    mesh(new THREE.CylinderGeometry(0.045, 0.037, 0.25, 14), S, el, 0, -0.125, 0);
    const hand = new THREE.Group(); hand.position.set(0, -0.27, 0); el.add(hand);
    mesh(SPH(0.045, 14), S, hand, 0, -0.03, 0).scale.set(0.6, 1.15, 0.95);
    const th = mesh(new THREE.CapsuleGeometry(0.013, 0.035, 4, 6), S, hand, 0, -0.02, s * -0.0 + 0.035); th.rotation.x = 0.6;
  }
  arms[0].rotation.z = -0.1; arms[1].rotation.z = 0.1; arms[0].userData.el.rotation.x = -0.15; arms[1].userData.el.rotation.x = -0.15;
  if (pose === 'wave') { arms[0].rotation.z = -2.4; arms[0].userData.el.rotation.z = -0.55; }
  if (pose === 'pet') {   // leans a little, right hand on the dog's head
    torso.rotation.x = 0.18; head.rotation.x = 0.28; head.rotation.y = 0.25;
    arms[1].rotation.set(-0.55, 0, 0.35); arms[1].userData.el.rotation.x = -0.35;
  }
  return root;
}

// ================================================================= MONSTER (tall, gaunt, clawed, glowing veins)
function veinTex() { const M = L.monster; return TX.vein ||= tex(512, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); const r = rng(666);
  for (let i = 0; i < 900; i++) { r(); r(); r(); r(); }
  for (let i = 0; i < 26; i++) { g.strokeStyle = M.eyes; g.globalAlpha = 0.9; g.lineWidth = 1 + r() * 2.5; let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (r() - 0.5) * 34; y += (r() - 0.3) * 30; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; }); }
function monster({ x = 0, z = 0, ry = 0, s = 1, pose = 'loom' } = {}) {
  const M = L.monster;
  const root = new THREE.Group(); root.position.set(x, GH(x, z), z); root.rotation.y = ry; root.scale.setScalar(s); scene.add(root);
  const skin = std({ map: monsterTex(), bumpMap: monsterTex(), bumpScale: 6, roughness: 0.45, metalness: 0.2, color: '#ffffff',
    emissiveMap: veinTex(), emissive: '#ffffff', emissiveIntensity: NIGHT ? 0.55 : 0.1 });
  const bone = std({ color: '#cfc2a4', roughness: 0.35 }), claw = std({ color: '#1e1a18', roughness: 0.2, metalness: 0.3 });
  const glow = new THREE.MeshBasicMaterial({ color: M.eyes });
  // legs (digitigrade)
  const LEGS = [];
  for (const sgn of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(sgn * 0.75, 3.9, -0.5); root.add(hip); hip.rotation.set(-0.55, 0, sgn * 0.08);
    mesh(new THREE.CapsuleGeometry(0.42, 1.6, 8, 16), skin, hip, 0, -1.0, 0);
    const knee = new THREE.Group(); knee.position.set(0, -2.0, 0); hip.add(knee); knee.rotation.x = 1.25;
    mesh(new THREE.CapsuleGeometry(0.26, 1.6, 8, 14), skin, knee, 0, -0.95, 0);
    const ankle = new THREE.Group(); ankle.position.set(0, -1.9, 0); knee.add(ankle); ankle.rotation.x = -0.75;
    LEGS.push({ hip, knee, ankle });
    mesh(new THREE.CapsuleGeometry(0.2, 0.7, 6, 12), skin, ankle, 0, -0.45, 0);
    for (let c = -1; c <= 1; c++) { const cg = new THREE.ConeGeometry(0.09, 0.8, 8); cg.translate(0, 0.4, 0); const cl = mesh(cg, claw, ankle, c * 0.17, -0.85, 0.05); cl.rotation.x = 1.75; cl.rotation.z = c * 0.25; }
  }
  mesh(SPH(0.75, 28), skin, root, 0, 4.0, -0.4).scale.set(1.25, 0.8, 0.9);   // pelvis
  // gaunt hunched torso: narrow waist, big rib cage, curved spine
  const torso = new THREE.Group(); torso.position.set(0, 4.3, -0.3); torso.rotation.x = 0.8; root.add(torso);
  mesh(new THREE.CapsuleGeometry(0.45, 0.9, 8, 18), skin, torso, 0, 0.6, 0);   // waist
  mesh(SPH(1.0, 40), skin, torso, 0, 1.9, 0.05).scale.set(1.35, 1.25, 0.95);   // rib cage
  for (let i = 0; i < 5; i++) { const rb = mesh(new THREE.TorusGeometry(1.0 - Math.abs(i - 2) * 0.08, 0.055, 6, 24, Math.PI * 1.1), bone, torso, 0, 1.35 + i * 0.27, 0.15);
    rb.rotation.set(Math.PI / 2 + 0.15, 0, -0.05 * Math.PI); rb.scale.set(1.3, 0.9, 1); }
  for (let i = 0; i < 11; i++) { const sp = mesh(new THREE.ConeGeometry(0.12 + (i % 3 === 0 ? 0.07 : 0), 0.7 + Math.sin(i * 1.3) * 0.3 + (i % 3 === 0 ? 0.4 : 0), 8), bone, torso,
    0, 0.3 + i * 0.27, -0.9 - Math.sin(i / 10 * Math.PI) * 0.35); sp.rotation.x = -1.1; }
  // shoulders + neck + head jutting forward
  for (const sgn of [-1, 1]) { mesh(SPH(0.6, 24), skin, torso, sgn * 1.25, 2.6, 0).scale.set(1, 0.85, 0.9);
    for (let k = 0; k < 3; k++) { const sp = mesh(new THREE.ConeGeometry(0.1, 0.6 + k * 0.2, 8), bone, torso, sgn * (1.3 + k * 0.12), 2.95, -0.2 + k * 0.15); sp.rotation.set(-0.4, 0, sgn * -0.7); } }
  const neck = mesh(new THREE.CapsuleGeometry(0.42, 0.7, 8, 16), skin, torso, 0, 3.05, 0.45); neck.rotation.x = 0.7;
  const head = new THREE.Group(); head.position.set(0, 3.45, 1.15); torso.add(head); head.rotation.x = -0.95;
  mesh(SPH(0.72, 40), skin, head, 0, 0.12, -0.15).scale.set(1.0, 0.8, 1.25);
  const brow = mesh(SPH(0.55, 28), skin, head, 0, 0.36, 0.38); brow.scale.set(1.45, 0.38, 0.75);
  mesh(SPH(0.58, 32), skin, head, 0, -0.06, 0.72).scale.set(0.9, 0.38, 1.1);   // snout / upper jaw
  const jaw = new THREE.Group(); jaw.position.set(0, -0.22, 0.05); head.add(jaw); jaw.rotation.x = 0.95;
  mesh(SPH(0.55, 32), skin, jaw, 0, -0.12, 0.62).scale.set(0.85, 0.3, 1.15);
  const inner = mesh(SPH(0.42, 24), new THREE.MeshBasicMaterial({ color: '#1c0404' }), head, 0, -0.42, 0.42); inner.scale.set(0.7, 0.55, 0.75);
  for (let i = 0; i < 15; i++) { const a = (i / 14 - 0.5) * 2.4, big = i % 4 === 1 ? 0.22 : 0;
    const t1 = mesh(new THREE.ConeGeometry(0.05, 0.34 + big, 6), bone, head, Math.sin(a) * 0.48, -0.3, 0.72 + Math.cos(a) * 0.5); t1.rotation.x = Math.PI + 0.15;
    mesh(new THREE.ConeGeometry(0.046, 0.3 + big * 0.8, 6), bone, jaw, Math.sin(a) * 0.43, 0.04, 0.62 + Math.cos(a) * 0.48); }
  for (let i = 0; i < 5; i++) { const dr = mesh(new THREE.CylinderGeometry(0.012, 0.004, 0.5 + i * 0.08, 5), new THREE.MeshStandardMaterial({ color: '#d8e8c8', roughness: 0, transparent: true, opacity: 0.7 }), head, (i - 2) * 0.16, -0.75, 0.7 + Math.abs(i - 2) * -0.05); }
  for (const [ex, ey, er] of [[-0.3, 0.3, 0.11], [0.3, 0.3, 0.11], [-0.5, 0.2, 0.08], [0.5, 0.2, 0.08], [-0.17, 0.44, 0.06], [0.17, 0.44, 0.06]]) {
    mesh(SPH(er, 16), glow, head, ex, ey, 0.82 - Math.abs(ex) * 0.42);
    const gsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: M.eyes, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    gsp.scale.setScalar(er * 8); gsp.position.set(ex, ey, 0.88 - Math.abs(ex) * 0.42); head.add(gsp);
  }
  for (const sgn of [-1, 1]) { const hg = new THREE.ConeGeometry(0.15, 1.6, 10); hg.translate(0, 0.8, 0); const hn = mesh(hg, bone, head, sgn * 0.5, 0.4, -0.3); hn.rotation.set(-1.1, 0, sgn * -0.5); }
  const pl = new THREE.PointLight(M.eyes, 10, 12, 1.4); pl.position.set(0, -0.2, 1.8); head.add(pl);
  // very long arms, reaching forward and down, huge claws
  const SHS = [];
  for (const sgn of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(sgn * 1.35, 2.5, 0.2); torso.add(sh); SHS.push(sh); sh.userData.base = null;
    if (pose === 'loom') sh.rotation.set(-1.25 - (sgn > 0 ? 0.25 : 0), 0, sgn * 0.45); else sh.rotation.set(-0.75, 0, sgn * 0.3);
    mesh(new THREE.CapsuleGeometry(0.3, 1.85, 8, 14), skin, sh, 0, -1.15, 0);
    const el = new THREE.Group(); el.position.set(0, -2.28, 0); sh.add(el); el.rotation.x = pose === 'loom' ? -0.85 : -0.4; sh.userData.el = el;
    mesh(SPH(0.32, 16), skin, el);
    mesh(new THREE.CapsuleGeometry(0.22, 2.0, 8, 14), skin, el, 0, -1.2, 0);
    const hand = new THREE.Group(); hand.position.set(0, -2.4, 0); el.add(hand); hand.rotation.x = -0.3;
    mesh(SPH(0.32, 20), skin, hand).scale.set(1.1, 0.7, 0.8);
    for (let c = 0; c < 4; c++) { const fg = new THREE.CapsuleGeometry(0.06, 0.5, 4, 8); fg.translate(0, -0.3, 0); const f = mesh(fg, skin, hand, (c - 1.5) * 0.17, -0.15, 0.05); f.rotation.set(0.3, 0, (c - 1.5) * 0.15);
      const cg = new THREE.ConeGeometry(0.065, 1.0, 8); cg.translate(0, -0.5, 0); const cl = mesh(cg, claw, f, 0, -0.6, 0); cl.rotation.x = 0.45; }
  }
  root.userData = { torso, head, jaw, shs: SHS, pl, skin, legs: LEGS, torsoX: torso.rotation.x };
  return root;
}


function nameTex(text, { w = 512, h = 128, bg = '#fff7e6', fg = '#3A2412', border = '#3A2412', glow = null } = {}) {
  return tex(w, h, (g) => {
    if (glow) { g.shadowColor = glow; g.shadowBlur = 24; }
    g.fillStyle = bg; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, h * 0.4); g.fill();
    g.shadowBlur = 0; if (border) { g.lineWidth = 8; g.strokeStyle = border; g.stroke(); }
    let fs = h * 0.5; g.font = `${fs}px "Arial Rounded MT Bold"`; while (g.measureText(text).width > w - 60 && fs > 16) { fs -= 2; g.font = `${fs}px "Arial Rounded MT Bold"`; }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2);
  });
}

// ---------------------------------------------------------------- toy-brick minifigure people (generic toy style, no logos)
const PLASTIC = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2 });
function faceTex(skin) { return TX['face' + skin] ||= tex(512, 256, (g, w, h) => { g.fillStyle = skin; g.fillRect(0, 0, w, h);
  const cx = w / 2; g.fillStyle = '#1b1310';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 34, 108, 11, 15, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(cx + s * 34 + 4, 102, 4, 0, 7); g.fill(); g.fillStyle = '#1b1310';
    g.lineWidth = 6; g.strokeStyle = '#1b1310'; g.beginPath(); g.moveTo(cx + s * 22, 78); g.lineTo(cx + s * 46, 74); g.stroke(); }
  g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(cx, 140, 34, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  g.fillStyle = 'rgba(230,120,120,0.35)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 58, 150, 14, 8, 0, 0, 7); g.fill(); } }); }
function shirtTex(col) { return TX['shirt' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.strokeStyle = shade(col, 0.6); g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.36, 0); g.lineTo(w / 2, h * 0.2); g.lineTo(w * 0.64, 0); g.stroke();
  g.fillStyle = css(mix(col, '#ffffff', 0.75)); const px = w / 2, py = h * 0.55;   // paw print
  g.beginPath(); g.ellipse(px, py + 14, 26, 22, 0, 0, 7); g.fill(); for (const [dx, dy] of [[-30, -16], [-11, -32], [11, -32], [30, -16]]) { g.beginPath(); g.ellipse(px + dx, py + dy, 10, 13, 0, 0, 7); g.fill(); } }); }
function minifig({ skin = '#f2c79a', hair = '#3a2416', hairStyle = 'short', shirt = '#3f7cc4', pants = '#2f3b5a', x = 0, z = 0, ry = 0, s = 1.45, wave = false } = {}) {
  const root = new THREE.Group(); root.position.set(x, GH(x, z), z); root.rotation.y = ry; scene.add(root);
  const fig = new THREE.Group(); fig.scale.setScalar(s); root.add(fig);
  const SK = PLASTIC(skin), SH = PLASTIC(shirt), PA = PLASTIC(pants), HA = PLASTIC(hair);
  const legs = [];
  for (const sd of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(sd * 0.095, 0.4, 0); fig.add(hip); legs.push(hip);
    mesh(new THREE.BoxGeometry(0.18, 0.34, 0.17), PA, hip, 0, -0.17, 0); mesh(new THREE.BoxGeometry(0.18, 0.06, 0.21), PA, hip, 0, -0.37, 0.02); }
  mesh(new THREE.BoxGeometry(0.38, 0.08, 0.17), PA, fig, 0, 0.44, 0);
  const tg = new THREE.BoxGeometry(0.38, 0.38, 0.17); const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) if (tp.getY(i) > 0) tp.setX(i, tp.getX(i) * 0.78);
  tg.computeVertexNormals();
  mesh(tg, [SH, SH, SH, SH, new THREE.MeshPhysicalMaterial({ map: shirtTex(shirt), roughness: 0.3, clearcoat: 0.7 }), SH], fig, 0, 0.67, 0);
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), SK, fig, 0, 0.875, 0);
  const head = new THREE.Group(); head.position.set(0, 0.97, 0); fig.add(head);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.17, 32, 1, false, -Math.PI, Math.PI * 2), [new THREE.MeshPhysicalMaterial({ map: faceTex(skin), roughness: 0.3, clearcoat: 0.7 }), SK, SK], head);
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.045, 20), SK, head, 0, 0.105, 0);
  if (hairStyle !== 'bald') { const cap = mesh(new THREE.SphereGeometry(0.118, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), HA, head, 0, 0.03, -0.008); cap.scale.set(1, 1.05, 1.03);
    mesh(new THREE.CylinderGeometry(0.118, 0.118, 0.07, 28, 1, true, Math.PI * 0.6, Math.PI * 0.8), HA, head, 0, 0.0, -0.006);
    if (hairStyle === 'long') mesh(new THREE.BoxGeometry(0.22, 0.2, 0.06), HA, head, 0, -0.07, -0.09);
    if (hairStyle === 'bun') mesh(SPH(0.055, 16), HA, head, 0, 0.13, -0.06);
    if (hairStyle === 'cap') { mesh(new THREE.BoxGeometry(0.16, 0.015, 0.1), HA, head, 0, 0.07, 0.13); }
    if (hairStyle === 'curly') for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; mesh(SPH(0.04, 10), HA, head, Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.09 - 0.01); } }
  const arms = [];
  for (const sd of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(sd * 0.18, 0.8, 0); fig.add(sh); arms.push(sh);
    mesh(SPH(0.055, 14), SH, sh); const a = mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.3, 14), SH, sh, sd * 0.03, -0.15, 0.02); a.rotation.z = sd * 0.18; a.rotation.x = -0.15;
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), SK, sh, sd * 0.055, -0.31, 0.05);
    const hand = mesh(new THREE.TorusGeometry(0.04, 0.019, 8, 14, Math.PI * 1.55), SK, sh, sd * 0.06, -0.36, 0.07); hand.rotation.set(Math.PI / 2, 0, Math.PI * 0.72);
    sh.rotation.z = sd * 0.05; }
  if (wave) { arms[0].rotation.z = -2.3; }
  root.userData = { legs, arms, head, fig };
  return root;
}
function walkFig(f, t, amt, ph = 0) { const U = f.userData; const a = Math.sin(t * 9 + ph) * 0.55 * amt;
  U.legs[0].rotation.x = a; U.legs[1].rotation.x = -a; U.arms[0].rotation.x = -a * 0.8; U.arms[1].rotation.x = a * 0.8 + (U.holding ? -0.35 : 0); U.fig.position.y = Math.abs(Math.sin(t * 9 + ph)) * 0.03 * amt; }


const FACE = -Math.PI / 2;
function animDog(d, t, mode, ph = 0) {
  const U = d.userData; if (!U || !U.legs) return;
  if (mode === 'run') { const f = 12, A = 0.85;
    U.legs[0].rotation.z = Math.sin(t * f + ph) * A; U.legs[1].rotation.z = Math.sin(t * f + ph + 0.7) * A;
    U.legs[2].rotation.z = Math.sin(t * f + ph + Math.PI) * A; U.legs[3].rotation.z = Math.sin(t * f + ph + Math.PI + 0.7) * A;
    U.body.position.y = U.base.by + Math.abs(Math.sin(t * f + ph)) * 0.08; U.body.rotation.z = Math.sin(t * f + ph) * 0.1;
    U.tail.rotation.x = Math.sin(t * f * 1.2 + ph) * 0.5; U.head.rotation.z = U.base.hz + Math.sin(t * f + ph) * 0.08;
  } else if (mode === 'wag') { U.tail.rotation.x = Math.sin(t * 17 + ph) * 0.7; U.head.rotation.x = Math.sin(t * 2.2 + ph) * 0.18; U.head.rotation.z = U.base.hz + Math.sin(t * 1.7 + ph) * 0.08;
  } else if (mode === 'hop') { const k = Math.max(0, Math.sin(t * 6 + ph)); U.body.position.y = U.base.by + k * 0.32; U.legs.forEach((l, i) => l.rotation.z = (i < 2 ? 0.6 : -0.6) * k); U.tail.rotation.x = Math.sin(t * 18 + ph) * 0.6; U.head.rotation.z = U.base.hz + 0.25 * k;
  } else if (mode === 'tremble') { U.body.position.x = Math.sin(t * 42 + ph) * 0.012; U.head.rotation.x = Math.sin(t * 31 + ph) * 0.04; }
}

function roofTex(col) { return TX['roof' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rng(3);
  for (let y = 0; y < h; y += 18) for (let x = (y / 18 % 2) * 12; x < w; x += 24) { g.fillStyle = css(mix(col, r() < 0.5 ? '#000000' : '#ffffff', r() * 0.18)); g.beginPath(); g.roundRect(x + 1, y + 1, 22, 20, [0, 0, 10, 10]); g.fill();
    g.strokeStyle = shade(col, 0.6); g.lineWidth = 2; g.stroke(); } }); }
function plankTex(col) { return TX['plank' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const r = rng(8);
  for (let x = 0; x < w; x += 21) { g.fillStyle = css(mix(col, r() < 0.5 ? '#000000' : '#ffffff', r() * 0.15)); g.fillRect(x, 0, 20, h); g.fillStyle = shade(col, 0.55); g.fillRect(x + 20, 0, 2, h); }
  speckle(g, w, h, 1200, [shade(col, 0.7), shade(col, 1.2)], [1, 3], 0.35, r); }); }
function brickTex(col) { return TX['brick' + col] ||= tex(128, 128, (g, w, h) => { g.fillStyle = shade(col, 0.6); g.fillRect(0, 0, w, h); const r = rng(6);
  for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 14 - 14; x < w; x += 28) { g.fillStyle = css(mix(col, r() < 0.5 ? '#000000' : '#ffffff', r() * 0.2)); g.fillRect(x + 1, y + 1, 26, 14); } }); }
function plasterTex(col) { return TX['plaster' + col] ||= tex(256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); speckle(g, w, h, 3000, [shade(col, 0.9), shade(col, 1.06)], [1, 4], 0.35, rng(9)); }); }
const WALLS = ['#fff1dc', '#ffe0e6', '#e3f6e8', '#ece2ff', '#fff6c8', '#dff1ff'];
// a detailed storybook cottage (style B). Front faces +z.
function cottage(parent, roofCol, name, { scale = 1, wall = WALLS[0], seed = 1 } = {}) {
  const h = new THREE.Group(); h.scale.setScalar(scale); parent.add(h); const r = rng(seed * 97 + 3);
  const wood = std({ map: plankTex('#6b4630'), color: '#ffffff', roughness: 0.8 }), dark = std({ color: '#4a3020', roughness: 0.7 });
  const white = std({ color: '#fbf7ee', roughness: 0.5 }), glass = new THREE.MeshStandardMaterial({ color: '#ffe6a8', emissive: '#ffb84a', emissiveIntensity: 0.8, roughness: 0.15 });
  const shutterM = std({ color: shade(roofCol, 0.85), roughness: 0.6 });
  mesh(new THREE.CylinderGeometry(1.32, 1.4, 0.45, 20), std({ map: stoneTex('#b9b0a8'), bumpMap: stoneTex('#b9b0a8'), bumpScale: 3 }), h, 0, 0.22, 0);          // stone base
  mesh(new THREE.CylinderGeometry(1.2, 1.24, 1.9, 24), std({ map: plasterTex(wall), roughness: 0.9 }), h, 0, 1.4, 0);                                            // plaster walls
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.31; if (Math.abs(Math.sin(a / 2)) < 0.2) continue; const b = mesh(new THREE.BoxGeometry(0.08, 1.9, 0.06), dark, h, Math.sin(a) * 1.22, 1.4, Math.cos(a) * 1.22); b.rotation.y = a; }   // timber beams
  mesh(new THREE.TorusGeometry(1.23, 0.045, 6, 40), dark, h, 0, 1.55, 0).rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(1.25, 0.05, 6, 40), dark, h, 0, 2.33, 0).rotation.x = Math.PI / 2;
  const roofM = std({ map: roofTex(roofCol), bumpMap: roofTex(roofCol), bumpScale: 2, roughness: 0.65 });
  mesh(new THREE.ConeGeometry(2.0, 2.1, 24), roofM, h, 0, 3.4, 0);
  mesh(new THREE.TorusGeometry(1.98, 0.07, 6, 48), std({ color: shade(roofCol, 0.7) }), h, 0, 2.36, 0).rotation.x = Math.PI / 2;           // eave trim
  mesh(SPH(0.11, 14), std({ color: '#f5c542', metalness: 0.6, roughness: 0.3 }), h, 0, 4.5, 0);                                              // finial
  mesh(new THREE.ConeGeometry(0.04, 0.3, 8), std({ color: '#f5c542', metalness: 0.6, roughness: 0.3 }), h, 0, 4.7, 0);
  // dormer on the roof front
  const dm = new THREE.Group(); dm.position.set(0, 3.05, 1.05); dm.rotation.x = -0.12; h.add(dm);
  mesh(new THREE.BoxGeometry(0.62, 0.5, 0.5), std({ map: plasterTex(wall) }), dm, 0, 0, 0);
  const dr = mesh(new THREE.ConeGeometry(0.5, 0.42, 4), roofM, dm, 0, 0.44, 0); dr.rotation.y = Math.PI / 4; dr.scale.set(1, 1, 0.9);
  mesh(new THREE.CircleGeometry(0.17, 20), glass, dm, 0, 0.02, 0.26); mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 20), white, dm, 0, 0.02, 0.265);
  // chimney
  const ch = mesh(new THREE.BoxGeometry(0.34, 1.3, 0.34), std({ map: brickTex('#b5583c'), color: '#ffffff' }), h, -0.95, 3.6, -0.35); ch.rotation.y = 0.3;
  mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), std({ color: '#5a3a2a' }), h, -0.95, 4.27, -0.35).rotation.y = 0.3;
  // arched door, frame, knob, step
  const door = new THREE.Group(); door.position.set(0, 0.45, 1.21); h.add(door);
  mesh(new THREE.BoxGeometry(0.66, 0.95, 0.06), wood, door, 0, 0.475, 0);
  mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 20, 1, false, 0, Math.PI), wood, door, 0, 0.95, 0).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  const fr = mesh(new THREE.TorusGeometry(0.36, 0.045, 6, 20, Math.PI), white, door, 0, 0.95, 0.03); fr.rotation.z = 0;
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.07, 0.95, 0.07), white, door, sx * 0.36, 0.475, 0.03);
  mesh(SPH(0.04, 10), std({ color: '#f5c542', metalness: 0.7, roughness: 0.25 }), door, 0.2, 0.5, 0.06);
  mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 16, 1, false, -Math.PI / 2, Math.PI), std({ map: stoneTex('#c9c0b8') }), h, 0, 0.06, 1.25);
  // porch lantern
  mesh(new THREE.BoxGeometry(0.06, 0.06, 0.25), dark, h, 0.58, 1.75, 1.22);
  mesh(SPH(0.08, 12), new THREE.MeshStandardMaterial({ color: '#fff0c0', emissive: '#ffb84a', emissiveIntensity: 1.5 }), h, 0.58, 1.62, 1.34);
  // windows with frames, shutters, flower boxes (left, right, back-sides)
  for (const a of [-0.95, 0.95, Math.PI - 0.6, Math.PI + 0.6]) {
    const wg = new THREE.Group(); wg.position.set(Math.sin(a) * 1.22, 1.55, Math.cos(a) * 1.22); wg.rotation.y = a; h.add(wg);
    mesh(new THREE.PlaneGeometry(0.42, 0.5), glass, wg, 0, 0, 0.02);
    for (const [bw, bh, x, y] of [[0.5, 0.05, 0, 0.27], [0.5, 0.05, 0, -0.27], [0.05, 0.56, -0.23, 0], [0.05, 0.56, 0.23, 0], [0.42, 0.03, 0, 0], [0.03, 0.5, 0, 0]]) mesh(new THREE.BoxGeometry(bw, bh, 0.05), white, wg, x, y, 0.04);
    for (const sx of [-1, 1]) { const sh = mesh(new THREE.BoxGeometry(0.2, 0.54, 0.03), shutterM, wg, sx * 0.37, 0, 0.03); sh.rotation.y = sx * -0.25; }
    mesh(new THREE.BoxGeometry(0.52, 0.1, 0.14), wood, wg, 0, -0.33, 0.08);
    for (let k = 0; k < 6; k++) mesh(SPH(0.04, 8), std({ color: ['#ff6b8b', '#ffd23f', '#ffffff', '#b388ff'][k % 4] }), wg, -0.2 + k * 0.08, -0.25, 0.1);
  }
  // garden: bushes, flowers, little picket fence arc
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 1.4 - Math.PI * 0.7 + (r() - 0.5) * 0.2; if (Math.abs(a) < 0.35) continue; const b = mesh(new THREE.IcosahedronGeometry(0.28 + r() * 0.12, 1), std({ map: leafTex('#4f9e6a'), color: '#ffffff' }), h, Math.sin(a) * 1.55, 0.2, Math.cos(a) * 1.55); b.scale.y = 0.8; }
  for (let i = -5; i <= 5; i++) { if (Math.abs(i) < 2) continue; const a = i * 0.13; mesh(new THREE.BoxGeometry(0.06, 0.38, 0.03), white, h, Math.sin(a) * 2.25, 0.19, Math.cos(a) * 2.25).rotation.y = a; }
  for (const sd of [-1, 1]) { const a0 = sd * 0.26, a1 = sd * 0.65; const rail = mesh(new THREE.BoxGeometry(Math.abs(a1 - a0) * 2.25, 0.04, 0.03), white, h, Math.sin((a0 + a1) / 2) * 2.25, 0.27, Math.cos((a0 + a1) / 2) * 2.25); rail.rotation.y = (a0 + a1) / 2; }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.37), new THREE.MeshBasicMaterial({ map: nameTex(name), transparent: true, toneMapped: false }));
  sign.position.set(0, 2.08, 1.27); h.add(sign);
  return { h, meshes: [], sign };
}
function dogHouse(parent, roofCol, { wall = WALLS[1] } = {}) {
  const s = new THREE.Group(); parent.add(s);
  mesh(new THREE.BoxGeometry(0.85, 0.6, 0.8), std({ map: plankTex('#b9825a'), color: '#ffffff' }), s, 0, 0.3, 0);
  const rf = mesh(new THREE.ConeGeometry(0.72, 0.55, 4), std({ map: roofTex(roofCol), roughness: 0.65 }), s, 0, 0.87, 0); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.95);
  mesh(new THREE.CircleGeometry(0.2, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#1a1020' }), s, 0, 0.12, 0.405);
  mesh(new THREE.PlaneGeometry(0.4, 0.12), new THREE.MeshBasicMaterial({ color: '#1a1020' }), s, 0, 0.06, 0.405);
  mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 16, Math.PI), std({ color: '#fbf7ee' }), s, 0, 0.12, 0.41);
  const bowl = mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.07, 16), std({ color: shade(roofCol, 1.0), roughness: 0.4 }), s, 0.35, 0.035, 0.65);
  mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 14), std({ color: '#8a5a3b' }), s, 0.35, 0.07, 0.65);
  return { s, meshes: [] };
}

function mergeGeos(list) {
  const pos = [], nor = [], col = [];
  for (const g0 of list) { if (!g0.userData.keepNormals) g0.computeVertexNormals(); const g = g0.index ? g0.toNonIndexed() : g0;
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); if (c) col.push(c.getX(i), c.getY(i), c.getZ(i)); else col.push(1, 1, 1); } }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return m;
}
function shadeGeo(g, y0, y1, dark = 0.45, light = 1.0, seed = 1, inner = null) { g.userData.keepNormals = g.userData.keepNormals || !!g.attributes.normal && g.userData.smoothDone;   // ambient-occlusion style gradient: dark low/inside, light high/outside
  const p = g.attributes.position, c = [];
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let k = lerp(dark, light, smooth(y0, y1, y)); if (inner) k *= lerp(0.7, 1.08, smooth(0, inner, Math.hypot(x, z)));
    k *= 0.9 + vn3(x * 3 + seed, y * 3, z * 3) * 0.2; c.push(k, k, k); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g;
}
function bumpy(g, amp, freq, seed) { const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const d = (vn3(v.x * freq + seed, v.y * freq, v.z * freq) - 0.5) * amp; v.addScaledVector(n, d); p.setXYZ(i, v.x, v.y, v.z); } return g; }
function pineFoliage(seed) {
  const parts = []; const r = rng(seed);
  for (let i = 0; i < 6; i++) { const rad = 1.55 * (1 - i / 7.2), h = 1.25, y = 1.0 + i * 0.62;
    const g = new THREE.ConeGeometry(rad, h, 16, 3); const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const yy = p.getY(k); if (yy < -h / 2 + 0.01) { const a = Math.atan2(p.getZ(k), p.getX(k)); const j = 1 + (Math.sin(a * 8 + i) * 0.5 + 0.5) * 0.22; p.setX(k, p.getX(k) * j); p.setZ(k, p.getZ(k) * j); p.setY(k, yy - (j - 1) * 0.9); } }
    g.translate(0, y, 0); g.rotateY(r() * 6.28); parts.push(shadeGeo(g, y - h / 2, y + h / 2, 0.42, 1.05, seed + i, rad)); }
  return mergeGeos(parts);
}
function canopy(seed, blobs = 11, size = 1) {
  const parts = []; const r = rng(seed);
  for (let i = 0; i < blobs; i++) { const a = r() * 6.28, d = r() * 0.95 * size, rr = (0.65 + r() * 0.5) * size;
    const g = bumpy(new THREE.IcosahedronGeometry(rr, 3), 0.22 * rr, 2.2, seed + i); { const p = g.attributes.position, nn = []; for (let q = 0; q < p.count; q++) { const v = new THREE.Vector3(p.getX(q), p.getY(q), p.getZ(q)).normalize(); nn.push(v.x, v.y, v.z); } g.setAttribute('normal', new THREE.Float32BufferAttribute(nn, 3)); g.userData.keepNormals = true; }
    g.translate(Math.cos(a) * d, (0.35 + r() * 0.9) * size - Math.pow(d / size, 2) * 0.5 * size, Math.sin(a) * d); parts.push(g); }
  const m = mergeGeos(parts); return shadeGeo(m, -0.4 * size, 1.6 * size, 0.42, 1.08, seed, 1.4 * size);
}
function trunkGeo(h, r0, r1, seed) { const g = new THREE.CylinderGeometry(r1, r0, h, 9, 4); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / h + 0.5; p.setX(i, p.getX(i) + Math.sin(y * 2.5 + seed) * 0.08 * y); } g.translate(0, h / 2, 0); return shadeGeo(g, 0, h, 0.55, 1, seed); }

// ================================================================= PLANET ID SITE
GH = () => 0;                      // the site stage is flat
const ACCOUNT = 'followerverse';
const IG_URL = 'https://www.instagram.com/' + ACCOUNT + '/';

// ---------------------------------------------------------------- traits: the same @ always gets the same dog, look and house
function cyrb(str, seed = 0) { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0); }
const roll = (h, salt, n) => cyrb('dogplanet:' + salt + ':' + h) % n, pickH = (h, salt, list) => list[roll(h, salt, list.length)];
BREEDS.push({ coat: '#5B4FD6', coat2: '#9EE7FF', ears: 'point', spots: '#FFE27A' });   // index 8: legendary Star Pup
const BREED_NAMES = ['Golden Pup', 'Spotty Pup', 'Fox Pup', 'Snow Husky', 'Choco Pup', 'Shadow Pup', 'Cloud Pup', 'Cocoa Pup', 'Star Pup'];
const DOG_NAMES = ['Biscuit', 'Mochi', 'Pepper', 'Noodle', 'Waffles', 'Bean', 'Nugget', 'Pickles', 'Toast', 'Maple', 'Ziggy', 'Pudding', 'Tater', 'Comet', 'Olive', 'Bubbles',
  'Rocket', 'Peanut', 'Muffin', 'Sprout', 'Pancake', 'Cosmo', 'Dumpling', 'Juniper', 'Taco', 'Marshmallow', 'Pixel', 'Churro', 'Honey', 'Scout', 'Bagel', 'Luna', 'Sushi', 'Tofu', 'Bolt', 'Clover'];
const QUIRKS = ['steals socks', 'is scared of butterflies', 'howls at both moons', 'sleeps upside down', 'only eats pancakes', 'scared off a monster', 'thinks it is a cat',
  'sneezes when happy', 'is the best at fetch on the planet', 'hides bones in your shoes', 'snores louder than the monsters', 'chases its own tail every morning',
  'gives the best hugs on the planet', 'barks at clouds', 'brings you a flower every day', 'is afraid of the vacuum, not the monsters'];
const STREETS = ['Maple Lane', 'Comet Road', 'Biscuit Street', 'Moonbeam Way', 'Pawprint Avenue', 'Sunny Hill', 'Meadow Loop', 'Starlight Drive', 'Bone Alley', 'Cloud Street', 'Tailwag Terrace', 'Puddle Park'];
const SKINS = ['#f2c79a', '#c48a5e', '#8d5a3b', '#f6d7be', '#6b4430', '#e0b48c', '#a8754e', '#ffd9a0', '#5a3824', '#ebc09a'];
const HAIRS = [['#241812', 'curly'], ['#7a4a26', 'long'], ['#1a1210', 'short'], ['#3a2a1e', 'bun'], ['#e0b867', 'short'], ['#2a1c14', 'long'], ['#c8553d', 'cap'], ['#1a1210', 'curly'], ['#4a2e1e', 'bun'], ['#2a1c14', 'short']];
const SHIRTS = ['#e8b23a', '#3f7cc4', '#c8553d', '#4fa36b', '#8c5fc4', '#e36f9b', '#2f9fa6', '#f2f2ee', '#ff9f43', '#5b8def'];
const ROOFS = ['#e2475a', '#9b5de5', '#f15bb5', '#ff9f1c', '#3fb6b0', '#ffd166'];
const cleanHandle = (s) => String(s || '').trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 30);
function traits(h, pos) {
  const n = roll(h, 'breed', 1000); const breed = n < 10 ? 8 : Math.min(7, Math.floor((n - 10) / (990 / 8)));
  const rarity = breed === 8 ? 'LEGENDARY' : roll(h, 'shiny', 100) < 8 ? 'RARE' : 'COMMON';
  const name = pickH(h, 'name', DOG_NAMES);
  return { h, pos, breed: breed % 9, breedName: BREED_NAMES[breed % 9], rarity, dogName: name, quirk: pickH(h, 'quirk', QUIRKS),
    skin: pickH(h, 'skin', SKINS), hair: pickH(h, 'hair', HAIRS), shirt: pickH(h, 'shirt', SHIRTS), pants: pickH(h, 'pants', ['#2f3b5a', '#5e6266', '#2f3b32', '#3b4a6b']),
    roof: pickH(h, 'roof', ROOFS), wall: pickH(h, 'wall', WALLS),
    house: pos ? pos : null, street: pos ? (pos > 2000 ? 'Monster Cave Road' : STREETS[Math.floor((pos - 1) / 40) % STREETS.length]) : null };
}
// ---------------------------------------------------------------- follower list: stored hashed, so nobody can read it from the site
let FOLLOW = { salt: 'dogplanet-v1', hashes: [] };
// SHA-256 that also works on plain http (phones on the same Wi-Fi), where crypto.subtle is unavailable
function sha256js(bytes) { const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n); m.set(bytes); m[l] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  const w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) { for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = r(w[i-15], 7) ^ r(w[i-15], 18) ^ (w[i-15] >>> 3), s1 = r(w[i-2], 17) ^ r(w[i-2], 19) ^ (w[i-2] >>> 10); w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0; }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) { const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0; }
    H = H.map((v, i) => (v + [a, b, c, d, e, f, g, h][i]) >>> 0); }
  return H.map(v => v.toString(16).padStart(8, '0')).join(''); }
async function sha16(s) { const bytes = new TextEncoder().encode(s);
  if (globalThis.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join(''); }
  return sha256js(bytes).slice(0, 16); }
async function followPos(h) { if (!FOLLOW.hashes.length) return null; const i = FOLLOW.hashes.indexOf(await sha16(FOLLOW.salt + h)); return i >= 0 ? i + 1 : null; }
try { FOLLOW = await (await fetch(QS.has('demo') ? './followers_demo.json' : './followers.json')).json(); } catch (e) { console.warn('no follower list yet'); }

// ---------------------------------------------------------------- renderer + world
const glc = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const world = new THREE.Scene(); scene = world;
const cam = new THREE.PerspectiveCamera(38, 1, 0.05, 3000);
skyDome(L.sky.top, L.sky.mid, L.sky.hor);
world.fog = new THREE.Fog(L.fogDay, 18, 120);
world.add(new THREE.HemisphereLight(L.sky.mid, L.grass[1], 1.15));
const sun = new THREE.DirectionalLight(L.sun, 2.6); sun.position.set(-8, 12, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; world.add(sun);
{ const gt = grassTex().clone(); gt.repeat.set(9, 9); gt.needsUpdate = true;
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), std({ map: gt, color: L.grass[0], roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; world.add(gnd); }
const STAGE_CLEAR = (x, z) => x > -3.2 && x < 4.2 && z > -7.5 && z < 2.5;
grassTufts(5000, 24, (x, z) => STAGE_CLEAR(x, z) && Math.hypot(x - 0.2, z + 0.3) < 1.6); flowers(700, 22, (x, z) => Math.hypot(x - 0.2, z + 0.3) < 1.6);
// a crescent of rounded trees and pines behind the stage
{ const foliage = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), bark = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, color: '#7a5038' });
  const r = rng(12), o = new THREE.Object3D(), spots = [];
  for (let i = 0; i < 260 && spots.length < 70; i++) { const a = Math.PI + 0.15 + r() * (Math.PI - 0.3), d = 9 + r() * 30, x = Math.cos(a) * d * 1.3, z = Math.sin(a) * d - 3; if (STAGE_CLEAR(x, z)) continue; spots.push([x, z, r() < 0.5]); }
  const make = (geo, mat, list, tints) => { const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach(([x, z], i) => { o.position.set(x, 0, z); o.rotation.set(0, r() * 6, 0); o.scale.setScalar(0.9 + r() * 0.8); o.updateMatrix(); im.setMatrixAt(i, o.matrix); if (tints) im.setColorAt(i, C(tints[(r() * tints.length) | 0])); }); im.castShadow = true; world.add(im); };
  const pines = spots.filter(s => s[2]), rounds = spots.filter(s => !s[2]);
  make(pineFoliage(5), foliage, pines, ['#2f8f86', '#2a7f7a', '#3a9a8c']); make(trunkGeo(1.2, 0.22, 0.14, 2), bark, pines, null);
  const cg = canopy(40, 11, 1.25); cg.translate(0, 2.4, 0); make(cg, foliage, rounds, ['#e2475a', '#9b5de5', '#f15bb5', '#ff9f1c', '#c94fd6']); make(trunkGeo(2.6, 0.26, 0.16, 1), bark, rounds, null);
  for (let i = 0; i < 16; i++) { const a = Math.PI + r() * Math.PI, d = 5 + r() * 4; const x = Math.cos(a) * d * 1.2, z = Math.sin(a) * d - 2; if (STAGE_CLEAR(x, z)) continue;
    const b = canopy(90 + i, 7, 0.9); b.translate(0, 0.35, 0); const m = new THREE.Mesh(b, foliage); m.position.set(x, 0, z); m.scale.setScalar(0.45 + r() * 0.3); world.add(m); } }
// a little sci-fi: orbital ring in the sky + floating light orbs
{ const ring = new THREE.Mesh(new THREE.TorusGeometry(700, 2, 8, 200), new THREE.MeshBasicMaterial({ color: '#e6f4ff', transparent: true, opacity: 0.5, fog: false })); ring.position.set(0, -250, -500); ring.rotation.set(1.05, 0.25, 0.3); world.add(ring);
  const pl = new THREE.Mesh(SPH(50, 48), std({ color: '#ffb3d9', emissive: '#a05080', emissiveIntensity: 0.25, fog: false })); pl.position.set(330, 300, -900); world.add(pl); }
const ORBS = Array.from({ length: 7 }, (_, i) => ({ s: sprite(i % 2 ? '#bff6ff' : '#ffd1f0', 0.45, V3(0, 0, 0), 0.85), x: -4 + i * 1.4, z: -6 - (i % 3), h: 2.4 + (i % 3) * 0.6, ph: i * 1.3 }));

// ---------------------------------------------------------------- the stage: your cottage, your dog house, you and your dog
const stage = new THREE.Group(); world.add(stage);
const holoMat = new THREE.MeshBasicMaterial({ color: '#9ff6ff', transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
let ACT = null;
function clearStage() { while (stage.children.length) { const c = stage.children.pop(); c.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } }
function buildStage(T) {
  clearStage(); scene = stage; ACT = { T };
  const home = new THREE.Group(); home.position.set(0.2, 0, -5.2); stage.add(home);
  cottage(home, T.roof, T.pos ? '@' + T.h : '@' + T.h + ' ?', { wall: T.wall, seed: (cyrb(T.h) % 97) + 1 });
  const dh = dogHouse(stage, T.roof); dh.s.position.set(2.9, 0, -3.6); dh.s.rotation.y = -0.45;
  if (T.pos) {
    ACT.fig = minifig({ skin: T.skin, hair: T.hair[0], hairStyle: T.hair[1], shirt: T.shirt, pants: T.pants, x: -0.55, z: -0.4, ry: 0.22, wave: true });
    ACT.dog = dog({ breed: T.breed, pose: 'sit', x: 0.65, z: -0.05, ry: FACE + 0.25, size: 1.15, headUp: 0.15 }); ACT.mode = 'wag';
  } else {
    // not a follower yet: the dog waits alone on an empty landing pad, next to a hologram of "you"
    ACT.dog = dog({ breed: T.breed, mood: 'scared', pose: 'sit', x: 0.6, z: -0.05, ry: FACE + 0.15, size: 1.15, headUp: 0.25 }); ACT.mode = 'tremble';
    ACT.ghost = minifig({ x: -0.55, z: -0.4, ry: 0.22 }); ACT.ghost.traverse(o => { if (o.isMesh) { o.material = holoMat; o.castShadow = false; } });
    const pad = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 48), new THREE.MeshBasicMaterial({ color: '#7ff3ff', transparent: true, opacity: 0.85, side: THREE.DoubleSide, toneMapped: false }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(-0.55, 0.02, -0.4); stage.add(pad); ACT.pad = pad;
  }
  scene = world;
}

// ---------------------------------------------------------------- UI
const $ = (id) => document.getElementById(id);
function fmt(n) { return '#' + String(n).padStart(4, '0'); }
function showCard(T) {
  const c = $('card'); c.classList.toggle('notyet', !T.pos);
  $('cid').innerHTML = T.pos ? `CITIZEN <b>${fmt(T.pos)}</b>` : 'NOT ON THE PLANET YET';
  $('badge').textContent = T.rarity === 'LEGENDARY' ? '★ LEGENDARY' : T.rarity; $('badge').className = 'badge ' + T.rarity;
  $('handle').textContent = '@' + T.h;
  $('dogline').textContent = `🐶 ${T.dogName} · ${T.breedName}`;
  $('quirk').textContent = `“${T.dogName} ${T.quirk}”`;
  $('homeline').textContent = T.pos ? `🏠 House ${T.house} · ${T.street}` : `🏠 Your cottage is reserved, but empty`;
  $('wait').textContent = `${T.dogName} is waiting for you on the landing pad…`;
  c.hidden = false; $('actions').hidden = false; $('follow').hidden = !!T.pos; $('save').hidden = !T.pos;
}
async function find(raw) {
  const h = cleanHandle(raw); if (!h) return;
  $('who').value = h; history.replaceState(null, '', '?u=' + encodeURIComponent(h) + (QS.has('demo') ? '&demo' : ''));
  const T = traits(h, await followPos(h)); buildStage(T); showCard(T);
}
$('form').addEventListener('submit', (e) => { e.preventDefault(); find($('who').value); });
$('follow').href = IG_URL;

// ---------------------------------------------------------------- the Story card (1080x1920) people can post and tag
async function storyCard() {
  const T = ACT.T, out = document.createElement('canvas'); out.width = 1080; out.height = 1920; const g = out.getContext('2d');
  const prevPR = renderer.getPixelRatio(), prevSize = renderer.getSize(new THREE.Vector2());
  renderer.setPixelRatio(1); renderer.setSize(1080, 1350, false); cam.aspect = 1080 / 1350; cam.updateProjectionMatrix(); renderer.render(world, cam);
  g.fillStyle = '#1a1030'; g.fillRect(0, 0, 1080, 1920); g.drawImage(glc, 0, 0, 1080, 1350);
  renderer.setPixelRatio(prevPR); renderer.setSize(prevSize.x, prevSize.y, false); resize();
  const F = (px) => `${px}px "Arial Rounded MT Bold","Nunito",system-ui,sans-serif`;
  const out1 = (txt, x, y, px, fill, stroke = '#3A2412') => { g.font = F(px); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = px * 0.22; g.strokeStyle = stroke; g.strokeText(txt, x, y); g.fillStyle = fill; g.fillText(txt, x, y); };
  out1('DOG PLANET', 540, 230, 110, '#ffffff'); out1('PLANET ID', 540, 330, 54, '#F5C542');
  g.fillStyle = '#FFFDF7'; g.strokeStyle = '#3A2412'; g.lineWidth = 10; g.beginPath(); g.roundRect(60, 1260, 960, 520, 48); g.fill(); g.stroke();
  g.textAlign = 'left'; g.fillStyle = '#3A2412'; g.font = F(72); g.fillText('CITIZEN', 110, 1370); g.fillStyle = '#E0A800'; g.fillText(fmt(T.pos), 430, 1370);
  g.fillStyle = '#C8553D'; g.font = F(60); g.fillText('@' + T.h, 110, 1460);
  g.fillStyle = '#3A2412'; g.font = F(46); g.fillText(`🐶  ${T.dogName} · ${T.breedName}`, 110, 1550);
  g.fillStyle = '#7A6656'; g.font = 'italic ' + F(36); g.fillText(`“${T.dogName} ${T.quirk}”`, 170, 1610);
  g.fillStyle = '#3A2412'; g.font = F(46); g.fillText(`🏠  House ${T.house} · ${T.street}`, 110, 1700);
  if (T.rarity !== 'COMMON') { g.fillStyle = T.rarity === 'LEGENDARY' ? '#8c5fc4' : '#3f7cc4'; g.beginPath(); g.roundRect(700, 1310, 280, 70, 35); g.fill(); g.fillStyle = '#fff'; g.font = F(34); g.textAlign = 'center'; g.fillText(T.rarity === 'LEGENDARY' ? '★ LEGENDARY' : 'RARE', 840, 1357); }
  out1('@' + ACCOUNT + ' · find your dog', 540, 1860, 44, '#ffffff');
  if (window.__previewCard) return out.toDataURL('image/jpeg', 0.85);   // local testing only
  const blob = await new Promise(r => out.toBlob(r, 'image/png')); const file = new File([blob], `planet-id-${T.h}.png`, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'My Planet ID' }); return; } catch (e) { } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
}
$('save').addEventListener('click', storyCard);

// ---------------------------------------------------------------- loop
let lastW = 0, lastH = 0;
function resize() { const w = glc.clientWidth, h = glc.clientHeight; if (!w || !h) return; lastW = w; lastH = h; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
if (window.ResizeObserver) new ResizeObserver(() => resize()).observe(glc);
addEventListener('resize', resize); resize();
const t0 = performance.now();
function frame() {
  if (glc.clientWidth !== lastW || glc.clientHeight !== lastH) resize();   // the box changes size when the card appears: never draw stretched
  const t = (performance.now() - t0) / 1000, a = Math.sin(t * 0.25) * 0.28;
  cam.position.set(0.3 + Math.sin(a) * 6.2, 1.55, -0.6 + Math.cos(a) * 6.2); cam.lookAt(0.15, 0.95, -1.3);
  if (ACT) { if (ACT.dog) animDog(ACT.dog, t, ACT.mode, 0);
    if (ACT.fig) { const A = ACT.fig.userData.arms[0]; A.rotation.z = -2.3 + Math.sin(t * 6) * 0.35; }
    if (ACT.ghost) { holoMat.opacity = 0.32 + 0.14 * Math.sin(t * 3); ACT.ghost.position.y = 0.04 + Math.sin(t * 2) * 0.03; }
    if (ACT.pad) ACT.pad.material.opacity = 0.55 + 0.35 * Math.sin(t * 3); }
  ORBS.forEach(o => o.s.position.set(o.x + Math.sin(t * 0.4 + o.ph), o.h + Math.sin(t * 1.2 + o.ph) * 0.3, o.z));
  renderer.render(world, cam); requestAnimationFrame(frame);
}
frame();
if (QS.get('u')) find(QS.get('u'));
window.ready = true; window.storyCard = storyCard;
