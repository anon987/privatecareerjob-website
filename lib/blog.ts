import { adminDb } from "@/lib/admin/firebaseAdmin";

/** Server-side blog access + a tiny, safe markdown renderer for post bodies. */

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  content: string;
  coverEmoji: string;
  /** /api/blog-image/{id} URL — used as the hero and og:image */
  featuredImage: string;
  author: string;
  createdAt: number;
  updatedAt: number;
}

function toPost(slug: string, d: FirebaseFirestore.DocumentData): BlogPost {
  return {
    slug,
    title: d.title ?? "",
    description: d.description ?? "",
    keywords: Array.isArray(d.keywords) ? d.keywords : [],
    content: d.content ?? "",
    coverEmoji: d.coverEmoji ?? "📝",
    featuredImage: d.featuredImage ?? "",
    author: d.author ?? "privatecareerjob",
    createdAt: d.createdAt?.toMillis?.() ?? 0,
    updatedAt: d.updatedAt?.toMillis?.() ?? 0,
  };
}

export async function publishedPosts(): Promise<BlogPost[]> {
  try {
    const snap = await adminDb().collection("blogPosts").where("published", "==", true).limit(100).get();
    return snap.docs
      .map((d) => toPost(d.id, d.data()))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const doc = await adminDb().collection("blogPosts").doc(slug).get();
    if (!doc.exists || !doc.get("published")) return null;
    return toPost(doc.id, doc.data()!);
  } catch {
    return null;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string): string {
  return s
    // images first so the link rule doesn't half-consume them; src restricted to
    // our own image route or https
    .replace(
      /!\[([^\]]*)\]\(((?:\/api\/blog-image\/[A-Za-z0-9]+|https:\/\/[^)\s]+))\)/g,
      '<img src="$2" alt="$1" loading="lazy" />'
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

/** Markdown-lite → HTML. Input is HTML-escaped first, so author markup can't inject tags. */
export function renderMarkdown(md: string): string {
  const lines = escapeHtml(md).split("\n");
  const out: string[] = [];
  let inList = false;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const closeList = () => {
    if (inList) out.push("</ul>");
    inList = false;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      flushPara();
      closeList();
      const level = h[1].length + 1; // # → h2 (h1 is the page title)
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const li = line.match(/^[-*]\s+(.*)/);
    if (li) {
      flushPara();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      closeList();
      continue;
    }
    para.push(line.trim());
  }
  flushPara();
  closeList();
  return out.join("\n");
}
