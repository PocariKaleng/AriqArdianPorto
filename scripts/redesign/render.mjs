// The pixel design's blog pages, written into the static build by scripts/build-static.mjs.
//
// The existing renderer (components/blog/StaticBlog.tsx) still turns each article's Markdown into HTML (KaTeX,
// highlighted code, images). This module takes its article body and metadata and places them in the pixel
// templates next to this file:
//   blog/index.html          the index, with search and tag filters (blog.html)
//   blog/<slug>/index.html   each article, with "On this page" and the next post (article.html)
// It also fills the latest posts into the home page (status log and Notes, between the blog: markers).
// Display tweaks per article live in posts.json; an article that is not listed there still gets a full page.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const STOP = new Set(['a', 'an', 'the', 'at', 'of', 'to', 'and', 'in', 'on', 'for', 'with', 'from', 'by']);
const ICONS = { cryptography: 'key', blockchain: 'block' };

const text = (html) => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (template, values) => {
  const html = template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in values ? values[key] : m));
  const left = html.match(/\{\{\w+\}\}/);
  if (left) throw new Error(`Template placeholder without a value: ${left[0]}`);
  return html;
};

// "4. Vulnerability #2 — Linearize XOR, then eliminate it" -> "linearize_xor_then": the section's name for the
// section tracker, the flag ("flag{...}") and "On this page"
export function flagName(heading) {
  let t = heading.replace(/^\d+\.\s*/, '');
  if (t.includes(' — ')) {
    const [before, after] = t.split(' — ');
    t = /^vulnerability\s*#\d+$/i.test(before.trim()) ? after : before;
  }
  const words = t.toLowerCase().match(/[a-z0-9]+/g) || ['section'];
  const out = words.slice(0, 3);
  for (let i = 3; i < words.length && STOP.has(out[out.length - 1]); i++) out.push(words[i]);
  return out.join('_');
}

// the inner HTML of the <div> that opens at `start`, counting nested divs
function innerDiv(html, start) {
  if (start < 0) throw new Error('The rendered article has no article body.');
  const open = html.indexOf('>', start) + 1;
  const re = /<\/?div\b[^>]*>/g;
  re.lastIndex = open;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[0][1] === '/' ? -1 : 1;
    if (!depth) return html.slice(open, m.index);
  }
  throw new Error('The rendered article body is not closed.');
}

// one article's data, from the old renderer's page plus posts.json
function readArticle(post, rendered, extra) {
  const metaSpans = [...(rendered.match(/<div class="article-metadata">(.*?)<\/div>/s) || [, ''])[1].matchAll(/<span>(.*?)<\/span>/g)].map((m) => text(m[1]));
  const [date = '', readTime = ''] = metaSpans;
  const tags = String(post.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  let body = innerDiv(rendered, rendered.indexOf('<div class="article-body">'));
  const used = new Set();
  body = body.replace(/<h2 id="([^"]+)">(.*?)<\/h2>/gs, (all, id, inner) => {
    const base = flagName(text(inner));
    let name = base, n = 2;
    while (used.has(name)) name = `${base}_${n++}`;
    used.add(name);
    return `<h2 id="${id}" data-flag="${name}">${inner}</h2>`;
  });
  const firstImage = (body.match(/<img [^>]*src="(?:\.\/)?(assets\/[^"]+)"/) || [])[1];
  return {
    slug: post.slug, date, readTime, tags, body, lang: extra.lang || '',
    title: extra.title || post.title,
    excerpt: extra.excerpt || post.excerpt || '',
    lead: post.excerpt || '',
    // a cover, as a path from the site root: the one set in posts.json, else the article's first picture
    cover: extra.cover || (firstImage ? `blog/${post.slug}/${firstImage}` : ''),
    icon: extra.icon || ICONS[(tags[0] || '').toLowerCase()] || 'note',
    peekLabel: extra.peekLabel || (tags[0] || 'post').toLowerCase(),
    noteChips: extra.noteChips || tags.slice(0, 2),
    statusTail: extra.statusTail || '',
  };
}

function cover(a, root) {
  return a.cover
    ? `<span class="post__cover" data-pixel-art><img src="${root}${esc(a.cover)}" alt="" loading="lazy"></span>`
    : '<span class="post__cover post__cover--empty" aria-hidden="true"><span class="px-icon" data-icon="note"></span></span>';
}

function postCard(a, i) {
  const kind = i === 0 ? 'post--feature' : 'post--row';
  const tags = a.tags.map((t) => t.toLowerCase());
  const search = `${a.title} ${a.excerpt} ${tags.join(' ')}`.toLowerCase();
  return `
      <article class="post ${kind}" data-post data-tags="${esc(tags.join('|'))}" data-text="${esc(search)}">
        <a class="post__link" href="${a.slug}/">
          ${cover(a, '../')}
          <span class="post__body">
            <span class="post__meta micro"><span class="post__no">${String(i + 1).padStart(2, '0')}</span>${esc(a.date)} · ${esc(a.readTime)}</span>
            <span class="post__title">${esc(a.title)}</span>
            <span class="post__excerpt">${esc(a.excerpt)}</span>
            <span class="chips">${a.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</span>
            <span class="post__cta">Read the post →</span>
          </span>
        </a>
      </article>`;
}

// the tag filters: each article's first tag (its category) first, by how often it is used, then the rest in order
function tagButtons(articles) {
  const firsts = new Map(), rest = [];
  for (const a of articles) {
    a.tags.forEach((t, i) => {
      const key = t.toLowerCase();
      if (i === 0) firsts.set(key, { label: t, n: (firsts.get(key)?.n || 0) + 1 });
      else if (!rest.some((r) => r.key === key)) rest.push({ key, label: t });
    });
  }
  const ordered = [...firsts.entries()].sort((x, y) => y[1].n - x[1].n).map(([key, v]) => ({ key, label: v.label }));
  for (const r of rest) if (!ordered.some((o) => o.key === r.key)) ordered.push(r);
  return '<button type="button" class="tagbtn" data-tag="" aria-pressed="true">All</button>' +
    ordered.map((o) => `<button type="button" class="tagbtn" data-tag="${esc(o.key)}" aria-pressed="false">${esc(o.label)}</button>`).join('');
}

function headMeta(siteUrl, url, title, description, type, image) {
  if (!siteUrl) return '';
  const base = siteUrl.replace(/\/$/, '');
  const abs = `${base}/${url}`;
  return `\n<link rel="canonical" href="${esc(abs)}">\n<meta property="og:type" content="${type}">\n<meta property="og:title" content="${esc(title)}">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:url" content="${esc(abs)}">` +
    (image ? `\n<meta property="og:image" content="${esc(`${base}/${image}`)}">` : '');
}

function homeWriting(a) {
  const visible = a.title + (a.statusTail ? `: ${a.statusTail}` : '');
  return `
          <li>
            <a class="status__item" href="blog/${a.slug}/" style="--n:2">
              <span class="status__icon"><span class="px-icon" data-icon="scroll"></span></span>
              <span class="status__body">
                <span class="status__label micro">Writing</span>
                <span class="status__text"><span class="status__type" style="--chars:${visible.length}"><u>${esc(a.title)}</u>${a.statusTail ? `: ${esc(a.statusTail)}` : ''}</span></span>
                <span class="status__meta">Blog · ${esc(a.date)}</span>
              </span>
              <span class="status__go" aria-hidden="true">→</span>
            </a>
          </li>
          `;
}

function homeNote(a, i) {
  const peek = a.cover ? ` data-peek="${esc(a.cover)}" data-peek-cap="${esc(`${a.peekLabel} · ${a.readTime}`)}"` : '';
  const chips = a.noteChips.map((t, k) => `<span class="note__chip${k === 0 ? ' note__chip--cat' : ''}">${esc(t)}</span>`).join('');
  return `
      <li>
        <a class="note" href="blog/${a.slug}/"${peek}>
          <span class="note__no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <span class="note__icon"><span class="px-icon" data-icon="${esc(a.icon)}"></span></span>
          <span class="note__body">
            <span class="note__meta micro">${esc(a.date)} · <b>${esc(a.readTime)}</b></span>
            <span class="note__title">${esc(a.title)}</span>
            <span class="note__desc">${esc(a.excerpt)}</span>
          </span>
          <span class="note__tags">${chips}</span>
          <span class="note__go" aria-hidden="true">→</span>
        </a>
      </li>`;
}

function between(html, name, content) {
  const re = new RegExp(`(<!-- blog:${name} -->)[\\s\\S]*?(<!-- /blog:${name} -->)`);
  if (!re.test(html)) throw new Error(`The home page has no blog:${name} markers.`);
  return html.replace(re, `$1${content}$2`);
}

/**
 * @param {object}   o
 * @param {string}   o.stage       the folder being built (it already holds public/)
 * @param {object[]} o.posts       published posts, newest first
 * @param {(post: object) => string} o.renderArticle  the old renderer's page for one post (its body is reused)
 * @param {string}   [o.siteUrl]   e.g. https://ariqardian.site, for canonical and sharing tags
 */
export async function writePixelBlog({ stage, posts, renderArticle, siteUrl }) {
  const extras = JSON.parse(await readFile(path.join(here, 'posts.json'), 'utf8'));
  const articleTemplate = await readFile(path.join(here, 'article.html'), 'utf8');
  const indexTemplate = await readFile(path.join(here, 'blog.html'), 'utf8');
  const articles = posts.map((post) => readArticle(post, renderArticle(post), extras[post.slug] || {}));

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i], next = articles[i + 1];
    const html = fill(articleTemplate, {
      root: '../../', title: esc(a.title), description: esc(a.lead.replace(/\s+/g, ' ').trim()),
      headMeta: headMeta(siteUrl, `blog/${a.slug}/`, a.title, a.lead.replace(/\s+/g, ' ').trim(), 'article', a.cover),
      date: esc(a.date), readTime: esc(a.readTime), lead: esc(a.lead),
      chips: a.tags.map((t) => `<li class="chip">${esc(t)}</li>`).join(''),
      langAttr: a.lang ? ` lang="${esc(a.lang)}"` : '', body: a.body,
      nextLabel: next ? 'Next post' : 'More posts', nextHref: next ? `../${next.slug}/` : '../',
      nextTitle: next ? esc(next.title) : 'All posts',
    });
    await mkdir(path.join(stage, 'blog', a.slug), { recursive: true });
    await writeFile(path.join(stage, 'blog', a.slug, 'index.html'), html);
  }

  const n = articles.length;
  const latestMonth = n ? articles[0].date.replace(/^\d+\s+/, '') : '';
  const count = n === 1 ? '1 post' : `${n} posts`;
  const description = 'Longer notes on cryptography, blockchain and the tools Ariq Ardian builds.';
  await writeFile(path.join(stage, 'blog', 'index.html'), fill(indexTemplate, {
    root: '../', headMeta: headMeta(siteUrl, 'blog/', 'Blog by Ariq Ardian', description, 'website', ''),
    heroMeta: n ? `${count} · ${latestMonth}` : 'No posts yet', tagButtons: tagButtons(articles), count,
    posts: articles.map(postCard).join(''),
  }));

  // the home page shows the latest post in its status log and the latest three under Notes
  const homePath = path.join(stage, 'index.html');
  let home = await readFile(homePath, 'utf8');
  home = between(home, 'writing', n ? homeWriting(articles[0]) : '\n          ');
  home = between(home, 'notes', articles.slice(0, 3).map(homeNote).join('') + '\n    ');
  await writeFile(homePath, home);
  // the writeups page links the blog with its post count
  const writeupsPath = path.join(stage, 'writeups.html');
  const writeups = await readFile(writeupsPath, 'utf8').catch(() => null);
  if (writeups) await writeFile(writeupsPath, writeups.replace(/blog · \d+ posts?/g, `blog · ${count}`));
  return articles;
}
