/* Notes: hovering a note decrypts its title and opens a small preview window that follows the cursor,
   its picture resolving from coarse pixels (6, 12, 24, 48, then the image). The preview is decorative
   (aria-hidden): every note is a plain link whose title, date and summary are written out. Fine pointers
   only; touch and keyboard get the strip's own inversion and nothing that follows a cursor. */
(function () {
  'use strict';
  var lists = Array.prototype.slice.call(document.querySelectorAll('[data-notes]'));
  if (!lists.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  lists.forEach(function (list) {
    list.querySelectorAll('.note').forEach(function (note) {
      note.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        var title = note.querySelector('.note__title');
        if (title && window.pxDecrypt) window.pxDecrypt(title);
      });
    });
  });
  if (!fine) return;

  /* ---- the preview window: one per page, built here because it is decoration ---- */
  var peek = document.createElement('div');
  peek.className = 'note-peek';
  peek.setAttribute('aria-hidden', 'true');
  peek.innerHTML =
    '<div class="note-peek__win">' +
      '<p class="note-peek__bar micro"><span class="note-peek__cap"></span><span class="note-peek__dot"></span></p>' +
      '<div class="note-peek__img"><img alt="" width="1200" height="750"><canvas></canvas></div>' +
    '</div>';
  document.body.appendChild(peek);
  var cap = peek.querySelector('.note-peek__cap');
  var box = peek.querySelector('.note-peek__img');
  var img = box.querySelector('img');
  var canvas = box.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var small = document.createElement('canvas');
  var sctx = small.getContext('2d');

  var cache = {};
  function preload(list) {
    list.querySelectorAll('[data-peek]').forEach(function (n) {
      var src = n.dataset.peek;
      if (!cache[src]) { var i = new Image(); i.src = src; cache[src] = i; }
    });
  }

  /* cover-fit from the top, like the img's object-position */
  function paint(source, n) {
    var rect = box.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (!w || !h) return;
    canvas.width = w; canvas.height = h;
    var cols = n, rows = Math.max(1, Math.round(n * h / w));
    small.width = cols; small.height = rows;
    var sw = source.naturalWidth, sh = source.naturalHeight;
    var scale = Math.max(w / sw, h / sh);
    var cw = w / scale, ch = h / scale;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(source, (sw - cw) / 2, 0, cw, ch, 0, 0, cols, rows);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, cols, rows, 0, 0, w, h);
  }

  var shown = '', timer = 0;
  function resolve(src, source) {
    var finish = function () { img.src = src; box.classList.remove('is-resolving'); };
    if (reduce) { finish(); return; }
    var steps = [6, 12, 24, 48], i = 0;
    box.classList.add('is-resolving');
    paint(source, steps[i++]);
    timer = setInterval(function () {
      if (i < steps.length) paint(source, steps[i++]);
      else { clearInterval(timer); finish(); }
    }, 60);
  }
  function show(src) {
    if (src === shown) return;
    shown = src;
    clearInterval(timer);
    var source = cache[src];
    if (!source) { source = cache[src] = new Image(); source.src = src; }
    if (source.complete && source.naturalWidth) {
      // the window takes the picture's own shape (within reason), so a wide cover is not cropped to a narrow box
      box.style.aspectRatio = String(Math.min(2.4, Math.max(1.3, source.naturalWidth / source.naturalHeight)));
      resolve(src, source);
      return;
    }
    // not loaded yet: resolve as soon as it is, if this note is still the one under the cursor
    box.classList.add('is-resolving');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    source.addEventListener('load', function () {
      if (shown !== src) return;
      box.style.aspectRatio = String(Math.min(2.4, Math.max(1.3, source.naturalWidth / source.naturalHeight)));
      resolve(src, source);
    }, { once: true });
  }

  /* ---- following: across with the cursor, sitting just above the hovered strip so it never covers that
     strip's own title; eased, and snapped to the 2px pixel grid ---- */
  var GAP = 14, EDGE = 12;
  var px = 0, py = 0, tx = 0, ty = 0, raf = 0, last = 0, on = false, hot = null, cx0 = 0;
  function target(cx) {
    if (!hot) return;
    cx0 = cx;
    var w = peek.offsetWidth, h = peek.offsetHeight;
    var r = hot.getBoundingClientRect();
    var right = cx + GAP + w <= window.innerWidth - EDGE;
    var above = r.top - GAP - h >= EDGE;
    tx = right ? cx + GAP : cx - GAP - w;
    ty = above ? r.top - GAP - h : r.bottom + GAP;
    peek.style.setProperty('--origin', (right ? '0%' : '100%') + ' ' + (above ? '100%' : '0%'));
  }
  function draw() {
    var sx = Math.round(px / 2) * 2, sy = Math.round(py / 2) * 2;
    peek.style.transform = 'translate3d(' + sx + 'px,' + sy + 'px,0)';
  }
  function tick(now) {
    var dt = Math.min(64, now - (last || now)); last = now;
    var k = 1 - Math.pow(1 - 0.2, dt / 16.67);   // the same chase at any frame rate
    px += (tx - px) * k; py += (ty - py) * k;
    draw();
    if (on || Math.abs(tx - px) > 0.5 || Math.abs(ty - py) > 0.5) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  function run() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

  lists.forEach(function (list) {
    var notes = list.querySelectorAll('.note[data-peek]');
    if (!notes.length) return;
    // fetch the pictures while the list is still coming up the screen, so the first hover can resolve
    if ('IntersectionObserver' in window) {
      var near = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { near.disconnect(); preload(list); }
      }, { rootMargin: '400px 0px' });
      near.observe(list);
    } else preload(list);
    notes.forEach(function (note) {
      note.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        hot = note;
        cap.textContent = note.dataset.peekCap || '';
        show(note.dataset.peek);
        target(e.clientX);
        if (!on) { px = tx; py = ty; draw(); }   // first appearance: in place, not flying in from a corner
        on = true;
        peek.classList.add('is-on');
        if (reduce) { px = tx; py = ty; draw(); } else run();
      });
    });
    // on the list, not the notes, so the window keeps following across the gaps between strips
    list.addEventListener('pointermove', function (e) {
      if (!on || e.pointerType !== 'mouse') return;
      target(e.clientX);
      if (reduce) { px = tx; py = ty; draw(); } else run();
    });
    list.addEventListener('pointerleave', function () {
      on = false;
      peek.classList.remove('is-on');
    });
  });
  // scrolling under a still cursor: the window keeps to its strip, or goes when the list has scrolled away
  window.addEventListener('scroll', function () {
    if (!on) return;
    if (!lists.some(function (l) { return l.matches(':hover'); })) { on = false; peek.classList.remove('is-on'); return; }
    target(cx0);
    if (reduce) { px = tx; py = ty; draw(); } else run();
  }, { passive: true });
})();
