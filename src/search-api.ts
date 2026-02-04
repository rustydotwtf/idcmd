import { createSearchStream } from "./content";
import { getSearchScope, loadSiteConfig } from "./utils/site-config";

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

export const handleSearchRequest = async (
  url: URL
): Promise<Response | undefined> => {
  if (url.pathname !== "/api/search") {
    return undefined;
  }

  const query = url.searchParams.get("q")?.toLowerCase();
  if (!query) {
    return Response.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  const siteConfig = await loadSiteConfig();
  const scope = getSearchScope(siteConfig);
  const stream = createSearchStream(query, scope);

  return new Response(toReadableStream(stream), {
    headers: { "Content-Type": "application/jsonl; charset=utf-8" },
  });
};
