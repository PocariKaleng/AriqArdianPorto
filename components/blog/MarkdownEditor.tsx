'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
export type EditorHandle = { insert: (before: string, after?: string, placeholder?: string) => void; focus: () => void };
export function normalizeLatex(text: string) {
  let normalized = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$\n${math.trim()}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`)
    .replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, math) => `$$\n${math.trim()}\n$$`);
  if (normalized === text && !text.includes('$') && !text.includes('```') && /^\s*\\(?:frac|sum|int|sqrt|begin|left|prod|lim|mathbf|mathbb|mathrm|overline)\b/.test(text)) normalized = `\n$$\n${text.trim()}\n$$\n`;
  return normalized;
}
export const MarkdownEditor = forwardRef<EditorHandle, { value: string; onChange: (text: string) => void; onImages: (files: File[]) => void }>(({ value, onChange, onImages }, ref) => {
  const parent = useRef<HTMLDivElement>(null), view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onImages });
  callbacks.current = { onChange, onImages };
  useImperativeHandle(ref, () => ({
    insert(before, after = '', placeholder = '') {
      const editor = view.current; if (!editor) return;
      const { from, to } = editor.state.selection.main;
      const selected = editor.state.sliceDoc(from, to) || placeholder;
      editor.dispatch({ changes: { from, to, insert: before + selected + after }, selection: { anchor: from + before.length, head: from + before.length + selected.length } });
      editor.focus();
    }, focus() { view.current?.focus(); },
  }));
  useEffect(() => {
    if (!parent.current) return;
    view.current = new EditorView({ parent: parent.current, doc: value, extensions: [
      basicSetup, markdown(), EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'Markdown editor', spellcheck: 'false' }),
      EditorView.updateListener.of(update => { if (update.docChanged) callbacks.current.onChange(update.state.doc.toString()); }),
      EditorView.domEventHandlers({
        paste(event, editor) {
          const files = [...(event.clipboardData?.files || [])];
          if (files.length) { event.preventDefault(); callbacks.current.onImages(files); return true; }
          const text = event.clipboardData?.getData('text/plain') || '', normalized = normalizeLatex(text);
          if (normalized !== text) { event.preventDefault(); editor.dispatch(editor.state.replaceSelection(normalized)); return true; }
          return false;
        },
        drop(event) {
          const files = [...(event.dataTransfer?.files || [])];
          if (files.length) { event.preventDefault(); callbacks.current.onImages(files); return true; }
          return false;
        },
      }),
    ] });
    return () => { view.current?.destroy(); view.current = null; };
  }, []);
  useEffect(() => {
    if (view.current && view.current.state.doc.toString() !== value) view.current.dispatch({ changes: { from: 0, to: view.current.state.doc.length, insert: value } });
  }, [value]);
  return <div className="markdown-source" ref={parent} />;
});
MarkdownEditor.displayName = 'MarkdownEditor';
