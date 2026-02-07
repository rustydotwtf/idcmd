import type { Server } from "bun";

import { generateLlmsTxt } from "./content/llms";
import { getMarkdownFile } from "./content/store";
import { renderMarkdownPage } from "./render/page-renderer";
import { handleSearchRequest } from "./search/api";
import { handleSearchPageRequest } from "./search/server-page";
import { handleRobotsTxt, handleSitemapXml } from "./seo/server";
import {
  createHtmlCacheHeaders,
  createStaticCacheHeaders,
} from "./server/headers";
import { createLiveReload } from "./server/live-reload";
import { serveStaticFile } from "./server/static";
import {
  getRedirectForCanonicalHtmlPath,
  isFileLikePathname,
  toCanonicalHtmlPathname,
} from "./site/url-policy";

type ServerInstance = Server<undefined>;

const PUBLIC_DIR = "./public";
const DIST_DIR = "./dist";
const isDev = process.env.NODE_ENV !== "production";
const LIVE_RELOAD_POLL_MS = 250;
const MIN_SEARCH_QUERY_LENGTH = 2;
const MAX_SEARCH_RESULTS = 50;

const cacheHeaders = createHtmlCacheHeaders(isDev);
const staticCacheHeaders = createStaticCacheHeaders(isDev);

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

const liveReload = createLiveReload({ isDev, pollMs: LIVE_RELOAD_POLL_MS });

if (isDev) {
  try {
    await liveReload.startWatcher();
  } catch (error) {
    console.warn("[live-reload] Watcher failed", error);
  }
}

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

  const slug = path.slice(1, -3);
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
    const html = await renderMarkdownPage(notFoundMarkdown, {
      currentPath: canonicalPathname,
      isDev,
      requestOrigin: url.origin,
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

  const html = await renderMarkdownPage(markdown, {
    currentPath: canonicalPathname,
    isDev,
    requestOrigin: url.origin,
  });

  return new Response(html, { headers: cacheHeaders, status: 200 });
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

  const liveReloadUpgrade = liveReload.maybeHandleUpgrade(req, server, path);
  if (liveReloadUpgrade === "handled") {
    return undefined;
  }

  const seoEnv = { distDir: DIST_DIR, isDev, staticCacheHeaders };
  const searchPageEnv = {
    cacheHeaders,
    isDev,
    maxResults: MAX_SEARCH_RESULTS,
    minQueryLength: MIN_SEARCH_QUERY_LENGTH,
  };
  const staticEnv = {
    distDir: DIST_DIR,
    isDev,
    publicDir: PUBLIC_DIR,
    staticCacheHeaders,
  };

  return (
    liveReloadUpgrade ??
    (await handleLlmsTxt(path)) ??
    (await handleRobotsTxt(url, seoEnv)) ??
    (await handleSitemapXml(url, seoEnv)) ??
    (await handleSearchRequest(url)) ??
    (await serveStaticFile(path, staticEnv)) ??
    (await handleMarkdownRequest(path)) ??
    (await (maybeHandleCanonicalRedirect(url) ??
      handleSearchPageRequest(url, searchPageEnv))) ??
    (await handlePageRequest(url))
  );
};

const server = Bun.serve({
  fetch(req, serverInstance) {
    return handleRequest(req, serverInstance);
  },

  port: process.env.PORT || 4000,

  websocket: liveReload.websocket,
});

console.log(`Server running at http://localhost:${server.port}`);
if (isDev) {
  console.log(
    "Live reload enabled - editing .md files will refresh the browser"
  );
}
