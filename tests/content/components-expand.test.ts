import { describe, expect, it } from "bun:test";

import { expandMarkdownForAgent } from "@/content/components/expand";

describe("doc components expand (agent markdown)", () => {
  it("expands InstallTabs into plain markdown and preserves frontmatter", async () => {
    const input = [
      "---",
      "title: Install",
      "---",
      "",
      "# Install",
      "",
      '<InstallTabs pkg="zod" />',
      "",
    ].join("\n");

    const expanded = await expandMarkdownForAgent(input, {
      currentPath: "/install/",
      instanceId: "test:agent",
      isDev: false,
      slug: "install",
    });

    expect(expanded.includes("title: Install")).toBe(true);
    expect(expanded.includes("<InstallTabs")).toBe(false);
    expect(expanded.includes("### npm")).toBe(true);
    expect(expanded.includes("npm i zod")).toBe(true);
    expect(expanded.includes("pnpm add zod")).toBe(true);
    expect(expanded.includes("bun add zod")).toBe(true);
    expect(expanded.includes("yarn add zod")).toBe(true);
  });

  it("does not expand component tags inside fenced code blocks", async () => {
    const input = [
      "# Example",
      "",
      "```md",
      '<InstallTabs pkg="zod" />',
      "```",
      "",
    ].join("\n");

    const expanded = await expandMarkdownForAgent(input, {
      currentPath: "/example/",
      instanceId: "test:fence",
      isDev: false,
      slug: "example",
    });

    expect(expanded.includes('<InstallTabs pkg="zod" />')).toBe(true);
    expect(expanded.includes("### npm")).toBe(false);
  });

  it("throws in non-dev mode when a component has invalid props", async () => {
    const input = ['<InstallTabs pkg={"zod"} />', ""].join("\n");

    await expect(
      expandMarkdownForAgent(input, {
        currentPath: "/bad/",
        instanceId: "test:bad",
        isDev: false,
        slug: "bad",
      })
    ).rejects.toThrow();
  });

  it("renders a visible error in dev mode when a component has invalid props", async () => {
    const input = ['<InstallTabs pkg={"zod"} />', ""].join("\n");

    const expanded = await expandMarkdownForAgent(input, {
      currentPath: "/bad/",
      instanceId: "test:bad-dev",
      isDev: true,
      slug: "bad",
    });

    expect(expanded.includes("Doc component error")).toBe(true);
  });
});
