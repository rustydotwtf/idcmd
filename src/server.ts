import type { Server } from "bun";

import { generateLlmsTxt, getMarkdownFile } from "./content";
import { render } from "./render";
import { handleSearchRequest } from "./search-api";
import { handleSearchPageRequest } from "./server-search-page";
import { handleRobotsTxt, handleSitemapXml } from "./server-seo";
import {
  getRedirectForCanonicalHtmlPath,
  isFileLikePathname,
  toCanonicalHtmlPathname,
} from "./url-policy";
import { CONTENT_DIR, contentGlob } from "./utils/content-paths";

interface LiveReloadClient {
  send: (msg: string) => void;
  close: () => void;
}

type ServerInstance = Server<undefined>;

const PUBLIC_DIR = "./public";
const DIST_DIR = "./dist";
const isDev = process.env.NODE_ENV !== "production";
const LIVE_RELOAD_POLL_MS = 250;
const MIN_SEARCH_QUERY_LENGTH = 2;
const MAX_SEARCH_RESULTS = 50;

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

const withQueryString = (pathname: string, search: string): string =>
  search ? `${pathname}${search}` : pathname;

const createRedirectResponse = (pathname: string, url: URL): Response =>
  new Response(null, {
    headers: {
      Location: withQueryString(pathname, url.search),
      ...(isDev ? { "Cache-Control": "no-cache" } : {}),
    },
    status: 308,
  });

const notifyLiveReload = (message: string): void => {
  for (const client of liveReloadClients) {
    try {
      client.send(message);
    } catch {
      liveReloadClients.delete(client);
    }
  }
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

const tryServeFileFromRoot = async (
  rootDir: string,
  pathname: string
): Promise<Response | null> => {
  const filePath = `${rootDir}${pathname}`;
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

const serveStaticFile = async (pathname: string): Promise<Response | null> => {
  const roots = isDev ? [PUBLIC_DIR] : [DIST_DIR, PUBLIC_DIR];
  for (const root of roots) {
    const response = await tryServeFileFromRoot(root, pathname);
    if (response) {
      return response;
    }
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

const createNotFoundResponse = async (url: URL): Promise<Response> => {
  const notFoundMarkdown = await getMarkdownFile("404");
  if (notFoundMarkdown) {
    const canonicalPathname = toCanonicalHtmlPathname(url.pathname);
    const html = await render(notFoundMarkdown, {
      currentPath: canonicalPathname,
      isDev,
      origin: url.origin,
      searchQuery: url.searchParams.get("q") ?? undefined,
    });
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

const handlePageRequest = async (url: URL): Promise<Response> => {
  const canonicalPathname = toCanonicalHtmlPathname(url.pathname);
  const slug =
    canonicalPathname === "/" ? "index" : canonicalPathname.slice(1, -1);
  const markdown = await getMarkdownFile(slug);

  if (!markdown) {
    return createNotFoundResponse(url);
  }

  const html = await render(markdown, {
    currentPath: canonicalPathname,
    isDev,
    origin: url.origin,
  });

  return new Response(html, {
    headers: cacheHeaders,
    status: 200,
  });
};

const maybeHandleCanonicalRedirect = (url: URL): Response | undefined => {
  const { pathname } = url;

  if (pathname === "/__live-reload" || pathname.startsWith("/api/")) {
    return undefined;
  }

  if (isFileLikePathname(pathname)) {
    return undefined;
  }

  const redirectPathname = getRedirectForCanonicalHtmlPath(pathname);
  if (!redirectPathname) {
    return undefined;
  }

  return createRedirectResponse(redirectPathname, url);
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

  const seoEnv = { distDir: DIST_DIR, isDev, staticCacheHeaders };
  const searchPageEnv = {
    cacheHeaders,
    isDev,
    maxResults: MAX_SEARCH_RESULTS,
    minQueryLength: MIN_SEARCH_QUERY_LENGTH,
  };

  return (
    liveReload ??
    (await handleLlmsTxt(path)) ??
    (await handleRobotsTxt(url, seoEnv)) ??
    (await handleSitemapXml(url, seoEnv)) ??
    (await handleSearchRequest(url)) ??
    (await serveStaticFile(path)) ??
    (await handleMarkdownRequest(path)) ??
    (await (maybeHandleCanonicalRedirect(url) ??
      handleSearchPageRequest(url, searchPageEnv))) ??
    (await handlePageRequest(url))
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
