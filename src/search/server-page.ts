import type { NavGroup } from "../content/navigation";
import type { SearchScope } from "../site/config";
import type { SearchResult } from "./contract";

import { getNavigation, renderDocument } from "../render/page-renderer";
import {
  getSearchScope,
  loadSiteConfig,
  resolveRightRailConfig,
} from "../site/config";
import { resolveCanonicalUrl } from "../site/urls";
import { loadSearchIndex, search as runSearch } from "./index";
import { renderSearchPageContent } from "./page";

export interface SearchPageHandlerEnv {
  cacheHeaders: HeadersInit;
  isDev: boolean;
  maxResults: number;
  minQueryLength: number;
}

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
  const scope = getSearchScope(siteConfig);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const rightRail = resolveRightRailConfig(siteConfig.rightRail);

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

  const canonicalUrl = resolveCanonicalUrl(
    {
      configuredBaseUrl: siteConfig.baseUrl,
      isDev: env.isDev,
      requestOrigin: url.origin,
    },
    "/search/"
  );

  return renderDocument({
    canonicalUrl,
    contentHtml: content,
    currentPath: "/search/",
    description: siteConfig.description,
    navigation,
    rightRail,
    searchQuery: query,
    showRightRail: false,
    siteName: siteConfig.name,
    title: `Search - ${siteConfig.name}`,
    tocItems: [],
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
