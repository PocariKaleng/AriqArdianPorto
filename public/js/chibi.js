/* Chibi Ariq: the portrait as an anime chibi, then pixelled. Big cel-shaded eyes with a warm iris gradient and
   two catchlights, a spiky fringe, a blue sheen ring on black hair and an ahoge; the light-blue jacket with dark
   frog closures, grey joggers, hands in pockets; standing on a grass block in the bottom-right corner.
   Decoration only (aria-hidden): every fact in its bubbles is already written on the page.

   Behaviour (the animate skill's gate: each motion has a job; rare moments may delight):
     breathes, blinks, the ahoge bobs        alive, not a sticker (a few frames a second)
     a gloss runs along the hair now and then the anime hair shine
     eyes follow the cursor (the catchlights) it notices you; fine pointers only
     hover: looks right at you               it notices you
     waves at a link you point at            feedback, at most every 8s
     a bubble per section                    a fact from it, once per section, 6s apart, not in the first 2.5s
                                             (the choreograph skill's attention loops)
     click: hop + speed lines, grin,         rare, so it may delight
            sparkles at the top of the hop, a fact
     three quick clicks: a sweat drop        flustered, and a short rest before he plays again
     sleeps (night, or 40s with no input)    Zzz and a snot bubble that swells with each breath
   Effects follow the create-game-vfx checklist: a fixed pool of nodes, restarted not stacked, cleaned by
   class removal, and a still version under reduced motion. Phones: smaller, ducking out while the page scrolls. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var firstVisit = false;
  try { firstVisit = !sessionStorage.getItem('pt-seen'); } catch (e) { /* storage blocked */ }

  /* ---- the sprite: 30 x 42, one letter per pixel (drawn on a workbench, see the palette below) ---- */
  var SPRITE = [
    '.................HD...........',
    '................HH............',
    '..........HHHHHHHHHH..........',
    '........HHHHHHHHHHHHHH........',
    '.......HHHHhhhhhhhhhHHH.......',
    '......HHHhHHHHHHHHHHhHHH......',
    '.....HHHHHHHHHHHHHHHHHHHH.....',
    '....DHHHHDHHHHHHHHHHDHHHHD....',
    '....DHHHHHDHHHHHHHHDHHHHHD....',
    '....DHHHSHHHSHHHHSHHHHSHHD....',
    '....DHHsSSHHsSHHsSHHsSSHHD....',
    '....DHsSSSsSSSHsSSSSsSSSHD....',
    '....DHSEEEEESSSSSSEEEEESHD....',
    '....DHSESSSSESSSSESSSSESHD....',
    '....DHSSSSSSSSSSSSSSSSSSHD....',
    '....DHSSSSSSSSSSSSSSSSSSHD....',
    '....DHSSSSSSSSSSSSSSSSSSHD....',
    '....DHSSSSSSSSSSSSSSSSSSHD....',
    '....DHSSSSSSSSSsSSSSSSSSHD....',
    '....DHSSSSSSSSSSSSSSSSSSHD....',
    '.....D.SSSSSSSMMSSSSSSS.D.....',
    '........sSSSSSSSSSSSSs........',
    '...........sSSSSSSs...........',
    '..........LBBssssBBL..........',
    '........LBBBBNNNNBBBBL........',
    '......BBBBBBBBbbBBBBBBBB......',
    '.....LBBBcBBBNNNNBBBcBBBb.....',
    '.....LBBBcBBBBbbBBBBcBBBb.....',
    '.....BBBBcBBBBbbBBBBcBBbb.....',
    '.....BBBBcBBBNNNNBBBcBBbb.....',
    '.....bBBBcBBBBbbBBBBcBBbb.....',
    '.....bBBbccBBBbbBBBccbBbc.....',
    '......cbbbbbbNNNNbbbbbbc......',
    '.......cccccccccccccccc.......',
    '........PPPPPPPPPPPPPP........',
    '........PPPPPPppPPPPPP........',
    '........PPPPPP..PPPPPP........',
    '........pPPPPp..pPPPPp........',
    '........pPPPPp..pPPPPp........',
    '........KKKKKK..KKKKKK........',
    '.......KkKKKKK..KkKKKKK.......',
    '.......KKKKKKK..KKKKKKK.......'
  ];
  var SW = 30, UPPER = 34;            // rows 0..33 (head, jacket, hem) rise and fall with the breath
  var COLORS = {
    H: '#221C2C', D: '#110E17', h: '#3F4C70', w: '#8495C0',
    S: '#F7D5C0', s: '#E3A991', R: '#F2989A', E: '#1C1522', M: '#8E4A3F',
    '1': '#3A2621', '2': '#6F4734', '3': '#B87C50', W: '#FFFFFF',
    B: '#BAD9F0', b: '#93B3CD', c: '#6D8DAA', L: '#E6F4FD', N: '#3B4760',
    P: '#BAB7B6', p: '#908C8B', K: '#2B2622', k: '#564C44',
    G: '#5AAE5F', g: '#7CC77A', T: '#8A5A2E', t: '#6B3F1F', Q: '#CFE8F7'
  };
  // the iris under the catchlights, per eye; null keeps the skin
  var IRIS_L = [['1', '1', '1', '1', 'E'], ['1', '1', '1', '2', '1'], ['2', '1', '1', '2', '2'], ['3', '2', '2', '3', '3'], [null, '3', '3', '3', null]];
  var IRIS_R = [['E', '1', '1', '1', '1'], ['1', '1', '1', '2', '1'], ['2', '1', '1', '2', '2'], ['3', '2', '2', '3', '3'], [null, '3', '3', '3', null]];
  var EYE_L = 8, EYE_R = 17, EYE_Y = 13;
  var RING = { y: 4, x0: 11, x1: 19 };   // the sheen; its sparkle pair rests at x 13-14
  // the right arm up out of its pocket, two frames of a wave
  var ARM_UP = [[21, 25, 'B'], [22, 25, 'B'], [22, 24, 'B'], [23, 24, 'b'], [22, 23, 'B'], [23, 23, 'b'], [23, 22, 'B'], [24, 22, 'b'], [23, 21, 'B'], [24, 21, 'b'], [24, 20, 'B'], [25, 20, 'b']];
  var HAND = [
    [[24, 19, 'L'], [25, 19, 'L'], [24, 18, 'S'], [25, 18, 'S'], [24, 17, 'S'], [25, 17, 'S'], [23, 18, 'S']],
    [[25, 19, 'L'], [26, 19, 'L'], [25, 18, 'S'], [26, 18, 'S'], [25, 17, 'S'], [26, 17, 'S'], [26, 16, 'S']]
  ];
  var GW = SW + 2, SH = SPRITE.length, GROUND = SH + 1, GH = GROUND + 5;
  if (SPRITE.some(function (r) { return r.length !== SW; })) return;

  /* ---- what the bubble says: facts from each section of each page ---- */
  var SAYS = {
    hello_world: "Hi! I'm Ariq. Crypto and blockchain CTFs, mostly.",
    selected_work: 'SecureVault encrypts files right in your browser.',
    latest_notes: 'Palumara is the long one: 17 minutes.',
    biography: "That's me in the photo. Same jacket.",
    achievements: 'Two podiums so far. Recursion 2.0 was the latest.',
    authored: 'I write challenges too. HOLOGY 9 was the last.',
    community: 'I lead Hack It Braw since September 2026.',
    on_repeat: 'Yorushika, Kenshi Yonezu, ZUTOMAYO. On repeat.',
    anime: 'Evangelion and Death Note, always.',
    writeups: '11 reports, 1,131 pages. Pull one off the shelf!',
    the_shelf: 'A thicker spine means more pages.',
    more_notes: 'Shorter notes live on HackMD.',
    notebook: 'Long posts, one challenge each.',
    posts: 'Try the search: lattice, RSA, Sui.',
    dashboard: 'Nothing here leaves your browser.',
    encrypt_file: 'AES-256-GCM, and no server involved.',
    introduction: 'Floating-point nonces, then lattices. Enjoy!',
    the_final_trap: "Careful, there's a trap at the end.",
    solver_and_execution: 'The flag is close now.'
  };
  var FACTS = ['2 podiums, 6 finals, 1 best writeup.', '11 writeups, 1,131 pages.', 'IT student at Universitas Brawijaya.', 'I lead Hack It Braw.', 'flag{you_found_me}'];

  /* ---- DOM: the sprite, the bubble and a fixed pool of effect nodes ---- */
  var STAR = '<svg viewBox="0 0 5 5" shape-rendering="crispEdges"><path d="M2 0h1v2h2v1H3v2H2V3H0V2h2z"/></svg>';
  var NOTE = '<svg viewBox="0 0 5 7" shape-rendering="crispEdges"><path d="M3 0h2v1H4v4H1V4H0V5h1v1h2V1h1z"/><path d="M0 4h3v2H0z"/></svg>';
  var DROP = '<svg viewBox="0 0 4 6" shape-rendering="crispEdges"><path d="M1 0h1v1h1v1h1v3H3v1H1V5H0V2h1z"/></svg>';
  var el = document.createElement('div');
  el.className = 'chibi';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<p class="chibi__bubble"><span class="chibi__text"></span></p>' +
    '<div class="chibi__body">' +
      '<canvas class="chibi__sprite" width="' + GW + '" height="' + GH + '"></canvas>' +
      '<span class="chibi__fx chibi__star chibi__star--1">' + STAR + '</span><span class="chibi__fx chibi__star chibi__star--2">' + STAR + '</span>' +
      '<span class="chibi__fx chibi__star chibi__star--3">' + STAR + '</span><span class="chibi__fx chibi__star chibi__star--4">' + STAR + '</span>' +
      '<span class="chibi__fx chibi__note chibi__note--1">' + NOTE + '</span><span class="chibi__fx chibi__note chibi__note--2">' + NOTE + '</span>' +
      '<span class="chibi__fx chibi__drop">' + DROP + '</span>' +
      '<span class="chibi__z chibi__z--1">z</span><span class="chibi__z chibi__z--2">z</span><span class="chibi__z chibi__z--3">Z</span>' +
      '<span class="chibi__bang">!</span>' +
    '</div>';
  document.body.appendChild(el);
  var body = el.querySelector('.chibi__body');
  var canvas = el.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var bubble = el.querySelector('.chibi__bubble');
  var text = el.querySelector('.chibi__text');
  var img = ctx.createImageData(GW, GH);
  var RGB = {};
  Object.keys(COLORS).forEach(function (k) { var h = COLORS[k]; RGB[k] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; });

  /* ---- state ---- */
  var s = {
    breath: 0, blink: false, wave: -1, look: [0, 0], mood: 'idle',   // idle | happy | sleep | yawn | shy
    asleep: false, sheen: -1, snot: 0, lastInput: Date.now(), lastBubble: 0, said: {}, ready: false, current: null
  };
  function night() { return root.getAttribute('data-theme') === 'dark'; }

  /* ---- drawing: compose the grid, outline it, stand it on the block ---- */
  function compose() {
    var grid = [], x, y, i, j;
    for (y = 0; y < GH; y++) grid.push(new Array(GW).fill(null));
    var dy = s.breath;
    function put(px, py, c) { px += 1; py += 1; if (px >= 0 && px < GW && py >= 0 && py < GH) grid[py][px] = c; }
    for (var r = SH - 1; r >= 0; r--) {
      var off = r < UPPER ? dy : 0;
      for (x = 0; x < SW; x++) { var c = SPRITE[r][x]; if (c !== '.') put(x, r + off, c); }
    }
    // the ahoge bobs a pixel with the breath
    if (dy && !reduce) { put(17, dy, null); put(18, dy, null); put(18, dy, 'H'); put(19, dy, 'D'); }
    // the sheen ring, and its sparkle (resting, or running along it)
    var sx = s.sheen >= 0 ? RING.x0 + s.sheen : 13;
    if (sx + 1 <= RING.x1) { put(sx, RING.y + dy, 'w'); put(sx + 1, RING.y + dy, 'w'); }
    // the waving arm leaves its pocket
    if (s.wave >= 0) {
      // the jacket's side stays; only the arm goes up
      for (y = 26; y <= 31; y++) { put(21, y + dy, 'B'); put(22, y + dy, 'b'); put(23, y + dy, 'c'); put(24, y + dy, null); }
      ARM_UP.concat(HAND[s.wave]).forEach(function (p) { put(p[0], p[1] + dy, p[2]); });
    }
    // eyes
    var closed = s.mood === 'sleep' || s.mood === 'yawn' || s.mood === 'happy' || s.blink;
    [[EYE_L, IRIS_L, 7], [EYE_R, IRIS_R, 22]].forEach(function (e) {
      var ex = e[0], ey = EYE_Y + dy, iris = e[1], flick = e[2];
      if (!closed) {
        for (j = 0; j < 5; j++) for (i = 0; i < 5; i++) if (iris[j][i]) put(ex + i, ey + j, iris[j][i]);
        var lx = s.look[0], hy = s.look[1] > 0 ? 1 : 0;
        put(ex + 1 + lx, ey + hy, 'W'); put(ex + 2 + lx, ey + hy, 'W'); put(ex + 1 + lx, ey + 1 + hy, 'W'); put(ex + 2 + lx, ey + 1 + hy, 'W');
        put(ex + 3 + lx, ey + 3, 'W');                                     // the small catchlight
        return;
      }
      // closed: the lash comes down; clear the eye to skin first
      for (j = -1; j <= 4; j++) for (i = -1; i <= 5; i++) { var cx = ex + i; if (cx >= 7 && cx <= 22 && !(cx > 12 && cx < 17)) put(cx, ey + j, 'S'); }
      if (s.mood === 'happy') {                                             // ^ ^
        put(ex + 1, ey + 1, 'E'); put(ex + 2, ey + 1, 'E'); put(ex + 3, ey + 1, 'E'); put(ex, ey + 2, 'E'); put(ex + 4, ey + 2, 'E');
      } else if (s.mood === 'sleep' || s.mood === 'yawn') {                 // a soft downward curve
        put(ex, ey + 2, 'E'); put(ex + 4, ey + 2, 'E'); put(ex + 1, ey + 3, 'E'); put(ex + 2, ey + 3, 'E'); put(ex + 3, ey + 3, 'E');
      } else {                                                              // a blink
        for (i = 0; i < 5; i++) put(ex + i, ey + 2, 'E');
        put(flick, ey + 3, 'E');                                        // the outer lashes point down
      }
    });
    // mouth and cheeks
    if (s.mood === 'happy') { for (i = 13; i <= 16; i++) put(i, 20 + dy, 'M'); put(14, 21 + dy, 'R'); put(15, 21 + dy, 'R'); }
    else if (s.mood === 'yawn') { put(14, 21 + dy, 'M'); put(15, 21 + dy, 'M'); }
    // asleep: the snot bubble swells and shrinks with the breath
    if (s.asleep && s.snot) {
      var bx = 16, by = 19 + dy;
      if (s.snot === 1) put(bx, by, 'Q');
      else if (s.snot === 2) { put(bx, by - 1, 'W'); put(bx + 1, by - 1, 'Q'); put(bx, by, 'Q'); put(bx + 1, by, 'Q'); }
      else { for (j = -2; j <= 0; j++) for (i = 0; i <= 2; i++) put(bx + i, by + j, 'Q'); put(bx, by - 2, 'W'); put(bx + 1, by - 2, 'W'); put(bx, by - 1, 'W'); }
    }
    // outline every empty cell touching the figure, then the grass block edge to edge
    var outline = [];
    for (y = 0; y < GROUND; y++) for (x = 0; x < GW; x++) {
      if (grid[y][x]) continue;
      if ((y > 0 && grid[y - 1][x]) || (y < GH - 1 && grid[y + 1][x]) || (x > 0 && grid[y][x - 1]) || (x < GW - 1 && grid[y][x + 1])) outline.push([x, y]);
    }
    outline.forEach(function (p) { grid[p[1]][p[0]] = 'O'; });
    for (y = GROUND; y < GH; y++) for (x = 0; x < GW; x++) {
      var k = y - GROUND;
      grid[y][x] = k === 0 ? ((x * 7) % 3 ? 'G' : 'g') : k === 1 ? ((x * 5 + 2) % 4 ? 'G' : 'T') : (((x * 3 + y * 5) % 5) ? 'T' : 't');
    }
    return grid;
  }
  function draw() {
    var grid = compose(), d = img.data;
    var line = night() ? [237, 231, 219] : [27, 26, 23];
    for (var y = 0; y < GH; y++) for (var x = 0; x < GW; x++) {
      var i4 = (y * GW + x) * 4, c = grid[y][x];
      if (!c) { d[i4 + 3] = 0; continue; }
      var v = c === 'O' ? line : RGB[c];
      d[i4] = v[0]; d[i4 + 1] = v[1]; d[i4 + 2] = v[2]; d[i4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ---- effects: restart a node's animation by toggling its class (never a new node) ---- */
  function fx(name, ms) {
    el.classList.remove('fx-' + name);
    void el.offsetWidth;
    el.classList.add('fx-' + name);
    clearTimeout(fx['t' + name]);
    fx['t' + name] = setTimeout(function () { el.classList.remove('fx-' + name); }, ms);
  }

  /* ---- the bubble: wipes in, types, stays a moment, goes ---- */
  var typeTimer = 0, hideTimer = 0;
  function say(msg, force) {
    var now = Date.now();
    if (!force && (s.asleep || !s.ready || now - s.lastBubble < 6000)) return false;
    s.lastBubble = now;
    clearInterval(typeTimer); clearTimeout(hideTimer);
    el.classList.add('is-talking');
    bubble.classList.remove('is-out');
    if (reduce) text.textContent = msg;
    else {
      var n = 0;
      text.textContent = '';
      typeTimer = setInterval(function () { n++; text.textContent = msg.slice(0, n); if (n >= msg.length) clearInterval(typeTimer); }, 22);
    }
    hideTimer = setTimeout(function () {
      bubble.classList.add('is-out');
      setTimeout(function () { el.classList.remove('is-talking'); bubble.classList.remove('is-out'); }, 160);
    }, 2600 + msg.length * 40);
    return true;
  }

  /* ---- moods ---- */
  var moodTimer = 0, napTimer = 0;
  function setMood(m, ms) {
    clearTimeout(moodTimer);
    s.mood = m;
    draw();
    if (ms) moodTimer = setTimeout(function () { s.mood = s.asleep ? 'sleep' : (body.matches(':hover') ? 'shy' : 'idle'); draw(); }, ms);
  }
  function sleep() {
    if (s.asleep) return;
    s.asleep = true; s.wave = -1; s.snot = 1;
    clearInterval(typeTimer); el.classList.remove('is-talking');
    setMood(reduce ? 'sleep' : 'yawn', 0);
    if (!reduce) setTimeout(function () { if (s.asleep) setMood('sleep', 0); }, 700);
    el.classList.add('is-asleep');
  }
  function wake(msg) {
    if (!s.asleep) return;
    s.asleep = false; s.snot = 0;
    el.classList.remove('is-asleep');
    setMood(body.matches(':hover') ? 'shy' : 'idle', 0);
    fx('bang', 520);
    if (msg) setTimeout(function () { say(msg, true); }, 160);
    // at night he only wakes for a moment, however he was woken (a tap has no pointerleave)
    if (night()) { clearTimeout(napTimer); napTimer = setTimeout(function () { if (night() && !body.matches(':hover')) sleep(); }, 5000); }
  }
  var waveTimer = 0;
  function wave(ms) {
    if (s.asleep || reduce) return;
    clearInterval(waveTimer);
    var t = 0;
    s.wave = 0; draw();
    waveTimer = setInterval(function () {
      t += 180;
      if (t >= ms) { clearInterval(waveTimer); s.wave = -1; draw(); return; }
      s.wave = s.wave ? 0 : 1; draw();
    }, 180);
  }
  // the hair gloss: the sparkle pair runs the length of the ring
  var sheenTimer = 0, nextSheen = Date.now() + 3500;
  function sheen() {
    if (reduce || s.asleep) return;
    clearInterval(sheenTimer);
    s.sheen = 0; draw();
    sheenTimer = setInterval(function () {
      s.sheen++;
      if (RING.x0 + s.sheen + 1 > RING.x1) { clearInterval(sheenTimer); s.sheen = -1; }
      draw();
    }, 70);
  }

  /* ---- the idle loop: eight ticks a second, paused with the tab ---- */
  var tick = 0, nextBlink = Date.now() + 2500;
  setInterval(function () {
    if (document.hidden) return;
    tick++;
    var now = Date.now(), changed = false;
    var period = s.asleep ? 8 : 4;
    var nb = reduce ? 0 : Math.floor(tick / period) % 2;
    if (nb !== s.breath) {
      s.breath = nb; changed = true;
      if (s.asleep) s.snot = reduce ? 2 : (s.snot % 3) + 1;                 // 1, 2, 3, 1 ... a breath per size
    }
    if (!reduce && !s.asleep && now >= nextBlink) {
      s.blink = true; changed = true;
      nextBlink = now + 2500 + Math.random() * 3000;
      setTimeout(function () { s.blink = false; draw(); }, 140);
    }
    if (!s.asleep && now >= nextSheen) { nextSheen = now + 5000 + Math.random() * 2500; sheen(); }
    if (!s.asleep && !night() && now - s.lastInput > 40000) sleep();
    if (changed) draw();
  }, 125);

  /* ---- input ---- */
  function noteInput() { s.lastInput = Date.now(); if (s.asleep && !night()) wake(); }
  ['pointerdown', 'keydown', 'scroll'].forEach(function (t) { window.addEventListener(t, noteInput, { passive: true }); });

  if (fine && !reduce) {
    // the catchlights follow the pointer, a pixel each way
    var lookRaf = 0, px = 0, py = 0;
    window.addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      noteInput();
      if (lookRaf) return;
      lookRaf = requestAnimationFrame(function () {
        lookRaf = 0;
        var r = canvas.getBoundingClientRect();
        var dx = px - (r.left + r.width * 15.5 / GW), dyy = py - (r.top + r.height * 15 / GH);
        var lx = dx < -48 ? -1 : dx > 48 ? 1 : 0, ly = dyy > 64 ? 1 : 0;
        if (body.matches(':hover')) { lx = 0; ly = 0; }
        if (lx !== s.look[0] || ly !== s.look[1]) { s.look = [lx, ly]; draw(); }
      });
    }, { passive: true });
    // a wave at the link under the pointer, at most every 8 seconds
    var lastWave = 0;
    document.addEventListener('pointerover', function (e) {
      var a = e.target.closest && e.target.closest('main a, footer a');
      if (!a || !s.ready || Date.now() - lastWave < 8000) return;
      lastWave = Date.now();
      wave(900);
    });
    // music notes over the tracks
    document.addEventListener('pointerover', function (e) {
      if (!s.asleep && e.target.closest && e.target.closest('.track')) fx('notes', 1700);
    });
  }

  // hover: he looks right at you
  body.addEventListener('pointerenter', function () {
    s.look = [0, 0];
    if (s.asleep) wake(night() ? 'zzz... oh, still up?' : null);
    if (s.mood === 'idle') setMood('shy', 0); else draw();
  });
  body.addEventListener('pointerleave', function () {
    if (s.mood === 'shy') setMood('idle', 0);
    clearTimeout(napTimer);
    if (night()) napTimer = setTimeout(sleep, 4000);
  });
  // click: a hop with speed lines, a grin, sparkles at the top of the hop, a fact; three quick clicks fluster him
  var factIx = Math.floor(Math.random() * FACTS.length), clicks = [], restUntil = 0, starTimer = 0, sayTimer = 0;
  body.addEventListener('click', function () {
    var now = Date.now();
    s.lastInput = now;
    if (now < restUntil) return;
    if (s.asleep) wake();
    // a new click cancels the last one's pending sparkle and line, so reactions never land out of order
    clearTimeout(starTimer); clearTimeout(sayTimer);
    clicks = clicks.filter(function (t) { return now - t < 2500; }).concat(now);
    if (clicks.length >= 3) {
      clicks = []; restUntil = now + 1500;
      el.classList.remove('fx-stars');
      setMood('shy', 1500); fx('drop', 1000);
      say('Okay, okay!', true);
      return;
    }
    if (!reduce) { body.classList.remove('is-hop'); void body.offsetWidth; body.classList.add('is-hop'); fx('lines', 300); }
    setMood('happy', 1100);
    starTimer = setTimeout(function () { fx('stars', 700); }, reduce ? 0 : 130);
    factIx = (factIx + 1) % FACTS.length;
    sayTimer = setTimeout(function () { say(FACTS[factIx], true); }, reduce ? 0 : 120);
  });

  // a bubble for the section in view (site.js reports it on every scroll frame)
  function sectionSay() {
    var name = s.current;
    if (!name || !SAYS[name] || s.said[name]) return;
    if (say(SAYS[name])) { s.said[name] = true; if (name === 'on_repeat') fx('notes', 1700); }
  }
  document.addEventListener('section:update', function (e) { s.current = e.detail && e.detail.name; sectionSay(); });

  // the theme: night puts him to bed, morning wakes him with a sparkle
  document.addEventListener('prefs:change', function (e) {
    if (e.detail.key !== 'theme') return;
    if (e.detail.value === 'dark') sleep();
    else if (s.asleep) { s.lastInput = Date.now(); wake('Morning!'); setTimeout(function () { fx('stars', 700); }, 120); }
    draw();
  });

  // phones: duck while the page scrolls, come back when it stops
  if (!fine) {
    var tuckTimer = 0;
    window.addEventListener('scroll', function () {
      el.classList.add('is-tucked');
      clearTimeout(tuckTimer);
      tuckTimer = setTimeout(function () { el.classList.remove('is-tucked'); }, 700);
    }, { passive: true });
  }

  // previews and tests can set a pose: window.pxChibi.pose({ mood: 'happy', wave: 0 })
  window.pxChibi = { pose: function (o) { Object.keys(o).forEach(function (k) { s[k] = o[k]; }); draw(); }, state: s };

  /* ---- start ---- */
  if (night()) { s.asleep = true; s.mood = 'sleep'; s.snot = 1; el.classList.add('is-asleep'); }
  draw();
  function begin() {
    if (firstVisit && !reduce && !night()) {
      el.classList.add('is-enter');
      setTimeout(function () {
        s.ready = true;
        fx('stars', 700);                                                   // he lands with a sparkle
        wave(1100);
        if (say(SAYS.hello_world, true)) s.said.hello_world = true;
      }, 440);
    } else {
      setTimeout(function () { s.ready = true; sectionSay(); }, 2500);       // the first word waits a moment
    }
  }
  if (root.classList.contains('pt-enter')) {
    var started = false;
    var go = function () { if (!started) { started = true; begin(); } };
    document.addEventListener('pt:reveal', go, { once: true });
    setTimeout(go, 1900);
  } else begin();
})();
