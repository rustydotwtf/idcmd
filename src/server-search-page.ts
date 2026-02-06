import type { NavGroup } from "./navigation";
import type { SearchResult } from "./search-contract";
import type { SearchScope, SiteConfig } from "./utils/site-config";

import { renderLayout } from "./layout";
import { getNavigation } from "./render";
import { loadSearchIndex, search as runSearch } from "./search-index";
import { renderSearchPageContent } from "./search-page";
import { resolveAbsoluteUrl } from "./url-utils";
import { getSearchScope, loadSiteConfig } from "./utils/site-config";

export interface SearchPageHandlerEnv {
  cacheHeaders: HeadersInit;
  isDev: boolean;
  maxResults: number;
  minQueryLength: number;
}

const getBaseUrl = (siteConfig: SiteConfig, url: URL): string =>
  siteConfig.baseUrl ?? url.origin;

const getTopPages = (
  navigation: NavGroup[]
): { href: string; title: string }[] =>
  navigation
    .flatMap((group) => group.items)
    .slice(0, 8)
    .map((item) => ({ href: item.href, title: item.title }));

const getResults = (
  index: Awaited<ReturnType<typeof loadSearchIndex>>,
  query: string,
  scope: SearchScope,
  env: SearchPageHandlerEnv
): SearchResult[] =>
  query.length >= env.minQueryLength
    ? runSearch(index, query, scope).slice(0, env.maxResults)
    : [];

const buildSearchPageHtml = async (
  url: URL,
  env: SearchPageHandlerEnv
): Promise<string> => {
  const siteConfig = await loadSiteConfig();
  const baseUrl = getBaseUrl(siteConfig, url);
  const scope = getSearchScope(siteConfig);
  const query = url.searchParams.get("q")?.trim() ?? "";

  const [navigation, index] = await Promise.all([
    getNavigation(env.isDev),
    loadSearchIndex({ forceRefresh: env.isDev, siteConfig }),
  ]);

  const results = getResults(index, query, scope, env);
  const topPages = getTopPages(navigation);
  const content = renderSearchPageContent({
    minQueryLength: env.minQueryLength,
    query,
    results,
    topPages,
  });

  const canonicalUrl = resolveAbsoluteUrl(baseUrl, "/search/");

  return renderLayout({
    canonicalUrl,
    content,
    currentPath: "/search/",
    description: siteConfig.description,
    navigation,
    searchQuery: query,
    title: `Search - ${siteConfig.name}`,
  });
};

export const handleSearchPageRequest = async (
  url: URL,
  env: SearchPageHandlerEnv
): Promise<Response | undefined> => {
  if (url.pathname !== "/search/") {
    return undefined;
  }

  const html = await buildSearchPageHtml(url, env);
  return new Response(html, { headers: env.cacheHeaders, status: 200 });
};
