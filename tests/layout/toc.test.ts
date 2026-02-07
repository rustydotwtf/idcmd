import { describe, expect, it } from "bun:test";

import { renderLayout } from "@/render/layout";
import { extractTocFromHtml } from "@/render/toc";
import { resolveRightRailConfig } from "@/site/config";

describe("right rail", () => {
  it("renders TOC links to h2/h3 ids", () => {
    const rightRail = resolveRightRailConfig();
    const content =
      '<h1 id="title"><a href="#title">Title</a></h1>' +
      '<h2 id="sec"><a href="#sec">Section</a></h2>' +
      '<h3 id="sub"><a href="#sub">Sub</a></h3>';
    const tocItems = extractTocFromHtml(content, {
      levels: rightRail.tocLevels,
    });

    const html = renderLayout({
      canonicalUrl: "http://localhost:4000/about/",
      content,
      currentPath: "/about/",
      navigation: [],
      rightRail,
      siteName: "Test",
      title: "Test",
      tocItems,
    });

    expect(html.includes('href="#sec"')).toBe(true);
    expect(html.includes('href="#sub"')).toBe(true);
    expect(html.includes('class="pl-3"')).toBe(true);
    expect(html.includes('data-toc-root="1"')).toBe(true);
    expect(html.includes('data-toc-scroll-container="1"')).toBe(true);
    expect(html.includes('data-toc-link="1"')).toBe(true);
  });

  it("builds provider URLs with an absolute markdown link", () => {
    const rightRail = resolveRightRailConfig();
    const content = '<h2 id="sec"><a href="#sec">Section</a></h2>';
    const tocItems = extractTocFromHtml(content, {
      levels: rightRail.tocLevels,
    });

    const html = renderLayout({
      canonicalUrl: "http://localhost:4000/about/",
      content,
      currentPath: "/about/",
      navigation: [],
      rightRail,
      siteName: "Test",
      title: "Test",
      tocItems,
    });

    const requiredSubstrings = [
      "https://chatgpt.com/?prompt=",
      "https://claude.ai/new?q=",
      "Copy Markdown to Clipboard",
      'data-copy-markdown="1"',
      'href="/about.md"',
      // Absolute markdown URL should be included in the encoded prompt.
      "http%3A%2F%2Flocalhost%3A4000%2Fabout.md",
      // Absolute llms.txt URL should be included in the encoded prompt.
      "http%3A%2F%2Flocalhost%3A4000%2Fllms.txt",
    ] as const;

    for (const needle of requiredSubstrings) {
      expect(html.includes(needle)).toBe(true);
    }
  });
});

describe("extractTocFromHtml", () => {
  it("defaults to h2/h3 only", () => {
    const items = extractTocFromHtml(
      '<h1 id="a"><a href="#a">A</a></h1>' +
        '<h2 id="b"><a href="#b">B</a></h2>' +
        '<h3 id="c"><a href="#c">C</a></h3>'
    );

    expect(items.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("supports configurable heading levels", () => {
    const items = extractTocFromHtml(
      '<h1 id="a"><a href="#a">A</a></h1>' +
        '<h2 id="b"><a href="#b">B</a></h2>' +
        '<h3 id="c"><a href="#c">C</a></h3>',
      { levels: [1, 2, 3] }
    );

    expect(items.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
