import { joinPath } from "./path";

const RUNTIME_SOURCE_DIR = joinPath("site", "code", "runtime");
const RUNTIME_OUTPUT_DIR = joinPath("dist", "_idcmd");

const RUNTIME_ENTRY_FILES = [
  "live-reload.ts",
  "llm-menu.ts",
  "nav-prefetch.ts",
  "right-rail-scrollspy.ts",
] as const;

const runtimeEntryPaths = (): string[] =>
  RUNTIME_ENTRY_FILES.map((fileName) => joinPath(RUNTIME_SOURCE_DIR, fileName));

const scanRuntimeEntrypoints = async (
  entries: readonly string[]
): Promise<{
  existing: string[];
  missing: string[];
}> => {
  const existing: string[] = [];
  const missing: string[] = [];

  for (const entry of entries) {
    // eslint-disable-next-line no-await-in-loop
    if (await Bun.file(entry).exists()) {
      existing.push(entry);
      continue;
    }
    missing.push(entry);
  }

  return { existing, missing };
};

const getRuntimeEntrypoints = async (): Promise<string[]> => {
  const entries = runtimeEntryPaths();
  const { existing, missing } = await scanRuntimeEntrypoints(entries);
  if (existing.length === 0) {
    return [];
  }
  if (missing.length > 0) {
    throw new Error(
      `Incomplete runtime scripts in ${RUNTIME_SOURCE_DIR}. Missing: ${missing.join(", ")}`
    );
  }
  return existing;
};

const buildRuntimeArgs = (entrypoints: string[], watch: boolean): string[] => [
  "bun",
  "build",
  ...entrypoints,
  "--format",
  "iife",
  "--outdir",
  RUNTIME_OUTPUT_DIR,
  "--target",
  "browser",
  ...(watch ? ["--watch"] : []),
];

export const compileRuntimeAssetsOnce = async (): Promise<number> => {
  const entrypoints = await getRuntimeEntrypoints();
  if (entrypoints.length === 0) {
    return 0;
  }

  const proc = Bun.spawn(buildRuntimeArgs(entrypoints, false), {
    stderr: "inherit",
    stdout: "inherit",
  });
  return proc.exited;
};

export const watchRuntimeAssets = async (): Promise<ReturnType<
  typeof Bun.spawn
> | null> => {
  const entrypoints = await getRuntimeEntrypoints();
  if (entrypoints.length === 0) {
    return null;
  }

  return Bun.spawn(buildRuntimeArgs(entrypoints, true), {
    stderr: "inherit",
    stdout: "inherit",
  });
};
