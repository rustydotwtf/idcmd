import { describe, expect, it } from "bun:test";

describe("llm-menu.js", () => {
  it("uses Clipboard API when available and falls back to execCommand", async () => {
    const script = await Bun.file("public/llm-menu.js").text();

    const clipboardApiPattern =
      /(navigator\.clipboard)|({\s*clipboard\s*}\s*=\s*navigator)/;
    expect(clipboardApiPattern.test(script)).toBe(true);
    expect(script.includes('document.execCommand("copy")')).toBe(true);
  });
});
