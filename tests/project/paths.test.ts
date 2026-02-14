import { describe, expect, it } from "bun:test";
import { createTempDir, joinPath } from "tests/test-utils";

import { resolveProjectPaths } from "@/project/paths";

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
});
