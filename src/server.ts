import { render } from "./render.tsx";

const CONTENT_DIR = "./content";

// Cache headers for Vercel CDN
const cacheHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "s-maxage=60, stale-while-revalidate=3600",
};

async function getMarkdownFile(slug: string): Promise<string | null> {
  const filePath = `${CONTENT_DIR}/${slug}.md`;
  const file = Bun.file(filePath);

  if (await file.exists()) {
    return file.text();
  }
  return null;
}

function extractTitle(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1];
}

const server = Bun.serve({
  port: process.env.PORT || 4000,

  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Handle root path
    if (path === "/") {
      path = "/index";
    }

    // Remove leading slash for file lookup
    const slug = path.slice(1);

    const markdown = await getMarkdownFile(slug);

    if (!markdown) {
      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const title = extractTitle(markdown);
    const html = render(markdown, title);

    return new Response(html, {
      status: 200,
      headers: cacheHeaders,
    });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
