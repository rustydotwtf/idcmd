import { buildCommand } from "./build";

const readJsonFile = async (path: string): Promise<unknown> => {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return null;
  }
  const text = await file.text();
  return JSON.parse(text) as unknown;
};

const warnIfVercelMisconfigured = async (): Promise<void> => {
  const raw = await readJsonFile("vercel.json");
  if (!raw) {
    // eslint-disable-next-line no-console
    console.warn(
      "Warning: vercel.json not found. Vercel static deploy expects public/ output."
    );
    return;
  }

  const record = raw as Record<string, unknown>;
  const out = record.outputDirectory;
  if (out !== "public") {
    // eslint-disable-next-line no-console
    console.warn(
      `Warning: vercel.json outputDirectory is not "public" (got ${JSON.stringify(out)}).`
    );
  }
};

const warnIfBaseUrlMissing = async (): Promise<void> => {
  const file = Bun.file("site/site.jsonc");
  if (!(await file.exists())) {
    return;
  }

  try {
    const cfg = Bun.JSONC.parse(await file.text()) as unknown as {
      baseUrl?: unknown;
    };
    if (!cfg.baseUrl) {
      // eslint-disable-next-line no-console
      console.warn(
        "Warning: site/site.jsonc missing baseUrl; sitemap.xml and robots.txt will be skipped."
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(`Warning: Failed to parse site/site.jsonc: ${message}`);
  }
};

export const deployCommand = async (): Promise<number> => {
  const code = await buildCommand();
  if (code !== 0) {
    return code;
  }

  await warnIfVercelMisconfigured();
  await warnIfBaseUrlMissing();

  printDeployInstructions();

  return 0;
};

const printDeployInstructions = (): void => {
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("Deploy (Vercel):");
  // eslint-disable-next-line no-console
  console.log("  1. Push this repo to GitHub");
  // eslint-disable-next-line no-console
  console.log("  2. Import the repo in Vercel");
  // eslint-disable-next-line no-console
  console.log("  3. Vercel will run `bun run build` and serve `public/`");
  // eslint-disable-next-line no-console
  console.log("");
};
