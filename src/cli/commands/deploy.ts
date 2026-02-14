import { resolveCachePolicy } from "../../site/cache";
import { loadSiteConfig } from "../../site/config";
import { basename } from "../path";
import { isDeployProvider, resolveProviderFromFlags } from "../provider";
import { generateProviderFiles, providerConfigPaths } from "../provider-files";
import { buildCommand } from "./build";

export interface DeployFlags {
  fly?: boolean;
  railway?: boolean;
  vercel?: boolean;
}

const readJsonFile = async (path: string): Promise<unknown> => {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    return null;
  }
  const text = await file.text();
  return JSON.parse(text) as unknown;
};

const readPackageName = async (): Promise<string> => {
  const raw = await readJsonFile("package.json");
  if (raw && typeof raw === "object") {
    const pkg = raw as { name?: unknown };
    if (typeof pkg.name === "string" && pkg.name.length > 0) {
      return pkg.name;
    }
  }
  return basename(process.cwd());
};

const warn = (message: string): void => {
  // eslint-disable-next-line no-console
  console.warn(`Warning: ${message}`);
};

const warnIfFileMissing = async (
  path: string,
  context: string
): Promise<void> => {
  if (await Bun.file(path).exists()) {
    return;
  }
  warn(`${path} not found (${context}).`);
};

const warnIfVercelMisconfigured = async (): Promise<void> => {
  const raw = await readJsonFile(providerConfigPaths.vercelJson);
  if (!raw) {
    warn("vercel.json not found. Run `idcmd deploy --vercel` to generate it.");
    return;
  }

  const record = raw as Record<string, unknown>;
  const out = record.outputDirectory;
  if (out !== "public") {
    warn(
      `vercel.json outputDirectory is not "public" (got ${JSON.stringify(out)}).`
    );
  }
};

const warnIfFlyMisconfigured = async (): Promise<void> => {
  await warnIfFileMissing(
    providerConfigPaths.flyToml,
    "required for Fly.io deploy"
  );
  await warnIfFileMissing(
    providerConfigPaths.dockerfile,
    "required for Fly.io deploy"
  );
};

const warnIfRailwayMisconfigured = async (): Promise<void> => {
  await warnIfFileMissing(
    providerConfigPaths.railwayJson,
    "required for Railway deploy"
  );
  await warnIfFileMissing(
    providerConfigPaths.dockerfile,
    "required for Railway deploy"
  );

  const raw = await readJsonFile(providerConfigPaths.railwayJson);
  if (!raw || typeof raw !== "object") {
    return;
  }

  const config = raw as {
    build?: { builder?: unknown };
  };
  const builder = config.build?.builder;
  if (builder !== undefined && builder !== "DOCKERFILE") {
    warn(
      `railway.json build.builder is ${JSON.stringify(builder)}; expected "DOCKERFILE".`
    );
  }
};

const warnIfBaseUrlMissing = async (): Promise<void> => {
  const file = Bun.file("site.jsonc");
  if (!(await file.exists())) {
    return;
  }

  try {
    const cfg = Bun.JSONC.parse(await file.text()) as unknown as {
      baseUrl?: unknown;
    };
    if (!cfg.baseUrl) {
      warn(
        "site.jsonc missing baseUrl; sitemap.xml and robots.txt will be skipped."
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warn(`Failed to parse site.jsonc: ${message}`);
  }
};

const warnIfProviderMisconfigured = async (
  provider: "vercel" | "fly" | "railway"
): Promise<void> => {
  if (provider === "vercel") {
    await warnIfVercelMisconfigured();
    return;
  }
  if (provider === "fly") {
    await warnIfFlyMisconfigured();
    return;
  }
  await warnIfRailwayMisconfigured();
};

const printGeneratedFiles = (files: readonly string[]): void => {
  if (files.length === 0) {
    return;
  }
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("Generated files:");
  for (const path of files) {
    // eslint-disable-next-line no-console
    console.log(`  - ${path}`);
  }
};

const generateProviderFilesForProject = async (
  provider: "vercel" | "fly" | "railway"
): Promise<void> => {
  const siteConfig = await loadSiteConfig();
  const packageName = await readPackageName();
  const files = await generateProviderFiles({
    cachePolicy: resolveCachePolicy(siteConfig.cache),
    packageName,
    provider,
    targetDir: process.cwd(),
  });
  printGeneratedFiles(files);
};

const printNeutralDeployInstructions = (): void => {
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("Deploy:");
  // eslint-disable-next-line no-console
  console.log("  1. Choose a provider");
  // eslint-disable-next-line no-console
  console.log("  2. Generate provider files:");
  // eslint-disable-next-line no-console
  console.log("     idcmd deploy --vercel");
  // eslint-disable-next-line no-console
  console.log("     idcmd deploy --fly");
  // eslint-disable-next-line no-console
  console.log("     idcmd deploy --railway");
  // eslint-disable-next-line no-console
  console.log("");
};

const printVercelInstructions = (): void => {
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

const printFlyInstructions = (): void => {
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("Deploy (Fly.io):");
  // eslint-disable-next-line no-console
  console.log("  1. Install flyctl and run `fly auth login`");
  // eslint-disable-next-line no-console
  console.log("  2. Set `app` in fly.toml to your Fly app name");
  // eslint-disable-next-line no-console
  console.log("  3. Run `fly deploy`");
  // eslint-disable-next-line no-console
  console.log("");
};

const printRailwayInstructions = (): void => {
  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("Deploy (Railway):");
  // eslint-disable-next-line no-console
  console.log("  1. Connect this repo in Railway (or use `railway up`)");
  // eslint-disable-next-line no-console
  console.log("  2. Railway will build from Dockerfile");
  // eslint-disable-next-line no-console
  console.log(
    "  3. Ensure required env vars are set (for example SITE_BASE_URL)"
  );
  // eslint-disable-next-line no-console
  console.log("");
};

const printDeployInstructions = (
  provider: "none" | "vercel" | "fly" | "railway"
): void => {
  if (provider === "none") {
    printNeutralDeployInstructions();
    return;
  }
  if (provider === "vercel") {
    printVercelInstructions();
    return;
  }
  if (provider === "fly") {
    printFlyInstructions();
    return;
  }
  printRailwayInstructions();
};

export const deployCommand = async (
  flags: DeployFlags = {}
): Promise<number> => {
  const provider = resolveProviderFromFlags(flags);
  const code = await buildCommand();
  if (code !== 0) {
    return code;
  }

  await warnIfBaseUrlMissing();

  if (isDeployProvider(provider)) {
    await generateProviderFilesForProject(provider);
    await warnIfProviderMisconfigured(provider);
  }

  printDeployInstructions(provider);

  return 0;
};
