import { getProjectPaths } from "@/project/paths";

const flatContentGlob = new Bun.Glob("*.md");

export const getContentDir = async (): Promise<string> => {
  const paths = await getProjectPaths();
  return paths.contentDir;
};

export const getMarkdownFilePath = async (slug: string): Promise<string> =>
  `${await getContentDir()}/${slug}.md`;

export const slugFromContentFile = (file: string): string => {
  if (file.endsWith(".md")) {
    return file.slice(0, -".md".length);
  }

  return file;
};

export const scanContentFiles =
  async function* scanContentFiles(): AsyncGenerator<string> {
    const { contentDir } = await getProjectPaths();
    // `content/<slug>.md`
    for await (const file of flatContentGlob.scan(contentDir)) {
      yield file;
    }
  };

export const pageSlugFromContentSlug = (slug: string): string =>
  slug === "index" ? "" : slug;

export const pagePathFromContentSlug = (slug: string): string =>
  slug === "index" ? "/" : `/${slug}/`;
