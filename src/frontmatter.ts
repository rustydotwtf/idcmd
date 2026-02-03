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
export function parseFrontmatter(markdown: string): ParsedMarkdown {
  const trimmed = markdown.trimStart();

  // Check if file starts with frontmatter delimiter
  if (!trimmed.startsWith("---")) {
    return {
      content: markdown,
      frontmatter: {},
    };
  }

  // Find the closing delimiter
  const endIndex = trimmed.indexOf("---", 3);
  if (endIndex === -1) {
    // No closing delimiter, treat as regular content
    return {
      content: markdown,
      frontmatter: {},
    };
  }

  // Extract the YAML block (between the two ---)
  const yamlBlock = trimmed.slice(3, endIndex).trim();

  // Get the remaining content after frontmatter
  const content = trimmed.slice(endIndex + 3).trimStart();

  // Parse YAML using Bun's native parser
  let frontmatter: PageMeta = {};
  try {
    const parsed = Bun.YAML.parse(yamlBlock);
    if (parsed && typeof parsed === "object") {
      frontmatter = parsed as PageMeta;
    }
  } catch (error) {
    console.warn("Failed to parse frontmatter YAML:", error);
  }

  return {
    content,
    frontmatter,
  };
}

/**
 * Extract title from markdown content (first h1 heading).
 * Used as fallback when frontmatter doesn't specify a title.
 */
export function extractTitleFromContent(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1];
}
