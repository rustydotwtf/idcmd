const DEFAULT_SITE_DIR = "site";
const DEFAULT_DIST_DIR = "dist";
const ASSET_PREFIX = "/_idcmd" as const;

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

const hasNewLayout = (cwd: string, siteDirName: string): Promise<boolean> =>
  Bun.file(joinPath(cwd, siteDirName, "site.jsonc")).exists();

const buildPaths = (
  cwd: string,
  rootDir: string,
  distDirName: string
): ProjectPaths => {
  const distDir = joinPath(cwd, distDirName);
  const contentDir = joinPath(rootDir, "content");
  const publicDir = joinPath(rootDir, "public");
  const iconsDir = joinPath(rootDir, "icons");
  const routesDir = joinPath(rootDir, "server", "routes");
  const siteConfigPath = joinPath(rootDir, "site.jsonc");

  const siteDir = rootDir === cwd ? null : rootDir;

  return {
    assetPrefix: ASSET_PREFIX,
    contentDir,
    distDir,
    iconsDir,
    publicDir,
    routesDir,
    siteConfigPath,
    siteDir,
  };
};

export const resolveProjectPaths = async (
  options: ResolveProjectPathsOptions = {}
): Promise<ProjectPaths> => {
  const cwd = trimTrailingSlash(options.cwd ?? process.cwd());
  const distDirName = options.distDir ?? DEFAULT_DIST_DIR;
  const siteDirName = options.siteDir ?? DEFAULT_SITE_DIR;

  const siteRoot = joinPath(cwd, siteDirName);
  const rootDir = (await hasNewLayout(cwd, siteDirName)) ? siteRoot : cwd;
  return buildPaths(cwd, rootDir, distDirName);
};

let cached: Promise<ProjectPaths> | null = null;

export const getProjectPaths = (): Promise<ProjectPaths> => {
  cached ??= resolveProjectPaths();
  return cached;
};
