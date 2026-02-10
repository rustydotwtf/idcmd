import type { ProjectPaths } from "../project/paths";

import {
  isFileLikePathname,
  toCanonicalHtmlPathname,
} from "../site/url-policy";

export type RouteHandler = (req: Request) => Response | Promise<Response>;

export interface RouteModule {
  DELETE?: RouteHandler;
  GET?: RouteHandler;
  HEAD?: RouteHandler;
  OPTIONS?: RouteHandler;
  PATCH?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
}

export interface UserRoutesEnv {
  isDev: boolean;
  routesDir: ProjectPaths["routesDir"];
}

interface LoadedRoute {
  handlers: RouteModule;
  pathname: string;
}

const SUPPORTED_EXTENSIONS = [".ts", ".js", ".mjs"] as const;

const isSupportedRouteFile = (relativePath: string): boolean =>
  SUPPORTED_EXTENSIONS.some((ext) => relativePath.endsWith(ext));

const normalizeRelativePath = (relativePath: string): string =>
  relativePath.replaceAll("\\", "/").replaceAll(/^\/+/g, "");

const stripExtension = (relativePath: string): string => {
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (relativePath.endsWith(ext)) {
      return relativePath.slice(0, -ext.length);
    }
  }
  return relativePath;
};

const stripTrailingIndex = (value: string): string => {
  if (value === "index") {
    return "";
  }
  if (value.endsWith("/index")) {
    return value.slice(0, -"/index".length);
  }
  return value;
};

const hasUnsupportedDynamicSegment = (pathname: string): boolean =>
  pathname.includes("[") || pathname.includes("]") || pathname.includes(":");

const pathnameFromRouteRelativePath = (relativePath: string): string => {
  const normalized = normalizeRelativePath(relativePath);
  const withoutExt = stripExtension(normalized);
  const withoutIndex = stripTrailingIndex(withoutExt);
  if (!withoutIndex) {
    return "/";
  }
  return `/${withoutIndex}`;
};

export const routePathnameFromFile = (
  filePath: string,
  routesDir: string
): string => {
  const normalizedDir = routesDir.replaceAll("\\", "/").replaceAll(/\/+$/g, "");
  const normalizedFile = filePath.replaceAll("\\", "/");
  const prefix = `${normalizedDir}/`;
  const relative = normalizedFile.startsWith(prefix)
    ? normalizedFile.slice(prefix.length)
    : normalizedFile;
  return pathnameFromRouteRelativePath(relative);
};

const loadRouteModule = async (filePath: string): Promise<RouteModule> => {
  const url = Bun.pathToFileURL(filePath);
  const mod = (await import(url.toString())) as unknown;
  return mod as RouteModule;
};

const scanRouteFiles = async (routesDir: string): Promise<string[]> => {
  const routes: string[] = [];
  const glob = new Bun.Glob("**/*");

  try {
    for await (const relativePath of glob.scan(routesDir)) {
      if (!isSupportedRouteFile(relativePath)) {
        continue;
      }
      routes.push(relativePath);
    }
  } catch {
    return [];
  }

  return routes;
};

const cacheByDir = new Map<string, LoadedRoute[]>();

const loadAllRoutes = async (env: UserRoutesEnv): Promise<LoadedRoute[]> => {
  const cached = cacheByDir.get(env.routesDir);
  if (cached) {
    return cached;
  }

  const files = await scanRouteFiles(env.routesDir);
  const loaded = await loadRoutesFromFiles(env.routesDir, files);
  cacheByDir.set(env.routesDir, loaded);
  return loaded;
};

const loadRoutesFromFiles = async (
  routesDir: string,
  files: readonly string[]
): Promise<LoadedRoute[]> => {
  if (files.length === 0) {
    return [];
  }

  const loaded: LoadedRoute[] = [];
  for (const relativeFile of files) {
    // eslint-disable-next-line no-await-in-loop
    loaded.push(await loadOneRoute(routesDir, relativeFile));
  }
  return loaded;
};

const loadOneRoute = async (
  routesDir: string,
  relativeFile: string
): Promise<LoadedRoute> => {
  const pathname = pathnameFromRouteRelativePath(relativeFile);
  if (hasUnsupportedDynamicSegment(pathname)) {
    throw new Error(
      `Unsupported dynamic route segment in ${routesDir}/${relativeFile} (computed pathname: ${pathname}). V1 does not support [param] or :param routes.`
    );
  }

  const handlers = await loadRouteModule(`${routesDir}/${relativeFile}`);
  return { handlers, pathname };
};

const handlerFor = (
  handlers: RouteModule,
  method: string
): RouteHandler | null => {
  const value = (handlers as Record<string, unknown>)[method];
  return typeof value === "function" ? (value as RouteHandler) : null;
};

const candidatePathnamesForRequest = (rawPathname: string): Set<string> => {
  const canonical = isFileLikePathname(rawPathname)
    ? rawPathname
    : toCanonicalHtmlPathname(rawPathname);

  const trimmedRaw =
    rawPathname.endsWith("/") && rawPathname !== "/"
      ? rawPathname.slice(0, -1)
      : rawPathname;
  const trimmedCanonical =
    canonical.endsWith("/") && canonical !== "/"
      ? canonical.slice(0, -1)
      : canonical;

  return new Set([rawPathname, canonical, trimmedRaw, trimmedCanonical]);
};

export const handleUserRouteRequest = async (
  url: URL,
  req: Request,
  env: UserRoutesEnv
): Promise<Response | undefined> => {
  const match = await findMatchingRoute(url.pathname, env);
  if (!match) {
    return undefined;
  }

  const handler = handlerFor(match.handlers, req.method);
  if (!handler) {
    return createMethodNotAllowedResponse(match.handlers);
  }

  return handler(req);
};

const findMatchingRoute = async (
  pathname: string,
  env: UserRoutesEnv
): Promise<LoadedRoute | null> => {
  const routes = await loadAllRoutes(env);
  if (routes.length === 0) {
    return null;
  }

  const candidates = candidatePathnamesForRequest(pathname);
  return routes.find((r) => candidates.has(r.pathname)) ?? null;
};

const createMethodNotAllowedResponse = (handlers: RouteModule): Response =>
  new Response("Method Not Allowed", {
    headers: { Allow: Object.keys(handlers).join(", ") },
    status: 405,
  });
