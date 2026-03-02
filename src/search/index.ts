import type { SearchScope, SiteConfig } from "../site/config";
import type { SearchResult } from "./contract";

import { expandMarkdownForAgent } from "../content/components/expand";
import { parseFrontmatter } from "../content/frontmatter";
import { derivePageMetaFromParsed } from "../content/meta";
import {
  getContentDir,
  pagePathFromContentSlug,
  scanContentFiles,
  slugFromContentFile,
} from "../content/paths";

export interface SearchIndexDocument {
  url: string;
  title: string;
  description: string;
  body: string;
}

export interface SearchIndex {
  generatedAt: string;
  documents: SearchIndexDocument[];
}

const SEARCH_INDEX_PATH = "public/search-index.json";
const MIN_QUERY_TOKEN_LENGTH = 2;
const DEFAULT_BODY_MAX_CHARS = 2000;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const markdownToPlainText = (markdown: string): string => {
  const { content } = parseFrontmatter(markdown);

  return (
    content
      // Remove fenced code blocks
      .replaceAll(/```[\s\S]*?```/g, " ")
      // Remove inline code ticks
      .replaceAll(/`([^`]+)`/g, "$1")
      // Images -> alt
      .replaceAll(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Links -> text
      .replaceAll(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Strip headings and blockquotes markers
      .replaceAll(/^\s{0,3}#{1,6}\s+/gm, "")
      .replaceAll(/^\s{0,3}>\s?/gm, "")
      // Collapse whitespace
      .replaceAll(/\s+/g, " ")
      .trim()
  );
};

const normalizeQueryTokens = (query: string): string[] =>
  query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= MIN_QUERY_TOKEN_LENGTH);

const isEligibleDocument = (
  slug: string,
  hidden: boolean | undefined
): boolean => !hidden && slug !== "404";

const sortDocuments = (documents: SearchIndexDocument[]): void => {
  documents.sort((a, b) => {
    if (a.url === "/") {
      return -1;
    }
    if (b.url === "/") {
      return 1;
    }
    return a.url.localeCompare(b.url);
  });
};

const buildDocumentFromFile = async (
  file: string,
  bodyMaxChars: number,
  contentDir: string,
  siteConfig: SiteConfig
): Promise<SearchIndexDocument | null> => {
  const slug = slugFromContentFile(file);
  const markdown = await Bun.file(`${contentDir}/${file}`).text();
  const parsed = parseFrontmatter(markdown);

  if (!isEligibleDocument(slug, parsed.frontmatter.hidden)) {
    return null;
  }

  const meta = derivePageMetaFromParsed(parsed, {
    fallbackTitle: slug,
    siteDefaultDescription: siteConfig.description,
  });
  const url = pagePathFromContentSlug(slug);
  const expandedForAgent = await expandMarkdownForAgent(markdown, {
    currentPath: url,
    instanceId: `${slug}:search`,
    isDev: false,
    slug,
  });
  const body = markdownToPlainText(expandedForAgent).slice(0, bodyMaxChars);

  return { body, description: meta.description, title: meta.title, url };
};

export interface GenerateSearchIndexOptions {
  bodyMaxChars?: number;
  generatedAt?: string;
  siteConfig: SiteConfig;
}

export const generateSearchIndexFromContent = async (
  options: GenerateSearchIndexOptions
): Promise<SearchIndex> => {
  const { bodyMaxChars = DEFAULT_BODY_MAX_CHARS, siteConfig } = options;
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const documents: SearchIndexDocument[] = [];
  const contentDir = await getContentDir();

  for await (const file of scanContentFiles()) {
    const document = await buildDocumentFromFile(
      file,
      bodyMaxChars,
      contentDir,
      siteConfig
    );
    if (document) {
      documents.push(document);
    }
  }

  sortDocuments(documents);

  return {
    documents,
    generatedAt,
  };
};

const isSearchIndexDocument = (
  value: unknown
): value is SearchIndexDocument => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    isNonEmptyString(record.url) &&
    isNonEmptyString(record.title) &&
    typeof record.description === "string" &&
    typeof record.body === "string"
  );
};

const isSearchIndex = (value: unknown): value is SearchIndex => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    isNonEmptyString(record.generatedAt) &&
    Array.isArray(record.documents) &&
    record.documents.every((doc) => isSearchIndexDocument(doc))
  );
};

let indexCache: SearchIndex | null = null;

export interface LoadSearchIndexOptions {
  forceRefresh?: boolean;
  siteConfig: SiteConfig;
}

const tryLoadSearchIndexFromDisk = async (): Promise<SearchIndex | null> => {
  const file = Bun.file(SEARCH_INDEX_PATH);
  if (!(await file.exists())) {
    return null;
  }

  try {
    const parsed = (await file.json()) as unknown;
    return isSearchIndex(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const loadSearchIndex = async (
  options: LoadSearchIndexOptions
): Promise<SearchIndex> => {
  const { forceRefresh = false, siteConfig } = options;
  if (indexCache && !forceRefresh) {
    return indexCache;
  }

  const loaded = await tryLoadSearchIndexFromDisk();
  if (loaded) {
    indexCache = loaded;
    return loaded;
  }

  const regenerated = await generateSearchIndexFromContent({ siteConfig });
  indexCache = regenerated;
  return regenerated;
};

const getScopeHaystack = (
  document: SearchIndexDocument,
  scope: SearchScope
): string => {
  if (scope === "title") {
    return document.title;
  }

  if (scope === "title_and_description") {
    return `${document.title} ${document.description}`;
  }

  return `${document.title} ${document.description} ${document.body}`;
};

const matchesAllTokens = (
  document: SearchIndexDocument,
  tokens: readonly string[],
  scope: SearchScope
): boolean => {
  const haystack = getScopeHaystack(document, scope).toLowerCase();
  return tokens.every((token) => haystack.includes(token));
};

const toSearchResult = (document: SearchIndexDocument): SearchResult => ({
  description: document.description,
  slug: document.url,
  title: document.title,
});

export const search = (
  index: SearchIndex,
  query: string,
  scope: SearchScope
): SearchResult[] => {
  const tokens = normalizeQueryTokens(query);
  if (tokens.length === 0) {
    return [];
  }

  const matches = index.documents
    .filter((document) => matchesAllTokens(document, tokens, scope))
    .map(toSearchResult)
    .toSorted((a, b) => a.title.localeCompare(b.title));

  return matches;
};
