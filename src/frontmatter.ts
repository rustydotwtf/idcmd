/**
 * Frontmatter parsing utility
 * Extracts YAML frontmatter from markdown files since Bun.markdown.html()
 * doesn't handle it natively (renders it as HTML instead of stripping it).
 */

export interface PageMeta {
  title?: string;
  icon?: string;
  group?: string;
  order?: number;
  hidden?: boolean;
}

export interface ParsedMarkdown {
  frontmatter: PageMeta;
  content: string;
}

/**
 * Parse YAML frontmatter from markdown content.
 * Frontmatter must be at the very start of the file, delimited by `---`.
 *
 * @example
 * ```markdown
 * ---
 * title: My Page
 * icon: home
 * group: main
 * order: 1
 * ---
 * # Content here
 * ```
 */
const getFrontmatterBlock = (
  trimmed: string
): { yamlBlock: string; content: string } | null => {
  if (!trimmed.startsWith("---")) {
    return null;
  }

  const endIndex = trimmed.indexOf("---", 3);
  if (endIndex === -1) {
    return null;
  }

  return {
    content: trimmed.slice(endIndex + 3).trimStart(),
    yamlBlock: trimmed.slice(3, endIndex).trim(),
  };
};

const parseYamlFrontmatter = (yamlBlock: string): PageMeta => {
  try {
    const parsed = Bun.YAML.parse(yamlBlock);
    if (parsed && typeof parsed === "object") {
      return parsed as PageMeta;
    }
  } catch (error) {
    console.warn("Failed to parse frontmatter YAML:", error);
  }

  return {};
};

export const parseFrontmatter = (markdown: string): ParsedMarkdown => {
  const trimmed = markdown.trimStart();
  const block = getFrontmatterBlock(trimmed);

  if (!block) {
    return {
      content: markdown,
      frontmatter: {},
    };
  }

  return {
    content: block.content,
    frontmatter: parseYamlFrontmatter(block.yamlBlock),
  };
};

/**
 * Extract title from markdown content (first h1 heading).
 * Used as fallback when frontmatter doesn't specify a title.
 */
export const extractTitleFromContent = (markdown: string): string | undefined =>
  markdown.match(/^#\s+(.+)$/m)?.[1];
