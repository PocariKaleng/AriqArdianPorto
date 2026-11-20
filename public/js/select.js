/* Project select: hovering or focusing a menu row makes it current; the screen swaps to its picture by
   resolving from coarse pixels (8, 16, 32, 64, then the image). Arrow keys move through the menu.
   Every row is a plain link with its description inside, so the menu works without this script. */
(function () {
  'use strict';
  var root = document.querySelector('[data-select]');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rows = Array.prototype.slice.call(root.querySelectorAll('.sel'));
  var screen = root.querySelector('[data-screen]');
  var img = root.querySelector('[data-screen-img]');
  var desc = root.querySelector('[data-screen-desc]');
  var tags = root.querySelector('[data-screen-tags]');
  var cta = root.querySelector('[data-screen-cta]');
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var small = document.createElement('canvas');
  var sctx = small.getContext('2d');
  screen.appendChild(canvas);
  var current = null, timer = 0;
  var cache = {};
  rows.forEach(function (r) { var i = new Image(); i.src = r.dataset.shot; cache[r.dataset.shot] = i; });

  function paint(source, n) {
    var rect = screen.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (!w || !h) return;   // the screen is hidden on phones: nothing to paint, and a 0px canvas would throw
    canvas.width = w; canvas.height = h;
    var cols = n, rowsN = Math.max(1, Math.round(n * h / w));
    small.width = cols; small.height = rowsN;
    // cover-fit from the top, like the img's object-position
    var sw = source.naturalWidth, sh = source.naturalHeight;
    var scale = Math.max(w / sw, h / sh);
    var cw = w / scale, ch = h / scale;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(source, (sw - cw) / 2, 0, cw, ch, 0, 0, cols, rowsN);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, cols, rowsN, 0, 0, w, h);
  }

  function select(row) {
    if (row === current) return;
    if (current) current.classList.remove('is-current');
    current = row;
    row.classList.add('is-current');
    desc.textContent = row.dataset.desc;
    tags.textContent = row.dataset.tags;
    cta.textContent = row.dataset.cta;
    var source = cache[row.dataset.shot];
    clearInterval(timer);
    var finish = function () { img.src = row.dataset.shot; screen.classList.remove('is-resolving'); };
    if (reduce || !source || !source.complete || !source.naturalWidth) { finish(); return; }
    var steps = [8, 16, 32, 64], i = 0;
    screen.classList.add('is-resolving');
    paint(source, steps[i++]);
    timer = setInterval(function () {
      if (i < steps.length) paint(source, steps[i++]);
      else { clearInterval(timer); finish(); }
    }, 65);
  }

  rows.forEach(function (row, i) {
    row.addEventListener('pointerenter', function () {
      select(row);
      var name = row.querySelector('.sel__name');
      if (name && window.pxDecrypt) window.pxDecrypt(name);
    });
    row.addEventListener('focus', function () { select(row); });
    row.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var next = rows[(i + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length];
        next.focus();
      }
    });
  });
  rows[0].classList.add('is-current');
  current = rows[0];

  /* entrance: power on once, when the frame scrolls into view; then resolve the first picture */
  function powerOn() {
    root.classList.add('is-on');
    if (reduce) return;
    setTimeout(function () { var first = current; current = null; select(first); }, 380);
  }
  if (reduce || !('IntersectionObserver' in window)) powerOn();
  else {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); powerOn(); }
    }, { threshold: 0.01, rootMargin: '0px 0px -12% 0px' });   // a tall phone stack powers on as soon as its top shows
    io.observe(root);
  }
})();
