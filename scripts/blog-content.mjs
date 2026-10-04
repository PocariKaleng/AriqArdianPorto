import { readFile, writeFile, mkdir, readdir, cp, rename, lstat, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import { validateBundle, validatePost, checkPortableMarkdown, safeAsset, safeSlug, imageTypes, validImage } from '../lib/blog-portable.mjs';

export const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
export const contentRoot = path.join(projectRoot, 'content', 'blog');

export async function readLocalExport(base = 'http://127.0.0.1:5174') {
  const origin = new URL(base);
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Alamat editor harus HTTP localhost, misalnya http://127.0.0.1:5174.');
  // The development preview already provides this simulated owner sign-in.
  const signIn = await fetch(`${origin.origin}/signin-with-chatgpt?return_to=/blog`, { redirect: 'manual', signal: AbortSignal.timeout(20_000) });
  const cookie = signIn.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  if (!cookie) throw new Error('Sign-in lokal tidak tersedia. Jalankan npm run dev, atau gunakan file dari Export website.');
  const response = await fetch(`${origin.origin}/api/blog/export`, { headers: { cookie, origin: origin.origin }, redirect: 'error', signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    throw new Error(message.error || `Ekspor gagal (${response.status}).`);
  }
  return response.json();
}

export async function importBundle(input) {
  const bundle = await validateBundle(input);
  // Stage the complete snapshot before replacing the old one. Keep a recoverable
  // copy locally; no delete operation touches the author's published content.
  const stage = path.join(projectRoot, '.sites-runtime', `blog-import-${crypto.randomUUID()}`);
  await mkdir(stage, { recursive: true });
  for (const post of bundle.posts) {
    const folder = path.join(stage, post.slug);
    await mkdir(path.join(folder, 'assets'), { recursive: true });
    const { markdown, assets, slug, title, excerpt, tags, status, published_at, updated_at } = post;
    const metadata = { slug, title, excerpt, tags, status, published_at, updated_at };
    await writeFile(path.join(folder, 'post.json'), JSON.stringify(metadata, null, 2) + '\n');
    await writeFile(path.join(folder, 'content.md'), markdown);
    for (const asset of assets) await writeFile(path.join(folder, asset.path), Buffer.from(asset.data, 'base64'));
  }
  await writeFile(path.join(stage, '.gitkeep'), '');
  await mkdir(path.dirname(contentRoot), { recursive: true });
  try {
    const stat = await lstat(contentRoot);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Folder content/blog harus berupa direktori biasa.');
    const resolved = await realpath(contentRoot);
    if (path.relative(projectRoot, resolved) !== path.join('content', 'blog')) throw new Error('Folder artikel berada di luar proyek.');
    await cp(resolved, path.join(projectRoot, '.sites-runtime', `blog-backup-${crypto.randomUUID()}`), { recursive: true });
    await rm(resolved, { recursive: true, force: true });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await rename(stage, contentRoot);
  console.log(`Exported ${bundle.posts.length} published article(s) with their images to content/blog.`);
  return bundle.posts;
}

export async function loadContent() {
  const posts = [];
  const entries = await readdir(contentRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (!entry.isDirectory() || !safeSlug(entry.name)) throw new Error(`Folder artikel tidak aman: ${entry.name}`);
    const folder = path.join(contentRoot, entry.name);
    const metadata = JSON.parse(await readFile(path.join(folder, 'post.json'), 'utf8'));
    const markdown = await readFile(path.join(folder, 'content.md'), 'utf8');
    const post = { ...metadata, markdown };
    validatePost(post);
    if (post.slug !== entry.name) throw new Error('Slug metadata berbeda dari nama folder.');
    const paths = new Set();
    for (const asset of await readdir(path.join(folder, 'assets'), { withFileTypes: true })) {
      const assetPath = `assets/${asset.name}`;
      if (!asset.isFile() || !safeAsset(assetPath)) throw new Error(`File gambar tidak aman: ${assetPath}`);
      const mime = Object.entries(imageTypes).find(([, ext]) => assetPath.endsWith(`.${ext}`))?.[0];
      const bytes = await readFile(path.join(folder, assetPath));
      if (!mime || bytes.length > 8 * 1024 * 1024 || !validImage(bytes, mime)) throw new Error(`Format gambar tidak valid: ${assetPath}`);
      paths.add(assetPath);
    }
    await checkPortableMarkdown(markdown, paths);
    posts.push(post);
  }
  return posts.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}

export async function copyArticleAssets(post, destination) {
  await cp(path.join(contentRoot, post.slug, 'assets'), path.join(destination, 'assets'), { recursive: true });
}

export async function exportCommand(args) {
  if (args.length > 1) throw new Error('Gunakan satu file .blog.json atau alamat editor localhost.');
  const source = args[0];
  const bundle = !source || /^https?:/.test(source) ? await readLocalExport(source) : JSON.parse(await readFile(path.resolve(source), 'utf8'));
  return importBundle(bundle);
}
