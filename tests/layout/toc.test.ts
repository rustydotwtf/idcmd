import { describe, expect, it } from "bun:test";

import { renderLayout } from "@/layout";

describe("right rail", () => {
  it("renders 'On this page' and links to h2/h3 ids", () => {
    const html = renderLayout({
      canonicalUrl: "http://localhost:4000/about/",
      content:
        '<h1 id="title"><a href="#title">Title</a></h1>' +
        '<h2 id="sec"><a href="#sec">Section</a></h2>' +
        '<h3 id="sub"><a href="#sub">Sub</a></h3>',
      currentPath: "/about/",
      navigation: [],
      title: "Test",
    });

    expect(html.includes("On this page")).toBe(true);
    expect(html.includes('href="#sec"')).toBe(true);
    expect(html.includes('href="#sub"')).toBe(true);
    expect(html.includes('class="pl-3"')).toBe(true);
  });

  it("builds provider URLs with an absolute markdown link", () => {
    const html = renderLayout({
      canonicalUrl: "http://localhost:4000/about/",
      content: '<h2 id="sec"><a href="#sec">Section</a></h2>',
      currentPath: "/about/",
      navigation: [],
      title: "Test",
    });

    expect(html.includes("https://chatgpt.com/?prompt=")).toBe(true);
    expect(html.includes("https://claude.ai/new?q=")).toBe(true);

    // Absolute markdown URL should be included in the encoded prompt.
    expect(html.includes("http%3A%2F%2Flocalhost%3A4000%2Fabout.md")).toBe(
      true
    );
  });
});
