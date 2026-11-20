/* Pixel page transition.
   Cover (leaving): the screen fills cell by cell, left to right, broken up by an 8x8 Bayer matrix so the wipe
   front is dithered, not a straight edge. The flag runs in from the left with the front and stops at the centre
   holding the destination, flag{about}. Then the browser navigates.
   Uncover (arriving): the same cells clear in the same order while the flag runs on to the right edge, where the
   rail flag lives. The first page of a visit plays the uncover as the intro, flag{hello_world}.
   Cells are the paper checker's own 24px, so the transition is made of the page's texture.
   Skipped entirely under reduced motion; links work normally without this script. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { root.classList.remove('pt-enter'); return; }

  var BAYER = [
    [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
  ];
  var css = getComputedStyle(root);
  var num = function (name, fallback) { var v = parseFloat(css.getPropertyValue(name)); return isNaN(v) ? fallback : v; };
  var CELL = num('--px-cell', 24);
  var COVER = num('--dur-cover', 460);
  var UNCOVER = num('--dur-uncover', 560);

  // overlay
  var el = document.createElement('div');
  el.className = 'pt';
  el.setAttribute('aria-hidden', 'true');
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var flagSvg = '<svg viewBox="0 0 10 12" shape-rendering="crispEdges">' +
    '<g class="flag__pole"><rect x="1" y="0" width="1" height="12"/><rect x="0" y="11" width="3" height="1"/></g>' +
    '<g class="flag__a"><g class="flag__cloth"><rect x="2" y="1" width="5" height="1"/><rect x="2" y="2" width="6" height="1"/><rect x="2" y="3" width="7" height="1"/><rect x="2" y="4" width="6" height="1"/><rect x="2" y="5" width="4" height="1"/></g><rect class="flag__shade" x="2" y="5" width="2" height="1"/></g>' +
    '<g class="flag__b"><g class="flag__cloth"><rect x="2" y="1" width="6" height="1"/><rect x="2" y="2" width="7" height="1"/><rect x="2" y="3" width="6" height="1"/><rect x="2" y="4" width="5" height="1"/><rect x="2" y="5" width="6" height="1"/></g><rect class="flag__shade" x="2" y="4" width="3" height="1"/></g>' +
    '</svg>';
  el.innerHTML = '<div class="pt__flag">' + flagSvg + '</div><p class="pt__label"></p>';
  el.insertBefore(canvas, el.firstChild);
  document.body.appendChild(el);
  var flag = el.querySelector('.pt__flag');
  var label = el.querySelector('.pt__label');

  var cols = 0, rows = 0, thresholds = null, dpr = 1, w = 0, h = 0;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
    thresholds = new Float32Array(cols * rows);
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        // 58% position (left to right), 42% ordered dither: the front is a band of scattered cells
        thresholds[y * cols + x] = 0.58 * (x / Math.max(1, cols - 1)) + 0.42 * (BAYER[y % 8][x % 8] / 63);
      }
    }
  }
  function ink() { return getComputedStyle(root).getPropertyValue('--ink').trim() || '#1B1A17'; }

  // draw: filled where the cell's threshold is under p (cover) or over p (uncover)
  function draw(p, covering) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = ink();
    ctx.beginPath();
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var t = thresholds[y * cols + x];
        if (covering ? t <= p : t > p) ctx.rect(x * CELL, y * CELL, CELL, CELL);
      }
    }
    ctx.fill();
  }
  var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var flagW = function () { return flag.getBoundingClientRect().width || 60; };

  function run(duration, frame, done) {
    var start = performance.now();
    function tick(now) {
      var t = Math.min(1, (now - start) / duration);
      frame(easeInOut(t), t);
      if (t < 1) requestAnimationFrame(tick); else if (done) done();
    }
    requestAnimationFrame(tick);
  }

  var busy = false;
  function cover(text, then) {
    busy = true;
    size();
    label.textContent = text;
    el.classList.add('is-active', 'is-covering');
    var fw = flagW();
    run(COVER, function (p, t) {
      draw(p * 1.02, true);
      // the flag runs with the front and stops at the centre
      var x = -fw + (w / 2 - fw / 2 + fw) * Math.min(1, p * 1.08);
      flag.style.transform = 'translate3d(' + Math.round(x) + 'px,0,0)';
      if (t > 0.45) el.classList.add('is-labelled');
    }, function () { setTimeout(then, 90); });
  }

  function uncover(text) {
    size();
    label.textContent = text;
    el.classList.add('is-active', 'is-labelled');
    var fw = flagW();
    draw(-1, false);                                   // every cell covered, including threshold 0
    flag.style.transform = 'translate3d(' + Math.round(w / 2 - fw / 2) + 'px,0,0)'; // hold at the centre
    root.classList.remove('pt-enter');
    // hold one beat with the label, then clear: the label leaves first, the flag runs on to the right edge
    setTimeout(function () {
      el.classList.remove('is-labelled');
      setTimeout(function () { document.dispatchEvent(new CustomEvent('pt:reveal')); }, 160);
      run(UNCOVER, function (p) {
        draw(p * 1.04 - 0.02, false);
        var x = (w / 2 - fw / 2) + (w / 2 + fw) * p;
        flag.style.transform = 'translate3d(' + Math.round(x) + 'px,0,0)';
      }, function () {
        el.classList.remove('is-active', 'is-covering');
        ctx.clearRect(0, 0, w, h);
        busy = false;
      });
    }, 220);
  }

  // destination name for the label
  function nameFor(url) {
    var path = url.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '/index');
    var last = path.split('/').filter(Boolean).pop() || 'index';
    last = last.replace(/\.html$/, '');
    var map = { index: 'home', about: 'about', securevault: 'securevault', writeups: 'writeups', blog: 'blog' };
    if (path.indexOf('/blog/') !== -1) return last === 'index' ? 'blog' : last.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    return map[last] || last.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor
    if (busy) { e.preventDefault(); return; }
    e.preventDefault();
    var text = 'flag{' + nameFor(url) + '}';
    try { sessionStorage.setItem('pt-label', text); } catch (err) { /* the next page simply opens without the uncover */ }
    cover(text, function () { location.href = url.href; });
  });

  // arriving: from a transition, or the first page of the visit
  var incoming = null;
  try {
    incoming = sessionStorage.getItem('pt-label');
    if (!incoming && !sessionStorage.getItem('pt-seen')) incoming = 'flag{hello_world}';
    sessionStorage.removeItem('pt-label');
    sessionStorage.setItem('pt-seen', '1');
  } catch (err) { incoming = null; }
  if (incoming) { busy = true; uncover(incoming); } else { root.classList.remove('pt-enter'); document.dispatchEvent(new CustomEvent('pt:reveal')); }

  // back/forward cache: never come back to a covered page
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      el.classList.remove('is-active', 'is-covering', 'is-labelled');
      ctx.clearRect(0, 0, w, h);
      root.classList.remove('pt-enter');
      busy = false;
    }
  });
  window.addEventListener('resize', function () { if (!busy) size(); });
})();
