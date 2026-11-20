/* Recently played, live from Last.fm: Spotify scrobbles every play to Last.fm, and this reads the newest ones.
   The four favourites written in the markup stay when the username or API key is missing or Last.fm cannot
   be reached, so the section never ends up empty. While the tab is visible it checks again every minute,
   so "Now playing" follows the music. Track names come from outside: they are only ever set as text. */
(function () {
  'use strict';
  var list = document.querySelector('[data-lastfm-user]');
  if (!list) return;
  var user = (list.dataset.lastfmUser || '').trim();
  var key = (list.dataset.lastfmKey || '').trim();
  if (!user || !key) return;

  var SHOW = 4, EVERY = 60000;
  var PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';   // Last.fm's grey star, sent when it has no cover
  var API = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&format=json&limit=20' +
    '&user=' + encodeURIComponent(user) + '&api_key=' + encodeURIComponent(key);
  var sum = document.querySelector('[data-lastfm-sum]');
  var note = document.querySelector('[data-lastfm-note]');
  var rtf = (window.Intl && Intl.RelativeTimeFormat) ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;
  var shownSig = '';

  function ago(uts) {
    var s = Math.round(uts - Date.now() / 1000);
    var a = Math.abs(s);
    if (!rtf) return '';
    if (a < 60) return 'just now';
    if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
    if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
    return rtf.format(Math.round(s / 86400), 'day');
  }
  function cover(t) {
    var imgs = t.image || [], url = '';
    for (var i = 0; i < imgs.length; i++) { if (imgs[i]['#text']) url = imgs[i]['#text']; }   // largest is last
    return url.indexOf(PLACEHOLDER) === -1 ? url : '';
  }
  function node(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* the newest distinct tracks; a song on repeat counts once, at its latest play */
  function pick(raw) {
    var seen = {}, out = [];
    raw.forEach(function (t) {
      var artist = (t.artist && (t.artist['#text'] || t.artist.name)) || '';
      var title = t.name || '';
      var id = (artist + '\u0000' + title).toLowerCase();
      if (!title || seen[id] || out.length >= SHOW) return;
      seen[id] = true;
      out.push({
        title: title, artist: artist, art: cover(t),
        now: !!(t['@attr'] && t['@attr'].nowplaying === 'true'),
        uts: t.date ? +t.date.uts : 0
      });
    });
    return out;
  }

  function card(t) {
    var li = document.createElement('li');
    var a = node('a', 'track' + (t.now ? ' track--now' : ''));
    a.href = 'https://open.spotify.com/search/' + encodeURIComponent(t.title + ' ' + t.artist);
    var art = node('span', 'track__art');
    if (t.art) {
      art.setAttribute('data-pixel-art', '');
      var img = new Image();
      img.src = t.art; img.alt = ''; img.width = 300; img.height = 300; img.decoding = 'async';
      art.appendChild(img);
    } else {
      art.classList.add('track__art--empty');
      var ico = node('span', 'px-icon');
      ico.setAttribute('aria-hidden', 'true');
      if (window.pxIcon) ico.innerHTML = window.pxIcon('disc');
      art.appendChild(ico);
    }
    if (t.now) {
      var badge = node('span', 'track__now micro');
      var eq = node('span', 'eq');
      eq.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 4; i++) eq.appendChild(document.createElement('i'));
      badge.appendChild(eq);
      badge.appendChild(document.createTextNode('Now playing'));
      art.appendChild(badge);
    }
    a.appendChild(art);
    a.appendChild(node('span', 'track__title', t.title));
    a.appendChild(node('span', 'track__artist', t.artist));
    var when = node('span', 'track__when meta', t.now ? 'Playing now' : ago(t.uts));
    if (t.uts) when.dataset.uts = t.uts;
    a.appendChild(when);
    a.appendChild(node('span', 'track__cta micro', 'Find on Spotify ↗'));
    li.appendChild(a);
    return li;
  }

  function render(tracks) {
    var sig = tracks.map(function (t) { return t.title + '|' + t.artist + '|' + t.now; }).join('\n');
    if (sig === shownSig) {
      // same songs: only the "x minutes ago" labels move on
      list.querySelectorAll('.track__when[data-uts]').forEach(function (w) { w.textContent = ago(+w.dataset.uts); });
      return;
    }
    shownSig = sig;
    var frag = document.createDocumentFragment();
    tracks.forEach(function (t) { frag.appendChild(card(t)); });
    list.replaceChildren(frag);
    list.querySelectorAll('[data-pixel-art]').forEach(function (box) { if (window.pxArt) window.pxArt(box); });
    list.classList.add('is-live');
    if (note) note.hidden = true;
    if (sum && !sum.dataset.live) {
      sum.dataset.live = '1';
      sum.textContent = '';
      sum.appendChild(document.createTextNode('Live from my Spotify, through '));
      var lf = node('a', 'u', 'Last.fm');
      lf.href = 'https://www.last.fm/user/' + encodeURIComponent(user);
      sum.appendChild(lf);
    }
  }

  var busy = false;
  function load() {
    if (busy || document.hidden) return;
    busy = true;
    fetch(API, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var raw = data && data.recenttracks && data.recenttracks.track;
        if (!raw) return;                          // an error body ({ error, message }) keeps what is shown
        if (!Array.isArray(raw)) raw = [raw];      // one scrobble comes back as an object, not a list
        var tracks = pick(raw);
        if (tracks.length) render(tracks);
      })
      .catch(function () { /* offline or blocked: the favourites (or the last good list) stay */ })
      .then(function () { busy = false; });
  }
  load();
  setInterval(load, EVERY);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) load(); });
})();
