'use client';
import { useState, useRef, useEffect, isValidElement, type ReactNode, type CSSProperties } from 'react';
import type { RootContent } from 'hast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check } from 'lucide-react';
import { syntax, codeLanguage } from './syntax';
function coloredTokens(nodes: RootContent[]): ReactNode[] {
  return nodes.map((node, index) => node.type === 'text' ? node.value : node.type === 'element' ? <span key={index} className={Array.isArray(node.properties.className) ? node.properties.className.join(' ') : undefined}>{coloredTokens(node.children)}</span> : null);
}
function codeTokens(text: string, language?: string): RootContent[] {
  if (language && syntax.registered(language) && text.length < 100_000) {
    try { return syntax.highlight(language, text).children; } catch { /* Unknown or malformed syntax stays readable. */ }
  }
  return [{ type: 'text', value: text }];
}
// Split highlighted tokens after parsing, preserving multiline strings and comments.
function tokenLines(nodes: RootContent[]): RootContent[][] {
  const lines: RootContent[][] = [[]];
  for (const node of nodes) {
    if (node.type === 'text') {
      node.value.split('\n').forEach((value, index) => {
        if (index) lines.push([]);
        if (value) lines[lines.length - 1].push({ type: 'text', value });
      });
    } else if (node.type === 'element') {
      tokenLines(node.children).forEach((children, index) => {
        if (index) lines.push([]);
        if (children.length) lines[lines.length - 1].push({ ...node, children });
      });
    }
  }
  return lines;
}
function Code({ children, className }: { children: ReactNode; className?: string }) {
  const language = className?.match(/language-([\w+-]+)/)?.[1]?.toLowerCase();
  return <code className={className}>{coloredTokens(codeTokens(String(children), language))}</code>;
}
export function outline(markdown: string) {
  let fence = false;
  return markdown.split('\n').flatMap((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return []; }
    const match = !fence && line.match(/^(#{1,3})\s+(.+)$/);
    return match ? [{ id: `section-${index + 1}`, title: match[2].replace(/[*_`]/g, '').replace(/\s+#+$/, ''), level: match[1].length }] : [];
  });
}
function CodeBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null), [copied, setCopied] = useState(false);
  const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children.props : undefined;
  const language = code?.className?.match(/language-([\w+-]+)/)?.[1]?.toLowerCase();
  const text = String(code?.children ?? ''), trailingNewline = text.endsWith('\n');
  const lines = tokenLines(codeTokens(text, language));
  if (trailingNewline) lines.pop();
  return <div className="article-code" ref={ref}><span className="code-language-label">{codeLanguage(language || '')}</span><button className="copy-code" aria-label="Copy code" onClick={async () => {
    try { await navigator.clipboard.writeText(ref.current?.querySelector('code')?.textContent || ''); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { setCopied(false); }
  }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy'}</button><pre><code className={code?.className} style={{ '--code-gutter-width': `${String(lines.length).length}ch` } as CSSProperties}>{lines.map((line, index) => <span key={index}><span className="code-line"><span className="code-line-number" aria-hidden="true" data-line={index + 1} /><span className="code-line-content">{coloredTokens(line)}</span></span>{index < lines.length - 1 || trailingNewline ? '\n' : null}</span>)}</code></pre></div>;
}
export function Article({ markdown, onMessage }: { markdown: string; onMessage?: (text: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>('.katex').forEach(element => {
      element.tabIndex = 0; element.setAttribute('role', 'button'); element.setAttribute('aria-label', 'Copy equation as LaTeX'); element.title = 'Copy LaTeX';
    });
  }, [markdown]);
  async function copyEquation(target: Element) {
    const equation = target.closest('.katex');
    const tex = equation?.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
    if (tex) {
      try { await navigator.clipboard.writeText(tex); onMessage?.('LaTeX copied.'); }
      catch { onMessage?.('Clipboard tidak tersedia. Pilih teks persamaan lalu salin.'); }
    }
  }
  return <div ref={root} className="article-body" onClick={event => void copyEquation(event.target as Element)} onKeyDown={event => {
    if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('.katex')) { event.preventDefault(); void copyEquation(event.target as Element); }
  }}><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false, trust: false }]]}
    components={{
      h1: ({ node, children }) => <h2 id={`section-${node?.position?.start.line}`}>{children}</h2>,
      h2: ({ node, children }) => <h2 id={`section-${node?.position?.start.line}`}>{children}</h2>,
      h3: ({ node, children }) => <h3 id={`section-${node?.position?.start.line}`}>{children}</h3>,
      pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
      code: ({ children, className }) => <Code className={className}>{children}</Code>,
      a: ({ href, children }) => <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>,
      img: ({ src, alt }) => <span className="article-image"><img src={src} alt={alt || 'Article image'} loading="lazy" />{alt && <span className="image-caption">{alt}</span>}</span>,
    }}>{markdown}</ReactMarkdown></div>;
}
