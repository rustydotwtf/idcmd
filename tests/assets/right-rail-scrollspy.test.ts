import { describe, expect, it } from "bun:test";

describe("right-rail-scrollspy.js", () => {
  it("finds headings in a way that supports non-CSS-selector-safe ids", async () => {
    const script = await Bun.file("public/right-rail-scrollspy.js").text();

    expect(script.includes("document.getElementById(")).toBe(true);
    // Guard against the original bug: unescaped template string inside querySelector.
    expect(/document\.querySelector\(\s*`#\$\{id\}`\s*\)/.test(script)).toBe(
      false
    );
  });
});
