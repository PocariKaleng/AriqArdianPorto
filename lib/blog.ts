import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export type Post = {
  id: string; slug: string; title: string; excerpt: string; markdown: string;
  tags: string; status: 'draft' | 'published'; owner_id: string;
  created_at: string; updated_at: string; published_at: string | null; revision: number;
};
export class BlogError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function db() {
  if (!env.DB) throw new BlogError('Penyimpanan belum tersedia. Coba lagi sebentar.', 503);
  return env.DB;
}
export function bucket() {
  if (!env.BUCKET) throw new BlogError('Penyimpanan gambar belum tersedia.', 503);
  return env.BUCKET;
}
export async function isOwner() {
  const user = await getChatGPTUser();
  return !!user && (user.email.toLowerCase() === 'artalarik2017@gmail.com' ||
    (import.meta.env.DEV && user.userId === 'local_seedy'));
}
export async function requireOwner(request?: Request) {
  const user = await getChatGPTUser();
  if (!user) throw new BlogError('Masuk dengan ChatGPT untuk menulis.', 401);
  if (!await isOwner()) throw new BlogError('Hanya pemilik portofolio yang bisa mengedit.', 403);
  if (request) {
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new BlogError('Permintaan tidak diizinkan.', 403);
  }
  return user;
}
export async function bodyJson(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new BlogError('Gunakan format JSON.', 415);
  if (Number(request.headers.get('content-length') || 0) > 800_000) throw new BlogError('Artikel terlalu besar.', 413);
  const text = await request.text();
  if (text.length > 400_000) throw new BlogError('Artikel terlalu besar.', 413);
  try { return JSON.parse(text); } catch { throw new BlogError('Data artikel tidak valid.'); }
}
export function cleanPost(input: Record<string, unknown>) {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const excerpt = typeof input.excerpt === 'string' ? input.excerpt.trim() : '';
  const markdown = typeof input.markdown === 'string' ? input.markdown : '';
  const tags = typeof input.tags === 'string' ? input.tags.trim() : '';
  if (!title || title.length > 180) throw new BlogError('Judul wajib diisi, maksimal 180 karakter.');
  if (excerpt.length > 400 || tags.length > 200 || markdown.length > 200_000) throw new BlogError('Teks melebihi batas panjang.');
  if (input.status !== 'draft' && input.status !== 'published') throw new BlogError('Status artikel tidak valid.');
  if (input.status === 'published' && !markdown.trim()) throw new BlogError('Isi artikel sebelum publish.');
  if (!Number.isInteger(input.revision) || Number(input.revision) < 0) throw new BlogError('Versi artikel tidak valid.');
  return { title, excerpt, markdown, tags, status: input.status as string, revision: Number(input.revision) };
}
export function postSlug(title: string, id: string) {
  const slug = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return `${slug || 'article'}-${id.slice(0, 8)}`;
}
export async function findPost(id: string) {
  return db().prepare('SELECT * FROM blog_posts WHERE id = ? OR slug = ?').bind(id, id).first<Post>();
}
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function handle(action: () => Promise<Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof BlogError) return json({ error: error.message }, error.status);
    console.error('Blog request failed', error);
    return json({ error: 'Tidak bisa menyimpan perubahan sekarang. Tulisanmu tetap ada di editor; coba lagi.' }, 500);
  }
}
