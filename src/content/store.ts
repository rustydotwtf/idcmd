import { getMarkdownFilePath } from "./paths";

export const getMarkdownFile = async (slug: string): Promise<string | null> => {
  const filePath = getMarkdownFilePath(slug);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return file.text();
  }
  return null;
};
