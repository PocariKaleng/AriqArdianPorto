/** Highlight the section being read and move the table-of-contents marker with it. */
export function mountArticleContents() {
  const nav = document.querySelector('.reader-navigation nav');
  const article = document.querySelector('.blog-reading');
  if (!(nav instanceof HTMLElement) || !article) return;
  const items = [...nav.querySelectorAll('a[href^="#"]')].flatMap(link => {
    const heading = document.getElementById(link.getAttribute('href').slice(1));
    return heading && link instanceof HTMLElement ? [{ link, heading }] : [];
  });
  if (!items.length) return;

  let positions = [], markers = [], pageHeight = 0, active = -1, frame = 0, layoutDirty = true, disposed = false;
  function update() {
    frame = 0;
    if (disposed) return;
    // Cache layout on resize/content changes; scrolling only compares cached positions.
    if (layoutDirty) {
      positions = items.map(({ heading }) => heading.getBoundingClientRect().top + window.scrollY);
      markers = items.map(({ link }) => link.offsetTop + (link.offsetHeight - 16) / 2);
      pageHeight = document.documentElement.scrollHeight;
      layoutDirty = false;
    }
    const readingLine = window.scrollY + Math.min(window.innerHeight * .28, 180);
    let index = 0;
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] <= readingLine) index = i;
    }
    if (window.scrollY > 0 && window.scrollY + window.innerHeight >= pageHeight - 4) index = items.length - 1;
    if (index !== active) {
      if (active >= 0) items[active].link.removeAttribute('aria-current');
      items[index].link.setAttribute('aria-current', 'location');
      active = index;
    }
    nav.style.setProperty('--toc-marker-y', `${markers[index]}px`);
    nav.dataset.tocReady = '';
  }
  function schedule() { if (!frame && !disposed) frame = requestAnimationFrame(update); }
  function refreshLayout() { layoutDirty = true; schedule(); }
  const observer = new ResizeObserver(refreshLayout);
  observer.observe(article);
  observer.observe(nav);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refreshLayout);
  article.addEventListener('load', refreshLayout, true);
  article.addEventListener('toggle', refreshLayout, true);
  document.fonts?.ready.then(refreshLayout);
  schedule();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', refreshLayout);
    article.removeEventListener('load', refreshLayout, true);
    article.removeEventListener('toggle', refreshLayout, true);
    items.forEach(({ link }) => link.removeAttribute('aria-current'));
    nav.style.removeProperty('--toc-marker-y');
    delete nav.dataset.tocReady;
  };
}
