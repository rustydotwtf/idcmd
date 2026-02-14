import type { ResolvedCachePolicy } from "../site/cache";

const combineCacheControl = (args: {
  browserCacheControl: string;
  edgeCacheControl: string | null;
}): string =>
  args.edgeCacheControl
    ? `${args.browserCacheControl}, ${args.edgeCacheControl}`
    : args.browserCacheControl;

export const createHtmlCacheHeaders = (
  isDev: boolean,
  cachePolicy: ResolvedCachePolicy
): HeadersInit => ({
  "Cache-Control": isDev
    ? "no-cache"
    : combineCacheControl({
        browserCacheControl: cachePolicy.html.browserCacheControl,
        edgeCacheControl: cachePolicy.html.edgeCacheControl,
      }),
  "Content-Type": "text/html; charset=utf-8",
});

export const createStaticCacheHeaders = (
  isDev: boolean,
  cachePolicy: ResolvedCachePolicy
): HeadersInit => ({
  "Cache-Control": isDev ? "no-cache" : cachePolicy.static.cacheControl,
});
