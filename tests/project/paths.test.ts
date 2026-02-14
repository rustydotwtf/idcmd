import { afterEach, describe, expect, it } from "bun:test";
import { createTempDir, joinPath } from "tests/test-utils";

import { getProjectPaths, resolveProjectPaths } from "@/project/paths";

const ORIGINAL_CWD = process.cwd();
const normalizeTmpRealpath = (path: string): string =>
  path.startsWith("/private/") ? path.slice("/private".length) : path;

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
});

describe("project paths", () => {
  it("always resolves to site/ layout paths", async () => {
    const dir = await createTempDir("idcmd-paths-site-");

    const paths = await resolveProjectPaths({ cwd: dir });
    const assertions: [unknown, unknown][] = [
      [paths.siteDir, joinPath(dir, "site")],
      [paths.contentDir, joinPath(dir, "site", "content")],
      [paths.publicDir, joinPath(dir, "site", "assets")],
      [paths.iconsDir, joinPath(dir, "site", "assets", "icons")],
      [paths.routesDir, joinPath(dir, "site", "code", "routes")],
      [paths.siteConfigPath, joinPath(dir, "site", "site.jsonc")],
      [paths.distDir, joinPath(dir, "dist")],
    ];
    for (const [actual, expected] of assertions) {
      expect(actual).toBe(expected);
    }
  });

  it("refreshes cached paths when cwd changes", async () => {
    const firstDir = await createTempDir("idcmd-paths-cwd-a-");
    const secondDir = await createTempDir("idcmd-paths-cwd-b-");

    process.chdir(firstDir);
    const firstPaths = await getProjectPaths();
    expect(normalizeTmpRealpath(firstPaths.contentDir)).toBe(
      normalizeTmpRealpath(joinPath(firstDir, "site", "content"))
    );

    process.chdir(secondDir);
    const secondPaths = await getProjectPaths();
    expect(normalizeTmpRealpath(secondPaths.contentDir)).toBe(
      normalizeTmpRealpath(joinPath(secondDir, "site", "content"))
    );
  });
});
