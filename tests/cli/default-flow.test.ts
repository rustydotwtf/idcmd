import { describe, expect, it } from "bun:test";
import { createTempDir, joinPath, readTextFile } from "tests/test-utils";

const CLI_ENTRY = Bun.fileURLToPath(
  new URL("../../src/cli.ts", import.meta.url)
);
const REPO_ROOT = Bun.fileURLToPath(new URL("../../", import.meta.url));
const BASE_URL = "http://127.0.0.1:4000";
const READY_TIMEOUT_MS = 60_000;
const READY_INTERVAL_MS = 500;
const SHUTDOWN_TIMEOUT_MS = 5000;

interface CommandResult {
  code: number;
  stderr: string;
  stdout: string;
}

interface DevProcess {
  proc: ReturnType<typeof Bun.spawn>;
  stderr: Promise<string>;
  stdout: Promise<string>;
}

const runCommand = async (
  command: string[],
  options: { cwd?: string } = {}
): Promise<CommandResult> => {
  const proc = Bun.spawn(command, {
    cwd: options.cwd,
    stderr: "pipe",
    stdout: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, stderr, stdout };
};

const runCli = (args: string[], cwd = REPO_ROOT): Promise<CommandResult> =>
  runCommand([process.execPath, CLI_ENTRY, ...args], { cwd });

const runCurl = (path: string, cwd: string): Promise<CommandResult> =>
  runCommand(["curl", "-fsS", "--max-time", "5", `${BASE_URL}${path}`], {
    cwd,
  });

const normalized = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  return "(empty)";
};

const assertSuccess = (label: string, result: CommandResult): void => {
  expect(
    result.code,
    [
      `${label} failed.`,
      "stdout:",
      normalized(result.stdout),
      "stderr:",
      normalized(result.stderr),
    ].join("\n")
  ).toBe(0);
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const pointScaffoldedProjectToLocalIdcmd = async (
  target: string
): Promise<void> => {
  const pkgPath = joinPath(target, "package.json");
  const pkg = JSON.parse(await readTextFile(pkgPath)) as {
    dependencies?: Record<string, string>;
  };
  pkg.dependencies = {
    ...pkg.dependencies,
    idcmd: `file:${REPO_ROOT}`,
  };
  await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
};

const waitForReady = async (cwd: string): Promise<void> => {
  const startedAt = Date.now();
  let lastFailure = "(no attempts yet)";

  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    const response = await runCurl("/", cwd);
    if (response.code === 0) {
      return;
    }
    lastFailure = normalized(response.stderr) || normalized(response.stdout);
    await Bun.sleep(READY_INTERVAL_MS);
  }

  throw new Error(
    `dev server did not become ready within ${String(
      READY_TIMEOUT_MS
    )}ms. Last curl failure: ${lastFailure}`
  );
};

const stopDev = async (proc: ReturnType<typeof Bun.spawn>): Promise<void> => {
  try {
    proc.kill("SIGTERM");
  } catch {
    return;
  }

  const didExit = await Promise.race([
    proc.exited.then(() => true),
    Bun.sleep(SHUTDOWN_TIMEOUT_MS).then(() => false),
  ]);
  if (didExit) {
    return;
  }
  try {
    proc.kill("SIGKILL");
  } catch {
    // ignore
  }
  await proc.exited;
};

const assertContains = (args: {
  label: string;
  needle: string;
  text: string;
}): void => {
  expect(
    args.text.includes(args.needle),
    `${args.label} missing ${args.needle}`
  ).toBe(true);
};

const assertAboutResponse = (text: string): void => {
  const hasHeading = text.includes("# About");
  if (hasHeading) {
    return;
  }
  assertContains({ label: "/about/", needle: ">About<", text });
};

const assertApiResponse = (text: string): void => {
  const payload = JSON.parse(text) as {
    message?: string;
    ok?: boolean;
  };
  expect(payload.ok).toBe(true);
  expect(payload.message).toBe("Hello from idcmd route!");
};

const assertHomeEndpoint = async (target: string): Promise<void> => {
  const home = await runCurl("/", target);
  assertSuccess("curl /", home);
  assertContains({ label: "/", needle: "<html", text: home.stdout });
};

const assertAboutEndpoint = async (target: string): Promise<void> => {
  const about = await runCurl("/about/", target);
  assertSuccess("curl /about/", about);
  assertAboutResponse(about.stdout);
};

const assertLlmsEndpoint = async (target: string): Promise<void> => {
  const llms = await runCurl("/llms.txt", target);
  assertSuccess("curl /llms.txt", llms);
  expect(llms.stdout.trim().length).toBeGreaterThan(0);
  assertContains({ label: "/llms.txt", needle: "about.md", text: llms.stdout });
};

const assertApiEndpoint = async (target: string): Promise<void> => {
  const api = await runCurl("/api/hello", target);
  assertSuccess("curl /api/hello", api);
  assertApiResponse(api.stdout);
};

const assertEndpoints = async (target: string): Promise<void> => {
  await assertHomeEndpoint(target);
  await assertAboutEndpoint(target);
  await assertLlmsEndpoint(target);
  await assertApiEndpoint(target);
};

const assertCheckPasses = async (
  target: string,
  label = "bun run check"
): Promise<void> => {
  assertSuccess(
    label,
    await runCommand([process.execPath, "run", "check"], { cwd: target })
  );
};

const scaffoldInstallAndCheck = async (): Promise<string> => {
  const root = await createTempDir("idcmd-default-flow-");
  const target = joinPath(root, "sample-site");

  assertSuccess(
    "idcmd init --yes",
    await runCli(["init", target, "--yes", "--no-git"])
  );

  await pointScaffoldedProjectToLocalIdcmd(target);
  assertSuccess(
    "bun install",
    await runCommand(["bun", "install"], { cwd: target })
  );
  await assertCheckPasses(target);

  return target;
};

const startDev = (cwd: string): DevProcess => {
  const proc = Bun.spawn([process.execPath, "run", "dev"], {
    cwd,
    stderr: "pipe",
    stdout: "pipe",
  });
  return {
    proc,
    stderr: new Response(proc.stderr).text(),
    stdout: new Response(proc.stdout).text(),
  };
};

const withDevLogs = async (error: unknown, dev: DevProcess): Promise<Error> => {
  const stdout = await dev.stdout;
  const stderr = await dev.stderr;
  return new Error(
    [
      toErrorMessage(error),
      "dev stdout:",
      normalized(stdout),
      "dev stderr:",
      normalized(stderr),
    ].join("\n")
  );
};

describe("cli default flow", () => {
  it("scaffolds, installs, checks, runs dev, and serves core endpoints", async () => {
    const target = await scaffoldInstallAndCheck();
    const dev = startDev(target);

    try {
      await waitForReady(target);
      await assertEndpoints(target);
    } catch (error) {
      throw await withDevLogs(error, dev);
    } finally {
      await stopDev(dev.proc);
    }

    await assertCheckPasses(target, "bun run check (post-dev)");
  }, 240_000);
});
