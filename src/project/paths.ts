const DEFAULT_SITE_DIR = "site";
const DEFAULT_DIST_DIR = "dist";
const ASSET_PREFIX = "/_idcmd" as const;
const CONTENT_DIR = "content";
const PUBLIC_DIR = "assets";
const ICONS_DIR = "assets/icons";
const ROUTES_DIR = "code/routes";
const SITE_CONFIG_FILE = "site.jsonc";

export interface ProjectPaths {
  assetPrefix: typeof ASSET_PREFIX;
  contentDir: string;
  distDir: string;
  iconsDir: string;
  publicDir: string;
  routesDir: string;
  siteConfigPath: string;
  siteDir: string | null;
}

export interface ResolveProjectPathsOptions {
  cwd?: string;
  distDir?: string;
  siteDir?: string;
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
  distDirName: string;
  siteDirName: string;
}): ProjectPaths => {
  const siteRoot = joinPath(args.cwd, args.siteDirName);
  return {
    assetPrefix: ASSET_PREFIX,
    contentDir: joinPath(siteRoot, CONTENT_DIR),
    distDir: joinPath(args.cwd, args.distDirName),
    iconsDir: joinPath(siteRoot, ICONS_DIR),
    publicDir: joinPath(siteRoot, PUBLIC_DIR),
    routesDir: joinPath(siteRoot, ROUTES_DIR),
    siteConfigPath: joinPath(siteRoot, SITE_CONFIG_FILE),
    siteDir: siteRoot,
  };
};

export const resolveProjectPaths = (
  options: ResolveProjectPathsOptions = {}
): Promise<ProjectPaths> => {
  const cwd = trimTrailingSlash(options.cwd ?? process.cwd());
  const distDirName = options.distDir ?? DEFAULT_DIST_DIR;
  const siteDirName = options.siteDir ?? DEFAULT_SITE_DIR;
  return Promise.resolve(buildPaths({ cwd, distDirName, siteDirName }));
};

let cached: Promise<ProjectPaths> | null = null;

export const getProjectPaths = (): Promise<ProjectPaths> => {
  cached ??= resolveProjectPaths();
  return cached;
};
