/* Pixel sky behind the page.
   Paper (day): a sun with a dithered glow and slowly turning rays, soft clouds, a light breeze and drifting leaves.
   Night: a crescent moon in a dithered halo, twinkling stars, dark clouds, the same breeze and a few fireflies.
   Drawn on a low-resolution canvas (one art pixel = 3 CSS px) and scaled up with nearest-neighbour sampling, so
   every shape is made of real pixels. The sun and moon sit near the top and scroll away with the page. Switching
   the theme sets one body and raises the other. Runs at 12 fps on a timer (it never wakes on every display frame),
   pauses when the tab is hidden, and under reduced motion draws a single still frame. The glow masks are worked
   out once per size, and the text column is measured on resize, not every frame. Decorative: aria-hidden, no
   pointer events. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PX = 3, FPS = 12;
  var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  var canvas = document.createElement('canvas');
  canvas.className = 'sky';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, img = null, buf = null;

  /* ---------- colour tokens ---------- */
  function parse(c) {
    c = c.trim();
    var m;
    if ((m = c.match(/^#([0-9a-f]{6})$/i))) {
      var n = parseInt(m[1], 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255, 1];
    }
    if ((m = c.match(/rgba?\(([^)]+)\)/))) {
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    return [0, 0, 0, 0];
  }
  var C = {};
  function readColors() {
    var cs = getComputedStyle(root);
    ['sun', 'sun-edge', 'glow', 'moon', 'moon-mid', 'moon-shade', 'star', 'cloud', 'cloud-shade', 'wind', 'leaf', 'leaf-2'].forEach(function (k) {
      C[k] = parse(cs.getPropertyValue('--sky-' + k) || '#000');
    });
  }

  /* ---------- pixels ---------- */
  var quiet = null;                                   // [x0, x1] in art pixels, or null
  var prose = document.querySelector('[data-prose]');
  function measureQuiet() {                          // on resize only: reading layout every frame forces a style pass
    if (!prose) { quiet = null; return; }
    var r = prose.getBoundingClientRect();
    quiet = [Math.floor(r.left / PX) - 4, Math.ceil(r.right / PX) + 4];
  }
  function putLively(x, y, c, alpha) {
    if (quiet && x >= quiet[0] && x <= quiet[1]) return;
    put(x, y, c, alpha);
  }
  function put(x, y, c, alpha) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var a = (alpha === undefined ? 1 : alpha) * c[3];
    if (a <= 0) return;
    var i = (y * W + x) * 4;
    var da = buf[i + 3] / 255;
    var oa = a + da * (1 - a);
    if (oa <= 0) return;
    buf[i] = (c[0] * a + buf[i] * da * (1 - a)) / oa;
    buf[i + 1] = (c[1] * a + buf[i + 1] * da * (1 - a)) / oa;
    buf[i + 2] = (c[2] * a + buf[i + 2] * da * (1 - a)) / oa;
    buf[i + 3] = oa * 255;
  }
  function dither(x, y, f) { return f * 16 > BAYER4[(y & 3) * 4 + (x & 3)]; }

  /* ---------- seeded layout ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var stars = [], clouds = [], gusts = [], motes = [];

  function cloudMask(w, h, r) {
    // a cloud is a union of puffs over a soft oval base; the lower part is shaded with an ordered dither
    var m = new Uint8Array(w * h);
    var puffs = [
      [w * 0.5, h * 0.52, h * 0.46],
      [w * (0.27 + r() * 0.06), h * 0.66, h * (0.3 + r() * 0.06)],
      [w * (0.7 + r() * 0.06), h * 0.62, h * (0.33 + r() * 0.06)],
      [w * (0.14 + r() * 0.04), h * 0.78, h * 0.2],
      [w * (0.86 - r() * 0.04), h * 0.78, h * 0.2]
    ];
    var bx = w * 0.5, by = h * 0.78, brx = w * 0.46, bry = h * 0.2;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var inside = ((x - bx) * (x - bx)) / (brx * brx) + ((y - by) * (y - by)) / (bry * bry) <= 1;
      for (var k = 0; !inside && k < puffs.length; k++) {
        var dx = x - puffs[k][0], dy = y - puffs[k][1];
        inside = dx * dx + dy * dy <= puffs[k][2] * puffs[k][2];
      }
      if (!inside) continue;
      var f = (y / h - 0.55) / 0.4;                  // 0 at the middle, 1 at the base
      m[y * w + x] = f > 0 && dither(x, y, Math.min(1, f * 1.3)) ? 2 : 1;
    }
    return { m: m, w: w, h: h };
  }

  function layout() {
    var r = rng(20261120);
    stars = [];
    var count = Math.round(W * H / 2600);
    for (var i = 0; i < count; i++) {
      stars.push({ x: r() * W, y: r() * H * 0.55, big: r() < 0.12, phase: r() * Math.PI * 2, speed: 0.6 + r() * 1.6 });
    }
    clouds = [];
    var cc = W < 260 ? 3 : 5;
    for (var j = 0; j < cc; j++) {
      var cw = Math.round(34 + r() * 44), ch = Math.round(cw * (0.42 + r() * 0.1));
      clouds.push({ x: r() * W, y: H * (0.08 + r() * 0.55), v: 0.6 + r() * 0.9, sprite: cloudMask(cw, ch, r) });
    }
    gusts = [];
    for (var g = 0; g < (W < 260 ? 2 : 4); g++) gusts.push(newGust(r, true));
    motes = [];
    for (var k = 0; k < (W < 260 ? 4 : 8); k++) motes.push({ x: r() * W, y: H * (0.2 + r() * 0.7), vx: 3 + r() * 5, phase: r() * 6.28, kind: r() < 0.5 ? 0 : 1 });
  }
  var gr = rng(7);
  function newGust(r, anywhere) {
    return {
      x: anywhere ? r() * W : -60 - r() * 120, y: H * (0.18 + r() * 0.7),
      len: 22 + r() * 22, amp: 1 + r() * 2.2, freq: 0.06 + r() * 0.05, v: 16 + r() * 12,
      curlAt: 0.35 + r() * 0.3, phase: r() * 6.28
    };
  }

  /* ---------- the scene ---------- */
  var theme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  var scrollPos = window.scrollY;                     // kept by the scroll listener, so a frame never asks for layout
  var swap = null;           // { from, to, t0 } while the bodies trade places
  function bodyCenter() {
    var small = W < 260;
    var scroll = scrollPos / PX;
    return { x: W * (small ? 0.8 : 0.79), y: H * (small ? 0.16 : 0.2) - scroll * 0.35, r: small ? 9 : 13 };
  }

  // a glow ring is the same set of offsets and strengths every frame: work it out once per size
  var rings = {};
  function ring(r0, r1, strength) {
    var key = r0 + ':' + r1 + ':' + strength;
    if (rings[key]) return rings[key];
    var out = [], R = Math.ceil(r1);
    for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
      var d = Math.hypot(x, y);
      if (d <= r0 || d > r1) continue;
      out.push(x, y, Math.pow(1 - (d - r0) / (r1 - r0), 1.7) * strength);
    }
    return (rings[key] = out);
  }
  function drawGlow(cx, cy, r0, r1, c, strength, alpha) {
    var pts = ring(r0, r1, strength), a = alpha === undefined ? 0.55 : alpha;
    cx = Math.round(cx); cy = Math.round(cy);
    for (var i = 0; i < pts.length; i += 3) {
      var x = cx + pts[i], y = cy + pts[i + 1];
      if (dither(x, y, pts[i + 2])) put(x, y, c, a);
    }
  }

  function drawSun(cx, cy, r, t, lift) {
    cy += lift;
    drawGlow(cx, cy, r, r * 2.9, C.glow, 0.85);
    // rays: 12 short beams turning in steps of 1/24 turn every quarter second
    var turn = Math.floor(t * 4) / 24 * Math.PI * 2;
    for (var k = 0; k < 12; k++) {
      var a = turn + k * Math.PI / 6, len = k % 2 ? 4 : 6;
      for (var s = 0; s < len; s++) put(cx + Math.cos(a) * (r + 4 + s), cy + Math.sin(a) * (r + 4 + s), C['sun-edge'], 0.9);
    }
    for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) {
      var d = Math.hypot(x, y);
      if (d > r) continue;
      // lit from the upper left: core, a dithered band, then the warmer rim
      var f = (d / r) * 0.75 + ((x + y) / (2 * r)) * 0.35;
      var c = f < 0.45 ? C.sun : (f < 0.62 ? (dither(cx + x | 0, cy + y | 0, (f - 0.45) / 0.17) ? C['sun-edge'] : C.sun) : C['sun-edge']);
      put(cx + x, cy + y, c);
    }
  }

  function drawMoon(cx, cy, r, lift) {
    cy += lift;
    drawGlow(cx, cy, r * 1.5, r * 3.1, C.glow, 0.42, 0.3);   // the wide, faint halo
    drawGlow(cx, cy, r, r * 1.7, C.glow, 0.95, 0.42);        // the close glow
    var sx = cx + r * 0.55, sy = cy - r * 0.3, sr = r * 0.92;   // the shadow disc that carves the crescent
    var craters = [[-0.35, -0.2, 0.18], [-0.1, 0.35, 0.13], [-0.55, 0.25, 0.1]];
    for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) {
      if (x * x + y * y > r * r) continue;
      var px = cx + x, py = cy + y;
      var ds = Math.hypot(px - sx, py - sy);
      if (ds < sr - 1.2) continue;
      var edge = ds < sr + 1.8;                                      // the terminator, dithered
      var c = C.moon;
      for (var k = 0; k < craters.length; k++) {
        var cr = craters[k];
        if (Math.hypot(x - cr[0] * r, y - cr[1] * r) < cr[2] * r) { c = C['moon-mid']; break; }
      }
      if (x + y > r * 0.9) c = C['moon-mid'];
      if (edge) { if (!dither(px | 0, py | 0, (ds - (sr - 1.2)) / 3)) continue; c = C['moon-shade']; }
      put(px, py, c);
    }
  }

  function drawStars(t) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = Math.sin(t * s.speed + s.phase);
      var on = tw > -0.55;
      if (!on) continue;
      var a = tw > 0.6 ? 1 : 0.55;
      putLively(s.x, s.y, C.star, a);
      if (s.big && tw > 0.35) {
        putLively(s.x - 1, s.y, C.star, 0.5); putLively(s.x + 1, s.y, C.star, 0.5);
        putLively(s.x, s.y - 1, C.star, 0.5); putLively(s.x, s.y + 1, C.star, 0.5);
      }
    }
  }

  function drawClouds(t) {
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i], sp = c.sprite;
      var x0 = Math.round(((c.x + t * c.v) % (W + sp.w * 2)) - sp.w), y0 = Math.round(c.y);
      for (var y = 0; y < sp.h; y++) for (var x = 0; x < sp.w; x++) {
        var v = sp.m[y * sp.w + x];
        if (!v) continue;
        put(x0 + x, y0 + y, v === 2 ? C['cloud-shade'] : C.cloud, 0.92);
      }
    }
  }

  function drawGusts(dt) {
    for (var i = 0; i < gusts.length; i++) {
      var g = gusts[i];
      g.x += g.v * dt;
      if (g.x - g.len > W + 20) { gusts[i] = newGust(gr, false); continue; }
      // a breeze line: a sine-wobbled streak whose tail fades, with one small curl near its head
      for (var s = 0; s < g.len; s++) {
        var x = g.x - s, y = g.y + Math.sin((x * g.freq) + g.phase) * g.amp;
        var a = s < 4 ? 1 : 1 - s / g.len;
        if ((s & 1) && s > g.len * 0.6) continue;
        putLively(x, y, C.wind, a);
      }
      var cx = g.x - g.len * g.curlAt, cy = g.y + Math.sin(cx * g.freq + g.phase) * g.amp - 3;
      for (var k = 0; k < 9; k++) {
        var ang = Math.PI / 2 + k * (Math.PI * 1.5 / 8);
        putLively(cx + Math.cos(ang) * 3, cy + Math.sin(ang) * 3, C.wind, 0.8);
      }
    }
  }

  function drawMotes(t, dt, night) {
    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.x += m.vx * dt;
      if (m.x > W + 4) { m.x = -4; m.y = H * (0.2 + Math.random() * 0.7); }
      var y = m.y + Math.sin(t * 1.3 + m.phase) * 4;
      if (night) {
        // fireflies: a pixel and a dithered glow that breathes
        var b = 0.5 + 0.5 * Math.sin(t * 2 + m.phase);
        putLively(m.x, y, C.leaf, 0.5 + b * 0.5);
        if (b > 0.6) { putLively(m.x - 1, y, C.leaf, 0.35); putLively(m.x + 1, y, C.leaf, 0.35); putLively(m.x, y - 1, C.leaf, 0.35); putLively(m.x, y + 1, C.leaf, 0.35); }
      } else {
        // leaves: a two-frame tumble
        var c = m.kind ? C.leaf : C['leaf-2'];
        if (Math.floor(t * 3 + m.phase) % 2) { putLively(m.x, y, c); putLively(m.x + 1, y, c); putLively(m.x + 1, y - 1, c); }
        else { putLively(m.x, y, c); putLively(m.x, y - 1, c); putLively(m.x + 1, y - 1, c); }
      }
    }
  }

  /* ---------- loop: a timer sets the pace, the frame callback draws ---------- */
  var start = performance.now(), last = start, due = start, raf = 0, timer = 0, running = false;
  function frame(now) {
    raf = 0;
    if (!running) return;
    var dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    due = Math.max(due + 1000 / FPS, now);             // the next frame keeps the beat, it does not drift late
    render((now - start) / 1000, dt);
    schedule();
  }
  function schedule() {
    if (reduce || timer || raf) return;
    // the sun and moon trading places is the one moment that runs at the display's own rate;
    // otherwise wake a little early, so the display frame that draws lands on the beat
    var wait = swap ? 0 : Math.max(0, due - performance.now() - 8);
    timer = setTimeout(function () { timer = 0; if (running) raf = requestAnimationFrame(frame); }, wait);
  }
  function render(t, dt) {
    buf.fill(0);
    var night = theme === 'dark';
    var b = bodyCenter();
    if (night) drawStars(t);
    drawClouds(reduce ? 0 : t);
    // the two bodies trade places on a theme switch: the old one sets, the new one rises
    var lift = 0, show = theme;
    if (swap) {
      var p = Math.min(1, (performance.now() - swap.t0) / 900);
      if (p < 0.45) { show = swap.from; lift = (p / 0.45) * (b.r * 3); }
      else { show = swap.to; lift = (1 - (p - 0.45) / 0.55) * (b.r * 3); }
      if (p >= 1) swap = null;
    }
    if (show === 'dark') drawMoon(b.x, b.y, b.r, Math.round(lift)); else drawSun(b.x, b.y, b.r, t, Math.round(lift));
    if (!reduce) { drawGusts(dt); drawMotes(t, dt, night); }
    ctx.putImageData(img, 0, 0);
  }

  function resize() {
    W = Math.ceil(window.innerWidth / PX); H = Math.ceil(window.innerHeight / PX);
    canvas.width = W; canvas.height = H;
    img = ctx.createImageData(W, H); buf = img.data;
    rings = {};
    measureQuiet();
    layout();
    render((performance.now() - start) / 1000, 0);
  }
  function setRunning(on) {
    running = on && !document.hidden;
    if (!running) { clearTimeout(timer); timer = 0; cancelAnimationFrame(raf); raf = 0; return; }
    if (!reduce && !raf && !timer) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  readColors();
  resize();
  setRunning(true);
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', function () { scrollPos = window.scrollY; if (reduce) render(0, 0); }, { passive: true });
  document.addEventListener('visibilitychange', function () { setRunning(true); });
  document.addEventListener('prefs:change', function (e) {
    if (e.detail.key === 'theme') {
      var next = e.detail.value === 'dark' ? 'dark' : 'light';
      if (next !== theme) { swap = reduce ? null : { from: theme, to: next, t0: performance.now() }; theme = next; }
      readColors();
      render((performance.now() - start) / 1000, 0);
    }
  });
})();
