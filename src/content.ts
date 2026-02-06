import type { SiteConfig } from "./utils/site-config";

import { parseFrontmatter } from "./frontmatter";
import { deriveDescription, deriveTitle } from "./page-meta";
import {
  CONTENT_DIR,
  contentGlob,
  getMarkdownFilePath,
  pageSlugFromContentSlug,
  slugFromContentFile,
} from "./utils/content-paths";
import { loadSiteConfig } from "./utils/site-config";

interface LlmsPage {
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

const buildLlmsPage = async (
  file: string,
  siteConfig: SiteConfig
): Promise<LlmsPage | null> => {
  const markdown = await Bun.file(`${CONTENT_DIR}/${file}`).text();
  const { frontmatter } = parseFrontmatter(markdown);
  if (frontmatter.hidden) {
    return null;
  }

  const slug = slugFromContentFile(file);
  const title = deriveTitle(markdown);
  const description = deriveDescription(markdown, siteConfig.description);

  return {
    description,
    slug: pageSlugFromContentSlug(slug),
    title,
  };
};

const buildLlmsPages = async (siteConfig: SiteConfig): Promise<LlmsPage[]> => {
  const pages: LlmsPage[] = [];

  for await (const file of contentGlob.scan(CONTENT_DIR)) {
    const page = await buildLlmsPage(file, siteConfig);
    if (page) {
      pages.push(page);
    }
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
  const siteConfig = await loadSiteConfig();
  const pages = await buildLlmsPages(siteConfig);
  const sortedPages = sortPages(pages);

  return formatLlmsTxt(siteConfig, sortedPages);
};
