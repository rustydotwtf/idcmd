import type { TocLevel } from "../site/config";

export interface TocItem {
  id: string;
  text: string;
  level: TocLevel;
}

const decodeBasicEntities = (value: string): string =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");

const stripTags = (value: string): string => value.replaceAll(/<[^>]*>/g, "");

const parseHeadingMatch = (match: RegExpMatchArray): TocItem | null => {
  const level = Number.parseInt(match[1] ?? "", 10) as TocLevel;
  const id = match[2]?.trim() ?? "";
  const rawInner = match[3] ?? "";

  if (!id) {
    return null;
  }

  const text = decodeBasicEntities(stripTags(rawInner)).trim();
  if (!text) {
    return null;
  }

  return { id, level, text };
};

export interface ExtractTocOptions {
  levels?: readonly TocLevel[];
}

const DEFAULT_LEVELS: readonly TocLevel[] = [2, 3] as const;

const hasHeadingLevel = (
  levels: ReadonlySet<TocLevel>,
  level: TocLevel
): boolean => levels.has(level);

export const extractTocFromHtml = (
  html: string,
  options: ExtractTocOptions = {}
): TocItem[] => {
  const items: TocItem[] = [];
  const levels = new Set(options.levels ?? DEFAULT_LEVELS);

  // Bun's markdown renderer emits headings like:
  // <h2 id="foo"><a href="#foo">Foo</a></h2>
  const headingRegex = /<h([1-6])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;

  for (const match of html.matchAll(headingRegex)) {
    const item = parseHeadingMatch(match);
    if (item && hasHeadingLevel(levels, item.level)) {
      items.push(item);
    }
  }

  return items;
};
