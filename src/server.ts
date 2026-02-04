import type { Server } from "bun";

import {
  createSearchStream,
  generateLlmsTxt,
  getMarkdownFile,
} from "./content";
import { render } from "./render";
import { CONTENT_DIR, contentGlob } from "./utils/content-paths";
import { getSearchScope, loadSiteConfig } from "./utils/site-config";

interface LiveReloadClient {
  send: (msg: string) => void;
  close: () => void;
}

type ServerInstance = Server<undefined>;

const PUBLIC_DIR = "./public";
const isDev = process.env.NODE_ENV !== "production";
const LIVE_RELOAD_POLL_MS = 500;
const textEncoder = new TextEncoder();

// Live reload WebSocket clients
const liveReloadClients = new Set<LiveReloadClient>();

const cacheHeaders = {
  "Cache-Control": isDev
    ? "no-cache"
    : "s-maxage=60, stale-while-revalidate=3600",
  "Content-Type": "text/html; charset=utf-8",
};

const staticCacheHeaders = {
  "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
};

// MIME types for static files
const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const notifyLiveReload = (message: string): void => {
  for (const client of liveReloadClients) {
    try {
      client.send(message);
    } catch {
      liveReloadClients.delete(client);
    }
  }
};

const toReadableStream = (
  iterable: AsyncIterable<string>
): ReadableStream<Uint8Array> => {
  const iterator = iterable[Symbol.asyncIterator]();

  return new ReadableStream({
    async cancel() {
      if (iterator.return) {
        await iterator.return();
      }
    },
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(textEncoder.encode(value));
      } catch (error) {
        controller.error(error);
      }
    },
  });
};

const getContentSnapshot = async (): Promise<string> => {
  const entries: string[] = [];
  for await (const file of contentGlob.scan(CONTENT_DIR)) {
    const filePath = `${CONTENT_DIR}/${file}`;
    const { lastModified } = Bun.file(filePath);
    entries.push(`${file}:${lastModified}`);
  }

  return entries.toSorted().join("|");
};

const startContentWatcher = async (): Promise<void> => {
  console.log("Watching content/ for changes...");
  let snapshot = await getContentSnapshot();

  const poll = async (): Promise<void> => {
    const nextSnapshot = await getContentSnapshot();
    if (nextSnapshot !== snapshot) {
      snapshot = nextSnapshot;
      console.log("[live-reload] Content updated");
      notifyLiveReload("reload");
    }
  };

  setInterval(async () => {
    try {
      await poll();
    } catch (error) {
      console.warn("[live-reload] Polling error", error);
    }
  }, LIVE_RELOAD_POLL_MS);
};

if (isDev) {
  try {
    await startContentWatcher();
  } catch (error) {
    console.warn("[live-reload] Watcher failed", error);
  }
}

const serveStaticFile = async (pathname: string): Promise<Response | null> => {
  const filePath = `${PUBLIC_DIR}${pathname}`;
  const file = Bun.file(filePath);

  if (await file.exists()) {
    const ext = pathname.slice(pathname.lastIndexOf("."));
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        ...staticCacheHeaders,
      },
    });
  }
  return null;
};

const handleLiveReload = (
  req: Request,
  server: ServerInstance,
  path: string
): "handled" | Response | undefined => {
  if (!isDev || path !== "/__live-reload") {
    return undefined;
  }

  const upgraded = server.upgrade(req);
  if (upgraded) {
    return "handled";
  }

  return new Response("WebSocket upgrade failed", { status: 400 });
};

const handleLlmsTxt = async (path: string): Promise<Response | undefined> => {
  if (path !== "/llms.txt") {
    return undefined;
  }

  const llmsTxt = await generateLlmsTxt();
  return new Response(llmsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...staticCacheHeaders,
    },
  });
};

const handleSearch = async (url: URL): Promise<Response | undefined> => {
  if (url.pathname !== "/api/search") {
    return undefined;
  }

  const query = url.searchParams.get("q")?.toLowerCase();
  if (!query) {
    return Response.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  const siteConfig = await loadSiteConfig();
  const scope = getSearchScope(siteConfig);
  const stream = createSearchStream(query, scope);

  return new Response(toReadableStream(stream), {
    headers: { "Content-Type": "application/jsonl; charset=utf-8" },
  });
};

const handleMarkdownRequest = async (
  path: string
): Promise<Response | undefined> => {
  if (!path.endsWith(".md")) {
    return undefined;
  }

  const slug = path.endsWith("/content.md")
    ? path.slice(1, -11)
    : path.slice(1, -3);
  const markdown = await getMarkdownFile(slug);

  if (!markdown) {
    return new Response("Not Found", {
      headers: { "Content-Type": "text/plain" },
      status: 404,
    });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      ...staticCacheHeaders,
    },
    status: 200,
  });
};

const createNotFoundResponse = async (): Promise<Response> => {
  const notFoundMarkdown = await getMarkdownFile("404");
  if (notFoundMarkdown) {
    const html = await render(notFoundMarkdown, undefined, isDev, "/404");
    return new Response(html, {
      headers: cacheHeaders,
      status: 404,
    });
  }

  return new Response("Not Found", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    status: 404,
  });
};

const handlePageRequest = async (path: string): Promise<Response> => {
  const normalizedPath = path === "/" ? "/index" : path;
  const slug = normalizedPath.slice(1);
  const markdown = await getMarkdownFile(slug);

  if (!markdown) {
    return createNotFoundResponse();
  }

  const currentPath = normalizedPath === "/index" ? "/" : normalizedPath;
  const html = await render(markdown, undefined, isDev, currentPath);

  return new Response(html, {
    headers: cacheHeaders,
    status: 200,
  });
};

const handleRequest = async (
  req: Request,
  server: ServerInstance
): Promise<Response | undefined> => {
  const url = new URL(req.url);
  const path = url.pathname;
  const liveReload = handleLiveReload(req, server, path);

  if (liveReload === "handled") {
    return undefined;
  }

  return (
    liveReload ??
    (await handleLlmsTxt(path)) ??
    (await handleSearch(url)) ??
    (await serveStaticFile(path)) ??
    (await handleMarkdownRequest(path)) ??
    (await handlePageRequest(path))
  );
};

const server = Bun.serve({
  fetch(req, server) {
    return handleRequest(req, server);
  },

  port: process.env.PORT || 4000,

  websocket: {
    close(ws) {
      liveReloadClients.delete(ws);
      console.log("[live-reload] Client disconnected");
    },
    message() {
      // No messages expected from client
    },
    open(ws) {
      liveReloadClients.add(ws);
      console.log("[live-reload] Client connected");
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);
if (isDev) {
  console.log(
    "Live reload enabled - editing .md files will refresh the browser"
  );
}
