import type { MouseEvent, ReactNode } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { Card } from "./card";

export interface Post {
  id: string;
  title: string;
  summary: string;
  author: string;
  published: string;
  date?: string;
  url: string;
  image?: string;
  imageAlt?: string;
  tags?: string[];
  status?: "draft" | "published";
}

interface Blog8Props {
  posts: Post[];
  onOpen?: (id: string) => void;
  renderActions?: (post: Post) => ReactNode;
}

/** The reference's text-and-image layout, using the portfolio's own palette. */
export function Blog8({ posts, onOpen, renderActions }: Blog8Props) {
  function open(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (!onOpen || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(id);
  }

  return (
    <div className="blog8-list">
      {posts.map(post => (
        <article key={post.id} className="blog8-post" data-search={`${post.title} ${post.summary} ${post.tags?.join(" ") || ""}`.toLowerCase()}>
          <Card className="blog8-card">
            <div className="blog8-copy">
              <div className="blog8-tags">
                {post.tags?.map(tag => <span key={tag}>{tag}</span>)}
                {post.status === "draft" && <span className="draft-badge">Draft</span>}
              </div>
              <h3><a href={post.url} onClick={event => open(event, post.id)}>{post.title}</a></h3>
              {post.summary && <p className="blog8-summary">{post.summary}</p>}
              <div className="blog8-byline">
                <span>{post.author}</span><span aria-hidden="true">·</span>
                <time dateTime={post.date}>{post.published}</time>
              </div>
              <div className="blog8-bottom">
                <a className="blog8-read" href={post.url} onClick={event => open(event, post.id)} aria-label={`Read more: ${post.title}`}>
                  Read more <ArrowRight size={16} aria-hidden="true" />
                </a>
                {renderActions?.(post)}
              </div>
            </div>
            <a className="blog8-image" href={post.url} onClick={event => open(event, post.id)} aria-label={`Read ${post.title}`}>
              {post.image ? <img src={post.image} alt={post.imageAlt || ""} width={800} height={450} loading="lazy" decoding="async" />
                : <div className="blog8-image-empty" aria-hidden="true"><FileText size={40} strokeWidth={1} /><span>{post.tags?.[0] || "Notes"}</span></div>}
            </a>
          </Card>
        </article>
      ))}
    </div>
  );
}
