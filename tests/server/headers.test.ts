import { describe, expect, it } from "bun:test";

import {
  createHtmlCacheHeaders,
  createStaticCacheHeaders,
} from "@/server/headers";
import { resolveCachePolicy } from "@/site/cache";

describe("server headers", () => {
  it("combines browser + edge html cache directives in production", () => {
    const headers = new Headers(
      createHtmlCacheHeaders(false, resolveCachePolicy({ preset: "static" }))
    );
    expect(headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=3600"
    );
  });

  it("uses no-cache html headers in development", () => {
    const headers = new Headers(
      createHtmlCacheHeaders(true, resolveCachePolicy({ preset: "static" }))
    );
    expect(headers.get("cache-control")).toBe("no-cache");
  });

  it("uses static preset immutable cache for static assets", () => {
    const headers = new Headers(
      createStaticCacheHeaders(false, resolveCachePolicy({ preset: "static" }))
    );
    expect(headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("uses balanced preset revalidation for static assets", () => {
    const headers = new Headers(
      createStaticCacheHeaders(
        false,
        resolveCachePolicy({ preset: "balanced" })
      )
    );
    expect(headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate"
    );
  });
});
