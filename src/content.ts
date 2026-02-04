import type { SearchScope, SiteConfig } from "./utils/site-config";

import { extractTitleFromContent, parseFrontmatter } from "./frontmatter";
import {
  CONTENT_DIR,
  contentGlob,
  getMarkdownFilePath,
  pagePathFromContentSlug,
  pageSlugFromContentSlug,
  slugFromContentFile,
} from "./utils/content-paths";
import { loadSiteConfig } from "./utils/site-config";

interface LlmsPage {
  slug: string;
  title: string;
  description: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  description: string;
}

export const getMarkdownFile = async (slug: string): Promise<string | null> => {
  const filePath = getMarkdownFilePath(slug);
  const file = Bun.file(filePath);

  if (await file.exists()) {
    return file.text();
  }
  return null;
};

const extractTitle = (markdown: string): string | undefined => {
  const { frontmatter, content } = parseFrontmatter(markdown);
  return frontmatter.title ?? extractTitleFromContent(content);
};

const extractDescription = (markdown: string): string => {
  const { content } = parseFrontmatter(markdown);
  const lines = content.split("\n");
  const titleIndex = lines.findIndex((line) => line.startsWith("# "));

  if (titleIndex === -1) {
    return "No description available.";
  }

  const descriptionLine = lines
    .slice(titleIndex + 1)
    .find((line) => line.trim() && !line.startsWith("#"));

  return descriptionLine?.trim() ?? "No description available.";
};

const sortPages = (pages: LlmsPage[]): LlmsPage[] =>
  pages.toSorted((a, b) => {
    if (a.slug === "") {
      return -1;
    }
    if (b.slug === "") {
      return 1;
    }
    return a.title.localeCompare(b.title);
  });

const buildLlmsPages = async (): Promise<LlmsPage[]> => {
  const pages: LlmsPage[] = [];

  for await (const file of contentGlob.scan(CONTENT_DIR)) {
    const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
    const slug = slugFromContentFile(file);
    const title = extractTitle(markdown) ?? slug;
    const description = extractDescription(markdown);

    pages.push({
      description,
      slug: pageSlugFromContentSlug(slug),
      title,
    });
  }

  return pages;
};

const formatLlmsTxt = (siteConfig: SiteConfig, pages: LlmsPage[]): string => {
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## Pages",
    "",
  ];

  for (const page of pages) {
    const mdFile =
      page.slug === "" ? "index/content.md" : `${page.slug}/content.md`;
    lines.push(`- [${page.title}](/${mdFile}): ${page.description}`);
  }

  return `${lines.join("\n")}\n`;
};

export const generateLlmsTxt = async (): Promise<string> => {
  const [siteConfig, pages] = await Promise.all([
    loadSiteConfig(),
    buildLlmsPages(),
  ]);
  const sortedPages = sortPages(pages);

  return formatLlmsTxt(siteConfig, sortedPages);
};

const getSearchContent = (scope: SearchScope, markdown: string): string => {
  if (scope === "title") {
    return extractTitle(markdown) ?? "";
  }

  if (scope === "title_and_description") {
    return `${extractTitle(markdown) ?? ""} ${extractDescription(markdown)}`;
  }

  return markdown;
};

const buildSearchResult = async (
  file: string,
  query: string,
  scope: SearchScope
): Promise<SearchResult | null> => {
  const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
  const slug = slugFromContentFile(file);
  const searchContent = getSearchContent(scope, markdown);

  if (!searchContent.toLowerCase().includes(query)) {
    return null;
  }

  return {
    description: extractDescription(markdown),
    slug: pagePathFromContentSlug(slug),
    title: extractTitle(markdown) ?? slug,
  };
};

export const createSearchStream = (
  query: string,
  scope: SearchScope
): AsyncIterable<string> => {
  const stream = async function* stream(): AsyncGenerator<string> {
    for await (const file of contentGlob.scan(CONTENT_DIR)) {
      const result = await buildSearchResult(file, query, scope);
      if (result) {
        yield `${JSON.stringify(result)}\n`;
      }
    }
  };

  return stream();
};
