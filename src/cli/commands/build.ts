import { compileRuntimeAssetsOnce } from "../runtime-assets";

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

const idcmdBuildEntry = (): string =>
  // `src/build.ts` lives two levels up from `src/cli/commands/*`.
  Bun.fileURLToPath(new URL("../../build.ts", import.meta.url));

export const buildCommand = async (): Promise<number> => {
  const runtimeCode = await compileRuntimeAssetsOnce();
  if (runtimeCode !== 0) {
    return runtimeCode;
  }

  const tailwindInput = await findTailwindInput();

  const cssProc = Bun.spawn(
    [
      "bunx",
      "@tailwindcss/cli",
      "-i",
      tailwindInput,
      "-o",
      "dist/styles.css",
      "--minify",
    ],
    { stderr: "inherit", stdout: "inherit" }
  );
  const cssCode = await cssProc.exited;
  if (cssCode !== 0) {
    return cssCode;
  }

  const buildProc = Bun.spawn(["bun", idcmdBuildEntry()], {
    env: { ...process.env, NODE_ENV: "production" },
    stderr: "inherit",
    stdout: "inherit",
  });
  return buildProc.exited;
};
