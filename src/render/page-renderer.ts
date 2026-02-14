import type { Highlighter } from "shiki";

import { createHighlighter } from "shiki";

import type { NavGroup } from "../content/navigation";
import type { SiteConfig } from "../site/config";

import { expandMarkdownContentForHtml } from "../content/components/expand";
import { parseFrontmatter } from "../content/frontmatter";
import { derivePageMetaFromParsed } from "../content/meta";
import { discoverNavigation } from "../content/navigation";
import { loadSiteConfig, resolveRightRailConfig } from "../site/config";
import { resolveCanonicalUrl } from "../site/urls";
import { getRenderLayout } from "./layout-loader";
import { renderMarkdownToHtml } from "./markdown";
import { getRightRail } from "./right-rail-loader";
import { extractTocFromHtml } from "./toc";

const ASSET_PREFIX = "/_idcmd";

// Initialize shiki highlighter (cached singleton)
let highlighterPromise: Promise<Highlighter> | null = null;

const getHighlighter = (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: [
        "javascript",
        "typescript",
        "jsx",
        "tsx",
        "json",
        "html",
        "css",
        "markdown",
        "bash",
        "shell",
        "python",
        "rust",
        "go",
        "sql",
        "yaml",
        "toml",
      ],
      themes: ["github-dark", "github-light"],
    });
  }
  return highlighterPromise;
};

// Highlight code blocks in HTML using shiki
const codeBlockRegex =
  /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;

const decodeHtmlEntities = (encoded: string): string =>
  encoded
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");

const getEffectiveLanguage = (
  loadedLanguages: Set<string>,
  language: string
): string => (loadedLanguages.has(language) ? language : "plaintext");

export const highlightCodeBlocks = async (html: string): Promise<string> => {
  const highlighter = await getHighlighter();
  const loadedLanguages = new Set(highlighter.getLoadedLanguages());

  return html.replace(
    codeBlockRegex,
    (_match: string, lang?: string, encodedCode?: string) => {
      const rawLanguage = lang ?? "plaintext";
      const code = decodeHtmlEntities(encodedCode ?? "");
      const effectiveLang = getEffectiveLanguage(loadedLanguages, rawLanguage);

      return highlighter.codeToHtml(code, {
        lang: effectiveLang as string,
        themes: {
          dark: "github-dark",
          light: "github-light",
        },
      });
    }
  );
};

// Cache navigation data (refreshed on each request in dev, cached in prod)
let navigationCache: NavGroup[] | null = null;

export const getNavigation = async (
  forceRefresh = false
): Promise<NavGroup[]> => {
  if (!navigationCache || forceRefresh) {
    navigationCache = await discoverNavigation();
  }
  return navigationCache;
};

/**
 * Render a full HTML document around already-rendered HTML content.
 * This is the only module that should call `renderLayout()` directly.
 */
export const renderDocument = async (options: {
  canonicalUrl?: string;
  contentHtml: string;
  cssPath?: string;
  currentPath: string;
  description?: string;
  inlineCss?: string;
  navigation: NavGroup[];
  rightRail: ReturnType<typeof resolveRightRailConfig>;
  scriptPaths?: string[];
  searchQuery?: string;
  showRightRail?: boolean;
  siteName: string;
  title: string;
  tocItems: ReturnType<typeof extractTocFromHtml>;
}): Promise<string> => {
  const [renderLayout, rightRailComponent] = await Promise.all([
    getRenderLayout(),
    getRightRail(),
  ]);
  return renderLayout({
    canonicalUrl: options.canonicalUrl,
    content: options.contentHtml,
    cssPath: options.cssPath,
    currentPath: options.currentPath,
    description: options.description,
    inlineCss: options.inlineCss,
    navigation: options.navigation,
    rightRail: options.rightRail,
    rightRailComponent,
    scriptPaths: options.scriptPaths,
    searchQuery: options.searchQuery,
    showRightRail: options.showRightRail,
    siteName: options.siteName,
    title: options.title,
    tocItems: options.tocItems,
  });
};

export interface RenderMarkdownPageOptions {
  cssPath?: string;
  currentPath: string;
  inlineCss?: string;
  isDev?: boolean;
  navigation?: NavGroup[];
  requestOrigin?: string;
  searchQuery?: string;
  showRightRail?: boolean;
  siteConfig?: SiteConfig;
  titleOverride?: string;
}

const resolveNavigationForPage = (
  navigation: NavGroup[] | undefined,
  isDev: boolean
): Promise<NavGroup[]> => {
  if (navigation) {
    return Promise.resolve(navigation);
  }

  // In dev, refresh on each request to reflect content updates.
  const forceRefresh = isDev;
  return getNavigation(forceRefresh);
};

const renderMarkdownContentToHtml = (markdown: string): Promise<string> =>
  highlightCodeBlocks(renderMarkdownToHtml(markdown));

const slugFromCurrentPath = (currentPath: string): string => {
  if (currentPath === "/") {
    return "index";
  }
  if (currentPath.startsWith("/") && currentPath.endsWith("/")) {
    return currentPath.slice(1, -1);
  }
  return currentPath.replaceAll("/", "");
};

const computeCanonicalUrlForPage = (options: {
  configuredBaseUrl: string | undefined;
  currentPath: string;
  isDev: boolean;
  requestOrigin: string | undefined;
}): string | undefined =>
  resolveCanonicalUrl(
    {
      configuredBaseUrl: options.configuredBaseUrl,
      isDev: options.isDev,
      requestOrigin: options.requestOrigin,
    },
    options.currentPath
  );

const renderMarkdownPageShell = (options: {
  canonicalUrl?: string;
  contentHtml: string;
  cssPath?: string;
  currentPath: string;
  description: string;
  inlineCss?: string;
  navigation: NavGroup[];
  rightRail: ReturnType<typeof resolveRightRailConfig>;
  scriptPaths: string[];
  searchQuery?: string;
  shouldShowRightRail: boolean;
  siteName: string;
  title: string;
  tocItems: ReturnType<typeof extractTocFromHtml>;
}): Promise<string> =>
  renderDocument({
    canonicalUrl: options.canonicalUrl,
    contentHtml: options.contentHtml,
    cssPath: options.cssPath,
    currentPath: options.currentPath,
    description: options.description,
    inlineCss: options.inlineCss,
    navigation: options.navigation,
    rightRail: options.rightRail,
    scriptPaths: options.scriptPaths,
    searchQuery: options.searchQuery,
    showRightRail: options.shouldShowRightRail,
    siteName: options.siteName,
    title: options.title,
    tocItems: options.tocItems,
  });

const computeTocItems = (options: {
  contentHtml: string;
  rightRail: ReturnType<typeof resolveRightRailConfig>;
  shouldShowRightRail: boolean;
}): ReturnType<typeof extractTocFromHtml> => {
  if (!options.shouldShowRightRail) {
    return [];
  }

  return extractTocFromHtml(options.contentHtml, {
    levels: options.rightRail.tocLevels,
  });
};

const computeScriptPaths = (options: {
  isDev: boolean;
  rightRail: ReturnType<typeof resolveRightRailConfig>;
  shouldShowRightRail: boolean;
  tocItems: readonly unknown[];
}): string[] => [
  ...(options.isDev ? [`${ASSET_PREFIX}/live-reload.js`] : []),
  ...(options.shouldShowRightRail ? [`${ASSET_PREFIX}/llm-menu.js`] : []),
  ...(options.shouldShowRightRail &&
  options.rightRail.scrollSpy.enabled &&
  options.tocItems.length > 0
    ? [`${ASSET_PREFIX}/right-rail-scrollspy.js`]
    : []),
];

/**
 * Render markdown to a full HTML page (server + build share this path).
 * Parses frontmatter once, computes TOC once, and centralizes canonical URL logic.
 */
export const renderMarkdownPage = async (
  markdown: string,
  options: RenderMarkdownPageOptions
): Promise<string> => {
  const parsed = parseFrontmatter(markdown);
  const siteConfig = options.siteConfig ?? (await loadSiteConfig());
  const rightRail = resolveRightRailConfig(siteConfig.rightRail);
  const shouldShowRightRail =
    (options.showRightRail ?? true) && rightRail.enabled;

  const { description, title } = derivePageMetaFromParsed(parsed, {
    fallbackTitle: "Untitled",
    siteDefaultDescription: siteConfig.description,
    titleOverride: options.titleOverride,
  });

  const slug = slugFromCurrentPath(options.currentPath);
  const expandedMarkdown = await expandMarkdownContentForHtml(parsed.content, {
    currentPath: options.currentPath,
    instanceId: `${slug}:page`,
    isDev: options.isDev ?? false,
    slug,
  });

  const [resolvedNavigation, contentHtml] = await Promise.all([
    resolveNavigationForPage(options.navigation, options.isDev ?? false),
    renderMarkdownContentToHtml(expandedMarkdown),
  ]);
  const tocItems = computeTocItems({
    contentHtml,
    rightRail,
    shouldShowRightRail,
  });

  return renderMarkdownPageShell({
    canonicalUrl: computeCanonicalUrlForPage({
      configuredBaseUrl: siteConfig.baseUrl,
      currentPath: options.currentPath,
      isDev: options.isDev ?? false,
      requestOrigin: options.requestOrigin,
    }),
    contentHtml,
    cssPath: options.cssPath,
    currentPath: options.currentPath,
    description,
    inlineCss: options.inlineCss,
    navigation: resolvedNavigation,
    rightRail,
    scriptPaths: computeScriptPaths({
      isDev: options.isDev ?? false,
      rightRail,
      shouldShowRightRail,
      tocItems,
    }),
    searchQuery: options.searchQuery,
    shouldShowRightRail,
    siteName: siteConfig.name,
    title,
    tocItems,
  });
};
