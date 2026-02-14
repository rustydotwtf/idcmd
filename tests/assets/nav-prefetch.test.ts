import { describe, expect, it } from "bun:test";

describe("nav-prefetch.js", () => {
  it("prefetches hoverable nav links", async () => {
    const script = await Bun.file("public/_idcmd/nav-prefetch.js").text();

    expect(script.includes('a[data-prefetch="hover"][href]')).toBe(true);
    expect(script.includes('link.rel = "prefetch"')).toBe(true);
  });
});
