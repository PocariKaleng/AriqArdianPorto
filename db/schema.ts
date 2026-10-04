import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const posts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(), slug: text('slug').notNull().unique(), title: text('title').notNull(),
  excerpt: text('excerpt').notNull().default(''), markdown: text('markdown').notNull().default(''),
  tags: text('tags').notNull().default(''), status: text('status').notNull().default('draft'),
  ownerId: text('owner_id').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'), revision: integer('revision').notNull().default(0),
}, table => [index('blog_status_date').on(table.status, table.publishedAt)]);
export const images = sqliteTable('blog_images', {
  id: text('id').primaryKey(), postId: text('post_id').notNull().references(() => posts.id),
  objectKey: text('object_key').notNull(), mime: text('mime').notNull(), bytes: integer('bytes').notNull(), createdAt: text('created_at').notNull(),
}, table => [index('blog_image_post').on(table.postId)]);
