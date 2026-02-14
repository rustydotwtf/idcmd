import { describe, expect, it } from "bun:test";
import {
  createTempDir,
  fileExists,
  joinPath,
  readTextFile,
  writeTextFile,
} from "tests/test-utils";

const CLI_ENTRY = Bun.fileURLToPath(
  new URL("../../src/cli.ts", import.meta.url)
);

const runCli = (
  args: string[],
  options: { cwd?: string } = {}
): Promise<number> => {
  const proc = Bun.spawn([process.execPath, CLI_ENTRY, ...args], {
    cwd: options.cwd,
    stderr: "pipe",
    stdout: "pipe",
  });
  return proc.exited;
};

const deleteFile = async (path: string): Promise<void> => {
  const proc = Bun.spawn(["rm", "-f", path], {
    stderr: "ignore",
    stdout: "ignore",
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`Failed to delete file: ${path}`);
  }
};

const scaffoldProject = async (): Promise<string> => {
  const root = await createTempDir("idcmd-client-");
  const target = joinPath(root, "sample-site");
  const code = await runCli(["init", target, "--yes", "--no-git"]);
  expect(code).toBe(0);
  return target;
};

describe("cli client", () => {
  it("adds missing local client files from templates", async () => {
    const target = await scaffoldProject();
    const rightRailPath = joinPath(target, "site", "client", "right-rail.tsx");

    await deleteFile(rightRailPath);
    expect(await fileExists(rightRailPath)).toBe(false);

    const code = await runCli(["client", "add", "right-rail"], { cwd: target });
    expect(code).toBe(0);

    expect(await fileExists(rightRailPath)).toBe(true);
    const text = await readTextFile(rightRailPath);
    expect(text.includes("export const RightRail")).toBe(true);
  });

  it("supports dry-run updates without overwriting files", async () => {
    const target = await scaffoldProject();
    const searchPagePath = joinPath(
      target,
      "site",
      "client",
      "search-page.tsx"
    );

    await writeTextFile(searchPagePath, "// local customization\n");
    const dryRunCode = await runCli(
      ["client", "update", "search-page", "--dry-run"],
      { cwd: target }
    );
    expect(dryRunCode).toBe(0);

    const afterDryRun = await readTextFile(searchPagePath);
    expect(afterDryRun).toBe("// local customization\n");
  });

  it("requires --yes before overwriting local client files", async () => {
    const target = await scaffoldProject();
    const layoutPath = joinPath(target, "site", "client", "layout.tsx");

    await writeTextFile(layoutPath, "// custom layout\n");

    const noConfirmCode = await runCli(["client", "update", "layout"], {
      cwd: target,
    });
    expect(noConfirmCode).toBe(1);
    expect(await readTextFile(layoutPath)).toBe("// custom layout\n");

    const confirmedCode = await runCli(
      ["client", "update", "layout", "--yes"],
      { cwd: target }
    );
    expect(confirmedCode).toBe(0);

    const updated = await readTextFile(layoutPath);
    expect(updated.includes("export const renderLayout")).toBe(true);
  });

  it("adds missing runtime files from templates", async () => {
    const target = await scaffoldProject();
    const runtimePath = joinPath(
      target,
      "site",
      "client",
      "runtime",
      "nav-prefetch.ts"
    );

    await deleteFile(runtimePath);
    expect(await fileExists(runtimePath)).toBe(false);

    const code = await runCli(["client", "add", "runtime"], { cwd: target });
    expect(code).toBe(0);

    expect(await fileExists(runtimePath)).toBe(true);
    const text = await readTextFile(runtimePath);
    expect(text.includes("data-prefetch")).toBe(true);
  });

  it("requires --yes before overwriting runtime files", async () => {
    const target = await scaffoldProject();
    const runtimePath = joinPath(
      target,
      "site",
      "client",
      "runtime",
      "llm-menu.ts"
    );

    await writeTextFile(runtimePath, "// custom runtime\n");

    const noConfirmCode = await runCli(["client", "update", "runtime"], {
      cwd: target,
    });
    expect(noConfirmCode).toBe(1);
    expect(await readTextFile(runtimePath)).toBe("// custom runtime\n");

    const confirmedCode = await runCli(
      ["client", "update", "runtime", "--yes"],
      { cwd: target }
    );
    expect(confirmedCode).toBe(0);

    const updated = await readTextFile(runtimePath);
    expect(updated.includes("initCopyMarkdownButtons")).toBe(true);
  });
});
