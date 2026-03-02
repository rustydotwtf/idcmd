import { describe, expect, it } from "bun:test";
import { createTempDir, writeTextFile } from "tests/test-utils";

const CLI_ENTRY = Bun.fileURLToPath(
  new URL("../../src/cli.ts", import.meta.url)
);
const READY_TIMEOUT_MS = 10_000;
const READY_INTERVAL_MS = 100;
const SHUTDOWN_TIMEOUT_MS = 5000;
const PROCESS_ALIVE_CHECK_MS = 250;

interface CommandResult {
  code: number;
  stderr: string;
  stdout: string;
}

interface PreviewProcess {
  proc: ReturnType<typeof Bun.spawn>;
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

const runCli = (args: string[], cwd: string): Promise<CommandResult> =>
  runCommand([process.execPath, CLI_ENTRY, ...args], { cwd });

const pickPort = (): number => 45_000 + Math.floor(Math.random() * 5000);

const writePreviewFixture = async (target: string): Promise<void> => {
  await writeTextFile(
    `${target}/public/index.html`,
    "<!doctype html><html><body>home-page</body></html>"
  );
  await writeTextFile(
    `${target}/public/about/index.html`,
    "<!doctype html><html><body>about-page</body></html>"
  );
  await writeTextFile(
    `${target}/public/404.html`,
    "<!doctype html><html><body>custom-404</body></html>"
  );
  await writeTextFile(`${target}/public/styles.css`, ":root { --fixture: 1; }");
};

const startPreview = (cwd: string, port: number): PreviewProcess => {
  const proc = Bun.spawn(
    [process.execPath, CLI_ENTRY, "preview", "--port", String(port)],
    {
      cwd,
      stderr: "pipe",
      stdout: "pipe",
    }
  );

  return { proc };
};

const fetchManual = (url: string): Promise<Response> =>
  fetch(url, { redirect: "manual" });

const tryFetchRootStatus = async (origin: string): Promise<number | null> => {
  try {
    const response = await fetchManual(`${origin}/`);
    return response.status;
  } catch {
    return null;
  }
};

const waitForReady = async (origin: string): Promise<void> => {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (true) {
    const status = await tryFetchRootStatus(origin);
    if (status === 200) {
      return;
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `preview server did not become ready within ${String(
          READY_TIMEOUT_MS
        )}ms. Last status: ${String(status ?? 0)}`
      );
    }

    await Bun.sleep(READY_INTERVAL_MS);
  }
};

const waitForExitWithin = (
  proc: ReturnType<typeof Bun.spawn>,
  timeoutMs: number
): Promise<boolean> => {
  const exitedPromise = (async (): Promise<boolean> => {
    await proc.exited;
    return true;
  })();
  const timeoutPromise = (async (): Promise<boolean> => {
    await Bun.sleep(timeoutMs);
    return false;
  })();
  return Promise.race([exitedPromise, timeoutPromise]);
};

const stopProcess = async (
  proc: ReturnType<typeof Bun.spawn>
): Promise<void> => {
  try {
    proc.kill("SIGTERM");
  } catch {
    return;
  }

  const exited = await waitForExitWithin(proc, SHUTDOWN_TIMEOUT_MS);
  if (exited) {
    return;
  }

  try {
    proc.kill("SIGKILL");
  } catch {
    // ignore
  }

  await proc.exited;
};

const isAlive = async (
  proc: ReturnType<typeof Bun.spawn>
): Promise<boolean> => {
  const exited = await waitForExitWithin(proc, PROCESS_ALIVE_CHECK_MS);
  return !exited;
};

const assertHomePage = async (origin: string): Promise<void> => {
  const home = await fetchManual(`${origin}/`);
  expect(home.status).toBe(200);
  const homeText = await home.text();
  expect(homeText.includes("home-page")).toBe(true);
};

const assertAboutRedirect = async (origin: string): Promise<void> => {
  const aboutRedirect = await fetchManual(`${origin}/about`);
  expect(aboutRedirect.status).toBe(308);
  expect(aboutRedirect.headers.get("location")).toBe("/about/");
};

const assertAboutPage = async (origin: string): Promise<void> => {
  const about = await fetchManual(`${origin}/about/`);
  expect(about.status).toBe(200);
  const aboutText = await about.text();
  expect(aboutText.includes("about-page")).toBe(true);
};

const assertStylesheet = async (origin: string): Promise<void> => {
  const stylesheet = await fetchManual(`${origin}/styles.css`);
  expect(stylesheet.status).toBe(200);
  const stylesheetText = await stylesheet.text();
  expect(stylesheetText.includes("--fixture")).toBe(true);
};

const assertMissingPage = async (origin: string): Promise<void> => {
  const missing = await fetchManual(`${origin}/missing/`);
  expect(missing.status).toBe(404);
  const missingText = await missing.text();
  expect(missingText.includes("custom-404")).toBe(true);
};

const assertPreviewRoutes = async (origin: string): Promise<void> => {
  await assertHomePage(origin);
  await assertAboutRedirect(origin);
  await assertAboutPage(origin);
  await assertStylesheet(origin);
  await assertMissingPage(origin);
};

describe("cli preview", () => {
  it("serves static output and stays alive until terminated", async () => {
    const target = await createTempDir("idcmd-preview-");
    await writePreviewFixture(target);

    const port = pickPort();
    const origin = `http://127.0.0.1:${String(port)}`;
    const preview = startPreview(target, port);

    try {
      await waitForReady(origin);
      expect(await isAlive(preview.proc)).toBe(true);
      await assertPreviewRoutes(origin);
    } finally {
      await stopProcess(preview.proc);
    }
  });

  it("fails when public/index.html is missing", async () => {
    const target = await createTempDir("idcmd-preview-missing-");
    const result = await runCli(
      ["preview", "--port", String(pickPort())],
      target
    );

    expect(result.code).toBe(1);
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output.includes("public/ not found. Run `idcmd build` first.")).toBe(
      true
    );
  });
});
