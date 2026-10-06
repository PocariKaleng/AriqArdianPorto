import { mkdir, readdir, readFile, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { projectRoot, loadContent, copyArticleAssets } from './blog-content.mjs';
import { mapMarkdownUrls, normalizeBase } from '../lib/blog-portable.mjs';
import { buildHighlights } from './build-highlights.mjs';

export async function buildStatic() {
  const basePath = normalizeBase(process.env.BLOG_BASE_PATH);
  const siteUrl = process.env.BLOG_SITE_URL;
  if (siteUrl && (!/^https:\/\//.test(siteUrl) || new URL(siteUrl).search || new URL(siteUrl).hash || new URL(siteUrl).username || new URL(siteUrl).password)) throw new Error('BLOG_SITE_URL harus URL HTTPS lengkap, termasuk subpath repository bila ada.');
  const posts = await loadContent();
  await buildHighlights();
  const renderRoot = path.join(projectRoot, '.sites-runtime', `static-render-${crypto.randomUUID()}`);
  await build({ configFile: false, root: projectRoot, publicDir: false, logLevel: 'warn', build: {
    ssr: path.join(projectRoot, 'components/blog/StaticBlog.tsx'), outDir: renderRoot, emptyOutDir: false,
    rolldownOptions: { output: { entryFileNames: 'render.mjs' } },
  } });
  const { renderBlog } = await import(pathToFileURL(path.join(renderRoot, 'render.mjs')).href);
  const destination = path.join(projectRoot, 'static-site');
  // Stage a complete public artifact to prevent deleted/unpublished articles
  // surviving in an old output folder between builds.
  const stage = path.join(projectRoot, '.sites-runtime', `static-stage-${crypto.randomUUID()}`);
  await mkdir(stage, { recursive: true });
  await cp(path.join(projectRoot, 'public'), stage, { recursive: true });
  await cp(path.join(projectRoot, 'node_modules/katex/dist'), path.join(stage, 'katex'), { recursive: true });
  await cp(path.join(projectRoot, 'app/notebook.css'), path.join(stage, 'notebook.css'));
  await cp(path.join(projectRoot, 'scripts/blog-runtime.js'), path.join(stage, 'blog-runtime.js'));
  await writeFile(path.join(stage, 'static-blog.css'), '[hidden]{display:none!important}\n');
  // Rewrite the existing portfolio's root URLs for GitHub project subpaths.
  for (const file of await readdir(stage)) {
    if (!/\.(html|css|js)$/.test(file)) continue;
    const location = path.join(stage, file);
    let source = await readFile(location, 'utf8');
    source = source.replace(/(["'])\/blog(?:\/)?\1/g, `$1${basePath}blog/$1`)
      .replace(/(["'(])\/assets\//g, `$1${basePath}assets/`)
      .replace(/blog\.html#writeups/g, 'writeups.html')
      .replace(/blog\.html/g, `${basePath}blog/`);
    await writeFile(location, source);
  }
  await mkdir(path.join(stage, 'blog'), { recursive: true });
  const options = { basePath, siteUrl };
  function withHiddenStyle(html) { return html.replace('</head>', `<link rel="stylesheet" href="${basePath}static-blog.css"></head>`); }
  await writeFile(path.join(stage, 'blog/index.html'), withHiddenStyle(renderBlog(posts, undefined, options)));
  for (const post of posts) {
    const folder = path.join(stage, 'blog', post.slug);
    await mkdir(folder, { recursive: true });
    await copyArticleAssets(post, folder);
    const rendered = { ...post, markdown: await mapMarkdownUrls(post.markdown, async url => url.startsWith('/assets/') || url.startsWith('/blog/') ? `${basePath}${url.slice(1)}` : url) };
    await writeFile(path.join(folder, 'index.html'), withHiddenStyle(renderBlog(posts, rendered, options)));
    await writeFile(path.join(folder, 'content.md'), `# ${post.title}\n\n${post.markdown}`);
  }
  await writeFile(path.join(stage, '.nojekyll'), '');
  if (siteUrl) {
    const escapeXml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
    const urls = ['index.html', 'work.html', 'writeups.html', 'about.html', 'contact.html', 'blog/', ...posts.map(post => `blog/${post.slug}/`)];
    await writeFile(path.join(stage, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeXml(`${siteUrl.replace(/\/$/, '')}/${url}`)}</loc></url>`).join('')}</urlset>`);
  }
  const { rename, lstat, rm, realpath } = await import('node:fs/promises');
  try {
    const stat = await lstat(destination);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('static-site harus berupa direktori biasa.');
    const resolved = await realpath(destination);
    if (path.relative(projectRoot, resolved) !== 'static-site') throw new Error('Folder hasil build berada di luar proyek.');
    await rm(resolved, { recursive: true, force: true });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await rename(stage, destination);
  console.log(`Built ${posts.length} published article(s) in static-site (base: ${basePath}). No author API or database is included.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.join(projectRoot, 'scripts/build-static.mjs')) {
  try { await buildStatic(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
