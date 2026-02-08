import { parseFrontmatter } from "@/content/frontmatter";
import {
  getContentDir,
  pagePathFromContentSlug,
  scanContentFiles,
  slugFromContentFile,
} from "@/content/paths";
import { resolveAbsoluteUrl } from "@/site/urls";

export interface SitemapPage {
  pathname: string;
  lastModified?: Date;
}

const toLastModDate = (date: Date): string => date.toISOString().slice(0, 10);

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const renderSitemapEntry = (
  page: SitemapPage,
  baseUrl: string
): string | null => {
  const loc = resolveAbsoluteUrl(baseUrl, page.pathname);
  if (!loc) {
    return null;
  }

  const lastModLine = page.lastModified
    ? `    <lastmod>${toLastModDate(page.lastModified)}</lastmod>`
    : null;

  const lines = [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastModLine,
    "  </url>",
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
};

export const generateSitemapXml = (
  pages: SitemapPage[],
  baseUrl: string
): string => {
  const entries = pages
    .map((page) => renderSitemapEntry(page, baseUrl))
    .filter((entry): entry is string => entry !== null);

  return `${[
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
  ].join("\n")}\n`;
};

export const generateRobotsTxt = (baseUrl: string): string => {
  const sitemap = resolveAbsoluteUrl(baseUrl, "/sitemap.xml");
  const lines = ["User-agent: *", "Allow: /"];

  if (sitemap) {
    lines.push(`Sitemap: ${sitemap}`);
  }

  return `${lines.join("\n")}\n`;
};

const isSitemapEligible = (
  slug: string,
  hidden: boolean | undefined
): boolean => !hidden && slug !== "404";

const compareSitemapPages = (a: SitemapPage, b: SitemapPage): number => {
  if (a.pathname === "/") {
    return -1;
  }
  if (b.pathname === "/") {
    return 1;
  }
  return a.pathname.localeCompare(b.pathname);
};

const collectSitemapPageFromFile = async (
  file: string,
  contentDir: string
): Promise<SitemapPage | null> => {
  const slug = slugFromContentFile(file);
  const markdownFile = Bun.file(`${contentDir}/${file}`);
  const markdown = await markdownFile.text();
  const { frontmatter } = parseFrontmatter(markdown);

  if (!isSitemapEligible(slug, frontmatter.hidden)) {
    return null;
  }

  const pathname = pagePathFromContentSlug(slug);
  const lastModified = new Date(markdownFile.lastModified);
  return { lastModified, pathname };
};

export const collectSitemapPagesFromContent = async (): Promise<
  SitemapPage[]
> => {
  const pages: SitemapPage[] = [];
  const contentDir = await getContentDir();

  for await (const file of scanContentFiles()) {
    const page = await collectSitemapPageFromFile(file, contentDir);
    if (page) {
      pages.push(page);
    }
  }

  // Stable, predictable ordering (root first, then lexical).
  pages.sort(compareSitemapPages);
  return pages;
};
