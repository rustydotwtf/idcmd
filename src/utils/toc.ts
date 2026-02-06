export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
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
  const level = match[1] === "2" ? 2 : 3;
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

export const extractTocFromHtml = (html: string): TocItem[] => {
  const items: TocItem[] = [];

  // Bun's markdown renderer emits headings like:
  // <h2 id="foo"><a href="#foo">Foo</a></h2>
  const headingRegex = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;

  for (const match of html.matchAll(headingRegex)) {
    const item = parseHeadingMatch(match);
    if (item) {
      items.push(item);
    }
  }

  return items;
};
