/* Signature: a pixel flag that runs along the right-edge rail (the bottom edge on a phone) and plants itself at
   each section, saying flag{section}. On the project page it rides the minimap and stops at the screen in view.
   Decorative only (aria-hidden); under reduced motion it jumps instead of running and does not wave. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 899px)');
  var root = document.documentElement;

  // 10 x 12 sprite: pole and foot in ink, cloth in the accent, two wave frames
  function rects(list, cls) {
    return '<g class="' + cls + '">' + list.map(function (r) {
      return '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="1"/>';
    }).join('') + '</g>';
  }
  var frameA = [[2, 1, 5], [2, 2, 6], [2, 3, 7], [2, 4, 6], [2, 5, 4]];
  var frameB = [[2, 1, 6], [2, 2, 7], [2, 3, 6], [2, 4, 5], [2, 5, 6]];
  var svg = '<svg viewBox="0 0 10 12" shape-rendering="crispEdges">' +
    '<g class="flag__pole"><rect x="1" y="0" width="1" height="12"/><rect x="0" y="11" width="3" height="1"/></g>' +
    '<g class="flag__a">' + rects(frameA, 'flag__cloth') + '<rect class="flag__shade" x="2" y="5" width="2" height="1"/></g>' +
    '<g class="flag__b">' + rects(frameB, 'flag__cloth') + '<rect class="flag__shade" x="2" y="4" width="3" height="1"/></g>' +
    '</svg>';

  var flag = document.createElement('div');
  flag.className = 'flag';
  flag.setAttribute('aria-hidden', 'true');
  flag.innerHTML = svg + '<span class="flag__tip">flag{hello_world}</span>';
  document.body.appendChild(flag);
  var tip = flag.querySelector('.flag__tip');
  var svgEl = flag.querySelector('svg');

  var minimap = document.querySelector('[data-minimap]');
  var thumbs = minimap ? Array.prototype.slice.call(minimap.querySelectorAll('a')) : [];
  var rail = null, ticks = [];

  function buildRail(sections) {
    if (rail) return;
    rail = document.createElement('div');
    // with a minimap the flag rides the thumbnails on wide screens; the rail is only the phone's bottom edge
    rail.className = minimap ? 'rail rail--phone' : 'rail';
    rail.setAttribute('aria-hidden', 'true');
    sections.forEach(function () {
      var t = document.createElement('span');
      t.className = 'rail__tick';
      rail.appendChild(t);
      ticks.push(t);
    });
    document.body.appendChild(rail);
    layoutTicks(sections);
  }
  function layoutTicks(sections) {
    if (!rail) return;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    sections.forEach(function (s, i) {
      var top = s.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45;
      var p = Math.min(1, Math.max(0, top / max));
      ticks[i].style.left = phone.matches ? (p * 100) + '%' : '0';
      ticks[i].style.top = phone.matches ? '0' : (p * 100) + '%';
    });
  }

  var px = parseFloat(getComputedStyle(root).getPropertyValue('--px')) || 2;
  var pos = { x: -100, y: -100 }, target = { x: -100, y: -100 };
  var raf = 0, moving = false, lastIndex = -2, talkTimer = 0, atEnd = false, placed = false;

  function say(text, hold) {
    tip.textContent = text;
    flag.classList.add('is-talking');
    clearTimeout(talkTimer);
    if (!hold) talkTimer = setTimeout(function () { flag.classList.remove('is-talking'); }, 1800);
  }

  function computeTarget(d) {
    var w = px * 10, h = px * 12;
    if (minimap && !phone.matches) {
      var r = minimap.getBoundingClientRect();
      var t = thumbs[Math.max(0, d.index)];
      var tr = t.getBoundingClientRect();
      svgEl.style.transform = 'scaleX(-1)';
      target.x = r.left - w + px * 1.5;
      target.y = tr.top + tr.height / 2 - h / 2;
      return;
    }
    if (!rail) return;
    var rr = rail.getBoundingClientRect();
    if (phone.matches) {
      svgEl.style.transform = '';
      target.x = Math.min(rr.left + d.progress * rr.width - px * 1.5, rr.right - w); // stay on screen at the end
      target.y = rr.top - h;
    } else {
      svgEl.style.transform = 'scaleX(-1)';
      target.x = rr.left - w + px * 1.5;
      target.y = rr.top + d.progress * rr.height - h;
    }
  }

  function step() {
    raf = 0;
    var k = reduce ? 1 : 0.14;
    var dx = target.x - pos.x, dy = target.y - pos.y;
    pos.x += dx * k; pos.y += dy * k;
    var still = Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4;
    if (still) { pos.x = target.x; pos.y = target.y; }
    flag.style.transform = 'translate3d(' + Math.round(pos.x) + 'px,' + Math.round(pos.y) + 'px,0)';
    flag.classList.toggle('tip-left', phone.matches && pos.x > window.innerWidth / 2);
    if (!still) {
      if (!moving) { moving = true; flag.classList.add('is-moving'); }
      raf = requestAnimationFrame(step);
    } else if (moving) {
      moving = false;
      flag.classList.remove('is-moving');
      if (!reduce) {
        flag.classList.remove('is-planted');
        void flag.offsetWidth;
        flag.classList.add('is-planted');
      }
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(step); }

  document.addEventListener('section:update', function (e) {
    var d = e.detail;
    if (!d.sections.length) return;
    buildRail(d.sections);
    computeTarget(d);
    if (!placed) { pos.x = target.x; pos.y = target.y; placed = true; }
    // captured ticks: every section passed so far
    ticks.forEach(function (t, i) { t.classList.toggle('is-captured', i <= d.index); });
    var end = d.progress > 0.985;
    if (end && !atEnd) { atEnd = true; ticks.forEach(function (t) { t.classList.add('is-captured'); }); say('flag{thanks_for_reading}', true); }
    else if (!end && atEnd) { atEnd = false; flag.classList.remove('is-talking'); }
    if (!end && d.index !== lastIndex) {
      // on an article the tip waits for a hover, so it never sits on the text or a code block's Copy button
      if (d.index >= 0 && lastIndex !== -2 && !document.querySelector('[data-prose]')) say('flag{' + d.name + '}');
      else if (d.index >= 0) tip.textContent = 'flag{' + d.name + '}';
      else tip.textContent = 'flag{' + (d.name || d.sections[0].dataset.flag) + '}';
      lastIndex = d.index;
    }
    kick();
  });

  window.addEventListener('resize', function () {
    var secs = Array.prototype.slice.call(document.querySelectorAll('[data-flag]'));
    layoutTicks(secs);
  });
  document.dispatchEvent(new CustomEvent('flag:ready'));
})();
