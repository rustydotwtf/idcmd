import { isFileLikePathname, toCanonicalHtmlPathname } from "@/site/url-policy";

const stripLeadingSlash = (pathname: string): string =>
  pathname.startsWith("/") ? pathname.slice(1) : pathname;

const tryServeFile = async (relativePath: string): Promise<Response | null> => {
  const file = Bun.file(`dist/${stripLeadingSlash(relativePath)}`);
  if (!(await file.exists())) {
    return null;
  }
  return new Response(file);
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

  const notFound = await tryServeFile("404.html");
  return notFound ?? new Response("Not Found", { status: 404 });
};

export const previewCommand = async (port: number): Promise<number> => {
  const exists = await Bun.file("dist/index.html").exists();
  if (!exists) {
    throw new Error("dist/ not found. Run `idcmd build` first.");
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
  return 0;
};
