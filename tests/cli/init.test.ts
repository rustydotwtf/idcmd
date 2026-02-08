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

const assertScaffolded = async (target: string): Promise<void> => {
  const requiredFiles = [
    joinPath(target, "package.json"),
    joinPath(target, "vercel.json"),
    joinPath(target, "site", "site.jsonc"),
    joinPath(target, "site", "content", "index.md"),
    joinPath(target, "site", "styles", "tailwind.css"),
    joinPath(target, "site", "public", "_idcmd", "live-reload.js"),
  ];
  for (const file of requiredFiles) {
    await expectFile(file);
  }

  const pkg = await readTextFile(joinPath(target, "package.json"));
  expect(pkg.includes('"name": "my-docs"')).toBe(true);
  expect(pkg.includes('"dev": "idcmd dev --port 4001"')).toBe(true);

  const siteConfig = await readTextFile(joinPath(target, "site", "site.jsonc"));
  expect(siteConfig.includes('"name": "My Docs"')).toBe(true);
  expect(siteConfig.includes('"description": "Test description"')).toBe(true);
  expect(siteConfig.includes('// "baseUrl": "https://example.com",')).toBe(
    true
  );
};

describe("cli init", () => {
  it("scaffolds the site/ layout with required files", async () => {
    const root = await createTempDir("idcmd-init-");
    const target = joinPath(root, "my-docs");

    const code = await runInit(target);
    expect(code).toBe(0);
    await assertScaffolded(target);
  });
});
