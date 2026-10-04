import { db, bucket, findPost, requireOwner, BlogError, json, handle } from '@/lib/blog';
export const dynamic = 'force-dynamic';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireOwner(request);
    const post = await findPost((await context.params).id);
    if (!post) throw new BlogError('Simpan draf sebelum mengunggah gambar.', 404);
    if (Number(request.headers.get('content-length') || 0) > 9_000_000) throw new BlogError('Maksimal 8 MB per gambar.', 413);
    const file = (await request.formData()).get('image');
    if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024) throw new BlogError('Pilih gambar PNG, JPG, WebP, atau GIF maksimal 8 MB.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    let mime = '';
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) mime = 'image/jpeg';
    else if ([137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)) mime = 'image/png';
    else if (String.fromCharCode(...bytes.slice(0,6)).match(/^GIF8[79]a$/)) mime = 'image/gif';
    else if (String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP') mime = 'image/webp';
    if (!mime) throw new BlogError('Format gambar tidak didukung. Gunakan PNG, JPG, WebP, atau GIF.');
    const id = crypto.randomUUID(), key = `blog/${post.id}/${id}`;
    await bucket().put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
      await db().prepare('INSERT INTO blog_images (id, post_id, object_key, mime, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, post.id, key, mime, bytes.length, new Date().toISOString()).run();
    } catch (error) { await bucket().delete(key); throw error; }
    return json({ url: `/api/blog/images/${id}`, name: file.name }, 201);
  });
}
