import { describe, expect, it } from "bun:test";
import {
  createTempDir,
  fileExists,
  joinPath,
  readTextFile,
} from "tests/test-utils";

const expectFile = async (path: string): Promise<void> => {
  expect(await fileExists(path)).toBe(true);
};

const runInit = (target: string): Promise<number> => {
  const proc = Bun.spawn(
    [
      process.execPath,
      "src/cli.ts",
      "init",
      target,
      "--yes",
      "--name",
      "My Docs",
      "--description",
      "Test description",
      "--port",
      "4001",
      "--no-git",
    ],
    { stderr: "pipe", stdout: "pipe" }
  );

  return proc.exited;
};

const assertRequiredFiles = async (target: string): Promise<void> => {
  const requiredFiles = [
    joinPath(target, ".gitignore"),
    joinPath(target, ".oxlintrc.json"),
    joinPath(target, ".oxfmtrc.jsonc"),
    joinPath(target, ".github", "workflows", "ci.yml"),
    joinPath(target, "package.json"),
    joinPath(target, "scripts", "check.ts"),
    joinPath(target, "scripts", "check-internal.ts"),
    joinPath(target, "scripts", "smoke.ts"),
    joinPath(target, "vercel.json"),
    joinPath(target, "site.jsonc"),
    joinPath(target, "src", "ui", "layout.tsx"),
    joinPath(target, "src", "ui", "right-rail.tsx"),
    joinPath(target, "src", "ui", "search-page.tsx"),
    joinPath(target, "src", "runtime", "live-reload.ts"),
    joinPath(target, "src", "runtime", "llm-menu.ts"),
    joinPath(target, "src", "runtime", "nav-prefetch.ts"),
    joinPath(target, "src", "runtime", "right-rail-scrollspy.ts"),
    joinPath(target, "src", "routes", "api", "hello.ts"),
    joinPath(target, "src", "server.ts"),
    joinPath(target, "content", "index.md"),
    joinPath(target, "assets", "favicon.svg"),
    joinPath(target, "assets", "icons", "home.svg"),
    joinPath(target, "styles", "tailwind.css"),
  ];

  for (const file of requiredFiles) {
    await expectFile(file);
  }
};

const assertPackageJson = async (target: string): Promise<void> => {
  const pkg = await readTextFile(joinPath(target, "package.json"));
  expect(pkg.includes('"name": "my-docs"')).toBe(true);
  expect(pkg.includes('"dev": "idcmd dev --port 4001"')).toBe(true);
  expect(pkg.includes('"check": "bun run scripts/check.ts"')).toBe(true);
  expect(pkg.includes('"smoke": "bun run scripts/smoke.ts"')).toBe(true);
};

const assertSiteConfig = async (target: string): Promise<void> => {
  const siteConfig = await readTextFile(joinPath(target, "site.jsonc"));
  expect(siteConfig.includes('"name": "My Docs"')).toBe(true);
  expect(siteConfig.includes('"description": "Test description"')).toBe(true);
  expect(siteConfig.includes('// "baseUrl": "https://example.com",')).toBe(
    true
  );
};

const assertClientLayout = async (target: string): Promise<void> => {
  const layoutClient = await readTextFile(
    joinPath(target, "src", "ui", "layout.tsx")
  );
  expect(
    layoutClient.includes('import type { LayoutProps } from "idcmd/client"')
  ).toBe(true);
  expect(layoutClient.includes("export const renderLayout")).toBe(true);
};

const assertReadme = async (target: string): Promise<void> => {
  const readme = await readTextFile(joinPath(target, "README.md"));
  expect(readme.includes("My Docs")).toBe(true);
  expect(readme.includes("intentionally opinionated for AI-friendly")).toBe(
    true
  );
};

const assertGitignore = async (target: string): Promise<void> => {
  const gitignore = await readTextFile(joinPath(target, ".gitignore"));
  expect(gitignore.includes("public/")).toBe(true);
};

const assertNoLegacySiteDir = async (target: string): Promise<void> => {
  expect(await fileExists(joinPath(target, "site"))).toBe(false);
};

const assertScaffolded = async (target: string): Promise<void> => {
  await assertRequiredFiles(target);
  await assertPackageJson(target);
  await assertSiteConfig(target);
  await assertClientLayout(target);
  await assertReadme(target);
  await assertGitignore(target);
  await assertNoLegacySiteDir(target);
};

describe("cli init", () => {
  it("scaffolds the root layout with required files", async () => {
    const root = await createTempDir("idcmd-init-");
    const target = joinPath(root, "my-docs");

    const code = await runInit(target);
    expect(code).toBe(0);
    await assertScaffolded(target);
  });
});
