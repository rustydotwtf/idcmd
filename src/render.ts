import type { Highlighter } from "shiki";

import { createHighlighter } from "shiki";

import type { PageMeta } from "./frontmatter";
import type { NavGroup } from "./navigation";

import { parseFrontmatter, extractTitleFromContent } from "./frontmatter";
import { renderLayout } from "./layout";
import { discoverNavigation } from "./navigation";
import { renderMarkdownToHtml } from "./utils/markdown";

const liveReloadScript = `
<script>
(function() {
  const ws = new WebSocket('ws://' + location.host + '/__live-reload');
  ws.onmessage = function(e) {
    if (e.data === 'reload') {
      console.log('[live-reload] Reloading...');
      location.reload();
    }
  };
  ws.onclose = function() {
    console.log('[live-reload] Disconnected, attempting reconnect...');
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>
`;

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

/**
 * Render markdown to HTML with layout.
 * Parses frontmatter, applies syntax highlighting, and includes navigation.
 */
export const render = async (
  markdown: string,
  titleOverride?: string,
  isDev = false,
  currentPath = "/"
): Promise<string> => {
  // Parse frontmatter from markdown
  const { frontmatter, content } = parseFrontmatter(markdown);

  // Determine title: override > frontmatter > h1 extraction
  const title =
    titleOverride ?? frontmatter.title ?? extractTitleFromContent(content);

  // Get navigation (refresh in dev mode for live updates)
  const navigation = await getNavigation(isDev);

  // Convert markdown to HTML string with GFM extensions
  let contentHtml = renderMarkdownToHtml(content);

  // Apply syntax highlighting to code blocks
  contentHtml = await highlightCodeBlocks(contentHtml);

  // Render with static layout
  let html = renderLayout({
    content: contentHtml,
    currentPath,
    navigation,
    title,
  });

  // Add live reload script for dev mode
  if (isDev) {
    html = html.replace("</body>", `${liveReloadScript}</body>`);
  }

  return html;
};

// Re-export for convenience
export { parseFrontmatter, extractTitleFromContent, type PageMeta };
