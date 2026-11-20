/* The menu's selector bar (see nav.css). The copy is decoration (aria-hidden, no links in it); the real links
   underneath stay as they are and work without this script. Loaded before transition.js, which marks the
   visit as seen: that is how the first page of a visit knows to play the menu's entrance. */
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  if (!links.length) return;
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---- entrance: the first page of a visit, once the intro has started to clear ---- */
  var firstVisit = false;
  try { firstVisit = !sessionStorage.getItem('pt-seen'); } catch (e) { /* storage blocked: no entrance */ }
  if (firstVisit && !reduce) {
    nav.classList.add('nav--boot');
    var go = function () { nav.classList.add('is-in'); };
    if (root.classList.contains('pt-enter')) {
      document.addEventListener('pt:reveal', go, { once: true });
      setTimeout(go, 1800);
    } else go();
  }

  /* ---- the inverted copy ---- */
  var hl = document.createElement('div');
  hl.className = 'nav__hl';
  hl.setAttribute('aria-hidden', 'true');
  var label = nav.querySelector('.nav__label');
  if (label) {
    var ghost = document.createElement('span');
    ghost.className = 'nav__label';
    ghost.textContent = label.textContent;
    hl.appendChild(ghost);
  }
  links.forEach(function (a) {
    var item = document.createElement('span');
    item.className = 'nav__i';
    item.textContent = a.textContent;
    hl.appendChild(item);
  });
  nav.appendChild(hl);
  nav.classList.add('nav--bar');

  /* clip the copy to one item: full, or collapsed to its left edge (where the bar wipes from and back to) */
  function clipFor(i, open) {
    var a = links[i];
    var W = nav.clientWidth, H = nav.clientHeight;
    var top = a.offsetTop, left = a.offsetLeft, w = a.offsetWidth, h = a.offsetHeight;
    var right = open ? W - left - w : W - left;
    return 'inset(' + top + 'px ' + right + 'px ' + (H - top - h) + 'px ' + left + 'px)';
  }
  var cur = -1;
  function mode(name) {
    hl.classList.remove('is-wipe', 'is-travel', 'is-out');
    if (name) hl.classList.add(name);
  }
  function show(i, instant) {
    if (i === cur) return;
    if (instant || reduce) { mode(''); hl.style.clipPath = clipFor(i, true); }
    else if (cur === -1) {
      mode(''); hl.style.clipPath = clipFor(i, false);
      void hl.offsetWidth;                       // start collapsed at this item, then wipe
      mode('is-wipe'); hl.style.clipPath = clipFor(i, true);
    } else {
      mode('is-travel'); hl.style.clipPath = clipFor(i, true);
    }
    cur = i;
    nav.classList.add('is-hot');
  }
  function hide(instant) {
    if (cur === -1) return;
    mode(instant || reduce ? '' : 'is-out');
    hl.style.clipPath = clipFor(cur, false);
    cur = -1;
    nav.classList.remove('is-hot');
  }

  links.forEach(function (a, i) {
    if (fine) a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') show(i, false); });
    // keyboard: the bar goes straight to the focused item
    a.addEventListener('focus', function () { if (a.matches(':focus-visible')) show(i, true); });
    a.addEventListener('blur', function () { if (!nav.matches(':hover')) hide(true); });
    a.addEventListener('pointerdown', function () {
      if (cur !== i) return;
      hl.classList.add('is-press');
      setTimeout(function () { hl.classList.remove('is-press'); }, 160);
    });
  });
  // leaving with the mouse hides the bar, unless the keyboard has an item focused (a mouse click's focus does not count)
  if (fine) nav.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return;
    var f = document.activeElement;
    if (f && nav.contains(f) && f.matches(':focus-visible')) { show(links.indexOf(f), false); return; }
    hide(false);
  });
  // a layout change (fonts arriving, the window resizing) moves the items: keep the bar on its item
  window.addEventListener('resize', function () { if (cur !== -1) { mode(''); hl.style.clipPath = clipFor(cur, true); } });
})();
