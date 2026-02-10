import { copyDir, isDirEmpty, replaceInFile } from "../fs";
import {
  normalizeOptionalString,
  parsePort,
  toPackageName,
} from "../normalize";
import { basename, joinPath } from "../path";
import { promptOptionalText, promptText } from "../prompt";
import { run } from "../run";
import { readPackageVersion } from "../version";

const DEFAULT_PORT = 4000;

export interface InitFlags {
  "base-url"?: string;
  description?: string;
  git?: boolean;
  name?: string;
  port?: string;
  yes?: boolean;
}

const resolveTemplateDir = (): string =>
  joinPath(import.meta.dir, "..", "..", "..", "templates", "default");

const commentOutBaseUrl = (text: string): string =>
  text.replace(
    '"baseUrl": "__IDCMD_SITE_BASE_URL__",',
    '// "baseUrl": "https://example.com",'
  );

const fillSiteJsonc = (args: {
  baseUrl: string | null;
  description: string;
  name: string;
  text: string;
}): string => {
  const updated = args.text
    .replaceAll("__IDCMD_SITE_NAME__", args.name)
    .replaceAll("__IDCMD_SITE_DESCRIPTION__", args.description);

  if (!args.baseUrl) {
    return commentOutBaseUrl(updated);
  }
  return updated.replaceAll("__IDCMD_SITE_BASE_URL__", args.baseUrl);
};

const fillPackageJson = (args: {
  idcmdVersion: string;
  packageName: string;
  port: number;
  text: string;
}): string =>
  args.text
    .replaceAll("__IDCMD_PACKAGE_NAME__", args.packageName)
    .replaceAll("__IDCMD_IDCMD_VERSION__", `^${args.idcmdVersion}`)
    .replaceAll("__IDCMD_DEV_PORT__", String(args.port));

interface InitDefaults {
  defaultPort: number;
  defaultSiteName: string;
  packageName: string;
}

interface InitInputs {
  baseUrl: string | null;
  description: string;
  port: number;
  siteName: string;
}

const readInitInputs = async (
  flags: InitFlags,
  defaults: InitDefaults
): Promise<InitInputs> => {
  const yes = flags.yes === true;

  const siteName = yes
    ? (flags.name ?? defaults.defaultSiteName)
    : await promptText("Site name", flags.name ?? defaults.defaultSiteName);

  const description = yes
    ? (flags.description ?? "")
    : await promptOptionalText("Description", flags.description ?? "");

  const baseUrlRaw = yes
    ? (flags["base-url"] ?? "")
    : await promptOptionalText("Base URL (optional)", flags["base-url"] ?? "");

  const port = yes
    ? defaults.defaultPort
    : parsePort(
        await promptText("Dev port", String(defaults.defaultPort)),
        defaults.defaultPort
      );

  return {
    baseUrl: normalizeOptionalString(baseUrlRaw),
    description,
    port,
    siteName,
  };
};

const scaffoldFromTemplate = async (targetDir: string): Promise<void> => {
  const templateDir = resolveTemplateDir();
  await copyDir(templateDir, targetDir);
};

const applySubstitutions = async (args: {
  baseUrl: string | null;
  description: string;
  idcmdVersion: string;
  packageName: string;
  port: number;
  siteName: string;
  targetDir: string;
}): Promise<void> => {
  await replaceInFile(joinPath(args.targetDir, "site", "site.jsonc"), (text) =>
    fillSiteJsonc({
      baseUrl: args.baseUrl,
      description: args.description,
      name: args.siteName,
      text,
    })
  );

  await replaceInFile(joinPath(args.targetDir, "package.json"), (text) =>
    fillPackageJson({
      idcmdVersion: args.idcmdVersion,
      packageName: args.packageName,
      port: args.port,
      text,
    })
  );
};

const maybeInitGit = async (
  enabled: boolean,
  targetDir: string
): Promise<void> => {
  if (!enabled) {
    return;
  }
  await run(["git", "init"], { cwd: targetDir });
};

const printNextSteps = (dir: string): void => {
  console.log("");
  console.log("Next steps:");
  console.log(`  cd ${dir}`);
  console.log("  bun install");
  console.log("  bun run dev");
  console.log("");
};

const assertEmptyTargetDir = async (targetDir: string): Promise<void> => {
  const empty = await isDirEmpty(targetDir);
  if (!empty) {
    throw new Error(`Target directory is not empty: ${targetDir}`);
  }
};

const computeInitDefaults = (
  targetDir: string,
  flags: InitFlags
): InitDefaults => {
  const defaultDirName = basename(targetDir);
  return {
    defaultPort: parsePort(flags.port, DEFAULT_PORT),
    defaultSiteName: defaultDirName,
    packageName: toPackageName(defaultDirName),
  };
};

const scaffoldAndConfigure = async (args: {
  defaults: InitDefaults;
  inputs: InitInputs;
  targetDir: string;
}): Promise<void> => {
  await scaffoldFromTemplate(args.targetDir);
  const idcmdVersion = await readPackageVersion();
  await applySubstitutions({
    baseUrl: args.inputs.baseUrl,
    description: args.inputs.description,
    idcmdVersion,
    packageName: args.defaults.packageName,
    port: args.inputs.port,
    siteName: args.inputs.siteName,
    targetDir: args.targetDir,
  });
};

export const initCommand = async (
  dirArg: string | undefined,
  flags: InitFlags
): Promise<number> => {
  const dir = dirArg ?? ".";
  const targetDir = joinPath(process.cwd(), dir);

  await assertEmptyTargetDir(targetDir);
  const defaults = computeInitDefaults(targetDir, flags);

  const inputs = await readInitInputs(flags, defaults);
  await scaffoldAndConfigure({ defaults, inputs, targetDir });

  await maybeInitGit(flags.git !== false, targetDir);
  printNextSteps(dir);

  return 0;
};
