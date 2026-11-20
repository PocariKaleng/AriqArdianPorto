/* Pixel parts: 10x10 icons drawn from character maps, and the community timeline's month cells with a hover
   readout. Icons are decorative (aria-hidden); every fact they sit beside is written out as text. */
(function () {
  'use strict';
  var ICONS = {
    trophy: [
      '..######..', '.########.', '##.####.##', '##.####.##', '.########.',
      '..######..', '....##....', '....##....', '..######..', '..######..'
    ],
    flag: [
      '.#######..', '.########.', '.#######..', '.######...', '.#........',
      '.#........', '.#........', '.#........', '.#........', '###.......'
    ],
    scroll: [
      '.#######..', '.#.....##.', '.#.###..#.', '.#......#.', '.#.####.#.',
      '.#......#.', '.#.###..#.', '.#......#.', '.########.', '..........'
    ],
    pen: [
      '.......##.', '......####', '.....####.', '....####..', '...####...',
      '..####....', '.####.....', '.##.......', '##........', '#.........'
    ],
    arrow: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
    // notes: the post's category (key = cryptography, chained blocks = blockchain) or where the notes live
    key: [
      '..........', '..........', '..........', '.###......', '#...#.....',
      '#...######', '#...#..#.#', '.###...#.#', '..........', '..........'
    ],
    block: [
      '..........', '####......', '#..#......', '#..####...', '####..#...',
      '...#..####', '...####..#', '......#..#', '......####', '..........'
    ],
    note: [
      '.########.', '.#......#.', '.#.####.#.', '.#......#.', '.#.####.#.',
      '.#......#.', '.#.##...#.', '.#......#.', '.########.', '..........'
    ],
    branch: [
      '###...###.', '#.#...#.#.', '###...###.', '.#.....#..', '.#....#...',
      '.#...#....', '.#..#.....', '####......', '#.#.......', '###.......'
    ],
    // a record, for a track whose cover Last.fm does not have
    disc: [
      '..######..', '.#......#.', '#..###...#', '#.#....#.#', '#.#.##.#.#',
      '#.#.##.#.#', '#.#....#.#', '#..####..#', '.#......#.', '..######..'
    ]
  };
  // the second frame each icon flips to while its tile is hovered
  var FRAMES = {
    trophy: [
      '.########.', '##.####.##', '##.####.##', '.########.', '..######..',
      '....##....', '....##....', '....##....', '..######..', '..######..'
    ],
    flag: [
      '.######...', '.#######..', '.########.', '.#######..', '.#........',
      '.#........', '.#........', '.#........', '.#........', '###.......'
    ],
    scroll: [
      '.#######..', '.#.....##.', '.#.####.#.', '.#......#.', '.#.##...#.',
      '.#......#.', '.#.####.#.', '.#......#.', '.########.', '..........'
    ],
    pen: [
      '..........', '.......##.', '......####', '.....####.', '....####..',
      '...####...', '..####....', '.####.....', '.##.......', '##........'
    ],
    // the key turns (teeth flip above the shaft)
    key: [
      '..........', '..........', '.......#.#', '.###...#.#', '#...#.....',
      '#...######', '#...#.....', '.###......', '..........', '..........'
    ],
    // the middle block fills: a block being mined into the chain
    block: [
      '..........', '####......', '#..#......', '#..####...', '#######...',
      '...#######', '...####..#', '......#..#', '......####', '..........'
    ],
    // the last line finishes writing
    note: [
      '.########.', '.#......#.', '.#.####.#.', '.#......#.', '.#.####.#.',
      '.#......#.', '.#.####.#.', '.#......#.', '.########.', '..........'
    ],
    // a commit lands on the branch: its node fills
    branch: [
      '###...###.', '#.#...###.', '###...###.', '.#.....#..', '.#....#...',
      '.#...#....', '.#..#.....', '####......', '#.#.......', '###.......'
    ],
    // the record turns: the gap in its groove moves round
    disc: [
      '..######..', '.#......#.', '#..####..#', '#.#....#.#', '#.#.##.#.#',
      '#.#.##.#.#', '#.#....#.#', '#...###..#', '.#......#.', '..######..'
    ]
  };
  function rectsFor(map) {
    var r = '';
    map.forEach(function (row, y) {
      // merge horizontal runs into one rect each
      var x = 0;
      while (x < row.length) {
        if (row[x] === '#') {
          var s = x;
          while (x < row.length && row[x] === '#') x++;
          r += '<rect x="' + s + '" y="' + y + '" width="' + (x - s) + '" height="1"/>';
        } else x++;
      }
    });
    return r;
  }
  function svgFor(name) {
    if (!ICONS[name]) return '';
    var f2 = FRAMES[name] ? '<g class="f2">' + rectsFor(FRAMES[name]) + '</g>' : '';
    var map = ICONS[name];
    return '<svg viewBox="0 0 ' + map[0].length + ' ' + map.length + '" shape-rendering="crispEdges" fill="currentColor"><g class="f1">' + rectsFor(map) + '</g>' + f2 + '</svg>';
  }
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = svgFor(el.dataset.icon);
    el.setAttribute('aria-hidden', 'true');
  });

  /* ---- achievement unlock delays: a wave in reading order whose gaps shrink (ease-out on the delays) ---- */
  var tiles = document.querySelectorAll('.ach__tile');
  tiles.forEach(function (t, i) {
    var x = tiles.length > 1 ? i / (tiles.length - 1) : 0;
    t.style.setProperty('--d', Math.round(480 * (1 - (1 - x) * (1 - x))) + 'ms');
  });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePtr = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- hover: the tile's label decrypts from cipher glyphs, left to right (fine pointers, motion allowed) ---- */
  var GLYPHS = '#$%&*+=?/<>01';
  function decrypt(el) {
    if (el._run) return;
    var final = el.textContent;
    var start = performance.now(), dur = 340;
    el._run = true;
    (function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var settled = Math.floor(t * final.length);
      var out = '';
      for (var i = 0; i < final.length; i++) {
        out += (i < settled || final[i] === ' ') ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(frame); else { el.textContent = final; el._run = false; }
    })(start);
  }
  window.pxDecrypt = (finePtr && !reduce) ? decrypt : function () {};
  if (finePtr && !reduce) {
    document.querySelectorAll('.ach__tile, .chal').forEach(function (tile) {
      tile.addEventListener('pointerenter', function () {
        tile.querySelectorAll('[data-scramble-text]').forEach(decrypt);
      });
    });
  }

  /* ---- album art as pixel art; hovering the track resolves it to the full picture in four steps ---- */
  // exposed so cards built later (the Last.fm tracks) get the same treatment
  function pixelArt(box) {
    var img = box.querySelector('img');
    if (!img || box._px) return;
    box._px = true;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    var small = document.createElement('canvas');
    var sctx = small.getContext('2d');
    var res = 12, timer = 0;
    function paint(n) {
      var size = Math.round(box.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2)) || 300;
      canvas.width = canvas.height = size;
      small.width = small.height = n;
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(img, 0, 0, n, n);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, n, n, 0, 0, size, size);
    }
    function ready() {
      try { paint(res); } catch (e) { return; }
      box.appendChild(canvas);
      box.classList.add('is-pixel');
      var link = box.closest('a') || box;
      link.addEventListener('pointerenter', function () {
        if (reduce) { box.classList.add('is-sharp'); return; }
        var steps = [24, 48, 96], i = 0;
        clearInterval(timer);
        timer = setInterval(function () {
          if (i < steps.length) paint(steps[i++]);
          else { clearInterval(timer); box.classList.add('is-sharp'); }
        }, 70);
      });
      link.addEventListener('pointerleave', function () {
        clearInterval(timer);
        box.classList.remove('is-sharp');
        paint(res);
      });
    }
    if (img.complete && img.naturalWidth) ready(); else img.addEventListener('load', ready, { once: true });
  }
  window.pxArt = pixelArt;
  window.pxIcon = svgFor;
  document.querySelectorAll('[data-pixel-art]').forEach(pixelArt);

  /* ---- polaroid frame light: the svg is sized to the real box, so the dash pattern keeps true lengths ---- */
  document.querySelectorAll('[data-run]').forEach(function (svg) {
    var rects = svg.querySelectorAll('rect');
    var stroke = 4;
    function fit() {
      var b = svg.getBoundingClientRect();
      var w = Math.round(b.width), h = Math.round(b.height);
      if (!w || !h) return;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      rects.forEach(function (rect) {
        rect.setAttribute('x', stroke / 2); rect.setAttribute('y', stroke / 2);
        rect.setAttribute('width', w - stroke); rect.setAttribute('height', h - stroke);
      });
    }
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(svg);
  });

  /* ---- polaroid: the photo develops once when it scrolls in (coarse pixels, washed out, then sharp) ---- */
  document.querySelectorAll('[data-develop]').forEach(function (fig) {
    if (reduce || !('IntersectionObserver' in window)) return;
    var box = fig.querySelector('.polaroid__photo');
    var img = box && box.querySelector('img');
    if (!img) return;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    var small = document.createElement('canvas');
    var sctx = small.getContext('2d');
    function paint(n) {
      var r = box.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
      canvas.width = w; canvas.height = h;
      var cols = n, rows = Math.max(1, Math.round(n * h / w));
      small.width = cols; small.height = rows;
      var sw = img.naturalWidth, sh = img.naturalHeight;
      var scale = Math.max(w / sw, h / sh), cw = w / scale, ch = h / scale;
      var sx = (sw - cw) * 0.5, sy = (sh - ch) * 0.3;          // the img's object-position: 50% 30%
      sctx.imageSmoothingEnabled = true;
      sctx.drawImage(img, sx, sy, cw, ch, 0, 0, cols, rows);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(small, 0, 0, cols, rows, 0, 0, w, h);
    }
    function develop() {
      var steps = [6, 10, 18, 32, 60], i = 0;
      try { paint(steps[i++]); } catch (e) { return; }
      box.appendChild(canvas);
      box.classList.add('develop-wash');
      var timer = setInterval(function () {
        if (i < steps.length) paint(steps[i++]);
        else { clearInterval(timer); canvas.remove(); }
      }, 140);
    }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      if (img.complete && img.naturalWidth) develop(); else img.addEventListener('load', develop, { once: true });
    }, { threshold: 0.35 });
    io.observe(fig);
  });

  /* ---- community timeline: data-segments="start-end:kind,..." with months counted from the axis start ---- */
  var tl = document.querySelector('[data-timeline]');
  if (!tl) return;
  var months = parseInt(tl.dataset.months, 10);
  var start = tl.dataset.start.split('-').map(Number); // [year, month]
  var NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthName(i) {
    var m = start[1] - 1 + (i - 1);
    return NAMES[m % 12] + ' ' + (start[0] + Math.floor(m / 12));
  }
  var KIND = { member: 'Member or staff', lead: 'Lead' };
  var tip = document.createElement('div');
  tip.className = 'tl__tip';
  tip.setAttribute('aria-hidden', 'true');
  tl.appendChild(tip);

  tl.querySelectorAll('[data-segments]').forEach(function (bar, r) {
    var kinds = new Array(months + 1);
    bar.dataset.segments.split(',').forEach(function (seg) {
      var parts = seg.split(':');
      var range = parts[0].split('-').map(Number);
      for (var i = range[0]; i <= range[1]; i++) kinds[i] = parts[1];
    });
    var who = bar.dataset.name;
    for (var i = 1; i <= months; i++) {
      var c = document.createElement('span');
      c.className = 'tl__cell' + (kinds[i] ? ' tl__cell--' + kinds[i] : '');
      c.style.setProperty('--c', i - 1);
      c.style.setProperty('--r', r);
      if (kinds[i]) c.dataset.tip = who + ' · ' + KIND[kinds[i]] + ' · ' + monthName(i);
      if (kinds[i] && i === months) c.classList.add('tl__cell--now');   // still going
      bar.appendChild(c);
    }
  });

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    tl.addEventListener('pointerover', function (e) {
      var c = e.target.closest('.tl__cell[data-tip]');
      if (!c) { tip.classList.remove('is-on'); return; }
      tip.textContent = c.dataset.tip;
      var tr = tl.getBoundingClientRect(), cr = c.getBoundingClientRect();
      tip.style.left = (cr.left - tr.left + cr.width / 2) + 'px';
      tip.style.top = (cr.top - tr.top) + 'px';
      tip.classList.add('is-on');
    });
    tl.addEventListener('pointerleave', function () { tip.classList.remove('is-on'); });
  }
})();
