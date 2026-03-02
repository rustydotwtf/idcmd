import {
  isFileLikePathname,
  toCanonicalHtmlPathname,
} from "../../site/url-policy";

const stripLeadingSlash = (pathname: string): string =>
  pathname.startsWith("/") ? pathname.slice(1) : pathname;

const tryServeFile = async (
  relativePath: string,
  status = 200
): Promise<Response | null> => {
  const file = Bun.file(`public/${stripLeadingSlash(relativePath)}`);
  if (!(await file.exists())) {
    return null;
  }
  return new Response(file, { status });
};

const toHtmlEntryPath = (canonicalPathname: string): string =>
  canonicalPathname === "/" ? "index.html" : `${canonicalPathname}index.html`;

const serveHtml = async (pathname: string): Promise<Response> => {
  const canonical = toCanonicalHtmlPathname(pathname);
  if (canonical !== pathname) {
    return new Response(null, {
      headers: { Location: canonical },
      status: 308,
    });
  }

  const htmlPath = toHtmlEntryPath(canonical);
  const served = await tryServeFile(htmlPath);
  if (served) {
    return served;
  }

  const notFound = await tryServeFile("404.html", 404);
  return notFound ?? new Response("Not Found", { status: 404 });
};

type ShutdownSignal = "SIGINT" | "SIGTERM";

const waitForShutdownSignal = (): Promise<ShutdownSignal> => {
  const { promise, resolve } = Promise.withResolvers<ShutdownSignal>();

  const handleSigInt = (): void => {
    cleanup();
    resolve("SIGINT");
  };

  const handleSigTerm = (): void => {
    cleanup();
    resolve("SIGTERM");
  };

  const cleanup = (): void => {
    process.off("SIGINT", handleSigInt);
    process.off("SIGTERM", handleSigTerm);
  };

  process.on("SIGINT", handleSigInt);
  process.on("SIGTERM", handleSigTerm);

  return promise;
};

export const previewCommand = async (port: number): Promise<number> => {
  const exists = await Bun.file("public/index.html").exists();
  if (!exists) {
    throw new Error("public/ not found. Run `idcmd build` first.");
  }

  const server = Bun.serve({
    async fetch(req) {
      const url = new URL(req.url);
      if (isFileLikePathname(url.pathname)) {
        const served = await tryServeFile(url.pathname);
        return served ?? new Response("Not Found", { status: 404 });
      }
      return serveHtml(url.pathname);
    },
    port,
  });

  // eslint-disable-next-line no-console
  console.log(`Preview running at http://localhost:${server.port}`);

  await waitForShutdownSignal();
  server.stop(true);

  return 0;
};
