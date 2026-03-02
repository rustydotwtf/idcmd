import { describe, expect, it } from "bun:test";

import { renderLayout } from "@/render/layout";
import { renderSearchPageContent } from "@/search/page";
import { resolveRightRailConfig } from "@/site/config";

const TEST_ICON = '<svg data-test-icon="1"></svg>';

describe("layout escaping", () => {
  it("escapes dynamic layout text and preserves trusted html content", () => {
    const rightRail = resolveRightRailConfig();
    const html = renderLayout({
      content: '<p data-raw="1">Raw content</p>',
      currentPath: "/",
      navigation: [
        {
          id: "main",
          items: [
            {
              href: "/intro/",
              iconSvg: TEST_ICON,
              order: 1,
              title: "Intro <i>tag</i>",
            },
          ],
          label: "Main <b>tag</b>",
          order: 1,
        },
      ],
      rightRail,
      showRightRail: false,
      siteName: "Site <img src=x onerror=1>",
      title: "Docs <script>alert(1)</script>",
      tocItems: [],
    });

    expect(
      html.includes("<title>Docs &lt;script&gt;alert(1)&lt;/script&gt;</title>")
    ).toBe(true);
    expect(html.includes("Site &lt;img src=x onerror=1&gt;")).toBe(true);
    expect(html.includes("Main &lt;b&gt;tag&lt;/b&gt;")).toBe(true);
    expect(html.includes("Intro &lt;i&gt;tag&lt;/i&gt;")).toBe(true);
    expect(html.includes('<p data-raw="1">Raw content</p>')).toBe(true);

    expect(html.includes("<script>alert(1)</script>")).toBe(false);
    expect(html.includes("<img src=x onerror=1>")).toBe(false);
  });

  it("escapes right-rail toc labels", () => {
    const rightRail = resolveRightRailConfig();
    const html = renderLayout({
      content: '<h2 id="toc-1"><a href="#toc-1">Heading</a></h2>',
      currentPath: "/guide/",
      navigation: [],
      rightRail,
      siteName: "Docs",
      title: "Guide",
      tocItems: [{ id: "toc-1", level: 2, text: "TOC <img src=x>" }],
    });

    expect(html.includes("TOC &lt;img src=x&gt;")).toBe(true);
    expect(html.includes("TOC <img src=x>")).toBe(false);
  });
});

describe("search escaping", () => {
  it("escapes query and result text in search results", () => {
    const html = renderSearchPageContent({
      minQueryLength: 1,
      query: '<img src=x onerror="1">',
      results: [
        {
          description: "Description <img src=x>",
          slug: "/page/",
          title: "Title <script>alert(1)</script>",
        },
      ],
      topPages: [],
    });

    expect(
      html.includes(
        'Found 1 result(s) for "&lt;img src=x onerror=&quot;1&quot;&gt;".'
      )
    ).toBe(true);
    expect(html.includes("Title &lt;script&gt;alert(1)&lt;/script&gt;")).toBe(
      true
    );
    expect(html.includes("Description &lt;img src=x&gt;")).toBe(true);
    expect(html.includes("<script>alert(1)</script>")).toBe(false);
  });

  it("escapes top page titles in empty state", () => {
    const html = renderSearchPageContent({
      minQueryLength: 2,
      query: "a",
      results: [],
      topPages: [{ href: "/top/", title: "Top <b>tag</b>" }],
    });

    expect(html.includes("Top &lt;b&gt;tag&lt;/b&gt;")).toBe(true);
    expect(html.includes("Top <b>tag</b>")).toBe(false);
  });
});
