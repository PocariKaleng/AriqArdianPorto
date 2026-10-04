import { BlogApp } from '@/components/blog/BlogApp';
import { findPost, isOwner } from '@/lib/blog';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await findPost((await params).slug);
  if (!post || (post.status !== 'published' && !await isOwner())) return { title: 'Article — Ariq Ardian' };
  return { title: `${post.title} — Ariq Ardian`, description: post.excerpt, robots: post.status === 'draft' ? { index: false, follow: false } : undefined };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) { return <BlogApp initialSlug={(await params).slug} />; }
