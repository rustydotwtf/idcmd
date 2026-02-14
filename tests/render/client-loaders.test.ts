import { afterEach, describe, expect, it } from "bun:test";
import { createTempDir, joinPath, writeTextFile } from "tests/test-utils";

import type { ResolvedRightRailConfig } from "@/site/config";

import {
  getRenderLayout,
  resetLayoutLoaderForTests,
} from "@/render/layout-loader";
import {
  getRightRail,
  resetRightRailLoaderForTests,
} from "@/render/right-rail-loader";
import {
  getRenderSearchPageContent,
  resetSearchPageLoaderForTests,
} from "@/search/search-page-loader";

const ORIGINAL_CWD = process.cwd();

const RIGHT_RAIL_CONFIG: ResolvedRightRailConfig = {
  enabled: true,
  placement: "content",
  scrollSpy: {
    centerActiveItem: true,
    enabled: true,
    updateHash: "replace",
  },
  smoothScroll: true,
  tocLevels: [2, 3] as const,
  visibleFrom: "xl",
};

const seedClientFile = async (
  root: string,
  fileName: string,
  text: string
): Promise<void> => {
  await writeTextFile(joinPath(root, "src", "ui", fileName), text);
};

const withClientFile = async (
  prefix: string,
  fileName: string,
  text: string
): Promise<string> => {
  const root = await createTempDir(prefix);
  await seedClientFile(root, fileName, text);
  process.chdir(root);
  return root;
};

const fallbackLayoutHtml = async (): Promise<string> => {
  const renderLayout = await getRenderLayout();
  return renderLayout({
    content: "<h1>Fallback</h1>",
    currentPath: "/",
    navigation: [],
    rightRail: RIGHT_RAIL_CONFIG,
    siteName: "Docs",
    title: "Fallback",
    tocItems: [],
  });
};

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  resetLayoutLoaderForTests();
  resetRightRailLoaderForTests();
  resetSearchPageLoaderForTests();
});

describe("client loaders", () => {
  it("loads custom layout from src/ui/layout.tsx", async () => {
    await withClientFile(
      "idcmd-layout-loader-",
      "layout.tsx",
      [
        "export const renderLayout = (props) =>",
        '  "<!DOCTYPE html><html><body>" + props.title + "</body></html>";\n',
      ].join("\n")
    );

    const renderLayout = await getRenderLayout();
    const html = renderLayout({
      content: "",
      currentPath: "/",
      navigation: [],
      rightRail: RIGHT_RAIL_CONFIG,
      siteName: "Docs",
      title: "Custom Layout",
      tocItems: [],
    });

    expect(html.includes("Custom Layout")).toBe(true);
    expect(html.includes("<!DOCTYPE html>")).toBe(true);
  });

  it("loads custom right rail from src/ui/right-rail.tsx", async () => {
    await withClientFile(
      "idcmd-right-rail-loader-",
      "right-rail.tsx",
      "export const RightRail = () => null;\n"
    );

    const RightRail = await getRightRail();
    const node = RightRail({
      currentPath: "/",
      rightRailConfig: RIGHT_RAIL_CONFIG,
      tocItems: [],
    });

    expect(node).toBe(null);
  });

  it("loads custom search-page renderer from src/ui/search-page.tsx", async () => {
    await withClientFile(
      "idcmd-search-page-loader-",
      "search-page.tsx",
      [
        "export const renderSearchPageContent = ({ query }) =>",
        '  "<section data-custom-search=\\"1\\">" + query + "</section>";\n',
      ].join("\n")
    );

    const renderSearchPageContent = await getRenderSearchPageContent();
    const html = renderSearchPageContent({
      minQueryLength: 2,
      query: "hello",
      results: [],
      topPages: [],
    });

    expect(html).toContain('data-custom-search="1"');
    expect(html).toContain("hello");
  });

  it("falls back to built-in layout when user export is missing", async () => {
    await withClientFile(
      "idcmd-layout-fallback-",
      "layout.tsx",
      'export const notRenderLayout = () => "ignored";\n'
    );

    expect(await fallbackLayoutHtml()).toContain("<!DOCTYPE html>");
  });

  it("falls back to built-in right rail when user export is missing", async () => {
    await withClientFile(
      "idcmd-right-rail-fallback-",
      "right-rail.tsx",
      "export const NotRightRail = () => null;\n"
    );

    const RightRail = await getRightRail();
    expect(
      RightRail({
        currentPath: "/",
        rightRailConfig: RIGHT_RAIL_CONFIG,
        tocItems: [],
      })
    ).not.toBe(null);
  });

  it("falls back to built-in search page renderer when user export is missing", async () => {
    await withClientFile(
      "idcmd-search-fallback-",
      "search-page.tsx",
      'export const notRenderSearchPageContent = () => "ignored";\n'
    );

    const renderSearchPageContent = await getRenderSearchPageContent();
    const html = renderSearchPageContent({
      minQueryLength: 2,
      query: "a",
      results: [],
      topPages: [],
    });

    expect(html).toContain("Type at least");
  });
});
