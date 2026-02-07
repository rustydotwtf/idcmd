export const CONTENT_DIR = "./content";
const flatContentGlob = new Bun.Glob("*.md");

export const getMarkdownFilePath = (slug: string): string =>
  `${CONTENT_DIR}/${slug}.md`;

export const slugFromContentFile = (file: string): string => {
  if (file.endsWith(".md")) {
    return file.slice(0, -".md".length);
  }

  return file;
};

export const scanContentFiles =
  async function* scanContentFiles(): AsyncGenerator<string> {
    // `content/<slug>.md`
    for await (const file of flatContentGlob.scan(CONTENT_DIR)) {
      yield file;
    }
  };

export const pageSlugFromContentSlug = (slug: string): string =>
  slug === "index" ? "" : slug;

export const pagePathFromContentSlug = (slug: string): string =>
  slug === "index" ? "/" : `/${slug}/`;
