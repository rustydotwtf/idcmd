/* eslint-disable react/jsx-key */

import type { SearchResult } from "./contract";

const escapeText = (value: string): string => Bun.escapeHTML(value);

export interface TopPageLink {
  href: string;
  title: string;
}

export interface SearchPageProps {
  query: string;
  minQueryLength: number;
  results: SearchResult[];
  topPages: TopPageLink[];
}

export type RenderSearchPageContent = (props: SearchPageProps) => string;

const ResultItem = ({ result }: { result: SearchResult }): JSX.Element => (
  <li class="rounded-md border border-border p-3">
    <a
      href={result.slug}
      class="font-medium underline decoration-border underline-offset-4"
    >
      {escapeText(result.title)}
    </a>
    <p class="mt-1 text-sm text-muted-foreground">
      {escapeText(result.description)}
    </p>
  </li>
);

const EmptyState = ({
  minQueryLength,
  topPages,
}: {
  minQueryLength: number;
  topPages: TopPageLink[];
}): JSX.Element => (
  <div class="text-sm text-muted-foreground">
    <p>{`Type at least ${minQueryLength} characters to search.`}</p>
    {topPages.length > 0 ? (
      <>
        <p class="mt-4 font-medium text-foreground">Popular pages</p>
        <ul class="mt-2 space-y-1">
          {topPages.map((page) => (
            <li>
              <a
                href={page.href}
                class="underline decoration-border underline-offset-4"
              >
                {escapeText(page.title)}
              </a>
            </li>
          ))}
        </ul>
      </>
    ) : null}
  </div>
);

const SearchPage = ({
  query,
  minQueryLength,
  results,
  topPages,
}: SearchPageProps): JSX.Element => {
  const trimmed = query.trim();
  const showResults = trimmed.length >= minQueryLength;

  return (
    <section class="not-prose rounded-lg border border-border bg-card/30 p-4">
      <h1 class="text-lg font-semibold">Search</h1>
      {showResults ? (
        <p class="mt-2 text-sm text-muted-foreground">
          {results.length === 0
            ? `No matches for "${escapeText(trimmed)}".`
            : `Found ${results.length} result(s) for "${escapeText(trimmed)}".`}
        </p>
      ) : (
        <div class="mt-2">
          <EmptyState minQueryLength={minQueryLength} topPages={topPages} />
        </div>
      )}

      {showResults ? (
        <ul class="mt-4 space-y-2">
          {results.map((result) => (
            <ResultItem result={result} />
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export const renderSearchPageContent: RenderSearchPageContent = (props) =>
  `${<SearchPage {...props} />}`;
