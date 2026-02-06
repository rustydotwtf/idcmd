import { describe, expect, it } from "bun:test";

import { renderLayout } from "@/render/layout";
import { resolveRightRailConfig } from "@/site/config";

describe("js policy", () => {
  it("does not include any scripts by default", () => {
    const rightRail = resolveRightRailConfig();
    const html = renderLayout({
      content: "<p>hello</p>",
      currentPath: "/",
      navigation: [],
      rightRail,
      siteName: "Test",
      title: "Test",
      tocItems: [],
    });

    expect(html.includes("<script")).toBe(false);
  });
});
