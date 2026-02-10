import { loadSiteConfig } from "../site/config";
import { resolveCanonicalBaseUrl } from "../site/urls";
import {
  collectSitemapPagesFromContent,
  generateRobotsTxt,
  generateSitemapXml,
} from "./files";

export interface SeoHandlerEnv {
  distDir: string;
  isDev: boolean;
  staticCacheHeaders: HeadersInit;
}

const tryServeDistFile = async (
  filePath: string,
  contentType: string,
  env: SeoHandlerEnv
): Promise<Response | null> => {
  if (env.isDev) {
    return null;
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return null;
  }

  return new Response(file, {
    headers: {
      "Content-Type": contentType,
      ...env.staticCacheHeaders,
    },
  });
};

export const handleRobotsTxt = async (
  url: URL,
  env: SeoHandlerEnv
): Promise<Response | undefined> => {
  if (url.pathname !== "/robots.txt") {
    return undefined;
  }

  const served = await tryServeDistFile(
    `${env.distDir}/robots.txt`,
    "text/plain; charset=utf-8",
    env
  );
  if (served) {
    return served;
  }

  const siteConfig = await loadSiteConfig();
  const baseUrl =
    resolveCanonicalBaseUrl({
      configuredBaseUrl: siteConfig.baseUrl,
      isDev: env.isDev,
      requestOrigin: url.origin,
    }) ?? url.origin;

  return new Response(generateRobotsTxt(baseUrl), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...env.staticCacheHeaders,
    },
  });
};

export const handleSitemapXml = async (
  url: URL,
  env: SeoHandlerEnv
): Promise<Response | undefined> => {
  if (url.pathname !== "/sitemap.xml") {
    return undefined;
  }

  const served = await tryServeDistFile(
    `${env.distDir}/sitemap.xml`,
    "application/xml; charset=utf-8",
    env
  );
  if (served) {
    return served;
  }

  const siteConfig = await loadSiteConfig();
  const baseUrl =
    resolveCanonicalBaseUrl({
      configuredBaseUrl: siteConfig.baseUrl,
      isDev: env.isDev,
      requestOrigin: url.origin,
    }) ?? url.origin;
  const pages = await collectSitemapPagesFromContent();

  return new Response(generateSitemapXml(pages, baseUrl), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      ...env.staticCacheHeaders,
    },
  });
};
