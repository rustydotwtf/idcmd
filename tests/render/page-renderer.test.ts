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
    expect(html.includes("/_idcmd/nav-prefetch.js")).toBe(true);
    expect(html.includes("/_idcmd/llm-menu.js")).toBe(true);
    expect(html.includes("/_idcmd/right-rail-scrollspy.js")).toBe(true);
  });

  it("does not render top nav or search form in page layout", async () => {
    const html = await renderMarkdownPage("# Title\n\n## Section\n\nHello", {
      currentPath: "/about/",
      navigation: [],
      siteConfig: {
        description: "Site description",
        name: "Test Site",
      },
    });

    expect(html.includes('id="site-search"')).toBe(false);
    expect(html.includes('action="/search/"')).toBe(false);
    expect(html.includes('role="search"')).toBe(false);
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

    expect(html.includes("/_idcmd/llm-menu.js")).toBe(true);
    expect(html.includes("/_idcmd/nav-prefetch.js")).toBe(true);
    expect(html.includes("/_idcmd/right-rail-scrollspy.js")).toBe(false);
  });

  it("does not include llm-menu script when right rail is disabled", async () => {
    const html = await renderMarkdownPage("# Title\n\n## Section\n\nHello", {
      currentPath: "/about/",
      navigation: [],
      showRightRail: false,
      siteConfig: {
        description: "Site description",
        name: "Test Site",
      },
    });

    expect(html.includes("/_idcmd/nav-prefetch.js")).toBe(true);
    expect(html.includes("/_idcmd/llm-menu.js")).toBe(false);
    expect(html.includes("/_idcmd/right-rail-scrollspy.js")).toBe(false);
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

  it("expands doc component tags into SSR html", async () => {
    const html = await renderMarkdownPage(
      ["# Install", "", '<InstallTabs pkg="zod" />', ""].join("\n"),
      {
        currentPath: "/install/",
        navigation: [],
        siteConfig: {
          description: "Site description",
          name: "Test Site",
        },
      }
    );

    expect(html.includes('data-doc-component="InstallTabs"')).toBe(true);
    expect(html.includes("<InstallTabs")).toBe(false);
  });
});
