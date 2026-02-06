import { describe, expect, it } from "bun:test";

import { renderLayout } from "@/layout";

describe("js policy", () => {
  it("does not include any scripts by default", () => {
    const html = renderLayout({
      content: "<p>hello</p>",
      currentPath: "/",
      navigation: [],
      title: "Test",
    });

    expect(html.includes("<script")).toBe(false);
  });
});
