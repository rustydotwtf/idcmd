import type { SearchResult } from "./contract";

import { getSearchScope, loadSiteConfig } from "../site/config";
import { toSearchResultJsonLine } from "./contract";
import { loadSearchIndex, search } from "./index";

const textEncoder = new TextEncoder();

const toReadableStream = (
  iterable: AsyncIterable<string>
): ReadableStream<Uint8Array> => {
  const iterator = iterable[Symbol.asyncIterator]();

  return new ReadableStream({
    async cancel() {
      if (iterator.return) {
        await iterator.return();
      }
    },
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(textEncoder.encode(value));
      } catch (error) {
        controller.error(error);
      }
    },
  });
};

const getQueryParam = (url: URL): string | null =>
  url.searchParams.get("q")?.trim().toLowerCase() ?? null;

const createMissingQueryResponse = (): Response =>
  Response.json({ error: "Missing query parameter 'q'" }, { status: 400 });

const toJsonLinesStream = (
  results: readonly SearchResult[]
): AsyncIterable<string> =>
  (async function* stream(): AsyncGenerator<string> {
    for (const result of results) {
      yield toSearchResultJsonLine(result);
    }
  })();

const createSearchResponse = async (query: string): Promise<Response> => {
  const siteConfig = await loadSiteConfig();
  const scope = getSearchScope(siteConfig);
  const index = await loadSearchIndex({ siteConfig });
  const results = search(index, query, scope);
  const stream = toJsonLinesStream(results);

  return new Response(toReadableStream(stream), {
    headers: { "Content-Type": "application/jsonl; charset=utf-8" },
  });
};

export const handleSearchRequest = (
  url: URL
): Promise<Response | undefined> => {
  if (url.pathname !== "/api/search") {
    return Promise.resolve(undefined satisfies Response | undefined);
  }

  const query = getQueryParam(url);
  if (!query) {
    return Promise.resolve(createMissingQueryResponse());
  }

  return createSearchResponse(query);
};
