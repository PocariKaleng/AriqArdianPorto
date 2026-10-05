'use client';
import { useRef, useState, useEffect } from 'react';
import { Bold, Heading2, Code2, ImagePlus, Sigma, Download, Upload, Save, ArrowUpRight, Columns2, Eye, FileCode2, Quote, HelpCircle, PencilLine } from 'lucide-react';
import { MarkdownEditor, normalizeLatex, type EditorHandle } from './MarkdownEditor';
import { Article, outline } from './Article';
import { api, downloadMarkdown, downloadWebsite, type BlogPost } from './types';
import { WriteEditor, type WriteHandle } from './WriteEditor';
const example = '## A small starting point\n\nWrite your notes here. Use **Markdown**, code, images, and equations.\n\n$$\nc \\equiv m^e \\pmod{n}\n$$\n\n```python\nmessage = pow(ciphertext, d, n)\n```\n';
export function PostEditor({ initial, onSaved, onLeave, onMessage }: { initial: BlogPost; onSaved: (post: BlogPost) => void; onLeave: () => void; onMessage: (text: string) => void }) {
  const [post, setPost] = useState(initial), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false), [mode, setMode] = useState<'write' | 'split' | 'source' | 'preview'>('write');
  const [help, setHelp] = useState(false), [recovery, setRecovery] = useState<BlogPost | null>(null);
  const [exporting, setExporting] = useState(false);
  const editor = useRef<EditorHandle>(null), images = useRef<HTMLInputElement>(null), importer = useRef<HTMLInputElement>(null);
  const writer = useRef<WriteHandle>(null), currentMode = useRef(mode); currentMode.current = mode;
  const latest = useRef(post); latest.current = post;
  const saveRef = useRef<() => void>(() => {});
  function change(patch: Partial<BlogPost>) { setPost(previous => ({ ...previous, ...patch })); setDirty(true); }
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`portfolio-blog-draft:${initial.id}`) || 'null');
      if (saved && saved.id === initial.id && (saved.markdown !== initial.markdown || saved.title !== initial.title)) setRecovery(saved);
    } catch { /* Server copy is always available. */ }
  }, [initial.id]);
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => { try { localStorage.setItem(`portfolio-blog-draft:${post.id}`, JSON.stringify(post)); } catch { /* Manual server save remains available. */ } }, 600);
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { clearTimeout(timer); window.removeEventListener('beforeunload', beforeUnload); };
  }, [post, dirty]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveRef.current(); } };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  async function save(status: 'draft' | 'published') {
    if (busy || uploading) return;
    setBusy(true); const snapshot = latest.current;
    try {
      const { post: saved } = await api<{ post: BlogPost }>(`/api/blog/${post.id}`, { method: 'PUT', body: JSON.stringify({ ...snapshot, status }) });
      const stillSame = latest.current.title === snapshot.title && latest.current.markdown === snapshot.markdown && latest.current.tags === snapshot.tags && latest.current.excerpt === snapshot.excerpt;
      setPost(previous => ({ ...previous, slug: saved.slug, revision: saved.revision, status: saved.status, updated_at: saved.updated_at, published_at: saved.published_at }));
      setDirty(!stillSame); onSaved(saved);
      if (stillSame) { try { localStorage.removeItem(`portfolio-blog-draft:${post.id}`); } catch { /* Optional recovery cache. */ } }
      onMessage(status === 'published' ? 'Artikel tersimpan sebagai Published. Ekspor dan deploy untuk memperbarui website publik.' : 'Draf tersimpan di editor lokal.');
    } catch (error) { onMessage((error as Error).message); } finally { setBusy(false); }
  }
  saveRef.current = () => { void save(post.status); };
  async function exportWebsite() {
    setExporting(true);
    try { await downloadWebsite(); onMessage('Paket semua artikel Published beserta gambar selesai diekspor.'); }
    catch (error) { onMessage((error as Error).message); }
    finally { setExporting(false); }
  }
  async function upload(files: File[]) {
    if (!files.length || uploading) return;
    setUploading(true);
    try {
      for (const file of files) {
        const data = new FormData(); data.append('image', file);
        const result = await api<{ url: string; name: string }>(`/api/blog/${post.id}/images`, { method: 'POST', body: data });
        const alt = result.name.replace(/\.[^.]+$/, '').replace(/[\[\]\\\n\r]/g, '').slice(0, 160);
        if (currentMode.current === 'write') writer.current?.insertImage(result.url, alt);
        else editor.current?.insert(`\n![${alt}](${result.url})\n`);
      }
      onMessage('Gambar masuk ke tulisan. Simpan draf untuk menyimpan posisinya.');
    } catch (error) { onMessage((error as Error).message); } finally { setUploading(false); if (images.current) images.current.value = ''; }
  }
  async function importFile(file?: File) {
    if (!file) return;
    if (file.size > 400_000) { onMessage('File Markdown maksimal 400 KB.'); return; }
    const text = normalizeLatex(await file.text());
    const title = text.match(/^#\s+(.+)\r?\n/);
    change({ title: title?.[1] || post.title, markdown: title ? text.replace(/^#\s+.+\r?\n\s*/, '') : text });
    if (importer.current) importer.current.value = '';
  }
  const items = outline(post.markdown);
  return <section className="editor-workspace" aria-label="Blog writing workspace">
    <div className="editor-topbar"><button className="quiet-button" onClick={() => { if (!dirty || confirm('Perubahan belum tersimpan di server. Keluar dari editor?')) onLeave(); }}>← All articles</button>
      <div className="editor-save"><span className="save-state">{busy ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved locally'}</span><button className="secondary-button" disabled={busy || uploading || exporting || dirty || post.status !== 'published'} title={dirty ? 'Save changes before exporting' : 'Export all saved Published articles and their images'} onClick={exportWebsite}><Download size={15} />{exporting ? 'Exporting…' : 'Export website'}</button><button className="secondary-button" disabled={busy || uploading || exporting} onClick={() => save('draft')}><Save size={15} />{post.status === 'published' ? 'Unpublish & save' : 'Save draft'}</button><button className="primary-button" disabled={busy || uploading || exporting} onClick={() => save('published')}><ArrowUpRight size={15} />{post.status === 'published' ? 'Update article' : 'Publish'}</button></div></div>
    {recovery && <div className="recovery-banner">Ada perubahan lokal yang belum tersimpan.<button onClick={() => { change({ title: recovery.title, markdown: recovery.markdown, excerpt: recovery.excerpt, tags: recovery.tags }); setRecovery(null); }}>Restore</button><button onClick={() => { localStorage.removeItem(`portfolio-blog-draft:${post.id}`); setRecovery(null); }}>Use server copy</button></div>}
    <div className="editor-metadata"><label htmlFor="post-title">Article title</label><input id="post-title" maxLength={180} value={post.title} onChange={event => change({ title: event.target.value })} placeholder="Give your idea a title" />
      <div className="metadata-details"><label>Short description<input maxLength={400} value={post.excerpt} onChange={event => change({ excerpt: event.target.value })} placeholder="A sentence for the article list" /></label><label>Tags<input maxLength={200} value={post.tags} onChange={event => change({ tags: event.target.value })} placeholder="cryptography, notes" /></label></div></div>
    <div className="editor-toolbar"><div className="format-tools">
      {mode !== 'write' && <>
      <button title="Heading" aria-label="Insert heading" onClick={() => editor.current?.insert('\n## ', '\n', 'Heading')}><Heading2 size={17} /></button>
      <button title="Bold" aria-label="Insert bold text" onClick={() => editor.current?.insert('**', '**', 'text')}><Bold size={17} /></button>
      <button title="Quote" aria-label="Insert quote" onClick={() => editor.current?.insert('\n> ', '\n', 'Quote')}><Quote size={17} /></button>
      <button title="Code block" aria-label="Insert code block" onClick={() => editor.current?.insert('\n```python\n', '\n```\n', '# your code')}><Code2 size={17} /></button>
      <button title="LaTeX equation" aria-label="Insert LaTeX equation" onClick={() => editor.current?.insert('\n$$\n', '\n$$\n', '\\frac{a}{b}')}><Sigma size={17} /></button>
      </>}
      {mode === 'write' && <button title="LaTeX equation" aria-label="Add LaTeX equation" onClick={() => writer.current?.openEquation()}><Sigma size={17} /></button>}
      <button title="Upload image" aria-label="Upload image" disabled={uploading} onClick={() => images.current?.click()}><ImagePlus size={17} /></button>
      <button title="Import Markdown" aria-label="Import Markdown" onClick={() => importer.current?.click()}><Upload size={17} /></button>
      <button title="Export Markdown" aria-label="Export Markdown" onClick={() => downloadMarkdown(post)}><Download size={17} /></button>
      <button title="Markdown help" aria-label="Markdown help" aria-expanded={help} onClick={() => setHelp(!help)}><HelpCircle size={17} /></button>
    </div><div className="editor-mode" role="group" aria-label="Editor layout">{([['write', PencilLine, 'Write'], ['source', FileCode2, 'Markdown'], ['split', Columns2, 'Split'], ['preview', Eye, 'Preview']] as const).map(([value, Icon, label]) => <button key={value} title={label} aria-label={`${label} mode`} aria-pressed={mode === value} disabled={uploading} onClick={() => setMode(value)}><Icon size={14} /><span>{label}</span></button>)}</div></div>
    {help && <div className="markdown-help"><p><code>## Heading</code> · <code>**bold**</code> · <code>[link](url)</code> · <code>![caption](image-url)</code></p><p>Add a filename to a code fence: <code>{'```sage filename="solver.sage"'}</code>. Click a code block header to fold or expand it.</p><p>Use <code>$x^2$</code> for inline math or <code>$$</code> on separate lines for a display equation. Paste raw LaTeX or <code>\\[ … \\]</code> to render it automatically. Paste/drop images directly into Source. Click an equation to copy its LaTeX.</p><button className="quiet-button" onClick={() => { if (!post.markdown || confirm('Ganti isi editor dengan contoh Markdown?')) change({ markdown: example }); }}>Insert Markdown example</button><a href="https://hackmd.io/@AriqArdian" target="_blank" rel="noopener noreferrer">My HackMD ↗</a></div>}
    {mode === 'write' ? <WriteEditor ref={writer} value={post.markdown} onChange={markdown => change({ markdown })} onImages={upload} onUpload={() => images.current?.click()} onMessage={onMessage} /> : <div className={`editor-panes mode-${mode}`}><div className="source-pane"><div className="pane-label">MARKDOWN <span>{uploading ? 'Uploading image…' : 'Paste or drop images here'}</span></div><MarkdownEditor ref={editor} value={post.markdown} onChange={markdown => change({ markdown })} onImages={upload} /></div>
      <div className="preview-pane"><div className="pane-label">LIVE PREVIEW <span>Equations render automatically</span></div><div className="preview-content"><h1>{post.title || 'Untitled'}</h1>{post.markdown ? <Article markdown={post.markdown} onMessage={onMessage} /> : <p className="preview-placeholder">Your words will appear here. Start with an idea, a code snippet, or an equation.</p>}</div></div></div>}
    <div className="editor-statusbar"><span>{post.markdown.trim() ? post.markdown.trim().split(/\s+/).length : 0} words · Markdown + LaTeX</span><span>⌘ / Ctrl + S to save · {items.length} headings</span></div>
    <input ref={images} hidden type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" onChange={event => upload([...event.target.files || []])} aria-label="Choose images" />
    <input ref={importer} hidden type="file" accept=".md,.markdown,.txt" onChange={event => importFile(event.target.files?.[0])} aria-label="Choose Markdown file" />
  </section>;
}
