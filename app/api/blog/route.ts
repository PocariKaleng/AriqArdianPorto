import { db, isOwner, requireOwner, json, handle, BlogError, type Post } from '@/lib/blog';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  return handle(async () => {
    const drafts = new URL(request.url).searchParams.get('drafts') === '1';
    if (drafts && !await isOwner()) throw new BlogError('Akses draf tidak diizinkan.', 403);
    const posts = await db().prepare(`SELECT id, slug, title, excerpt, tags, status, updated_at, published_at, revision FROM blog_posts ${drafts ? '' : "WHERE status = 'published'"} ORDER BY COALESCE(published_at, updated_at) DESC LIMIT 500`).all();
    return json({ posts: posts.results });
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireOwner(request);
    const id = crypto.randomUUID(), now = new Date().toISOString();
    await db().prepare('INSERT INTO blog_posts (id, slug, title, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, `draft-${id.slice(0, 8)}`, 'Untitled', user.userId, now, now).run();
    const post = await db().prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first<Post>();
    return json({ post }, 201);
  });
}
