export const createHtmlCacheHeaders = (isDev: boolean): HeadersInit => ({
  "Cache-Control": isDev
    ? "no-cache"
    : "s-maxage=60, stale-while-revalidate=3600",
  "Content-Type": "text/html; charset=utf-8",
});

export const createStaticCacheHeaders = (isDev: boolean): HeadersInit => ({
  "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000, immutable",
});
