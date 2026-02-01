import { render } from "./render.tsx";
import { watch } from "fs";

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

  async fetch(req, server) {
    const url = new URL(req.url);
    let path = url.pathname;

    // Handle WebSocket upgrade for live reload
    if (isDev && path === "/__live-reload") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Try to serve static files first
    const staticResponse = await serveStaticFile(path);
    if (staticResponse) {
      return staticResponse;
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
    const html = render(markdown, title, isDev);

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
