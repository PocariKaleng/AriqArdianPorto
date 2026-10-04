import { renderToStaticMarkup } from 'react-dom/server';
import { ArrowUpRight, ArrowLeft, BookOpen, Search, Copy, Download } from 'lucide-react';
import { Article, outline } from './Article';
import { BlogHeader, BlogFooter } from './BlogChrome';
import { dateLabel } from './types';

type PublishedPost = { slug: string; title: string; excerpt: string; tags: string; markdown: string; published_at: string; updated_at: string };
type Options = { basePath: string; siteUrl?: string };
const themeInit = "try{document.documentElement.dataset.theme=localStorage.getItem('portfolio-theme')||'dark'}catch{}";

export function renderBlog(posts: PublishedPost[], post: PublishedPost | undefined, options: Options) {
  const { basePath, siteUrl } = options;
  const relativeUrl = post ? `blog/${post.slug}/` : 'blog/';
  const title = post ? `${post.title} · Ariq Ardian` : 'Blog · Ariq Ardian';
  const description = post?.excerpt || 'Notes on cryptography, blockchain, and the things I build.';
  const canonical = siteUrl ? `${siteUrl.replace(/\/$/, '')}/${relativeUrl}` : undefined;
  return '<!doctype html>\n' + renderToStaticMarkup(<html lang="en" data-theme="dark"><head>
    <meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title><meta name="description" content={description} />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta property="og:type" content={post ? 'article' : 'website'} /><meta property="og:title" content={title} /><meta property="og:description" content={description} />
    {canonical && <><link rel="canonical" href={canonical} /><meta property="og:url" content={canonical} /></>}
    <script dangerouslySetInnerHTML={{ __html: themeInit }} />
    {['style.css', 'silk.css', 'site-chrome.css', 'typography.css', 'notebook.css', 'katex/katex.min.css'].map(file => <link key={file} rel="stylesheet" href={`${basePath}${file}`} />)}
    <script src={`${basePath}blog-runtime.js`} defer /><script src={`${basePath}silk.js`} defer />
  </head><body><div className="page page-notebook"><BlogHeader basePath={basePath} staticSite />
    <main id="main" className="shell notebook-main"><div className="notebook-title"><div><span className="notebook-eyebrow">ARIQ’S NOTEBOOK</span><h1>{post ? 'Blog' : 'Blog.'}</h1>{!post && <p>{description}</p>}</div><a className="quiet-button" href={`${basePath}writeups.html`}><BookOpen size={15} />CTF Write Up <ArrowUpRight size={14} /></a></div>
      {post ? <div className="reader-layout"><aside className="reader-navigation"><a className="quiet-button" href={`${basePath}blog/`}><ArrowLeft size={14} />All articles</a><span className="sidebar-label">ON THIS PAGE</span><nav aria-label="Article contents">{outline(post.markdown).map(item => <a key={item.id} href={`#${item.id}`} className={item.level === 3 ? 'heading-nested' : ''}>{item.title}</a>)}</nav></aside>
        <article className="blog-reading"><div className="article-metadata"><span>{dateLabel(post.published_at)}</span><span>{Math.max(1, Math.ceil(post.markdown.split(/\s+/).length / 220))} min read</span></div><h1>{post.title}</h1>{post.excerpt && <p className="article-lead">{post.excerpt}</p>}
          <div className="article-byline"><img src={`${basePath}assets/profile-avatar.jpg`} alt="" /><span>Ariq Ardian</span><div><a className="quiet-button" href="./content.md" download aria-label="Download article Markdown"><Download size={14} /></a><button className="quiet-button" data-copy-link aria-label="Copy article link"><Copy size={14} /></button></div></div>
          <Article markdown={post.markdown} /><p className="article-end">{post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => <span key={tag}>{tag}</span>)}</p></article></div>
        : <div className="library-layout"><aside className="library-sidebar"><span className="sidebar-label">LIBRARY</span><div className="library-reference"><a href={`${basePath}writeups.html`}>Competition writeups <ArrowUpRight size={13} /></a><a href="https://hackmd.io/@AriqArdian" target="_blank" rel="noopener noreferrer">HackMD notes <ArrowUpRight size={13} /></a></div></aside>
          <section className="article-library" aria-label="Articles"><div className="library-heading"><h2>Published articles <span data-article-count>{posts.length}</span></h2><label className="article-search"><Search size={15} /><input type="search" aria-label="Search articles" placeholder="Search notes…" /></label></div>
            <div className="article-list">{posts.map(item => <article key={item.slug} className="article-list-item" data-search={`${item.title} ${item.excerpt} ${item.tags}`.toLowerCase()}><div className="article-list-meta">{dateLabel(item.published_at)}</div><h3><a href={`${basePath}blog/${item.slug}/`}>{item.title}<ArrowUpRight size={18} /></a></h3>{item.excerpt && <p>{item.excerpt}</p>}<div className="article-list-bottom">{item.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(' · ') || 'Notes'}</div></article>)}</div>
            <div className="blog-empty" data-search-empty hidden={posts.length > 0}><h3>{posts.length ? 'No matching notes.' : 'The next idea starts here.'}</h3><p>{posts.length ? 'Try another title, keyword, or tag.' : 'New articles will appear here. In the meantime, explore my competition writeups.'}</p></div>
          </section></div>}
    </main><BlogFooter basePath={basePath} /><div className="blog-toast" role="status" hidden data-toast /></div></body></html>);
}
