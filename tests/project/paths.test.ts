import { describe, expect, it } from "bun:test";
import {
  createTempDir,
  ensureDir,
  joinPath,
  writeTextFile,
} from "tests/test-utils";

import { resolveProjectPaths } from "@/project/paths";

describe("project paths", () => {
  it("uses legacy layout when site/site.jsonc is missing", async () => {
    const dir = await createTempDir("idcmd-paths-legacy-");
    await ensureDir(joinPath(dir, "content"));
    await ensureDir(joinPath(dir, "public"));
    await ensureDir(joinPath(dir, "icons"));

    const paths = await resolveProjectPaths({ cwd: dir });
    const assertions: [unknown, unknown][] = [
      [paths.siteDir, null],
      [paths.contentDir, joinPath(dir, "content")],
      [paths.publicDir, joinPath(dir, "public")],
      [paths.iconsDir, joinPath(dir, "icons")],
      [paths.siteConfigPath, joinPath(dir, "site.jsonc")],
      [paths.distDir, joinPath(dir, "dist")],
    ];
    for (const [actual, expected] of assertions) {
      expect(actual).toBe(expected);
    }
  });

  it("uses site/ layout when site/site.jsonc exists", async () => {
    const dir = await createTempDir("idcmd-paths-site-");
    await writeTextFile(
      joinPath(dir, "site", "site.jsonc"),
      '{ "name": "x", "description": "" }'
    );

    const paths = await resolveProjectPaths({ cwd: dir });
    const assertions: [unknown, unknown][] = [
      [paths.siteDir, joinPath(dir, "site")],
      [paths.contentDir, joinPath(dir, "site", "content")],
      [paths.publicDir, joinPath(dir, "site", "public")],
      [paths.iconsDir, joinPath(dir, "site", "icons")],
      [paths.siteConfigPath, joinPath(dir, "site", "site.jsonc")],
      [paths.distDir, joinPath(dir, "dist")],
    ];
    for (const [actual, expected] of assertions) {
      expect(actual).toBe(expected);
    }
  });
});
