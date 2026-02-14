import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  createTempDir,
  joinPath,
  requireResponse,
  writeTextFile,
} from "tests/test-utils";

import { handleSearchRequest } from "@/search/api";
import { parseSearchResultsJsonLines } from "@/search/contract";

const SEARCH_QUERY = "markdown";
const ORIGINAL_CWD = process.cwd();

const seedSiteProject = async (): Promise<void> => {
  const root = await createTempDir("idcmd-search-api-");
  await writeTextFile(
    joinPath(root, "site", "site.jsonc"),
    '{ "name": "Docs", "description": "Markdown site" }'
  );
  await writeTextFile(
    joinPath(root, "site", "content", "index.md"),
    ["---", "title: Home", "---", "", "# Home", "", "Markdown site docs."].join(
      "\n"
    )
  );
  await writeTextFile(
    joinPath(root, "site", "content", "about.md"),
    ["---", "title: About", "---", "", "# About", "", "About this site."].join(
      "\n"
    )
  );
  process.chdir(root);
};

const expectValidResults = (jsonl: string): void => {
  const results = parseSearchResultsJsonLines(jsonl);
  expect(results.length > 0).toBe(true);

  for (const result of results) {
    expect(result.slug.startsWith("/")).toBe(true);
    expect(result.slug === "/" || result.slug.endsWith("/")).toBe(true);
    expect(result.title.length > 0).toBe(true);
    expect(result.description.length > 0).toBe(true);
  }
};

describe("/api/search", () => {
  beforeEach(async () => {
    await seedSiteProject();
  });

  afterEach(() => {
    process.chdir(ORIGINAL_CWD);
  });

  it("returns JSONL records matching the shared search contract", async () => {
    const response = await handleSearchRequest(
      new URL(
        `/api/search?q=${encodeURIComponent(SEARCH_QUERY)}`,
        "http://test"
      )
    );

    const resolvedResponse = requireResponse(
      response,
      "Expected /api/search response"
    );
    expect(resolvedResponse.status).toBe(200);
    expect(resolvedResponse.headers.get("content-type")).toContain(
      "application/jsonl; charset=utf-8"
    );
    expectValidResults(await resolvedResponse.text());
  });

  it("returns HTTP 400 when q is missing", async () => {
    const response = await handleSearchRequest(
      new URL("/api/search", "http://test")
    );

    const resolvedResponse = requireResponse(
      response,
      "Expected /api/search response"
    );
    expect(resolvedResponse.status).toBe(400);
    expect(resolvedResponse.headers.get("content-type")).toContain(
      "application/json"
    );

    const body = (await resolvedResponse.json()) as { error?: string };
    expect(body.error).toBe("Missing query parameter 'q'");
  });
});
