(() => {
  let timer;
  function notify(text) {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    toast.textContent = text; toast.hidden = false;
    clearTimeout(timer); timer = setTimeout(() => { toast.hidden = true; }, 3000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); notify('Copied.'); return true; }
    catch { notify('Clipboard unavailable. Select the text or copy from the address bar.'); return false; }
  }
  const toggle = document.querySelector('.theme-toggle');
  function themeLabel() {
    const light = document.documentElement.dataset.theme === 'light';
    toggle?.setAttribute('aria-label', `Switch to ${light ? 'dark' : 'light'} mode`);
    const icon = toggle?.querySelector('.theme-icon');
    if (icon) icon.textContent = light ? '☾' : '☼';
  }
  themeLabel();
  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('portfolio-theme', next); } catch { /* Theme works without storage. */ }
    themeLabel();
  });
  document.querySelectorAll('.copy-code').forEach(button => button.addEventListener('click', async () => {
    if (await copy(button.closest('.article-code').querySelector('code').textContent)) {
      const label = button.innerHTML; button.textContent = 'Copied';
      setTimeout(() => { button.innerHTML = label; }, 1600);
    }
  }));
  document.querySelector('[data-copy-link]')?.addEventListener('click', () => void copy(location.href));
  document.querySelectorAll('.katex').forEach(equation => {
    equation.tabIndex = 0; equation.setAttribute('role', 'button'); equation.setAttribute('aria-label', 'Copy equation as LaTeX'); equation.title = 'Copy LaTeX';
    const copyTex = () => void copy(equation.querySelector('annotation[encoding="application/x-tex"]').textContent);
    equation.addEventListener('click', copyTex);
    equation.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); copyTex(); } });
  });
  document.querySelector('[aria-label="Search articles"]')?.addEventListener('input', event => {
    const query = event.target.value.toLowerCase().trim();
    let count = 0;
    document.querySelectorAll('[data-search]').forEach(article => { article.hidden = !article.dataset.search.includes(query); if (!article.hidden) count++; });
    document.querySelector('[data-article-count]').textContent = count;
    document.querySelector('[data-search-empty]').hidden = count > 0;
  });
})();
