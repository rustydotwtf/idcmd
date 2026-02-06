import { describe, expect, it } from "bun:test";

import { renderMarkdownPage } from "@/render/page-renderer";

describe("page-renderer", () => {
  it("renders TOC and includes scrollspy script when headings exist", async () => {
    const html = await renderMarkdownPage("# Title\n\n## Section\n\nHello", {
      currentPath: "/about/",
      navigation: [],
      siteConfig: {
        description: "Site description",
        name: "Test Site",
      },
    });

    expect(html.includes('data-toc-root="1"')).toBe(true);
    expect(html.includes("/right-rail-scrollspy.js")).toBe(true);
  });

  it("does not include scrollspy script when TOC is empty", async () => {
    const html = await renderMarkdownPage("# Title\n\nHello", {
      currentPath: "/about/",
      navigation: [],
      siteConfig: {
        description: "Site description",
        name: "Test Site",
      },
    });

    expect(html.includes("/right-rail-scrollspy.js")).toBe(false);
  });

  it("uses request origin for canonical URLs in dev mode", async () => {
    const html = await renderMarkdownPage("# Title\n\n## Section\n\nHello", {
      currentPath: "/about/",
      isDev: true,
      navigation: [],
      requestOrigin: "http://localhost:4000",
      siteConfig: {
        baseUrl: "https://example.com",
        description: "Site description",
        name: "Test Site",
      },
    });

    expect(
      html.includes('<link rel="canonical" href="http://localhost:4000/about/"')
    ).toBe(true);
  });

  it("uses configured baseUrl for canonical URLs in non-dev mode", async () => {
    const html = await renderMarkdownPage("# Title\n\n## Section\n\nHello", {
      currentPath: "/about/",
      isDev: false,
      navigation: [],
      requestOrigin: "http://localhost:4000",
      siteConfig: {
        baseUrl: "https://example.com",
        description: "Site description",
        name: "Test Site",
      },
    });

    expect(
      html.includes('<link rel="canonical" href="https://example.com/about/"')
    ).toBe(true);
  });
});
