/* The badge as a pixel player card (see badge.css): the photo's coarse-to-sharp resolve, the scan, the name
   decrypt, the status pings, and the first-visit print. The link and its label work without this script.
   Loaded before transition.js, which marks the visit as seen: that is how the first page knows to print. */
(function () {
  'use strict';
  var badge = document.querySelector('.badge');
  if (!badge) return;
  var img = badge.querySelector('img');
  var name = badge.querySelector('.badge__name');
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var firstVisit = false;
  try { firstVisit = !sessionStorage.getItem('pt-seen'); } catch (e) { /* storage blocked: no entrance */ }

  /* ---- the photo in a frame with a canvas for its pixel frames ---- */
  var pic = document.createElement('span');
  pic.className = 'badge__pic';
  img.parentNode.insertBefore(pic, img);
  pic.appendChild(img);
  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  pic.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var small = document.createElement('canvas');
  var sctx = small.getContext('2d');
  function paint(n) {
    var size = Math.round(pic.getBoundingClientRect().width * Math.min(window.devicePixelRatio || 1, 2));
    if (!size || !img.naturalWidth) return false;
    canvas.width = canvas.height = size;
    small.width = small.height = n;
    var s = Math.min(img.naturalWidth, img.naturalHeight);          // centre square, like object-fit: cover
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, n, n);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, n, n, 0, 0, size, size);
    return true;
  }
  var timer = 0;
  function resolve() {
    if (reduce) return;
    clearInterval(timer);
    var steps = [6, 12, 24], i = 0;
    if (!paint(steps[i++])) return;
    pic.classList.add('is-px');
    timer = setInterval(function () {
      if (i < steps.length) paint(steps[i++]);
      else { clearInterval(timer); pic.classList.remove('is-px'); }
    }, 70);
  }
  // restart a one-shot animation by toggling its class: never stacked, always cleaned up
  function once(cls, ms) {
    badge.classList.remove(cls);
    void badge.offsetWidth;
    badge.classList.add(cls);
    clearTimeout(once[cls]);
    once[cls] = setTimeout(function () { badge.classList.remove(cls); }, ms);
  }

  /* ---- hover ---- */
  if (fine) {
    badge.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      resolve();
      if (!reduce) { once('is-scan', 400); once('is-ping', 760); }
      if (name && window.pxDecrypt) window.pxDecrypt(name);
    });
  }

  /* ---- idle: a rare ping of the status square ---- */
  if (!reduce) {
    (function ping() {
      setTimeout(function () {
        if (!document.hidden && !badge.matches(':hover')) once('is-ping', 760);
        ping();
      }, ping.started ? 6000 : 2500);
      ping.started = true;
    })();
  }

  /* ---- the first page of a visit: print, then the photo resolves, then the square pings ---- */
  if (firstVisit && !reduce) {
    badge.classList.add('badge--boot');
    var go = function () {
      if (badge.classList.contains('is-in')) return;
      if (paint(6)) pic.classList.add('is-px');
      badge.classList.add('is-in');
      setTimeout(resolve, 420);
      setTimeout(function () { once('is-ping', 760); }, 720);
    };
    if (root.classList.contains('pt-enter')) {
      document.addEventListener('pt:reveal', go, { once: true });
      setTimeout(go, 1800);
    } else go();
  }
})();
