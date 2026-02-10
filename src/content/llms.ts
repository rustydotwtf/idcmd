import type { SiteConfig } from "../site/config";

import { loadSiteConfig } from "../site/config";
import { parseFrontmatter } from "./frontmatter";
import { derivePageMetaFromParsed } from "./meta";
import {
  getContentDir,
  pageSlugFromContentSlug,
  scanContentFiles,
  slugFromContentFile,
} from "./paths";

interface LlmsPage {
  description: string;
  slug: string;
  title: string;
}

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
  contentDir: string,
  siteConfig: SiteConfig
): Promise<LlmsPage | null> => {
  const markdown = await Bun.file(`${contentDir}/${file}`).text();
  const parsed = parseFrontmatter(markdown);

  if (parsed.frontmatter.hidden) {
    return null;
  }

  const slug = slugFromContentFile(file);
  const meta = derivePageMetaFromParsed(parsed, {
    fallbackTitle: slug,
    siteDefaultDescription: siteConfig.description,
  });

  return {
    description: meta.description,
    slug: pageSlugFromContentSlug(slug),
    title: meta.title,
  };
};

const buildLlmsPages = async (siteConfig: SiteConfig): Promise<LlmsPage[]> => {
  const pages: LlmsPage[] = [];
  const contentDir = await getContentDir();

  for await (const file of scanContentFiles()) {
    const page = await buildLlmsPage(file, contentDir, siteConfig);
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
    const mdFile = page.slug === "" ? "index.md" : `${page.slug}.md`;
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
