// The marker identifies the section currently being read; links remain native anchors.
const aboutDirectory = document.querySelector('.about-directory');
if (aboutDirectory) {
  const directoryLinks = [...aboutDirectory.querySelectorAll('a[href^="#"]')];
  const directorySections = directoryLinks.map(link => document.getElementById(link.hash.slice(1)));
  const directoryMarker = aboutDirectory.querySelector('.directory-marker');
  let directoryFrame = 0;

  function updateDirectory() {
    directoryFrame = 0;
    let current = 0;
    const readingEdge = Math.max(110, window.innerHeight * .26);
    directorySections.forEach((section, index) => {
      if (section && section.getBoundingClientRect().top <= readingEdge) current = index;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) {
      current = directoryLinks.length - 1;
    }
    directoryLinks.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const active = directoryLinks[current];
    directoryMarker.style.transform = `translateX(${active.offsetLeft + active.offsetWidth / 2 - 2}px)`;
    aboutDirectory.dataset.ready = 'true';
  }

  function requestDirectoryUpdate() {
    if (!directoryFrame && !document.hidden) directoryFrame = requestAnimationFrame(updateDirectory);
  }
  window.addEventListener('scroll', requestDirectoryUpdate, {passive: true});
  window.addEventListener('resize', requestDirectoryUpdate);
  window.addEventListener('hashchange', requestDirectoryUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(directoryFrame);
      directoryFrame = 0;
    } else requestDirectoryUpdate();
  });
  if ('ResizeObserver' in window) new ResizeObserver(requestDirectoryUpdate).observe(aboutDirectory);
  document.fonts?.ready.then(requestDirectoryUpdate);
  requestDirectoryUpdate();
}
