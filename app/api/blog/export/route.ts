import { bucket, db, requireOwner, handle, BlogError, type Post } from '@/lib/blog';
import { publishedBundle, validateBundle } from '@/lib/blog-portable.mjs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handle(async () => {
    await requireOwner(request);
    const result = await db().prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 500").all<Post>();
    try {
      const bundle = await publishedBundle(result.results, async (postId: string, imageId: string) => {
        const image = await db().prepare('SELECT object_key, mime FROM blog_images WHERE id = ? AND post_id = ?').bind(imageId, postId).first<{ object_key: string; mime: string }>();
        if (!image) return null;
        const object = await bucket().get(image.object_key);
        return object ? { mime: image.mime, bytes: await object.arrayBuffer() } : null;
      });
      await validateBundle(bundle);
      return new Response(JSON.stringify(bundle), { headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="portfolio.blog.json"',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      } });
    } catch (error) { throw new BlogError((error as Error).message); }
  });
}
