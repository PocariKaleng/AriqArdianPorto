import { db, bucket, findPost, requireOwner, isOwner, bodyJson, cleanPost, postSlug, BlogError, json, handle } from '@/lib/blog';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return handle(async () => {
    const post = await findPost((await context.params).id);
    if (!post || (post.status !== 'published' && !await isOwner())) throw new BlogError('Artikel tidak ditemukan.', 404);
    return json({ post: { ...post, owner_id: undefined } });
  });
}
export async function PUT(request: Request, context: Context) {
  return handle(async () => {
    await requireOwner(request);
    const current = await findPost((await context.params).id);
    if (!current) throw new BlogError('Artikel tidak ditemukan.', 404);
    const value = cleanPost(await bodyJson(request));
    const now = new Date().toISOString();
    const slug = current.published_at ? current.slug : postSlug(value.title, current.id);
    const publishedAt = value.status === 'published' ? (current.published_at || now) : current.published_at;
    const result = await db().prepare('UPDATE blog_posts SET title = ?, excerpt = ?, markdown = ?, tags = ?, status = ?, slug = ?, updated_at = ?, published_at = ?, revision = revision + 1 WHERE id = ? AND revision = ?')
      .bind(value.title, value.excerpt, value.markdown, value.tags, value.status, slug, now, publishedAt, current.id, value.revision).run();
    if (!result.meta.changes) throw new BlogError('Artikel berubah di perangkat lain. Ekspor salinan Markdown sebelum memuat ulang versi terbaru.', 409);
    return json({ post: { ...await findPost(current.id), owner_id: undefined } });
  });
}
export async function DELETE(request: Request, context: Context) {
  return handle(async () => {
    await requireOwner(request);
    const current = await findPost((await context.params).id);
    if (!current) throw new BlogError('Artikel tidak ditemukan.', 404);
    const assets = await db().prepare('SELECT object_key FROM blog_images WHERE post_id = ?').bind(current.id).all<{ object_key: string }>();
    if (assets.results.length) await bucket().delete(assets.results.map(a => a.object_key));
    await db().batch([db().prepare('DELETE FROM blog_images WHERE post_id = ?').bind(current.id), db().prepare('DELETE FROM blog_posts WHERE id = ?').bind(current.id)]);
    return json({ deleted: true });
  });
}
