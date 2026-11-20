/* Site behaviour: preferences, theme toggle, phone menu, title and image reveals, current section. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KEY = 'sim-prefs';

  /* ---- preferences: only the theme, set by the sun and moon button ---- */
  function readPrefs() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  // the display face, signature, code font and sky are decided now: forget any old simulation choice of them
  (function () { var p = readPrefs(), dirty = false; ['display', 'signature', 'code', 'sky'].forEach(function (k) { if (k in p) { delete p[k]; dirty = true; } }); if (dirty) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ } } })();
  function setPref(key, value) {
    var p = readPrefs(); p[key] = value;
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode: the page still changes */ }
    root.setAttribute('data-' + key, value);
    document.dispatchEvent(new CustomEvent('prefs:change', { detail: { key: key, value: value } }));
  }
  window.setPref = setPref;
  window.readPrefs = readPrefs;

  var themeBtn = document.querySelector('[data-theme-toggle]');
  function syncThemeBtn() {
    if (!themeBtn) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to the light theme' : 'Switch to the dark theme');
    themeBtn.title = dark ? 'Paper' : 'Night';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () { setPref('theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
    document.addEventListener('prefs:change', syncThemeBtn);
    syncThemeBtn();
  }

  /* ---- phone menu: a full-screen sheet ---- */
  var chrome = document.querySelector('[data-chrome]');
  var menuBtn = document.querySelector('.menu-btn');
  if (chrome && menuBtn) {
    var close = function () {
      chrome.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.textContent = 'Menu';
      document.body.style.overflow = '';
    };
    menuBtn.addEventListener('click', function () {
      var open = !chrome.classList.contains('is-open');
      if (!open) { close(); return; }
      chrome.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.textContent = 'Close';
      document.body.style.overflow = 'hidden';
    });
    chrome.querySelectorAll('.nav a, .sheet-links a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && chrome.classList.contains('is-open')) { close(); menuBtn.focus(); } });
  }

  /* ---- big titles: masked word reveal; the readable copy stays in an sr-only span ---- */
  document.querySelectorAll('[data-title]').forEach(function (el) {
    var lines = el.innerHTML.split(/<br\s*\/?>/i).map(function (s) { return s.replace(/<[^>]+>/g, '').trim(); });
    var label = lines.join(' ');
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = label;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    var i = 0;
    lines.forEach(function (line, li) {
      line.split(/\s+/).forEach(function (word, wi, arr) {
        var m = document.createElement('span'); m.className = 'w-mask';
        var w = document.createElement('span'); w.className = 'w'; w.textContent = word; w.style.setProperty('--i', i++);
        m.appendChild(w); vis.appendChild(m);
        if (wi < arr.length - 1) vis.appendChild(document.createTextNode(' '));
      });
      if (li < lines.length - 1) vis.appendChild(document.createElement('br'));
    });
    el.appendChild(sr); el.appendChild(vis);
  });

  var revealables = document.querySelectorAll('[data-title], [data-reveal-img], [data-unlock]');
  function startReveals() {
    if (reduce || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    revealables.forEach(function (el) { io.observe(el); });
  }
  // an arriving page transition holds the reveals until the pixels start to clear, so the title rises with the uncover
  if (root.classList.contains('pt-enter')) {
    var started = false;
    var go = function () { if (!started) { started = true; startReveals(); } };
    document.addEventListener('pt:reveal', go, { once: true });
    setTimeout(go, 1800);
  } else {
    startReveals();
  }

  /* ---- looping decorations stop while their block is off screen (blinking cursors, the polaroid, the eq bars) ---- */
  var live = document.querySelectorAll('.polaroid, .status, [data-select], .tracks, .tl, .shelf');
  if (live.length && 'IntersectionObserver' in window) {
    var liveIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-offscreen', !e.isIntersecting); });
    }, { rootMargin: '64px 0px' });
    live.forEach(function (el) { liveIo.observe(el); });
  }

  /* ---- current section: drives the minimap and the signature flag ---- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-flag]'));
  var minimapLinks = Array.prototype.slice.call(document.querySelectorAll('[data-minimap] a'));
  var current = -2;
  function measure() {
    var line = window.innerHeight * 0.45;
    var idx = -1;
    sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= line) idx = i; });
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, window.scrollY / max));
    if (idx !== current) {
      current = idx;
      minimapLinks.forEach(function (a, i) {
        if (i === Math.max(0, idx)) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    document.dispatchEvent(new CustomEvent('section:update', {
      detail: { index: idx, name: idx >= 0 ? sections[idx].dataset.flag : null, progress: progress, sections: sections }
    }));
  }
  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; measure(); }); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', measure);
  document.addEventListener('flag:ready', measure);
  measure();
})();
