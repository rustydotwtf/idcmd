export interface SearchResult {
  slug: string;
  title: string;
  description: string;
}

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" && value !== null;

export const isSearchResult = (value: unknown): value is SearchResult => {
  if (!isStringRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string"
  );
};

export const toSearchResultJsonLine = (result: SearchResult): string =>
  `${JSON.stringify(result)}\n`;

const parseSearchLine = (line: string): SearchResult | null => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  return isSearchResult(parsed) ? parsed : null;
};

export const parseSearchResultsJsonLines = (jsonl: string): SearchResult[] => {
  const parsed = jsonl.split("\n").map((line) => parseSearchLine(line));
  return parsed.filter((result): result is SearchResult => result !== null);
};
