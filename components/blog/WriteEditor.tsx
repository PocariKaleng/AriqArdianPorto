'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useEditor, EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import { InlineMath, BlockMath } from '@tiptap/extension-mathematics';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Bold, Italic, Code2, Link2, List, ListOrdered, Quote, Undo2, Redo2, Plus, ChevronDown, ChevronRight, Sigma, ImagePlus, Table2, Heading2, X, Copy } from 'lucide-react';
import { syntax, codeLanguages, codeLanguage } from './syntax';
import { normalizeLatex } from './MarkdownEditor';
import { Article } from './Article';
import { codeFilename, codeFileMeta } from './code-file';

function CodeView({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState(false), [folded, setFolded] = useState(false);
  return <NodeViewWrapper className="write-code-block"><div className="write-code-topbar" contentEditable={false}>
    <button type="button" className="write-code-disclosure" aria-expanded={!folded} aria-label={`${folded ? 'Expand' : 'Collapse'} ${node.attrs.filename || 'code block'}`} onClick={() => setFolded(!folded)}><ChevronRight size={14} /></button>
    <select aria-label="Code block language" value={node.attrs.language || 'plaintext'} onChange={event => updateAttributes({ language: event.target.value })}>
      {!codeLanguages.some(([value]) => value === node.attrs.language) && node.attrs.language && <option value={node.attrs.language}>{codeLanguage(node.attrs.language)}</option>}
      {codeLanguages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
    </select><input className="write-code-filename" aria-label="Code filename" placeholder="Filename, e.g. solver.sage" maxLength={160} value={node.attrs.filename || ''} onChange={event => updateAttributes({ filename: event.target.value })} /><button title="Copy code" aria-label="Copy code block" onClick={async () => { try { await navigator.clipboard.writeText(node.textContent); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setCopied(false); } }}><Copy size={13} />{copied ? 'Copied' : 'Copy'}</button>
  </div><pre hidden={folded}><NodeViewContent<'code'> as="code" /></pre></NodeViewWrapper>;
}
export const ColoredCode = CodeBlockLowlight.extend({
  addAttributes() {
    return { ...this.parent?.(), filename: { default: '', parseHTML: element => element.getAttribute('data-filename') || '', renderHTML: attributes => attributes.filename ? { 'data-filename': attributes.filename } : {} }, meta: { default: '', rendered: false } };
  },
  parseMarkdown(token, helpers) {
    const [language = '', ...parts] = (token.lang || '').split(/\s+/);
    const meta = parts.join(' ');
    return helpers.createNode('codeBlock', { language: language || null, filename: codeFilename(meta), meta }, token.text ? [helpers.createTextNode(token.text)] : []);
  },
  renderMarkdown(node, helpers) {
    const meta = codeFileMeta(node.attrs?.meta || '', node.attrs?.filename || '');
    const info = [node.attrs?.language || (meta ? 'plaintext' : ''), meta].filter(Boolean).join(' ');
    const text = node.content ? helpers.renderChildren(node.content) : '';
    const longestFence = Math.max(2, ...[...text.matchAll(/`+/g)].map(match => match[0].length));
    const fence = '`'.repeat(longestFence + 1);
    return `${fence}${info}\n${text}\n${fence}`;
  },
  addNodeView() { return ReactNodeViewRenderer(CodeView); },
});
export type WriteHandle = { insertMarkdown: (markdown: string) => void; insertImage: (src: string, alt: string) => void; openEquation: () => void };
type MathEdit = { latex: string; inline: boolean; pos?: number };
export const WriteEditor = forwardRef<WriteHandle, { value: string; onChange: (value: string) => void; onImages: (files: File[]) => void; onUpload: () => void; onMessage: (text: string) => void }>(({ value, onChange, onImages, onUpload, onMessage }, ref) => {
  const callbacks = useRef({ onChange, onImages, onMessage });
  useEffect(() => { callbacks.current = { onChange, onImages, onMessage }; }, [onChange, onImages, onMessage]);
  const [menu, setMenu] = useState(false), [math, setMath] = useState<MathEdit | null>(null), [link, setLink] = useState<string | null>(null);
  const [code, setCode] = useState('python'), [, refreshToolbar] = useState(0);
  const mathDialog = useRef<HTMLDialogElement>(null), linkDialog = useRef<HTMLDialogElement>(null), blockMenu = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ codeBlock: false, horizontalRule: false, underline: false, heading: { levels: [2, 3] }, link: { openOnClick: false, protocols: ['http', 'https', 'mailto'] } }),
      Markdown, Image.configure({ allowBase64: false }), Placeholder.configure({ placeholder: 'Start writing, or type / to add a block…' }),
      TableKit.configure({ table: { resizable: false } }), ColoredCode.configure({ lowlight: syntax, defaultLanguage: 'plaintext' }),
      InlineMath.configure({ katexOptions: { displayMode: false, trust: false, strict: false, throwOnError: false }, onClick: (node, pos) => setMath({ latex: node.attrs.latex, inline: true, pos }) }),
      BlockMath.configure({ katexOptions: { displayMode: true, trust: false, strict: false, throwOnError: false }, onClick: (node, pos) => setMath({ latex: node.attrs.latex, inline: false, pos }) })],
    content: value, contentType: 'markdown',
    editorProps: {
      attributes: { class: 'article-body write-document', role: 'textbox', 'aria-label': 'Article editor', 'aria-multiline': 'true', spellcheck: 'true' },
      handleKeyDown(view, event) {
        if (event.key === '/' && !view.state.selection.$from.parent.textContent && view.state.selection.$from.parent.type.name === 'paragraph') { event.preventDefault(); setMenu(true); return true; }
        return false;
      },
      handlePaste(view, event) {
        const files = [...(event.clipboardData?.files || [])];
        if (files.length) { event.preventDefault(); callbacks.current.onImages(files); return true; }
        const text = event.clipboardData?.getData('text/plain') || '';
        if (text && !event.clipboardData?.getData('text/html') && view.state.selection.$from.parent.type.name !== 'codeBlock') {
          event.preventDefault(); editor?.commands.insertContent(normalizeLatex(text), { contentType: 'markdown' }); return true;
        }
        return false;
      },
      handleDrop(_view, event) { const files = [...(event.dataTransfer?.files || [])]; if (files.length) { event.preventDefault(); callbacks.current.onImages(files); return true; } return false; },
    },
    onUpdate: ({ editor }) => callbacks.current.onChange(editor.getMarkdown()),
    onSelectionUpdate: () => refreshToolbar(count => count + 1),
    onTransaction: ({ transaction }) => { if (transaction.docChanged) refreshToolbar(count => count + 1); },
  });
  useImperativeHandle(ref, () => ({
    insertMarkdown: markdown => { editor?.chain().focus().insertContent(markdown, { contentType: 'markdown' }).run(); },
    insertImage: (src, alt) => { editor?.chain().focus().setImage({ src, alt }).run(); },
    openEquation: () => setMath({ latex: '\\frac{a}{b}', inline: false }),
  }));
  useEffect(() => { if (editor && editor.getMarkdown() !== value) editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false }); }, [value, editor]);
  useEffect(() => { if (math) mathDialog.current?.showModal(); }, [math !== null]);
  useEffect(() => { if (link !== null) linkDialog.current?.showModal(); }, [link !== null]);
  useEffect(() => { if (menu) blockMenu.current?.querySelector<HTMLButtonElement>('button')?.focus(); }, [menu]);
  if (!editor) return <div className="write-loading">Opening your writing space…</div>;
  function addBlock(type: string) {
    setMenu(false); if (!editor) return;
    if (type === 'heading') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (type === 'quote') editor.chain().focus().toggleBlockquote().run();
    else if (type === 'list') editor.chain().focus().toggleBulletList().run();
    else if (type === 'code') editor.chain().focus().setCodeBlock({ language: code }).run();
    else if (type === 'table') editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    else if (type === 'math') setMath({ latex: '\\frac{a}{b}', inline: false });
    else if (type === 'image') onUpload();
  }
  return <div className="write-space"><div className="write-formatbar" role="toolbar" aria-label="Text formatting">
    <div className="block-picker"><button className="add-block" aria-label="Add block" aria-expanded={menu} onClick={() => setMenu(!menu)}><Plus size={15} /><span>Block</span><ChevronDown size={12} /></button>
      {menu && <div ref={blockMenu} className="block-menu" role="group" aria-label="Insert a block" onKeyDown={event => { if (event.key === 'Escape') { setMenu(false); editor.commands.focus(); } }}>
        <span>INSERT A BLOCK</span>{([['heading', Heading2, 'Heading'], ['list', List, 'Bullet list'], ['quote', Quote, 'Quote'], ['code', Code2, 'Code block'], ['math', Sigma, 'Equation'], ['image', ImagePlus, 'Image'], ['table', Table2, 'Table']] as const).map(([type, Icon, label]) => <button key={type} onClick={() => addBlock(type)}><Icon size={15} />{label}</button>)}
      </div>}
    </div>
    <select className="write-heading-select" aria-label="Text style" value={editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'} onChange={event => event.target.value === 'p' ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level: event.target.value === 'h2' ? 2 : 3 }).run()}><option value="p">Text</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select>
    <button title="Bold · Ctrl B" aria-label="Bold" aria-pressed={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></button>
    <button title="Italic · Ctrl I" aria-label="Italic" aria-pressed={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></button>
    <button title="Inline code" aria-label="Inline code" aria-pressed={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code2 size={16} /></button>
    <button title="Link" aria-label="Insert link" aria-pressed={editor.isActive('link')} onClick={() => setLink(editor.getAttributes('link').href || '')}><Link2 size={16} /></button>
    <button title="Bullet list" aria-label="Bullet list" aria-pressed={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></button>
    <button title="Numbered list" aria-label="Numbered list" aria-pressed={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></button>
    <button title="Quote" aria-label="Quote" aria-pressed={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></button>
    <div className="code-insert-tools"><select aria-label="New code block language" value={code} onChange={event => setCode(event.target.value)}>{codeLanguages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button title="Insert code block" aria-label="Add code block" onClick={() => addBlock('code')}><Plus size={14} /><Code2 size={16} /></button></div>
    <div className="write-history"><button title="Undo" aria-label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></button><button title="Redo" aria-label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></button></div>
  </div>
    {editor.isActive('table') && <div className="table-tools" role="toolbar" aria-label="Table controls"><button onClick={() => editor.chain().focus().addRowAfter().run()}>+ Row</button><button onClick={() => editor.chain().focus().addColumnAfter().run()}>+ Column</button><button onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</button><button onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</button><button onClick={() => editor.chain().focus().deleteTable().run()}>Remove table</button></div>}
    <EditorContent editor={editor} />
    <div className="write-hint">Type / for blocks · Markdown shortcuts work here · Click an equation to edit its LaTeX</div>
    {math && <dialog ref={mathDialog} className="editor-dialog" aria-labelledby="equation-title" onCancel={() => setMath(null)}><div className="editor-dialog-title"><h2 id="equation-title">{math.pos === undefined ? 'Add an equation' : 'Edit equation'}</h2><button aria-label="Close equation dialog" onClick={() => setMath(null)}><X size={18} /></button></div><label htmlFor="equation-latex">LaTeX</label><textarea id="equation-latex" autoFocus rows={4} value={math.latex} onChange={event => setMath({ ...math, latex: event.target.value })} placeholder="\\frac{a}{b}" /><label className="math-inline-choice"><input type="checkbox" checked={math.inline} disabled={math.pos !== undefined} onChange={event => setMath({ ...math, inline: event.target.checked })} />Inline equation</label><div className="equation-preview"><Article markdown={`$$\n${math.latex}\n$$`} onMessage={onMessage} /></div><div className="editor-dialog-actions"><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(math.latex); onMessage('LaTeX copied.'); } catch { onMessage('Clipboard tidak tersedia.'); } }}><Copy size={14} />Copy LaTeX</button><button className="primary-button" disabled={!math.latex.trim()} onClick={() => { const attrs = { latex: math.latex.trim(), pos: math.pos }; if (math.pos !== undefined) { if (math.inline) editor.chain().focus().updateInlineMath(attrs).run(); else editor.chain().focus().updateBlockMath(attrs).run(); } else if (math.inline) editor.chain().focus().insertInlineMath(attrs).run(); else editor.chain().focus().insertBlockMath(attrs).run(); setMath(null); }}>{math.pos === undefined ? 'Insert equation' : 'Update equation'}</button></div></dialog>}
    {link !== null && <dialog ref={linkDialog} className="editor-dialog link-dialog" aria-labelledby="link-title" onCancel={() => setLink(null)}><div className="editor-dialog-title"><h2 id="link-title">Add a link</h2><button aria-label="Close link dialog" onClick={() => setLink(null)}><X size={18} /></button></div><label htmlFor="link-url">URL</label><input id="link-url" autoFocus type="url" value={link} onChange={event => setLink(event.target.value)} placeholder="https://…" /><div className="editor-dialog-actions"><button className="secondary-button" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLink(null); }}>Remove link</button><button className="primary-button" onClick={() => { if (!/^(https?:\/\/|mailto:|\/|#)/i.test(link.trim())) { onMessage('Gunakan URL https, email, atau tautan halaman.'); return; } editor.chain().focus().extendMarkRange('link').setLink({ href: link.trim() }).run(); setLink(null); }}>Apply link</button></div></dialog>}
  </div>;
});
WriteEditor.displayName = 'WriteEditor';
