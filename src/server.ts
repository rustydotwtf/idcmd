import { render } from "./render.tsx";
import { watch } from "fs";

interface SiteConfig {
  name: string;
  description: string;
  search?: {
    scope?: "full" | "title" | "title_and_description";
  };
}

const CONTENT_DIR = "./content";
const PUBLIC_DIR = "./public";
const isDev = process.env.NODE_ENV !== "production";

// Live reload WebSocket clients
const liveReloadClients = new Set<{ send: (msg: string) => void; close: () => void }>();

// Watch content directory for changes in dev mode
if (isDev) {
  console.log("Watching content/ for changes...");
  watch(CONTENT_DIR, { recursive: true }, (event, filename) => {
    if (filename?.endsWith(".md")) {
      console.log(`[live-reload] ${filename} changed`);
      for (const client of liveReloadClients) {
        try {
          client.send("reload");
        } catch {
          liveReloadClients.delete(client);
        }
      }
    }
  });
}

// Cache headers for Vercel CDN
const cacheHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": isDev ? "no-cache" : "s-maxage=60, stale-while-revalidate=3600",
};

const staticCacheHeaders = {
  "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
};

// MIME types for static files
const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function serveStaticFile(pathname: string): Promise<Response | null> {
  const filePath = `${PUBLIC_DIR}${pathname}`;
  const file = Bun.file(filePath);

  if (await file.exists()) {
    const ext = pathname.substring(pathname.lastIndexOf("."));
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        ...staticCacheHeaders,
      },
    });
  }
  return null;
}

async function getMarkdownFile(slug: string): Promise<string | null> {
  const filePath = `${CONTENT_DIR}/${slug}/content.md`;
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

function extractDescription(markdown: string): string {
  // Skip the title line, find first non-empty paragraph
  const lines = markdown.split("\n");
  let foundTitle = false;
  let description = "";

  for (const line of lines) {
    if (line.startsWith("# ")) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && line.trim() && !line.startsWith("#")) {
      description = line.trim();
      break;
    }
  }

  return description || "No description available.";
}

async function generateLlmsTxt(): Promise<string> {
  const siteConfig = Bun.JSONC.parse(await Bun.file("site.jsonc").text()) as SiteConfig;
  const glob = new Bun.Glob("*/content.md");

  const pages: { slug: string; title: string; description: string }[] = [];

  for await (const file of glob.scan(CONTENT_DIR)) {
    const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
    const slug = file.replace("/content.md", "");
    const title = extractTitle(markdown) || slug;
    const description = extractDescription(markdown);
    pages.push({ slug: slug === "index" ? "" : slug, title, description });
  }

  // Sort: index first, then alphabetically
  pages.sort((a, b) => {
    if (a.slug === "") return -1;
    if (b.slug === "") return 1;
    return a.title.localeCompare(b.title);
  });

  let output = `# ${siteConfig.name}\n\n> ${siteConfig.description}\n\n## Pages\n\n`;
  for (const page of pages) {
    const mdFile = page.slug === "" ? "index/content.md" : `${page.slug}/content.md`;
    output += `- [${page.title}](/${mdFile}): ${page.description}\n`;
  }

  return output;
}

const server = Bun.serve({
  port: process.env.PORT || 4000,

  async fetch(req, server) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Handle WebSocket upgrade for live reload
    if (isDev && path === "/__live-reload") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Handle /llms.txt
    if (path === "/llms.txt") {
      const llmsTxt = await generateLlmsTxt();
      return new Response(llmsTxt, {
        headers: { "Content-Type": "text/plain; charset=utf-8", ...staticCacheHeaders },
      });
    }

    // Handle /api/search
    if (path === "/api/search") {
      const query = url.searchParams.get("q")?.toLowerCase();
      if (!query) {
        return new Response(JSON.stringify({ error: "Missing query parameter 'q'" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(
        async function* () {
          const glob = new Bun.Glob("*/content.md");
          const siteConfig = Bun.JSONC.parse(await Bun.file("site.jsonc").text()) as SiteConfig;
          const scope = siteConfig.search?.scope ?? "full";

          for await (const file of glob.scan(CONTENT_DIR)) {
            const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
            const slug = file.replace("/content.md", "");

            // Determine searchable content based on scope
            let searchContent: string;
            if (scope === "title") {
              searchContent = extractTitle(markdown) ?? "";
            } else if (scope === "title_and_description") {
              searchContent = `${extractTitle(markdown) ?? ""} ${extractDescription(markdown)}`;
            } else {
              searchContent = markdown;
            }

            if (searchContent.toLowerCase().includes(query)) {
              const result = {
                slug: slug === "index" ? "/" : `/${slug}`,
                title: extractTitle(markdown) ?? slug,
                description: extractDescription(markdown),
              };
              yield JSON.stringify(result) + "\n";
            }
          }
        },
        { headers: { "Content-Type": "application/jsonl" } },
      );
    }

    // Try to serve static files first
    const staticResponse = await serveStaticFile(path);
    if (staticResponse) {
      return staticResponse;
    }

    // Handle raw markdown requests
    // Supports both /about.md and /about/content.md formats
    if (path.endsWith(".md")) {
      let slug: string;
      if (path.endsWith("/content.md")) {
        // /about/content.md -> about
        slug = path.slice(1, -11);
      } else {
        // /about.md -> about
        slug = path.slice(1, -3);
      }

      const markdown = await getMarkdownFile(slug);

      if (!markdown) {
        return new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new Response(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          ...staticCacheHeaders,
        },
      });
    }

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
    const html = await render(markdown, title, isDev);

    return new Response(html, {
      status: 200,
      headers: cacheHeaders,
    });
  },

  websocket: {
    open(ws) {
      liveReloadClients.add(ws);
      console.log("[live-reload] Client connected");
    },
    close(ws) {
      liveReloadClients.delete(ws);
      console.log("[live-reload] Client disconnected");
    },
    message() {
      // No messages expected from client
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);
if (isDev) {
  console.log("Live reload enabled - editing .md files will refresh the browser");
}
