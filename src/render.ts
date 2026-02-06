import type { Highlighter } from "shiki";

import { createHighlighter } from "shiki";

import type { PageMeta } from "./frontmatter";
import type { NavGroup } from "./navigation";

import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";
import { renderLayout } from "./layout";
import { discoverNavigation } from "./navigation";
import { deriveDescription, deriveTitle } from "./page-meta";
import { resolveAbsoluteUrl } from "./url-utils";
import { renderMarkdownToHtml } from "./utils/markdown";
import { loadSiteConfig, resolveRightRailConfig } from "./utils/site-config";
import { extractTocFromHtml } from "./utils/toc";

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

export interface RenderResult {
  html: string;
  frontmatter: PageMeta;
}

export interface RenderOptions {
  titleOverride?: string;
  isDev?: boolean;
  currentPath?: string;
  origin?: string;
  searchQuery?: string;
}

const derivePageMeta = (
  markdown: string,
  siteDefaultDescription: string,
  titleOverride: string | undefined
): { title: string; description: string } => ({
  description: deriveDescription(markdown, siteDefaultDescription),
  title: deriveTitle(markdown, titleOverride),
});

/**
 * Render markdown to HTML with layout.
 * Parses frontmatter, applies syntax highlighting, and includes navigation.
 */
export const render = async (
  markdown: string,
  options: RenderOptions = {}
): Promise<string> => {
  const {
    currentPath = "/",
    isDev = false,
    origin,
    searchQuery,
    titleOverride,
  } = options;

  const { content } = parseFrontmatter(markdown);
  const siteConfig = await loadSiteConfig();
  const rightRail = resolveRightRailConfig(siteConfig.rightRail);
  const { description, title } = derivePageMeta(
    markdown,
    siteConfig.description,
    titleOverride
  );

  const navigation = await getNavigation(isDev);
  const contentHtml = await highlightCodeBlocks(renderMarkdownToHtml(content));
  const tocItems =
    rightRail.enabled && rightRail.scrollSpy.enabled
      ? extractTocFromHtml(contentHtml, { levels: rightRail.tocLevels })
      : [];
  const scriptPaths = [
    ...(isDev ? ["/live-reload.js"] : []),
    ...(rightRail.enabled && rightRail.scrollSpy.enabled && tocItems.length > 0
      ? ["/right-rail-scrollspy.js"]
      : []),
  ];

  return renderLayout({
    canonicalUrl: resolveAbsoluteUrl(siteConfig.baseUrl ?? origin, currentPath),
    content: contentHtml,
    currentPath,
    description,
    navigation,
    rightRailConfig: siteConfig.rightRail,
    scriptPaths,
    searchQuery,
    siteName: siteConfig.name,
    title,
  });
};

// Re-export for convenience
export { parseFrontmatter, extractTitleFromContent, type PageMeta };
