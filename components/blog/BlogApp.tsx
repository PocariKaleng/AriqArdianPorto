'use client';
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Plus, Search, FileText, ArrowUpRight, Pencil, Trash2, BookOpen, Download, Copy, ArrowLeft } from 'lucide-react';
import { BlogHeader, BlogFooter } from './BlogChrome';
const PostEditor = lazy(() => import('./PostEditor').then(module => ({ default: module.PostEditor })));
import { Article, outline } from './Article';
import { api, dateLabel, downloadMarkdown, downloadWebsite, type BlogPost, type Summary } from './types';
export function BlogApp({ initialSlug }: { initialSlug?: string }) {
  const [owner, setOwner] = useState(false), [ready, setReady] = useState(false), [posts, setPosts] = useState<Summary[]>([]);
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [draft, setDraft] = useState<BlogPost | null>(null);
  const [reading, setReading] = useState<BlogPost | null>(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [articleBusy, setArticleBusy] = useState(false), [deletePost, setDeletePost] = useState<Summary | null>(null);
  const [exporting, setExporting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null), deleteDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (deletePost) deleteDialog.current?.showModal(); }, [deletePost]);
  function notify(text: string) { setMessage(text); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setMessage(''), 6500); }
  async function refresh(canEdit: boolean) {
    const data = await api<{ posts: Summary[] }>(`/api/blog${canEdit ? '?drafts=1' : ''}`); setPosts(data.posts); setError('');
  }
  async function openArticle(id: string, edit = false, updateUrl = true) {
    setArticleBusy(true); setError('');
    try {
      const { post } = await api<{ post: BlogPost }>(`/api/blog/${encodeURIComponent(id)}`);
      setDraft(edit ? post : null); setReading(edit ? null : post);
      if (updateUrl) history.pushState({}, '', edit ? `/blog?edit=${post.id}` : `/blog/${post.slug}`);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (error) { setError((error as Error).message); } finally { setArticleBusy(false); }
  }
  function showIndex() { setDraft(null); setReading(null); setError(''); history.pushState({}, '', '/blog'); }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await api<{ canEdit: boolean }>('/api/blog/session'); if (!active) return;
        setOwner(session.canEdit); await refresh(session.canEdit);
        const edit = new URLSearchParams(location.search).get('edit');
        if (edit && session.canEdit) await openArticle(edit, true, false);
        else if (initialSlug) await openArticle(initialSlug, false, false);
      } catch (error) { if (active) setError((error as Error).message); } finally { if (active) setReady(true); }
    })();
    const script = document.createElement('script'); script.src = '/silk.js'; document.body.appendChild(script);
    const pop = () => {
      const edit = new URLSearchParams(location.search).get('edit');
      const slug = location.pathname.split('/')[2];
      if (edit) void openArticle(edit, true, false); else if (slug) void openArticle(slug, false, false); else { setDraft(null); setReading(null); }
    };
    window.addEventListener('popstate', pop);
    return () => { active = false; script.remove(); window.removeEventListener('popstate', pop); if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);
  async function create() {
    setBusy(true);
    try { const { post } = await api<{ post: BlogPost }>('/api/blog', { method: 'POST' }); setDraft(post); setReading(null); history.pushState({}, '', `/blog?edit=${post.id}`); await refresh(owner); }
    catch (error) { notify((error as Error).message); } finally { setBusy(false); }
  }
  async function exportWebsite() {
    setExporting(true);
    try { await downloadWebsite(); notify('Paket artikel Published dan gambar selesai diekspor. Draf tetap di editor lokal.'); }
    catch (error) { notify((error as Error).message); }
    finally { setExporting(false); }
  }
  async function remove() {
    if (!deletePost) return; setBusy(true);
    try { await api(`/api/blog/${deletePost.id}`, { method: 'DELETE' }); setDeletePost(null); showIndex(); await refresh(owner); notify('Artikel dan gambar lampirannya dihapus.'); }
    catch (error) { notify((error as Error).message); } finally { setBusy(false); }
  }
  const visible = posts.filter(post => (filter === 'all' || post.status === filter) && `${post.title} ${post.excerpt} ${post.tags}`.toLowerCase().includes(query.toLowerCase()));
  const headings = reading ? outline(reading.markdown) : [];
  return <div className={`page page-notebook ${draft ? 'is-writing' : ''}`}><BlogHeader /><main id="main" className="shell notebook-main">
    {draft ? <Suspense fallback={<div className="write-loading" role="status">Opening the editor…</div>}><PostEditor key={draft.id} initial={draft} onSaved={() => void refresh(owner).catch(error => notify(error.message))} onLeave={showIndex} onMessage={notify} /></Suspense> : <>
      <div className="notebook-title"><div><span className="notebook-eyebrow">ARIQ’S NOTEBOOK</span><h1>{reading ? 'Blog' : 'Blog.'}</h1>{!reading && <p>Notes on cryptography, blockchain, and the things I build.</p>}</div><div className="notebook-actions"><a className="quiet-button" href="/writeups.html"><BookOpen size={15} />CTF Write Up <ArrowUpRight size={14} /></a>{owner ? <><button className="secondary-button" disabled={exporting || busy} onClick={exportWebsite}><Download size={15} />{exporting ? 'Exporting…' : 'Export website'}</button><button className="primary-button" disabled={busy} onClick={create}><Plus size={16} />New article</button></> : ready && <a className="secondary-button" href="/signin-with-chatgpt?return_to=%2Fblog" target="_top">Owner sign in</a>}</div></div>
      {error && <div className="blog-error" role="alert"><p>{error}</p><button onClick={() => { void refresh(owner).catch(error => setError(error.message)); }}>Try again</button></div>}
      {!ready || articleBusy ? <div className="blog-loading" role="status" aria-label="Loading articles"><span /><span /><span /></div> : reading ? <div className="reader-layout">
        <aside className="reader-navigation"><button className="quiet-button" onClick={showIndex}><ArrowLeft size={14} />All articles</button><span className="sidebar-label">ON THIS PAGE</span><nav aria-label="Article contents">{headings.map(item => <a key={item.id} href={`#${item.id}`} className={item.level === 3 ? 'heading-nested' : ''}>{item.title}</a>)}</nav></aside>
        <article className="blog-reading"><div className="article-metadata"><span>{dateLabel(reading.published_at)}</span><span>{Math.max(1, Math.ceil(reading.markdown.split(/\s+/).length / 220))} min read</span>{reading.status === 'draft' && <span>Draft preview</span>}</div><h1>{reading.title}</h1>{reading.excerpt && <p className="article-lead">{reading.excerpt}</p>}<div className="article-byline"><img src="/assets/profile-avatar.jpg" alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /><span>Ariq Ardian</span><div>{owner && <button className="quiet-button" onClick={() => openArticle(reading.id, true)}><Pencil size={14} />Edit</button>}<button className="quiet-button" onClick={() => downloadMarkdown(reading)} aria-label="Export article Markdown"><Download size={14} /></button><button className="quiet-button" onClick={async () => { try { await navigator.clipboard.writeText(location.href); notify('Article link copied.'); } catch { notify('Salin URL artikel dari address bar.'); } }} aria-label="Copy article link"><Copy size={14} /></button></div></div>
          <Article markdown={reading.markdown} onMessage={notify} /><p className="article-end">{reading.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => <span key={tag}>{tag}</span>)}</p></article></div> : <div className="library-layout">
        <aside className="library-sidebar"><span className="sidebar-label">LIBRARY</span><nav aria-label="Article filters">{[['all', 'All articles'], ['published', 'Published'], ...(owner ? [['draft', 'Drafts']] : [])].map(([value, label]) => <button key={value} aria-current={filter === value ? 'page' : undefined} onClick={() => setFilter(value)}><FileText size={15} /><span>{label}</span><small>{posts.filter(post => value === 'all' || post.status === value).length}</small></button>)}</nav><div className="library-reference"><span className="sidebar-label">ELSEWHERE</span><a href="/writeups.html">Competition writeups <ArrowUpRight size={13} /></a><a href="https://hackmd.io/@AriqArdian" target="_blank" rel="noopener noreferrer">HackMD notes <ArrowUpRight size={13} /></a></div></aside>
        <section className="article-library" aria-label="Articles"><div className="library-heading"><h2>{filter === 'draft' ? 'Drafts' : filter === 'published' ? 'Published articles' : 'All articles'} <span>{visible.length}</span></h2><label className="article-search"><Search size={15} /><input aria-label="Search articles" type="search" placeholder="Search notes…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
          {!visible.length ? <div className="blog-empty"><FileText size={30} strokeWidth={1} /><h3>{query ? 'No matching notes.' : filter === 'draft' ? 'A place for unfinished ideas.' : 'The next idea starts here.'}</h3><p>{query ? 'Try another title, keyword, or tag.' : owner ? 'Create an article, write in Markdown, and publish when it is ready. Your PDF writeups are still in Write Up.' : 'New articles will appear here. In the meantime, explore my competition writeups.'}</p>{!query && <a className="quiet-button" href="/writeups.html">Read the writeups <ArrowUpRight size={14} /></a>}</div> : <div className="article-list">{visible.map(post => <article className="article-list-item" key={post.id}><div className="article-list-meta"><span>{dateLabel(post.published_at || post.updated_at)}</span>{post.status === 'draft' && <span className="draft-badge">Draft</span>}</div><h3><a href={`/blog/${post.slug}`} onClick={event => { event.preventDefault(); void openArticle(post.id); }}>{post.title}<ArrowUpRight size={18} /></a></h3>{post.excerpt && <p>{post.excerpt}</p>}<div className="article-list-bottom"><span>{post.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(' · ') || 'Notes'}</span>{owner && <div><button aria-label={`Edit ${post.title}`} onClick={() => openArticle(post.id, true)}><Pencil size={14} />Edit</button><button aria-label={`Delete ${post.title}`} onClick={() => setDeletePost(post)}><Trash2 size={14} /></button></div>}</div></article>)}</div>}
        </section></div>}
    </>}
  </main><BlogFooter />{message && <div className="blog-toast" role="status">{message}<button aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button></div>}
    {deletePost && <dialog ref={deleteDialog} className="delete-dialog" aria-labelledby="delete-title" onCancel={() => setDeletePost(null)}><h2 id="delete-title">Delete this article?</h2><p>“{deletePost.title}” and its uploaded images will be removed. Export the Markdown first if you want to keep a copy.</p><div><button autoFocus className="secondary-button" disabled={busy} onClick={() => setDeletePost(null)}>Cancel</button><button className="primary-button" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete article'}</button></div></dialog>}
  </div>;
}
