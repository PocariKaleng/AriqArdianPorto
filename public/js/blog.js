/* Blog: search and tag filters on the index; the table of contents, its current heading and copy-link on the
   article page. Posts and headings are plain links, so both pages read fully without this script. */
(function () {
  'use strict';

  /* ---------- index: filter by text and tag ---------- */
  var posts = Array.prototype.slice.call(document.querySelectorAll('[data-post]'));
  var search = document.querySelector('[data-search]');
  var tagBtns = Array.prototype.slice.call(document.querySelectorAll('.tagbtn'));
  var count = document.querySelector('[data-count]');
  var empty = document.querySelector('[data-empty]');
  var clear = document.querySelector('[data-clear]');
  var tag = '';
  function apply() {
    var q = (search ? search.value : '').trim().toLowerCase();
    var shown = 0;
    posts.forEach(function (p) {
      var okTag = !tag || p.dataset.tags.split('|').indexOf(tag) !== -1;
      var okText = !q || p.dataset.text.indexOf(q) !== -1;
      p.hidden = !(okTag && okText);
      if (!p.hidden) shown++;
    });
    if (count) count.textContent = shown === 1 ? '1 post' : shown + ' posts';
    if (empty) empty.hidden = shown !== 0;
  }
  if (posts.length) {
    if (search) search.addEventListener('input', apply);
    tagBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        tag = b.dataset.tag;
        tagBtns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        apply();
      });
    });
    if (clear) clear.addEventListener('click', function () {
      tag = ''; if (search) search.value = '';
      tagBtns.forEach(function (o) { o.setAttribute('aria-pressed', String(o.dataset.tag === '')); });
      apply();
      if (search) search.focus();
    });
  }

  /* ---------- article: "On this page", the way docs and blog themes do it (Astro Starlight and the like) ----------
     An Overview entry for the top, then the h2s with their h3s indented. The current entry follows the shared section
     tracker (site.js) and is marked on the hairline track; narrower screens get a fold button (see blog.css). */
  var toc = document.querySelector('[data-toc]');
  var prose = document.querySelector('[data-prose]');
  if (toc && prose) (function () {
    var nav = toc.closest('.toc') || toc.parentNode;
    var entries = [];
    var addEntry = function (href, text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      var a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      li.appendChild(a);
      toc.appendChild(li);
      return a;
    };
    var overview = addEntry('#main', 'Overview');
    var lastH2 = null;
    Array.prototype.forEach.call(prose.querySelectorAll('h2[id], h3[id]'), function (h) {
      var sub = h.tagName === 'H3';
      if (sub && !lastH2) return;
      var e = { a: addEntry('#' + h.id, h.textContent.replace(/^\d+\.\s*/, ''), sub ? 'toc__sub' : ''), h: h, sub: sub, kids: [] };
      if (sub) lastH2.kids.push(e); else lastH2 = e;
      entries.push(e);
    });

    // one heading or none: no contents column, the text takes the width
    if (entries.filter(function (e) { return !e.sub; }).length < 2) {
      nav.hidden = true;
      nav.parentNode.classList.add('article__grid--solo');
      return;
    }

    // the mark: one bar that steps to the current entry (a transform, so it never asks for layout)
    var mark = document.createElement('span');
    mark.className = 'toc__mark';
    mark.setAttribute('aria-hidden', 'true');
    nav.appendChild(mark);
    var current = null;
    var place = function () {
      if (!current || !current.offsetParent) { mark.style.opacity = '0'; return; }   // folded away
      mark.style.opacity = '';
      mark.style.left = toc.offsetLeft + 'px';
      mark.style.transform = 'translateY(' + current.offsetTop + 'px) scaleY(' + current.offsetHeight + ')';
      // a long list scrolls inside its column: keep the current entry in it
      if (nav.scrollHeight > nav.clientHeight) {
        var top = current.offsetTop, bottom = top + current.offsetHeight;
        if (top < nav.scrollTop || bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = top - nav.clientHeight / 3;
      }
    };
    var setCurrent = function (a) {
      if (a === current) return;
      if (current) current.removeAttribute('aria-current');
      current = a;
      current.setAttribute('aria-current', 'true');
      place();
    };
    setCurrent(overview);
    document.addEventListener('section:update', function (ev) {
      var name = ev.detail.name, hit = null;
      for (var i = 0; i < entries.length; i++) if (!entries[i].sub && entries[i].h.dataset.flag === name) { hit = entries[i]; break; }
      var pick = hit;
      if (hit && hit.kids.length) {
        var line = window.innerHeight * 0.45;           // the same reading line the section tracker uses
        hit.kids.forEach(function (k) { if (k.h.getBoundingClientRect().top <= line) pick = k; });
      }
      setCurrent(pick ? pick.a : overview);
    });
    window.addEventListener('resize', place);

    // narrower screens: the list folds into a box above the text
    var fold = document.createElement('button');
    fold.type = 'button';
    fold.className = 'toc__fold micro';
    fold.setAttribute('aria-expanded', 'false');
    fold.setAttribute('aria-controls', toc.id || '');
    fold.innerHTML = '<span>On this page</span><svg class="toc__chev" viewBox="0 0 5 3" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true"><path d="M0 0h1v1H0zM1 1h1v1H1zM2 2h1v1H2zM3 1h1v1H3zM4 0h1v1H4z"/></svg>';
    nav.insertBefore(fold, nav.firstChild);
    nav.classList.add('toc--fold');
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      fold.setAttribute('aria-expanded', String(open));
      place();
    };
    fold.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    // picking an entry closes the box first, so the jump lands on the heading and not a box-height below it
    toc.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) setOpen(false);
    });
  })();

  /* code blocks: copy without toggling the details they sit in */
  document.querySelectorAll('.copy-code').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var block = btn.closest('details');
      var lines = block ? block.querySelectorAll('.code-line-content') : [];
      var text = Array.prototype.map.call(lines, function (l) { return l.textContent; }).join(String.fromCharCode(10));
      var label = btn.lastChild;
      var done = function (ok) {
        btn.classList.toggle('is-copied', ok);
        label.textContent = ok ? 'Copied' : 'Select and copy';
        setTimeout(function () { btn.classList.remove('is-copied'); label.textContent = 'Copy'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  });

  var copyBtn = document.querySelector('[data-copy-link]');
  var copyStatus = document.querySelector('[data-copy-link-status]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var done = function (ok) {
        copyBtn.textContent = ok ? 'Link copied' : 'Copy the address bar';
        if (copyStatus) copyStatus.textContent = ok ? 'Article link copied' : 'Copy failed';
        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  }
})();
