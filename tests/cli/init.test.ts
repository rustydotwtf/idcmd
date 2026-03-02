import { describe, expect, it } from "bun:test";
import {
  createTempDir,
  fileExists,
  joinPath,
  readTextFile,
} from "tests/test-utils";

interface InitResult {
  code: number;
  stderr: string;
  stdout: string;
}

const expectFile = async (path: string): Promise<void> => {
  expect(await fileExists(path)).toBe(true);
};

const runInitWithOutput = async (
  target: string,
  extraArgs: string[] = []
): Promise<InitResult> => {
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
      ...extraArgs,
    ],
    { stderr: "pipe", stdout: "pipe" }
  );

  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return { code, stderr, stdout };
};

const runInit = async (
  target: string,
  extraArgs: string[] = []
): Promise<number> => {
  const result = await runInitWithOutput(target, extraArgs);
  return result.code;
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

const assertStarterContent = async (target: string): Promise<void> => {
  const homeMarkdown = await readTextFile(
    joinPath(target, "content", "index.md")
  );
  expect(homeMarkdown.includes("# **My Docs**")).toBe(true);
  expect(homeMarkdown.includes("IDCMD_SITE_NAME")).toBe(false);
};

const assertGitignore = async (target: string): Promise<void> => {
  const gitignore = await readTextFile(joinPath(target, ".gitignore"));
  expect(gitignore.includes("public/")).toBe(true);
};

const assertNoLegacySiteDir = async (target: string): Promise<void> => {
  expect(await fileExists(joinPath(target, "site"))).toBe(false);
};

const assertNoProviderFiles = async (target: string): Promise<void> => {
  expect(await fileExists(joinPath(target, "vercel.json"))).toBe(false);
  expect(await fileExists(joinPath(target, "fly.toml"))).toBe(false);
  expect(await fileExists(joinPath(target, "railway.json"))).toBe(false);
  expect(await fileExists(joinPath(target, "Dockerfile"))).toBe(false);
  expect(await fileExists(joinPath(target, ".dockerignore"))).toBe(false);
};

const assertScaffolded = async (target: string): Promise<void> => {
  await assertRequiredFiles(target);
  await assertPackageJson(target);
  await assertSiteConfig(target);
  await assertClientLayout(target);
  await assertReadme(target);
  await assertStarterContent(target);
  await assertGitignore(target);
  await assertNoLegacySiteDir(target);
  await assertNoProviderFiles(target);
};

describe("cli init", () => {
  it("scaffolds the root layout with required files", async () => {
    const root = await createTempDir("idcmd-init-");
    const target = joinPath(root, "my-docs");

    const code = await runInit(target);
    expect(code).toBe(0);
    await assertScaffolded(target);
  });

  it("generates vercel config when --vercel is provided", async () => {
    const root = await createTempDir("idcmd-init-vercel-");
    const target = joinPath(root, "my-docs");

    expect(await runInit(target, ["--vercel"])).toBe(0);
    await expectFile(joinPath(target, "vercel.json"));
  });

  it("generates fly files when --fly is provided", async () => {
    const root = await createTempDir("idcmd-init-fly-");
    const target = joinPath(root, "my-docs");

    expect(await runInit(target, ["--fly"])).toBe(0);
    await expectFile(joinPath(target, "fly.toml"));
    await expectFile(joinPath(target, "Dockerfile"));
    await expectFile(joinPath(target, ".dockerignore"));
  });

  it("generates railway files when --railway is provided", async () => {
    const root = await createTempDir("idcmd-init-railway-");
    const target = joinPath(root, "my-docs");

    expect(await runInit(target, ["--railway"])).toBe(0);
    await expectFile(joinPath(target, "railway.json"));
    await expectFile(joinPath(target, "Dockerfile"));
    await expectFile(joinPath(target, ".dockerignore"));
  });

  it("fails with guidance when target directory is not empty", async () => {
    const target = await createTempDir("idcmd-init-non-empty-");
    await Bun.write(joinPath(target, "keep.txt"), "do not overwrite");

    const result = await runInitWithOutput(target);
    expect(result.code).toBe(1);

    const output = `${result.stdout}\n${result.stderr}`;
    expect(output.includes("Target directory is not empty")).toBe(true);
    expect(output.includes("idcmd init <new-directory>")).toBe(true);
  });
});
