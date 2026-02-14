import { afterEach, describe, expect, it } from "bun:test";
import {
  createTempDir,
  isSorted,
  joinPath,
  writeTextFile,
} from "tests/test-utils";

import { generateSearchIndexFromContent, search } from "@/search/index";
import { loadSiteConfig } from "@/site/config";

const FIXED_GENERATED_AT = "1970-01-01T00:00:00.000Z";
const CANONICAL_URL_PATTERN = /^\/$|\/$/;
const ORIGINAL_CWD = process.cwd();

const seedSiteProject = async (): Promise<void> => {
  const root = await createTempDir("idcmd-search-index-");
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
  await writeTextFile(
    joinPath(root, "site", "content", "404.md"),
    ["---", "title: Not Found", "---", "", "# 404"].join("\n")
  );
  process.chdir(root);
};

const createIndex = async () => {
  const siteConfig = await loadSiteConfig();
  return generateSearchIndexFromContent({
    generatedAt: FIXED_GENERATED_AT,
    siteConfig,
  });
};

const expectCanonicalUrls = (urls: string[]): void => {
  for (const url of urls) {
    expect(url).toMatch(CANONICAL_URL_PATTERN);
  }
};

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
});

describe("search-index", () => {
  it("generates a stable v1 index with canonical urls", async () => {
    await seedSiteProject();
    const index = await createIndex();

    expect(index).toMatchObject({
      generatedAt: FIXED_GENERATED_AT,
      version: 1,
    });
    expect(index.documents.length > 0).toBe(true);

    const urls = index.documents.map((doc) => doc.url);
    expect(urls).not.toContain("/404/");
    expect(urls[0]).toBe("/");
    expect(isSorted(urls.slice(1))).toBe(true);
    expectCanonicalUrls(urls);
  });

  it("searches documents via AND-matching tokens", async () => {
    await seedSiteProject();
    const index = await createIndex();

    const results = search(index, "markdown site", "full");
    expect(results.length > 0).toBe(true);
    expect(results.every((r) => CANONICAL_URL_PATTERN.test(r.slug))).toBe(true);
  });
});
