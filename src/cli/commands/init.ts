import { copyDir, ensureDir, isDirEmpty, replaceInFile } from "../fs";
import {
  normalizeOptionalString,
  parsePort,
  toPackageName,
} from "../normalize";
import { basename, dirname, joinPath } from "../path";
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

const TEMPLATE_DOTPATHS = [".gitignore", ".github/workflows/ci.yml"];
const DEFAULT_OXLINT_CONFIG = `{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": [
    "./node_modules/ultracite/config/oxlint/core/.oxlintrc.json",
    "./node_modules/ultracite/config/oxlint/react/.oxlintrc.json"
  ],
  "rules": {
    "jest/require-hook": "off"
  },
  "overrides": [
    {
      "files": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.test.js",
        "**/*.test.jsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/*.spec.js",
        "**/*.spec.jsx"
      ],
      "rules": {
        "jest/require-hook": "error"
      }
    }
  ]
}
`;
const DEFAULT_OXFMT_CONFIG = `// Ultracite oxfmt Configuration
// https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "experimentalSortPackageJson": true,
  "experimentalSortImports": {
    "ignoreCase": true,
    "newlinesBetween": true,
    "order": "asc",
  },
}
`;

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

const fillReadme = (args: { siteName: string; text: string }): string =>
  args.text
    .replaceAll("__IDCMD_SITE_NAME__", args.siteName)
    .replaceAll("IDCMD_SITE_NAME", args.siteName);

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
  await copyTemplateDotpaths({ targetDir, templateDir });
  await writeDefaultLintConfigs(targetDir);
};

const copyTemplateDotpaths = async (args: {
  targetDir: string;
  templateDir: string;
}): Promise<void> => {
  for (const relativePath of TEMPLATE_DOTPATHS) {
    const srcPath = joinPath(args.templateDir, relativePath);
    if (!(await Bun.file(srcPath).exists())) {
      continue;
    }
    const dstPath = joinPath(args.targetDir, relativePath);
    // Hidden paths are not copied by glob scan; explicitly create parent dirs.
    // eslint-disable-next-line no-await-in-loop
    await ensureDir(dirname(dstPath));
    // eslint-disable-next-line no-await-in-loop
    await Bun.write(dstPath, Bun.file(srcPath));
  }
};

const writeDefaultLintConfigs = async (targetDir: string): Promise<void> => {
  await Bun.write(joinPath(targetDir, ".oxlintrc.json"), DEFAULT_OXLINT_CONFIG);
  await Bun.write(joinPath(targetDir, ".oxfmtrc.jsonc"), DEFAULT_OXFMT_CONFIG);
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

  await replaceInFile(joinPath(args.targetDir, "README.md"), (text) =>
    fillReadme({
      siteName: args.siteName,
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
