import { parsePort } from "@/cli/normalize";

const DEFAULT_PORT = 4000;

export interface DevFlags {
  port?: string;
}

const findTailwindInput = async (): Promise<string> => {
  const candidates = ["site/styles/tailwind.css", "content/styles.css"];
  for (const path of candidates) {
    // eslint-disable-next-line no-await-in-loop
    if (await Bun.file(path).exists()) {
      return path;
    }
  }
  throw new Error(
    "Could not find Tailwind input. Expected site/styles/tailwind.css (new layout) or content/styles.css (legacy)."
  );
};

const resolveTailwindOutput = async (): Promise<string> => {
  const hasSite = await Bun.file("site/site.jsonc").exists();
  return hasSite ? "site/public/styles.css" : "public/styles.css";
};

const idcmdServerEntry = (): string =>
  Bun.fileURLToPath(new URL("../server.ts", import.meta.url));

const installSignalHandlers = (shutdown: () => void): void => {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

export const devCommand = async (flags: DevFlags): Promise<number> => {
  const port = parsePort(flags.port, DEFAULT_PORT);
  const tailwindInput = await findTailwindInput();
  const tailwindOutput = await resolveTailwindOutput();

  const cssProc = Bun.spawn(
    [
      "bunx",
      "@tailwindcss/cli",
      "-i",
      tailwindInput,
      "-o",
      tailwindOutput,
      "--watch",
    ],
    { stderr: "inherit", stdout: "inherit" }
  );

  const serverProc = Bun.spawn(["bun", "--hot", idcmdServerEntry()], {
    env: { ...process.env, NODE_ENV: "development", PORT: String(port) },
    stderr: "inherit",
    stdout: "inherit",
  });

  const shutdown = (): void => {
    try {
      cssProc.kill("SIGTERM");
    } catch {
      // ignore
    }
    try {
      serverProc.kill("SIGTERM");
    } catch {
      // ignore
    }
  };

  installSignalHandlers(shutdown);

  const [cssExit, serverExit] = await Promise.all([
    cssProc.exited,
    serverProc.exited,
  ]);
  return serverExit === 0 ? cssExit : serverExit;
};
