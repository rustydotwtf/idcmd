const DEFAULT_OUTPUT_DIR = "public";
const ASSET_PREFIX = "/_idcmd" as const;
const CONTENT_DIR = "content";
const ASSETS_DIR = "assets";
const ICONS_DIR = "assets/icons";
const ROUTES_DIR = "src/routes";
const SITE_CONFIG_FILE = "site.jsonc";

export interface ProjectPaths {
  assetPrefix: typeof ASSET_PREFIX;
  contentDir: string;
  outputDir: string;
  iconsDir: string;
  assetsDir: string;
  routesDir: string;
  siteConfigPath: string;
}

export interface ResolveProjectPathsOptions {
  cwd?: string;
  outputDir?: string;
}

const trimTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.replaceAll(/\/+$/g, "") : value;

const joinPath = (...parts: string[]): string => {
  const filtered = parts.filter((p) => p.length > 0);
  if (filtered.length === 0) {
    return ".";
  }

  const normalized = filtered.map((p, idx) => {
    const trimmed =
      idx === 0 ? trimTrailingSlash(p) : p.replaceAll(/^\/+/g, "");
    return trimTrailingSlash(trimmed);
  });

  return normalized.join("/");
};

const buildPaths = (args: {
  cwd: string;
  outputDirName: string;
}): ProjectPaths => ({
  assetPrefix: ASSET_PREFIX,
  assetsDir: joinPath(args.cwd, ASSETS_DIR),
  contentDir: joinPath(args.cwd, CONTENT_DIR),
  iconsDir: joinPath(args.cwd, ICONS_DIR),
  outputDir: joinPath(args.cwd, args.outputDirName),
  routesDir: joinPath(args.cwd, ROUTES_DIR),
  siteConfigPath: joinPath(args.cwd, SITE_CONFIG_FILE),
});

export const resolveProjectPaths = (
  options: ResolveProjectPathsOptions = {}
): Promise<ProjectPaths> => {
  const cwd = trimTrailingSlash(options.cwd ?? process.cwd());
  const outputDirName = options.outputDir ?? DEFAULT_OUTPUT_DIR;
  return Promise.resolve(buildPaths({ cwd, outputDirName }));
};

let cached: Promise<ProjectPaths> | null = null;
let cachedCwd: string | null = null;

export const getProjectPaths = (): Promise<ProjectPaths> => {
  const cwd = trimTrailingSlash(process.cwd());
  if (!cached || cachedCwd !== cwd) {
    cachedCwd = cwd;
    cached = resolveProjectPaths({ cwd });
  }
  return cached;
};
