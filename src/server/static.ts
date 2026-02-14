const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export interface ServeStaticEnv {
  distDir: string;
  isDev: boolean;
  publicDir: string;
  staticCacheHeaders: HeadersInit;
}

const tryServeFileFromRoot = async (
  rootDir: string,
  pathname: string,
  env: ServeStaticEnv
): Promise<Response | null> => {
  const filePath = `${rootDir}${pathname}`;
  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    return null;
  }

  const ext = pathname.slice(pathname.lastIndexOf("."));
  const contentType = mimeTypes[ext] || "application/octet-stream";

  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      ...env.staticCacheHeaders,
    },
  });
};

export const serveStaticFile = async (
  pathname: string,
  env: ServeStaticEnv
): Promise<Response | null> => {
  const roots = [env.distDir, env.publicDir];

  for (const root of roots) {
    const served = await tryServeFileFromRoot(root, pathname, env);
    if (served) {
      return served;
    }
  }

  return null;
};
