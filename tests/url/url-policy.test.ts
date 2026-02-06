import { describe, expect, it } from "bun:test";

import {
  getRedirectForCanonicalHtmlPath,
  isFileLikePathname,
  toCanonicalHtmlPathname,
} from "@/site/url-policy";

describe("url-policy", () => {
  it("canonicalizes html pages to trailing slash", () => {
    expect(getRedirectForCanonicalHtmlPath("/about")).toBe("/about/");
    expect(getRedirectForCanonicalHtmlPath("/about/")).toBeNull();
    expect(toCanonicalHtmlPathname("/index")).toBe("/");
    expect(getRedirectForCanonicalHtmlPath("/index")).toBe("/");
  });

  it("does not canonicalize file-like paths", () => {
    expect(isFileLikePathname("/about.md")).toBe(true);
    expect(getRedirectForCanonicalHtmlPath("/about.md")).toBeNull();
    expect(isFileLikePathname("/index/content.md")).toBe(true);
    expect(getRedirectForCanonicalHtmlPath("/index/content.md")).toBeNull();
    expect(isFileLikePathname("/styles.css")).toBe(true);
    expect(getRedirectForCanonicalHtmlPath("/styles.css")).toBeNull();
  });
});
