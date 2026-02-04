export const CONTENT_DIR = "./content";
export const contentGlob = new Bun.Glob("*/content.md");

export const getMarkdownFilePath = (slug: string): string =>
  `${CONTENT_DIR}/${slug}/content.md`;

export const slugFromContentFile = (file: string): string =>
  file.replace("/content.md", "");

export const pageSlugFromContentSlug = (slug: string): string =>
  slug === "index" ? "" : slug;

export const pagePathFromContentSlug = (slug: string): string =>
  slug === "index" ? "/" : `/${slug}`;
