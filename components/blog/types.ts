export type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; markdown: string; tags: string;
  status: 'draft' | 'published'; updated_at: string; published_at: string | null; revision: number;
};
export type Summary = Omit<BlogPost, 'markdown'>;
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options?.headers } });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error((data as { error?: string }).error || 'Permintaan gagal. Coba lagi.');
  return data as T;
}
export function downloadMarkdown(post: BlogPost) {
  const blob = new Blob([`# ${post.title}\n\n${post.markdown}`], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `${post.slug}.md`; link.click(); URL.revokeObjectURL(url);
}
export async function downloadWebsite() {
  const response = await fetch('/api/blog/export');
  if (!response.ok) {
    const data = await response.json() as { error?: string };
    throw new Error(data.error || 'Ekspor gagal. Coba lagi.');
  }
  const url = URL.createObjectURL(await response.blob()), link = document.createElement('a');
  link.href = url; link.download = 'portfolio.blog.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function dateLabel(date: string | null) {
  return date ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(date)) : 'Draft';
}
