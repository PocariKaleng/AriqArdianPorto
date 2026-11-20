/* Writeups shelf: hovering or focusing a book pulls it and shows its cover and details on the reader below.
   The books are plain links to the PDFs, so the shelf works without this script. */
(function () {
  'use strict';
  var shelf = document.querySelector('[data-shelf]');
  var reader = document.querySelector('[data-reader]');
  if (!shelf || !reader) return;
  var img = reader.querySelector('[data-reader-img]');
  var round = reader.querySelector('[data-reader-round]');
  var title = reader.querySelector('[data-reader-title]');
  var pages = reader.querySelector('[data-reader-pages]');
  var link = reader.querySelector('[data-reader-link]');
  var books = Array.prototype.slice.call(shelf.querySelectorAll('.book'));
  var current = null;

  // the other covers load when the pointer or focus first reaches the shelf, not with the page
  var preloaded = false;
  function preload() {
    if (preloaded) return;
    preloaded = true;
    books.forEach(function (b) { var pre = new Image(); pre.src = b.dataset.cover; });
  }
  shelf.addEventListener('pointerenter', preload);
  shelf.addEventListener('focusin', preload);

  function show(book) {
    if (book === current) return;
    if (current) current.classList.remove('is-current');
    current = book;
    book.classList.add('is-current');
    img.src = book.dataset.cover;
    round.textContent = book.dataset.round;
    title.textContent = book.dataset.book;
    pages.textContent = book.dataset.pages;
    link.href = book.getAttribute('href');
    link.textContent = 'Open the ' + book.dataset.book + ' PDF ↗';
    reader.classList.remove('is-swapping');
    void reader.offsetWidth;
    reader.classList.add('is-swapping');
  }
  books.forEach(function (b) {
    b.addEventListener('pointerenter', function () { show(b); });
    b.addEventListener('focus', function () { show(b); });
  });
  show(books[0]);
})();
