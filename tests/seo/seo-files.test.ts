import { describe, expect, it } from "bun:test";

import { generateRobotsTxt, generateSitemapXml } from "@/seo/files";

describe("seo-files", () => {
  it("generateRobotsTxt includes sitemap and ends with a newline", () => {
    const robots = generateRobotsTxt("https://example.com");

    expect(robots).toContain("User-agent: *\n");
    expect(robots).toContain("Allow: /\n");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml\n");
    expect(robots.endsWith("\n")).toBe(true);
  });

  it("generateSitemapXml escapes XML and renders lastmod as YYYY-MM-DD", () => {
    const xml = generateSitemapXml(
      [
        { pathname: "/" },
        {
          lastModified: new Date("2020-02-03T04:05:06.000Z"),
          pathname: "/a&b/",
        },
      ],
      "https://example.com"
    );

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(
      true
    );
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/a&amp;b/</loc>");
    expect(xml).toContain("<lastmod>2020-02-03</lastmod>");
    expect(xml.endsWith("\n")).toBe(true);
  });
});
