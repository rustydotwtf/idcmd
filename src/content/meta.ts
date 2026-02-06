import type { ParsedMarkdown } from "./frontmatter";

import { extractTitleFromContent } from "./frontmatter";

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

export interface DeriveTitleOptions {
  fallbackTitle: string;
  titleOverride?: string;
}

export const deriveTitleFromParsed = (
  parsed: ParsedMarkdown,
  options: DeriveTitleOptions
): string => {
  const override = options.titleOverride?.trim();
  if (override) {
    return override;
  }

  return (
    parsed.frontmatter.title ??
    extractTitleFromContent(parsed.content) ??
    options.fallbackTitle
  );
};

export interface DeriveDescriptionOptions {
  siteDefaultDescription: string;
}

export const deriveDescriptionFromParsed = (
  parsed: ParsedMarkdown,
  options: DeriveDescriptionOptions
): string => {
  const frontmatterDescription = parsed.frontmatter.description?.trim();
  if (frontmatterDescription) {
    return frontmatterDescription;
  }

  const extracted = extractDescriptionFromContent(parsed.content);
  if (extracted) {
    return extracted;
  }

  const fallback = options.siteDefaultDescription.trim();
  return fallback.length > 0 ? fallback : "No description available.";
};

export interface DerivePageMetaOptions
  extends DeriveTitleOptions, DeriveDescriptionOptions {}

export const derivePageMetaFromParsed = (
  parsed: ParsedMarkdown,
  options: DerivePageMetaOptions
): { title: string; description: string } => ({
  description: deriveDescriptionFromParsed(parsed, {
    siteDefaultDescription: options.siteDefaultDescription,
  }),
  title: deriveTitleFromParsed(parsed, {
    fallbackTitle: options.fallbackTitle,
    titleOverride: options.titleOverride,
  }),
});
