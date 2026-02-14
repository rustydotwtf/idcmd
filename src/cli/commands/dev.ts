import { parsePort } from "../normalize";
import {
  compileRuntimeAssetsOnce,
  watchRuntimeAssets,
} from "../runtime-assets";

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
  // `src/server.ts` lives two levels up from `src/cli/commands/*`.
  Bun.fileURLToPath(new URL("../../server.ts", import.meta.url));

const installSignalHandlers = (shutdown: () => void): void => {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

const spawnCssProcess = (
  tailwindInput: string,
  tailwindOutput: string
): ReturnType<typeof Bun.spawn> =>
  Bun.spawn(
    [
      "bunx",
      "@tailwindcss/cli",
      "-i",
      tailwindInput,
      "-o",
      tailwindOutput,
      // Tailwind v4 exits watch mode when stdin is closed unless `always` is specified.
      "--watch=always",
    ],
    { stderr: "inherit", stdout: "inherit" }
  );

const spawnServerProcess = (port: number): ReturnType<typeof Bun.spawn> =>
  Bun.spawn(["bun", "--hot", idcmdServerEntry()], {
    env: { ...process.env, NODE_ENV: "development", PORT: String(port) },
    stderr: "inherit",
    stdout: "inherit",
  });

const ensureRuntimeAssetsReady = async (): Promise<{
  runtimeProc: ReturnType<typeof Bun.spawn> | null;
  runtimeSetupCode: number;
}> => {
  const runtimeCode = await compileRuntimeAssetsOnce();
  if (runtimeCode !== 0) {
    return { runtimeProc: null, runtimeSetupCode: runtimeCode };
  }

  return {
    runtimeProc: await watchRuntimeAssets(),
    runtimeSetupCode: 0,
  };
};

const killProcess = (proc: ReturnType<typeof Bun.spawn> | null): void => {
  if (!proc) {
    return;
  }
  try {
    proc.kill("SIGTERM");
  } catch {
    // ignore
  }
};

const resolveDevExitCode = (args: {
  cssExit: number;
  runtimeExit: number;
  serverExit: number;
}): number => {
  if (args.serverExit !== 0) {
    return args.serverExit;
  }
  if (args.cssExit !== 0) {
    return args.cssExit;
  }
  return args.runtimeExit;
};

const installDevSignalHandlers = (args: {
  cssProc: ReturnType<typeof Bun.spawn>;
  runtimeProc: ReturnType<typeof Bun.spawn> | null;
  serverProc: ReturnType<typeof Bun.spawn>;
}): void => {
  installSignalHandlers(() => {
    killProcess(args.cssProc);
    killProcess(args.serverProc);
    killProcess(args.runtimeProc);
  });
};

const waitForDevExit = async (args: {
  cssProc: ReturnType<typeof Bun.spawn>;
  runtimeProc: ReturnType<typeof Bun.spawn> | null;
  serverProc: ReturnType<typeof Bun.spawn>;
}): Promise<{ cssExit: number; runtimeExit: number; serverExit: number }> => {
  const [cssExit, serverExit, runtimeExit] = await Promise.all([
    args.cssProc.exited,
    args.serverProc.exited,
    args.runtimeProc?.exited ?? Promise.resolve(0),
  ]);
  return { cssExit, runtimeExit, serverExit };
};

export const devCommand = async (flags: DevFlags): Promise<number> => {
  const port = parsePort(flags.port, DEFAULT_PORT);
  const { runtimeProc, runtimeSetupCode } = await ensureRuntimeAssetsReady();
  if (runtimeSetupCode !== 0) {
    return runtimeSetupCode;
  }

  const tailwindInput = await findTailwindInput();
  const tailwindOutput = await resolveTailwindOutput();
  const cssProc = spawnCssProcess(tailwindInput, tailwindOutput);
  const serverProc = spawnServerProcess(port);
  installDevSignalHandlers({ cssProc, runtimeProc, serverProc });
  return resolveDevExitCode(
    await waitForDevExit({ cssProc, runtimeProc, serverProc })
  );
};
