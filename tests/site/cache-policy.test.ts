import { describe, expect, it } from "bun:test";

import { resolveCachePolicy } from "@/site/cache";

describe("cache policy presets", () => {
  it("defaults to static preset", () => {
    const policy = resolveCachePolicy();
    expect(policy.preset).toBe("static");
    expect(policy.static.cacheControl).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("uses balanced preset static revalidation", () => {
    const policy = resolveCachePolicy({ preset: "balanced" });
    expect(policy.static.cacheControl).toBe(
      "public, max-age=0, must-revalidate"
    );
    expect(policy.html.edgeCacheControl).toBe(
      "s-maxage=60, stale-while-revalidate=3600"
    );
  });

  it("uses fresh preset no-store behavior", () => {
    const policy = resolveCachePolicy({ preset: "fresh" });
    expect(policy.html.browserCacheControl).toBe("no-store");
    expect(policy.html.edgeCacheControl).toBeNull();
    expect(policy.static.cacheControl).toBe("no-store");
  });

  it("applies html edge cache overrides", () => {
    const policy = resolveCachePolicy({
      html: { sMaxAgeSeconds: 90, staleWhileRevalidateSeconds: 1800 },
      preset: "static",
    });
    expect(policy.html.edgeCacheControl).toBe(
      "s-maxage=90, stale-while-revalidate=1800"
    );
  });
});
