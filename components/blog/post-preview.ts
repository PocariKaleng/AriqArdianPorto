import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, Image, Definition } from "mdast";

const parser = unified().use(remarkParse);

/** Read the first actual Markdown image; code examples are not thumbnails. */
export function postPreview(markdown: string) {
  const tree = parser.parse(markdown);
  const definitions = new Map<string, Definition>();
  const images: { url?: string; identifier?: string; alt?: string | null }[] = [];
  function visit(node: Root | Root["children"][number]) {
    if (node.type === "definition") definitions.set(node.identifier, node);
    if (node.type === "image") images.push(node as Image);
    if (node.type === "imageReference") images.push(node);
    if ("children" in node) node.children.forEach(child => visit(child as Root["children"][number]));
  }
  visit(tree);
  for (const image of images) {
    const url = image.url || definitions.get(image.identifier || "")?.url;
    if (url && /^(https:\/\/|\/assets\/|\/api\/blog\/images\/|\.\/assets\/)/i.test(url)) {
      return { preview_image: url, preview_alt: image.alt && image.alt !== "image" ? image.alt : "" };
    }
  }
  return { preview_image: undefined, preview_alt: undefined };
}
