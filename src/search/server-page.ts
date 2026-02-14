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
import { getRenderSearchPageContent } from "./search-page-loader";

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

const getSearchQuery = (url: URL): string =>
  url.searchParams.get("q")?.trim() ?? "";

const loadSearchPageDependencies = async (options: {
  isDev: boolean;
  siteConfig: Awaited<ReturnType<typeof loadSiteConfig>>;
}): Promise<{
  navigation: Awaited<ReturnType<typeof getNavigation>>;
  index: Awaited<ReturnType<typeof loadSearchIndex>>;
  renderSearchPageContent: Awaited<
    ReturnType<typeof getRenderSearchPageContent>
  >;
}> => {
  const [navigation, index, renderSearchPageContent] = await Promise.all([
    getNavigation(options.isDev),
    loadSearchIndex({
      forceRefresh: options.isDev,
      siteConfig: options.siteConfig,
    }),
    getRenderSearchPageContent(),
  ]);

  return { index, navigation, renderSearchPageContent };
};

const getCanonicalSearchPageUrl = (options: {
  baseUrl?: string;
  env: SearchPageHandlerEnv;
  url: URL;
}): string | undefined =>
  resolveCanonicalUrl(
    {
      configuredBaseUrl: options.baseUrl,
      isDev: options.env.isDev,
      requestOrigin: options.url.origin,
    },
    "/search/"
  );

const buildSearchPageHtml = async (
  url: URL,
  env: SearchPageHandlerEnv
): Promise<string> => {
  const siteConfig = await loadSiteConfig();
  const scope = getSearchScope(siteConfig);
  const query = getSearchQuery(url);
  const rightRail = resolveRightRailConfig(siteConfig.rightRail);

  const { index, navigation, renderSearchPageContent } =
    await loadSearchPageDependencies({
      isDev: env.isDev,
      siteConfig,
    });

  const results = getResults(index, query, scope, env);
  const content = renderSearchPageContent({
    minQueryLength: env.minQueryLength,
    query,
    results,
    topPages: getTopPages(navigation),
  });

  return renderDocument({
    canonicalUrl: getCanonicalSearchPageUrl({
      baseUrl: siteConfig.baseUrl,
      env,
      url,
    }),
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
