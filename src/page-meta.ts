import { extractTitleFromContent, parseFrontmatter } from "./frontmatter";

const stripInlineMarkdown = (text: string): string =>
  text
    // Images: ![alt](url) -> alt
    .replaceAll(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Links: [text](url) -> text
    .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Inline code: `code` -> code
    .replaceAll(/`([^`]+)`/g, "$1")
    // Emphasis markers
    .replaceAll(/[*_~]+/g, "")
    .trim();

const extractDescriptionFromContent = (content: string): string | undefined => {
  const lines = content.split("\n");
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line));

  const startIndex = titleIndex === -1 ? 0 : titleIndex + 1;
  const firstMeaningfulLine = lines
    .slice(startIndex)
    .find(
      (line) => line.trim().length > 0 && !line.trimStart().startsWith("#")
    );

  const cleaned = firstMeaningfulLine
    ? stripInlineMarkdown(firstMeaningfulLine)
    : undefined;

  return cleaned && cleaned.length > 0 ? cleaned : undefined;
};

export const deriveTitle = (
  markdown: string,
  titleOverride?: string
): string => {
  if (titleOverride && titleOverride.trim().length > 0) {
    return titleOverride.trim();
  }

  const { frontmatter, content } = parseFrontmatter(markdown);
  return (
    frontmatter.title ??
    extractTitleFromContent(content) ??
    // A safe fallback so <title> is never empty.
    "Untitled"
  );
};

export const deriveDescription = (
  markdown: string,
  siteDefaultDescription: string
): string => {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const frontmatterDescription = frontmatter.description?.trim();

  if (frontmatterDescription && frontmatterDescription.length > 0) {
    return frontmatterDescription;
  }

  const extracted = extractDescriptionFromContent(content);
  if (extracted) {
    return extracted;
  }

  const fallback = siteDefaultDescription.trim();
  return fallback.length > 0 ? fallback : "No description available.";
};
