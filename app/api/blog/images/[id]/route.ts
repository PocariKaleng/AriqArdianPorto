import { db, bucket, isOwner, BlogError, handle } from '@/lib/blog';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const image = await db().prepare('SELECT i.object_key, i.mime, p.status FROM blog_images i JOIN blog_posts p ON p.id = i.post_id WHERE i.id = ?').bind((await context.params).id).first<{ object_key: string; mime: string; status: string }>();
    if (!image || (image.status !== 'published' && !await isOwner())) throw new BlogError('Gambar tidak ditemukan.', 404);
    const object = await bucket().get(image.object_key);
    if (!object) throw new BlogError('Gambar tidak ditemukan.', 404);
    return new Response(object.body, { headers: { 'Content-Type': image.mime, 'Cache-Control': 'private, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff' } });
  });
}
