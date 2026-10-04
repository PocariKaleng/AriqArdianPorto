import { Buffer } from 'node:buffer';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
export function normalizeBase(value = '/') {
  if (!value) return '/';
  if (!/^\/[a-zA-Z0-9_./-]*$/.test(value) || value.includes('//') || value.split('/').some(part => part === '.' || part === '..')) throw new Error('BLOG_BASE_PATH harus berupa path seperti / atau /Portofolio/.');
  return value.endsWith('/') ? value : value + '/';
}
export const imageTypes = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
export const safeSlug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100 && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(value);
export const safeAsset = value => typeof value === 'string' && /^assets\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(value);

// Work on Markdown nodes so URL examples inside code and LaTeX stay unchanged.
export async function mapMarkdownUrls(markdown, transform) {
  const changes = [];
  const tree = parser.parse(markdown), imageReferences = new Set();
  function findReferences(node) {
    if (node.type === 'imageReference') imageReferences.add(node.identifier);
    for (const child of node.children || []) findReferences(child);
  }
  findReferences(tree);
  async function walk(node) {
    if (['image', 'link', 'definition'].includes(node.type)) {
      const type = node.type === 'definition' && imageReferences.has(node.identifier) ? 'image' : node.type;
      const next = await transform(node.url, type);
      if (next !== node.url) {
        const start = node.position.start.offset, end = node.position.end.offset;
        const source = markdown.slice(start, end);
        const opening = node.type === 'definition' ? source.indexOf(']:') : source.lastIndexOf('](');
        const index = source.indexOf(node.url, opening + 2);
        if (index < 0) throw new Error('Alamat gambar memakai escape yang tidak didukung. Masukkan ulang gambar melalui editor.');
        changes.push({ start: start + index, end: start + index + node.url.length, next });
      }
    }
    for (const child of node.children || []) await walk(child);
  }
  await walk(tree);
  for (const change of changes.sort((a, b) => b.start - a.start)) markdown = markdown.slice(0, change.start) + change.next + markdown.slice(change.end);
  return markdown;
}

export function localImageId(value) {
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
    path = url.pathname;
  }
  return path.match(/^\/api\/blog\/images\/([a-f0-9-]{36})$/)?.[1] || null;
}

export async function publishedBundle(posts, readImage) {
  const exported = [];
  for (const post of posts.filter(post => post.status === 'published')) {
    const assets = new Map();
    const markdown = await mapMarkdownUrls(post.markdown, async url => {
      const id = localImageId(url);
      if (!id) return url;
      if (!assets.has(id)) {
        const image = await readImage(post.id, id);
        if (!image || !imageTypes[image.mime]) throw new Error(`Gambar ${id} di artikel “${post.title}” tidak tersedia. Unggah ulang sebelum ekspor.`);
        assets.set(id, { path: `assets/${id}.${imageTypes[image.mime]}`, mime: image.mime, data: Buffer.from(image.bytes).toString('base64') });
      }
      return `./${assets.get(id).path}`;
    });
    exported.push({ slug: post.slug, title: post.title, excerpt: post.excerpt, tags: post.tags, status: 'published', markdown, published_at: post.published_at, updated_at: post.updated_at, assets: [...assets.values()] });
  }
  return { format: 'portfolio-blog', version: 1, posts: exported };
}

export function validImage(bytes, mime) {
  if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === 'image/gif') return ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString());
  if (mime === 'image/webp') return bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  return false;
}

export function validatePost(post) {
  if (!post || post.status !== 'published' || !safeSlug(post.slug)) throw new Error('Paket hanya boleh berisi artikel Published dengan slug yang aman.');
  for (const [key, max] of [['title', 180], ['excerpt', 400], ['tags', 200], ['markdown', 200_000]]) {
    if (typeof post[key] !== 'string' || post[key].length > max) throw new Error(`Isi ${key} tidak valid di artikel ${post.slug}.`);
  }
  if (!post.title.trim() || !post.markdown.trim()) throw new Error('Judul dan isi artikel wajib ada.');
  for (const key of ['published_at', 'updated_at']) if (typeof post[key] !== 'string' || !Number.isFinite(Date.parse(post[key]))) throw new Error(`Tanggal ${key} tidak valid.`);
}

export async function validateBundle(bundle) {
  if (bundle?.format !== 'portfolio-blog' || bundle.version !== 1 || !Array.isArray(bundle.posts) || bundle.posts.length > 500) throw new Error('Paket ekspor blog tidak valid.');
  const slugs = new Set();
  for (const post of bundle.posts) {
    validatePost(post);
    if (slugs.has(post.slug)) throw new Error('Slug artikel duplikat.');
    slugs.add(post.slug);
    if (!Array.isArray(post.assets) || post.assets.length > 500) throw new Error('Daftar gambar tidak valid.');
    const paths = new Set();
    for (const asset of post.assets) {
      if (!safeAsset(asset.path) || !imageTypes[asset.mime] || !asset.path.endsWith(`.${imageTypes[asset.mime]}`) || paths.has(asset.path)) throw new Error('Nama atau format file gambar tidak aman.');
      paths.add(asset.path);
      if (typeof asset.data !== 'string' || asset.data.length > 12_000_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(asset.data)) throw new Error('Data gambar tidak valid.');
      const bytes = Buffer.from(asset.data, 'base64');
      if (!bytes.length || bytes.length > 8 * 1024 * 1024 || !validImage(bytes, asset.mime)) throw new Error('Isi gambar tidak cocok dengan formatnya.');
    }
    await checkPortableMarkdown(post.markdown, paths);
  }
  return bundle;
}

export async function checkPortableMarkdown(markdown, paths) {
  await mapMarkdownUrls(markdown, async (url, type) => {
    if (localImageId(url) || /^\/(api|signin-with-chatgpt)(\/|\?|$)/.test(url) || /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])([:/]|$)/i.test(url)) throw new Error('Artikel masih memakai alamat server lokal. Ekspor ulang dari editor.');
    if (url.startsWith('./assets/') && !paths.has(url.slice(2))) throw new Error(`Gambar ${url} hilang dari paket.`);
    if (type === 'image' && !url.startsWith('./assets/') && !url.startsWith('/assets/') && !/^https:\/\//i.test(url)) throw new Error('Gunakan gambar unggahan atau alamat gambar HTTPS.');
    return url;
  });
}
